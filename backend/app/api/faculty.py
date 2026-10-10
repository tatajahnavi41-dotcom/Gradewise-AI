from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from app.core.database import get_db
from app.api.auth import get_current_user
from app.models.models import User, Student, Staff, SubjectMarks, Intervention, ExamSchedule
from app.services.scoring_engine import calculate_student_success_score, calculate_comeback_score
from app.services.mentor_matching import match_mentors_for_student
from app.services.early_warning import evaluate_risks_and_warnings

router = APIRouter(prefix="/faculty", tags=["Faculty"])

class AddMarksRequest(BaseModel):
    student_id: str
    subject_code: str
    internal_marks: float
    assignment_marks: float
    lab_marks: float

class RecordAttendanceRequest(BaseModel):
    student_id: str
    attendance_pct: float

class AssignMentorRequest(BaseModel):
    student_id: str
    faculty_id: str

@router.get("/dashboard")
def get_faculty_dashboard(
    branch: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["faculty", "admin"]:
        raise HTTPException(status_code=403, detail="Faculty authorization required")
        
    target_branch = branch or current_user.branch or "AIML"
    
    students_query = db.query(Student).filter(Student.branch == target_branch)
    total_branch_students = students_query.count()
    
    # Students needing urgent attention (High Risk or critical attendance or low academic)
    attention_list = students_query.filter(
        (Student.risk_category == "HIGH") | 
        (Student.attendance_risk == True) | 
        (Student.academic_risk == True)
    ).limit(10).all()
    
    # High performers
    high_performers = students_query.filter(Student.success_score >= 80.0).limit(8).all()
    
    # Active interventions in branch
    student_ids = [s.student_id for s in students_query.all()]
    interventions = db.query(Intervention).filter(Intervention.student_id.in_(student_ids)).all()
    
    pending_interventions = [i for i in interventions if i.status == "Pending"]
    in_progress_interventions = [i for i in interventions if i.status == "In Progress"]
    completed_interventions = [i for i in interventions if i.status == "Completed"]
    
    # Mentees assigned to this faculty member if staff_id is present
    my_mentees = []
    if current_user.staff_id:
        my_mentees = db.query(Student).filter(Student.primary_mentor_id == current_user.staff_id).all()
        
    # Upcoming exams for this branch
    upcoming_exams = db.query(ExamSchedule).filter(
        (ExamSchedule.branch == target_branch) | (ExamSchedule.branch == "ALL")
    ).all()
    
    avg_score = round(sum(s.success_score or 0 for s in students_query.all()) / max(1, total_branch_students), 1)
    avg_attendance = round(sum(s.attendance_pct or 0 for s in students_query.all()) / max(1, total_branch_students), 1)

    return {
        "branch": target_branch,
        "total_students": total_branch_students,
        "average_success_score": avg_score,
        "average_attendance": avg_attendance,
        "attention_count": len(attention_list),
        "attention_list": attention_list,
        "high_performers_count": len(high_performers),
        "high_performers": high_performers,
        "my_mentees_count": len(my_mentees),
        "my_mentees": my_mentees,
        "interventions_summary": {
            "pending": len(pending_interventions),
            "in_progress": len(in_progress_interventions),
            "completed": len(completed_interventions),
            "total": len(interventions)
        },
        "upcoming_exams": upcoming_exams
    }

@router.post("/add-marks")
def add_or_update_marks(
    req: AddMarksRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["faculty", "admin"]:
        raise HTTPException(status_code=403, detail="Faculty authorization required")
        
    student = db.query(Student).filter(Student.student_id == req.student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
        
    # Verify bounds
    if not (0 <= req.internal_marks <= 40 and 0 <= req.assignment_marks <= 20 and 0 <= req.lab_marks <= 20):
        raise HTTPException(status_code=400, detail="Marks out of range: Internals [0-40], Assignments [0-20], Lab [0-20]")
        
    mark_entry = db.query(SubjectMarks).filter(
        SubjectMarks.student_id == req.student_id,
        SubjectMarks.subject_code == req.subject_code
    ).first()
    
    total_pct = round(((req.internal_marks + req.assignment_marks + req.lab_marks) / 80.0) * 100.0, 1)
    grade = "O" if total_pct >= 90 else ("A+" if total_pct >= 80 else ("A" if total_pct >= 70 else ("B+" if total_pct >= 60 else ("B" if total_pct >= 50 else "F"))))
    
    if mark_entry:
        mark_entry.internal_marks = req.internal_marks
        mark_entry.assignment_marks = req.assignment_marks
        mark_entry.lab_marks = req.lab_marks
        mark_entry.total_percentage = total_pct
        mark_entry.grade = grade
        mark_entry.is_weak_subject = (total_pct < 50.0)
    else:
        mark_entry = SubjectMarks(
            student_id=req.student_id,
            semester=student.semester,
            subject_code=req.subject_code,
            subject_name=f"Course {req.subject_code}",
            internal_marks=req.internal_marks,
            assignment_marks=req.assignment_marks,
            lab_marks=req.lab_marks,
            total_percentage=total_pct,
            grade=grade,
            is_weak_subject=(total_pct < 50.0)
        )
        db.add(mark_entry)
        
    db.flush()

    # Recalculate student overall academic score across all subjects
    all_marks = db.query(SubjectMarks).filter(SubjectMarks.student_id == req.student_id).all()
    avg_academic = sum(m.total_percentage for m in all_marks) / max(1, len(all_marks))
    student.academic_score = round(avg_academic, 1)
    student.cgpa = round(avg_academic / 10.0 * 0.94, 2)
    student.academic_risk = (student.academic_score < 50.0)
    
    # Recalculate explainable success score
    calc_res = calculate_student_success_score({
        "academic_score": student.academic_score,
        "attendance_pct": student.attendance_pct,
        "lms_activity_score": student.lms_activity_score or 0.0,
        "engagement_score": student.engagement_score or 0.0,
        "placement_readiness_score": student.placement_readiness_score or round(student.academic_score * 0.8, 1),
        "skills_score": student.skills_score or 0.0,
    })
    student.success_score = calc_res["success_score"]
    student.risk_category = calc_res["risk_category"]
    student.comeback_score = calculate_comeback_score(student.success_score, student.prev_semester_score or 0.0, student.learning_streak or 0, student.growth_points or 0)
    
    db.commit()

    # Sync to MongoDB Atlas
    try:
        from app.core.mongo_database import sync_data_to_mongo
        sync_data_to_mongo(
            students_data=[{
                "student_id": student.student_id,
                "name": student.name,
                "email": student.email,
                "branch": student.branch,
                "year": student.year,
                "semester": student.semester,
                "cgpa": student.cgpa,
                "academic_score": student.academic_score,
                "attendance_pct": student.attendance_pct,
                "success_score": student.success_score,
                "risk_category": student.risk_category,
                "study_hours": student.study_hours,
                "growth_points": student.growth_points,
                "career_goal": student.career_goal
            }]
        )
    except Exception as e:
        print(f"MongoDB sync notice on marks update: {e}")

    return {
        "message": "Marks recorded and student metrics recalculated successfully",
        "updated_subject_score": total_pct,
        "new_academic_score": student.academic_score,
        "new_success_score": student.success_score,
        "new_risk_category": student.risk_category
    }

@router.post("/record-attendance")
def record_attendance(
    req: RecordAttendanceRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["faculty", "admin"]:
        raise HTTPException(status_code=403, detail="Faculty authorization required")
        
    if not (0 <= req.attendance_pct <= 100):
        raise HTTPException(status_code=400, detail="Attendance must be between 0 and 100%")
        
    student = db.query(Student).filter(Student.student_id == req.student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
        
    student.attendance_pct = round(req.attendance_pct, 1)
    student.attendance_risk = (student.attendance_pct < 65.0)
    
    # Recalculate score
    calc_res = calculate_student_success_score({
        "academic_score": student.academic_score,
        "attendance_pct": student.attendance_pct,
        "lms_activity_score": student.lms_activity_score,
        "engagement_score": student.engagement_score,
        "placement_readiness_score": student.placement_readiness_score,
        "skills_score": student.skills_score,
    })
    student.success_score = calc_res["success_score"]
    student.risk_category = calc_res["risk_category"]
    
    db.commit()

    # Sync to MongoDB Atlas
    try:
        from app.core.mongo_database import sync_data_to_mongo
        sync_data_to_mongo(
            students_data=[{
                "student_id": student.student_id,
                "name": student.name,
                "email": student.email,
                "branch": student.branch,
                "year": student.year,
                "semester": student.semester,
                "cgpa": student.cgpa,
                "academic_score": student.academic_score,
                "attendance_pct": student.attendance_pct,
                "success_score": student.success_score,
                "risk_category": student.risk_category,
                "study_hours": student.study_hours,
                "growth_points": student.growth_points,
                "career_goal": student.career_goal
            }]
        )
    except Exception as e:
        print(f"MongoDB sync notice on attendance update: {e}")

    return {
        "message": "Attendance updated and student risk recalculated",
        "attendance_pct": student.attendance_pct,
        "attendance_risk": student.attendance_risk,
        "new_success_score": student.success_score
    }

@router.get("/mentor-candidates/{student_id}")
def get_smart_mentor_matches(
    student_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    student = db.query(Student).filter(Student.student_id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
        
    staff_list = db.query(Staff).all()
    subject_marks = db.query(SubjectMarks).filter(SubjectMarks.student_id == student_id).all()
    
    candidates = match_mentors_for_student(student, staff_list, subject_marks)
    return {
        "student_id": student.student_id,
        "student_name": student.name,
        "branch": student.branch,
        "career_goal": student.career_goal,
        "candidates": candidates
    }

@router.post("/assign-mentor")
def assign_mentor(
    req: AssignMentorRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["faculty", "admin"]:
        raise HTTPException(status_code=403, detail="Faculty authorization required")
        
    student = db.query(Student).filter(Student.student_id == req.student_id).first()
    faculty = db.query(Staff).filter(Staff.staff_id == req.faculty_id).first()
    
    if not student or not faculty:
        raise HTTPException(status_code=404, detail="Student or Faculty record not found")
        
    student.primary_mentor_id = faculty.staff_id
    faculty.current_mentees = (faculty.current_mentees or 0) + 1
    
    db.commit()
    return {
        "message": f"Successfully assigned {faculty.name} as mentor for {student.name}",
        "student_id": student.student_id,
        "mentor_name": faculty.name
    }

@router.get("/students-grades")
def list_students_and_grades(
    branch: Optional[str] = None,
    year: Optional[int] = None,
    risk: Optional[str] = None,
    search: Optional[str] = None,
    under_50_only: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["faculty", "admin"]:
        raise HTTPException(status_code=403, detail="Faculty or Admin authorization required")
        
    query = db.query(Student)
    if branch and branch != "ALL":
        query = query.filter(Student.branch == branch)
    if year:
        query = query.filter(Student.year == year)
    if risk and risk != "ALL":
        query = query.filter(Student.risk_category == risk.upper())
    if under_50_only:
        query = query.filter((Student.academic_score < 50.0) | (Student.success_score < 50.0))
    if search:
        search_fmt = f"%{search}%"
        query = query.filter(
            (Student.name.ilike(search_fmt)) |
            (Student.student_id.ilike(search_fmt)) |
            (Student.email.ilike(search_fmt))
        )
        
    students = query.order_by(Student.student_id.asc()).all()
    results = []
    for s in students:
        marks = db.query(SubjectMarks).filter(SubjectMarks.student_id == s.student_id).all()
        needs_guidance = (s.academic_score is not None and s.academic_score < 50.0) or (s.success_score is not None and 0 < s.success_score < 50.0) or any(m.total_percentage < 50.0 for m in marks)
        
        results.append({
            "student_id": s.student_id,
            "name": s.name,
            "email": s.email,
            "branch": s.branch,
            "year": s.year,
            "semester": s.semester,
            "cgpa": s.cgpa,
            "academic_score": s.academic_score,
            "attendance_pct": s.attendance_pct,
            "success_score": s.success_score,
            "risk_category": s.risk_category,
            "career_goal": s.career_goal,
            "needs_guidance": needs_guidance,
            "subject_marks": [{
                "id": m.id,
                "subject_code": m.subject_code,
                "subject_name": m.subject_name,
                "internal_marks": m.internal_marks,
                "assignment_marks": m.assignment_marks,
                "lab_marks": m.lab_marks,
                "total_percentage": m.total_percentage,
                "grade": m.grade,
                "is_weak": m.is_weak_subject or m.total_percentage < 50.0
            } for m in marks]
        })
        
    return {
        "total": len(results),
        "students": results
    }
