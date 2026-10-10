import json
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from app.core.database import get_db
from app.api.auth import get_current_user
from app.core.security import hash_password
from app.models.models import (
    User, Student, Staff, Intervention, Feedback, GrowthLeagueEvent,
    SubjectMarks, Task, TaskSubmission, LearningMaterial
)
from app.services.growth_league import compute_growth_league_standings
from app.services.segmentation import segment_students
from app.services.scoring_engine import calculate_student_success_score, calculate_comeback_score

router = APIRouter(prefix="/admin", tags=["Admin & Campus Intelligence"])

class CreateStudentAdminRequest(BaseModel):
    student_id: str
    name: str
    email: str
    branch: str
    year: int
    semester: int
    cgpa: Optional[float] = 0.0
    attendance_pct: Optional[float] = 0.0
    academic_score: Optional[float] = 0.0
    study_hours: Optional[float] = 0.0
    career_goal: Optional[str] = "Software Developer"
    learning_style: Optional[str] = "Visual & Practical"
    phone: Optional[str] = None
    bio: Optional[str] = None
    password: Optional[str] = "Student@123"

class UpdateStudentAdminRequest(BaseModel):
    name: Optional[str] = None
    branch: Optional[str] = None
    year: Optional[int] = None
    semester: Optional[int] = None
    cgpa: Optional[float] = None
    attendance_pct: Optional[float] = None
    academic_score: Optional[float] = None
    study_hours: Optional[float] = None
    career_goal: Optional[str] = None
    learning_style: Optional[str] = None
    phone: Optional[str] = None
    bio: Optional[str] = None
    risk_category: Optional[str] = None
    profile_status: Optional[str] = None

class CreateStaffAdminRequest(BaseModel):
    staff_id: str
    name: str
    email: str
    department: str
    role_type: str  # teaching, non-teaching
    designation: str
    specialization: Optional[str] = None
    assigned_branch: Optional[str] = None
    assigned_subjects: Optional[List[str]] = []
    max_mentees: Optional[int] = 20
    phone: Optional[str] = None
    bio: Optional[str] = None
    password: Optional[str] = "Faculty@123"

class UpdateStaffAdminRequest(BaseModel):
    name: Optional[str] = None
    department: Optional[str] = None
    role_type: Optional[str] = None
    designation: Optional[str] = None
    specialization: Optional[str] = None
    assigned_branch: Optional[str] = None
    assigned_subjects: Optional[List[str]] = None
    max_mentees: Optional[int] = None
    phone: Optional[str] = None
    bio: Optional[str] = None

class UpdateUserRoleRequest(BaseModel):
    role: Optional[str] = None
    is_active: Optional[bool] = None
    is_approved: Optional[bool] = None

@router.get("/dashboard")
def get_campus_intelligence_dashboard(
    branch: Optional[str] = None,
    year: Optional[Any] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin authorization required")
        
    query = db.query(Student)
    if branch and branch != "ALL":
        query = query.filter(Student.branch == branch)
    if year is not None and str(year).strip() not in ("", "ALL", "undefined", "null"):
        try:
            year_int = int(year)
            query = query.filter(Student.year == year_int)
        except (ValueError, TypeError):
            pass
        
    students = query.all()
    total_students = len(students)
    
    total_staff = db.query(Staff).count()
    teaching_staff = db.query(Staff).filter(Staff.role_type == "teaching").count()
    non_teaching_staff = db.query(Staff).filter(Staff.role_type == "non-teaching").count()
    
    # Branch counts
    aiml_count = len([s for s in students if s.branch == "AIML"])
    aids_count = len([s for s in students if s.branch == "AIDS"])
    cse_count = len([s for s in students if s.branch == "CSE"])
    
    # Scores
    scores = [s.success_score or 0 for s in students]
    avg_success_score = round(sum(scores) / max(1, total_students), 1)
    
    # High performers & risks
    high_performers = len([s for s in students if (s.success_score or 0) >= 75.0])
    medium_risk = len([s for s in students if s.risk_category == "MEDIUM"])
    high_risk = len([s for s in students if s.risk_category == "HIGH"])
    
    academic_risk_count = len([s for s in students if s.academic_risk])
    attendance_risk_count = len([s for s in students if s.attendance_risk])
    placement_risk_count = len([s for s in students if s.placement_risk])
    assignment_risk_count = len([s for s in students if s.assignment_risk])
    provisional_count = len([s for s in students if s.is_provisional])
    
    # Average attendance & assignment
    attendances = [s.attendance_pct or 0 for s in students]
    avg_attendance = round(sum(attendances) / max(1, total_students), 1)
    
    # Interventions
    interventions = db.query(Intervention).all()
    pending_int = len([i for i in interventions if i.status == "Pending"])
    inprogress_int = len([i for i in interventions if i.status == "In Progress"])
    completed_int = len([i for i in interventions if i.status == "Completed"])
    
    # Tasks
    total_tasks = db.query(Task).count()
    active_tasks = db.query(Task).filter(Task.status == "Active").count()
    total_submissions = db.query(TaskSubmission).count()
    completed_submissions = db.query(TaskSubmission).filter(TaskSubmission.status == "Completed").count()
    
    # Feedbacks
    feedbacks = db.query(Feedback).all()
    avg_feedback_rating = round(sum(f.rating for f in feedbacks) / max(1, len(feedbacks)), 1) if feedbacks else 4.5
    
    # Dynamic Executive Insights
    insights = [
        f"College-wide average Success Score is {avg_success_score}/100 across {total_students} active students.",
        f"{high_performers} students ({high_performers/max(1, total_students)*100:.0f}%) demonstrate strong holistic standing (>75).",
        f"Placement risk flagged in {placement_risk_count} students (primarily coding/aptitude preparation benchmarks in 3rd & 4th year).",
        f"Active faculty interventions stand at {inprogress_int} ongoing and {completed_int} successfully resolved cases.",
        f"Academic task engine tracking {total_tasks} total assignments with {completed_submissions} reviewed submissions."
    ]

    return {
        "summary": {
            "total_students": total_students,
            "total_staff": total_staff,
            "teaching_staff": teaching_staff,
            "non_teaching_staff": non_teaching_staff,
            "branches": {
                "AIML": aiml_count,
                "AIDS": aids_count,
                "CSE": cse_count
            },
            "average_success_score": avg_success_score,
            "average_attendance": avg_attendance,
            "high_performers": high_performers,
            "medium_risk": medium_risk,
            "high_risk": high_risk,
            "academic_risk_count": academic_risk_count,
            "attendance_risk_count": attendance_risk_count,
            "placement_risk_count": placement_risk_count,
            "assignment_risk_count": assignment_risk_count,
            "provisional_count": provisional_count,
            "interventions": {
                "total": len(interventions),
                "pending": pending_int,
                "in_progress": inprogress_int,
                "completed": completed_int
            },
            "tasks_summary": {
                "total_tasks": total_tasks,
                "active_tasks": active_tasks,
                "total_submissions": total_submissions,
                "completed_submissions": completed_submissions
            },
            "feedbacks": {
                "total": len(feedbacks),
                "avg_rating": avg_feedback_rating
            }
        },
        "insights": insights
    }

@router.get("/staff")
def list_staff(
    role_type: Optional[str] = None,
    department: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Staff)
    if role_type and role_type != "ALL":
        query = query.filter(Staff.role_type == role_type)
    if department and department != "ALL":
        query = query.filter(Staff.department == department)
    if search:
        search_fmt = f"%{search}%"
        query = query.filter(
            (Staff.name.ilike(search_fmt)) |
            (Staff.staff_id.ilike(search_fmt)) |
            (Staff.email.ilike(search_fmt)) |
            (Staff.specialization.ilike(search_fmt))
        )
        
    staff_members = query.all()
    
    # Enrich with task and intervention counts
    enriched = []
    for s in staff_members:
        tasks_count = db.query(Task).filter(Task.faculty_id == s.staff_id).count()
        interventions_count = db.query(Intervention).filter(Intervention.assigned_faculty_id == s.staff_id).count()
        materials_count = db.query(LearningMaterial).filter(LearningMaterial.faculty_id == s.staff_id).count()
        
        assigned_subs = []
        if s.assigned_subjects:
            try:
                assigned_subs = json.loads(s.assigned_subjects) if isinstance(s.assigned_subjects, str) else s.assigned_subjects
            except Exception:
                assigned_subs = [s.assigned_subjects]
                
        enriched.append({
            "staff_id": s.staff_id,
            "name": s.name,
            "email": s.email,
            "department": s.department,
            "role_type": s.role_type,
            "designation": s.designation,
            "specialization": s.specialization,
            "assigned_branch": s.assigned_branch,
            "assigned_subjects": assigned_subs,
            "max_mentees": s.max_mentees,
            "current_mentees": s.current_mentees,
            "phone": getattr(s, "phone", None),
            "bio": getattr(s, "bio", None),
            "is_active": getattr(s, "is_active", True),
            "tasks_count": tasks_count,
            "interventions_count": interventions_count,
            "materials_count": materials_count
        })
        
    return {
        "total": len(enriched),
        "staff": enriched
    }

@router.post("/staff")
def create_staff(
    req: CreateStaffAdminRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin authorization required")
        
    existing = db.query(Staff).filter(
        (Staff.staff_id == req.staff_id) | (Staff.email == req.email)
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Staff ID or Email already exists.")
        
    staff = Staff(
        staff_id=req.staff_id.strip(),
        name=req.name.strip(),
        email=req.email.strip(),
        department=req.department.strip(),
        role_type=req.role_type.strip(),
        designation=req.designation.strip(),
        specialization=req.specialization.strip() if req.specialization else None,
        assigned_branch=req.assigned_branch.strip() if req.assigned_branch else None,
        assigned_subjects=json.dumps(req.assigned_subjects or []),
        max_mentees=req.max_mentees or 20,
        current_mentees=0,
        phone=req.phone.strip() if req.phone else None,
        bio=req.bio.strip() if req.bio else None,
        is_active=True
    )
    db.add(staff)
    
    # Create or update user login
    user_existing = db.query(User).filter(User.email == req.email).first()
    if not user_existing:
        new_user = User(
            username=req.email.split("@")[0],
            email=req.email.strip(),
            hashed_password=hash_password(req.password or "Faculty@123"),
            role="faculty",
            name=req.name.strip(),
            staff_id=req.staff_id.strip(),
            branch=req.assigned_branch or req.department,
            designation=req.designation.strip(),
            phone=req.phone,
            bio=req.bio,
            is_active=True
        )
        db.add(new_user)
        
    db.commit()
    return {"message": "Faculty account created successfully", "staff_id": staff.staff_id}

@router.put("/staff/{staff_id}")
def update_staff(
    staff_id: str,
    req: UpdateStaffAdminRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin authorization required")
        
    staff = db.query(Staff).filter(Staff.staff_id == staff_id).first()
    if not staff:
        raise HTTPException(status_code=404, detail="Staff record not found")
        
    if req.name is not None: staff.name = req.name.strip()
    if req.department is not None: staff.department = req.department.strip()
    if req.role_type is not None: staff.role_type = req.role_type.strip()
    if req.designation is not None: staff.designation = req.designation.strip()
    if req.specialization is not None: staff.specialization = req.specialization.strip()
    if req.assigned_branch is not None: staff.assigned_branch = req.assigned_branch.strip()
    if req.assigned_subjects is not None: staff.assigned_subjects = json.dumps(req.assigned_subjects)
    if req.max_mentees is not None: staff.max_mentees = req.max_mentees
    if req.phone is not None: staff.phone = req.phone.strip()
    if req.bio is not None: staff.bio = req.bio.strip()
    
    # Sync User
    user = db.query(User).filter(User.staff_id == staff_id).first()
    if user:
        if req.name is not None: user.name = req.name.strip()
        if req.designation is not None: user.designation = req.designation.strip()
        if req.assigned_branch is not None: user.branch = req.assigned_branch.strip()
        if req.phone is not None: user.phone = req.phone.strip()
        if req.bio is not None: user.bio = req.bio.strip()
        
    db.commit()
    return {"message": "Faculty record updated successfully", "staff_id": staff_id}

@router.patch("/staff/{staff_id}/status")
def toggle_staff_status(
    staff_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin authorization required")
        
    staff = db.query(Staff).filter(Staff.staff_id == staff_id).first()
    if not staff:
        raise HTTPException(status_code=404, detail="Staff record not found")
        
    current_status = getattr(staff, "is_active", True)
    staff.is_active = not current_status
    
    user = db.query(User).filter(User.staff_id == staff_id).first()
    if user:
        user.is_active = staff.is_active
        
    db.commit()
    return {"message": f"Staff status updated to {'Active' if staff.is_active else 'Deactivated'}", "is_active": staff.is_active}

@router.delete("/staff/{staff_id}")
def delete_staff(
    staff_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin authorization required")
        
    staff = db.query(Staff).filter(Staff.staff_id == staff_id).first()
    if not staff:
        raise HTTPException(status_code=404, detail="Staff record not found")
        
    user = db.query(User).filter(User.staff_id == staff_id).first()
    if user:
        db.delete(user)
        
    db.delete(staff)
    db.commit()
    return {"message": f"Staff {staff_id} deleted successfully"}

# Student Management Endpoints for Admin
@router.post("/students")
def create_student(
    req: CreateStudentAdminRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin authorization required")
        
    existing = db.query(Student).filter(
        (Student.student_id == req.student_id) | (Student.email == req.email)
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Student ID or Email already exists.")
        
    init_cgpa = float(req.cgpa) if req.cgpa is not None else 0.0
    init_attendance = float(req.attendance_pct) if req.attendance_pct is not None else 0.0
    init_academic = float(req.academic_score) if req.academic_score is not None else (round(init_cgpa * 10.0, 1) if init_cgpa > 0 else 0.0)
    init_study = float(req.study_hours) if req.study_hours is not None else 0.0

    if init_academic > 0 or init_attendance > 0:
        calc_res = calculate_student_success_score({
            "academic_score": init_academic,
            "attendance_pct": init_attendance,
            "lms_activity_score": 0.0,
            "engagement_score": 0.0,
            "placement_readiness_score": round(init_academic * 0.8, 1) if init_academic > 0 else 0.0,
            "skills_score": 0.0
        })
        init_success = calc_res["success_score"]
        init_risk = calc_res["risk_category"]
    else:
        init_success = 0.0
        init_risk = "PROVISIONAL"
    
    student = Student(
        student_id=req.student_id.strip().upper(),
        name=req.name.strip(),
        email=req.email.strip().lower(),
        branch=req.branch.strip().upper(),
        year=req.year,
        semester=req.semester,
        profile_status="Verified",
        phone=req.phone.strip() if req.phone else None,
        bio=req.bio.strip() if req.bio else None,
        is_active=True,
        study_hours=init_study,
        cgpa=init_cgpa,
        academic_score=init_academic,
        attendance_pct=init_attendance,
        lms_activity_score=0.0,
        engagement_score=0.0,
        placement_readiness_score=round(init_academic * 0.8, 1) if init_academic > 0 else 0.0,
        skills_score=0.0,
        success_score=init_success,
        risk_category=init_risk,
        career_goal=req.career_goal or "Software Developer",
        learning_style=req.learning_style or "Visual & Practical",
        growth_points=0,
        learning_streak=0
    )
    db.add(student)
    
    # Create User login
    user_existing = db.query(User).filter(User.email == req.email.strip().lower()).first()
    if not user_existing:
        new_user = User(
            username=req.email.strip().lower().split("@")[0],
            email=req.email.strip().lower(),
            hashed_password=hash_password(req.password or "Student@123"),
            role="student",
            name=req.name.strip(),
            student_id=req.student_id.strip().upper(),
            branch=req.branch.strip().upper(),
            phone=req.phone,
            bio=req.bio,
            is_active=True
        )
        db.add(new_user)
        
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
            }],
            users_data=[{
                "username": new_user.username if not user_existing else user_existing.username,
                "email": student.email,
                "role": "student",
                "name": student.name,
                "student_id": student.student_id,
                "branch": student.branch
            }]
        )
    except Exception as e:
        print(f"MongoDB sync notice on admin student create: {e}")

    return {"message": "Student created successfully", "student_id": student.student_id}

@router.put("/students/{student_id}")
def update_student(
    student_id: str,
    req: UpdateStudentAdminRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin authorization required")
        
    student = db.query(Student).filter(Student.student_id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
        
    if req.name is not None: student.name = req.name.strip()
    if req.branch is not None: student.branch = req.branch.strip()
    if req.year is not None: student.year = req.year
    if req.semester is not None: student.semester = req.semester
    if req.cgpa is not None: student.cgpa = req.cgpa
    if req.attendance_pct is not None: 
        student.attendance_pct = req.attendance_pct
        student.attendance_risk = (student.attendance_pct < 65.0)
    if req.academic_score is not None: student.academic_score = req.academic_score
    if req.study_hours is not None: student.study_hours = req.study_hours
    if req.career_goal is not None: student.career_goal = req.career_goal.strip()
    if req.learning_style is not None: student.learning_style = req.learning_style.strip()
    if req.phone is not None: student.phone = req.phone.strip()
    if req.bio is not None: student.bio = req.bio.strip()
    if req.risk_category is not None: student.risk_category = req.risk_category
    if req.profile_status is not None: student.profile_status = req.profile_status
    
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
    if not req.risk_category:
        student.risk_category = calc_res["risk_category"]
        
    # Sync User
    user = db.query(User).filter(User.student_id == student_id).first()
    if user:
        if req.name is not None: user.name = req.name.strip()
        if req.branch is not None: user.branch = req.branch.strip()
        if req.phone is not None: user.phone = req.phone.strip()
        if req.bio is not None: user.bio = req.bio.strip()
        
    db.commit()
    return {"message": "Student record updated successfully", "student_id": student_id}

@router.patch("/students/{student_id}/status")
def toggle_student_status(
    student_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin authorization required")
        
    student = db.query(Student).filter(Student.student_id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
        
    current_status = getattr(student, "is_active", True)
    student.is_active = not current_status
    
    user = db.query(User).filter(User.student_id == student_id).first()
    if user:
        user.is_active = student.is_active
        
    db.commit()
    return {"message": f"Student status updated to {'Active' if student.is_active else 'Deactivated'}", "is_active": student.is_active}

@router.delete("/students/{student_id}")
def delete_student(
    student_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin authorization required")
        
    student = db.query(Student).filter(Student.student_id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
        
    user = db.query(User).filter(User.student_id == student_id).first()
    if user:
        db.delete(user)
        
    db.delete(student)
    db.commit()
    return {"message": f"Student {student_id} deleted successfully"}

# User Accounts & Permissions Management
@router.get("/users")
def list_users(
    role: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin authorization required")
        
    query = db.query(User)
    if role and role != "ALL":
        query = query.filter(User.role == role)
    if search:
        search_fmt = f"%{search}%"
        query = query.filter(
            (User.username.ilike(search_fmt)) |
            (User.email.ilike(search_fmt)) |
            (User.name.ilike(search_fmt))
        )
        
    users = query.all()
    results = []
    for u in users:
        results.append({
            "id": u.id,
            "username": u.username,
            "email": u.email,
            "role": u.role,
            "name": u.name,
            "student_id": u.student_id,
            "staff_id": u.staff_id,
            "branch": u.branch,
            "designation": u.designation,
            "phone": getattr(u, "phone", None),
            "is_active": getattr(u, "is_active", True),
            "is_approved": getattr(u, "is_approved", True),
            "created_at": u.created_at.isoformat() if u.created_at else ""
        })
    return {"total": len(results), "users": results}

@router.patch("/users/{user_id}/permissions")
def update_user_permissions(
    user_id: int,
    req: UpdateUserRoleRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin authorization required")
        
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User account not found")
        
    if req.role is not None and req.role in ["admin", "faculty", "student"]:
        target_user.role = req.role
    if req.is_active is not None:
        target_user.is_active = req.is_active
    if req.is_approved is not None:
        target_user.is_approved = req.is_approved
        
    db.commit()
    return {"message": "User permissions updated successfully", "user_id": user_id}

@router.get("/growth-league")
def get_growth_league(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    students = db.query(Student).all()
    events = db.query(GrowthLeagueEvent).all()
    return compute_growth_league_standings(students, events)

@router.get("/leaderboard")
def get_campus_leaderboard(
    branch: Optional[str] = None,
    year: Optional[int] = None,
    category: str = "success_score",
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Student)
    if branch and branch != "ALL":
        query = query.filter(Student.branch == branch)
    if year:
        query = query.filter(Student.year == year)
        
    if category == "comeback_score":
        query = query.order_by(Student.comeback_score.desc())
    elif category == "cgpa":
        query = query.order_by(Student.cgpa.desc())
    elif category == "attendance":
        query = query.order_by(Student.attendance_pct.desc())
    else:
        query = query.order_by(Student.success_score.desc())
        
    leaders = query.limit(limit).all()
    
    leader_records = []
    for idx, s in enumerate(leaders):
        leader_records.append({
            "rank": idx + 1,
            "student_id": s.student_id,
            "name": s.name,
            "branch": s.branch,
            "year": s.year,
            "success_score": s.success_score,
            "comeback_score": s.comeback_score,
            "cgpa": s.cgpa,
            "attendance_pct": s.attendance_pct,
            "growth_points": s.growth_points,
            "learning_streak": s.learning_streak,
            "performance_band": "Top Tier" if (s.success_score or 0) >= 80 else ("Growth Champion" if (s.comeback_score or 0) >= 65 else "Solid Progress")
        })
        
    return {
        "category": category,
        "count": len(leader_records),
        "leaderboard": leader_records
    }
