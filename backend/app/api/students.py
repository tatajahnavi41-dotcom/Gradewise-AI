import json
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
from app.core.database import get_db
from app.api.auth import get_current_user
from app.models.models import (
    User, Student, SubjectMarks, AssessmentAttempt,
    RoadmapMilestone, Intervention, Staff, ExamSchedule
)
from app.services.scoring_engine import calculate_student_success_score, calculate_comeback_score
from app.services.early_warning import evaluate_risks_and_warnings, compute_exam_difficulty_radar

router = APIRouter(prefix="/students", tags=["Students"])

class UpdateCareerGoalRequest(BaseModel):
    career_goal: str

@router.get("")
def list_students(
    branch: Optional[str] = None,
    year: Optional[Any] = None,
    risk: Optional[str] = None,
    search: Optional[str] = None,
    provisional_only: bool = False,
    sort_by: str = "class_rank",
    order: str = "asc",
    skip: int = 0,
    limit: int = 180,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Student)
    
    # Faculty can view all students or filter by specific branch
    if branch and branch != "ALL":
        query = query.filter(Student.branch == branch)
        
    if year is not None and str(year).strip() not in ("", "ALL", "undefined", "null"):
        try:
            year_int = int(year)
            query = query.filter(Student.year == year_int)
        except (ValueError, TypeError):
            pass
        
    if risk and risk != "ALL":
        query = query.filter(Student.risk_category == risk.upper())
        
    if provisional_only:
        query = query.filter(Student.is_provisional == True)
        
    if search:
        search_fmt = f"%{search}%"
        query = query.filter(
            (Student.name.ilike(search_fmt)) |
            (Student.student_id.ilike(search_fmt)) |
            (Student.email.ilike(search_fmt))
        )
        
    # Sorting
    if sort_by == "success_score":
        query = query.order_by(Student.success_score.asc() if order == "asc" else Student.success_score.desc())
    elif sort_by == "cgpa":
        query = query.order_by(Student.cgpa.asc() if order == "asc" else Student.cgpa.desc())
    elif sort_by == "attendance":
        query = query.order_by(Student.attendance_pct.asc() if order == "asc" else Student.attendance_pct.desc())
    elif sort_by == "comeback_score":
        query = query.order_by(Student.comeback_score.asc() if order == "asc" else Student.comeback_score.desc())
    else:
        query = query.order_by(Student.class_rank.asc() if order == "asc" else Student.class_rank.desc())
        
    total_count = query.count()
    students = query.offset(skip).limit(limit).all()
    
    return {
        "total": total_count,
        "count": len(students),
        "students": students
    }

@router.get("/{student_id}")
def get_student_profile(
    student_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    student = db.query(Student).filter(Student.student_id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail=f"Student {student_id} not found")
        
    # Privacy check: If logged-in user is a student, only allow viewing their own profile
    if current_user.role == "student" and current_user.student_id != student_id:
        raise HTTPException(status_code=403, detail="Access denied: Students can only view their own private profile")
        
    marks = db.query(SubjectMarks).filter(SubjectMarks.student_id == student_id).all()
    milestones = db.query(RoadmapMilestone).filter(RoadmapMilestone.student_id == student_id).all()
    interventions = db.query(Intervention).filter(Intervention.student_id == student_id).all()
    attempts = db.query(AssessmentAttempt).filter(AssessmentAttempt.student_id == student_id).order_by(AssessmentAttempt.date.desc()).all()
    mentor = db.query(Staff).filter(Staff.staff_id == student.primary_mentor_id).first() if student.primary_mentor_id else None
    
    # Calculate explainable score breakdown
    student_dict = {
        "academic_score": student.academic_score,
        "attendance_pct": student.attendance_pct,
        "lms_activity_score": student.lms_activity_score,
        "engagement_score": student.engagement_score,
        "placement_readiness_score": student.placement_readiness_score,
        "skills_score": student.skills_score,
    }
    score_breakdown = calculate_student_success_score(student_dict)
    risk_evaluation = evaluate_risks_and_warnings(student, marks)

    # Performance guidance for students scoring below 50%
    guidance = []
    if (student.academic_score is not None and student.academic_score < 50.0) or (student.success_score is not None and 0 < student.success_score < 50.0):
        guidance.append({
            "area": "Overall Academic Performance",
            "message": "Your academic standing is below the 50% threshold. Schedule 1-on-1 counseling with your assigned faculty mentor and follow topic-wise review sets.",
            "recommended_action": "Schedule 1-on-1 Faculty Mentoring",
            "priority": "HIGH",
            "type": "ACADEMIC_REMEDIAL"
        })
    for sm in marks:
        if sm.total_percentage < 50.0:
            guidance.append({
                "area": f"{sm.subject_name} ({sm.subject_code})",
                "message": f"Current score in {sm.subject_code} is {sm.total_percentage}% (Grade {sm.grade}). Priority revision required before end-semester exam.",
                "recommended_action": f"Practice foundational questions for {sm.subject_code} in Learning Arena",
                "subject_code": sm.subject_code,
                "priority": "CRITICAL",
                "type": "SUBJECT_REMEDIAL"
            })
    if student.attendance_pct is not None and student.attendance_pct < 75.0 and student.attendance_pct > 0:
        guidance.append({
            "area": "Attendance Recovery",
            "message": f"Classroom attendance is {student.attendance_pct}%. Minimum 75% required for exam eligibility.",
            "recommended_action": "Submit Attendance Catch-up log and consult HOD",
            "priority": "HIGH",
            "type": "ATTENDANCE_WARNING"
        })
    
    return {
        "student": student,
        "score_breakdown": score_breakdown,
        "risk_evaluation": risk_evaluation,
        "academic_guidance": guidance,
        "subject_marks": marks,
        "milestones": milestones,
        "interventions": interventions,
        "recent_attempts": attempts,
        "mentor": mentor
    }

@router.get("/{student_id}/radar")
def get_student_exam_radar(
    student_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    student = db.query(Student).filter(Student.student_id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
        
    marks = db.query(SubjectMarks).filter(SubjectMarks.student_id == student_id).all()
    upcoming_exams = db.query(ExamSchedule).filter(
        (ExamSchedule.branch == student.branch) | (ExamSchedule.branch == "ALL"),
        ExamSchedule.year == student.year
    ).all()
    
    radar = compute_exam_difficulty_radar(student, marks, upcoming_exams)
    return {
        "student_id": student.student_id,
        "student_name": student.name,
        "branch": student.branch,
        "year": student.year,
        "radar": radar
    }

@router.post("/{student_id}/career-mission")
def update_career_mission(
    student_id: str,
    req: UpdateCareerGoalRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    student = db.query(Student).filter(Student.student_id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
        
    student.career_goal = req.career_goal
    db.commit()
    db.refresh(student)
    
    return {"message": "Career mission updated successfully", "career_goal": student.career_goal}

@router.patch("/milestone/{milestone_id}/toggle")
def toggle_milestone(
    milestone_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    milestone = db.query(RoadmapMilestone).filter(RoadmapMilestone.id == milestone_id).first()
    if not milestone:
        raise HTTPException(status_code=404, detail="Milestone not found")
        
    if milestone.status == "completed":
        milestone.status = "in_progress"
        milestone.completed_at = None
    else:
        milestone.status = "completed"
        milestone.completed_at = datetime.utcnow()
        # Award student growth points
        st = db.query(Student).filter(Student.student_id == milestone.student_id).first()
        if st:
            st.growth_points = (st.growth_points or 0) + 25
            st.comeback_score = calculate_comeback_score(st.success_score or 70.0, st.prev_semester_score or 65.0, st.learning_streak or 1, st.growth_points)
            
    db.commit()
    db.refresh(milestone)
    return {"milestone": milestone, "status": milestone.status}
