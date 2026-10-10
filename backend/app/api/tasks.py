from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
from app.core.database import get_db
from app.api.auth import get_current_user
from app.models.models import User, Student, Staff, Task, TaskSubmission, GrowthLeagueEvent
from app.services.scoring_engine import calculate_comeback_score

router = APIRouter(prefix="/tasks", tags=["Task Monitoring & Assignments"])

class CreateTaskRequest(BaseModel):
    title: str
    description: str
    subject_code: str
    subject_name: Optional[str] = None
    branch: Optional[str] = "ALL"
    year: Optional[int] = 0
    assigned_student_id: Optional[str] = None
    due_date: str
    points: Optional[int] = 100

class SubmitTaskRequest(BaseModel):
    submission_text: str
    attachment_url: Optional[str] = None

class ReviewSubmissionRequest(BaseModel):
    grade: str
    feedback: Optional[str] = None
    status: Optional[str] = "Completed"  # Completed, Needs Revision

class UpdateTaskRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    subject_code: Optional[str] = None
    subject_name: Optional[str] = None
    branch: Optional[str] = None
    year: Optional[int] = None
    due_date: Optional[str] = None
    points: Optional[int] = None
    status: Optional[str] = None

@router.get("")
def list_tasks(
    branch: Optional[str] = None,
    year: Optional[int] = None,
    status: Optional[str] = None,
    faculty_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Task)
    
    if current_user.role == "student" and current_user.student_id:
        student = db.query(Student).filter(Student.student_id == current_user.student_id).first()
        if student:
            # Student sees tasks for their branch/ALL and year/0 or directly assigned to them
            query = query.filter(
                (Task.branch.in_([student.branch, "ALL"])) &
                (Task.year.in_([student.year, 0])) |
                (Task.assigned_student_id == student.student_id)
            )
    elif current_user.role == "faculty":
        if faculty_id:
            query = query.filter(Task.faculty_id == faculty_id)
        elif current_user.staff_id:
            # Show faculty's own created tasks or branch tasks
            query = query.filter(
                (Task.faculty_id == current_user.staff_id) |
                (Task.branch == current_user.branch)
            )
    else:
        # Admin can filter by branch or faculty
        if branch and branch != "ALL":
            query = query.filter(Task.branch == branch)
        if year and year > 0:
            query = query.filter(Task.year == year)
        if faculty_id:
            query = query.filter(Task.faculty_id == faculty_id)

    if status and status != "ALL":
        query = query.filter(Task.status == status)
        
    tasks = query.order_by(Task.created_at.desc()).all()
    
    results = []
    for t in tasks:
        submissions = db.query(TaskSubmission).filter(TaskSubmission.task_id == t.id).all()
        submitted_count = len([s for s in submissions if s.status in ["Submitted", "Completed"]])
        completed_count = len([s for s in submissions if s.status == "Completed"])
        
        # Student specific submission status
        my_submission = None
        if current_user.role == "student" and current_user.student_id:
            sub = next((s for s in submissions if s.student_id == current_user.student_id), None)
            if sub:
                my_submission = {
                    "id": sub.id,
                    "status": sub.status,
                    "submission_text": sub.submission_text,
                    "attachment_url": sub.attachment_url,
                    "submitted_at": sub.submitted_at.isoformat() if sub.submitted_at else None,
                    "grade": sub.grade,
                    "feedback": sub.feedback
                }
                
        results.append({
            "id": t.id,
            "title": t.title,
            "description": t.description,
            "subject_code": t.subject_code,
            "subject_name": t.subject_name,
            "branch": t.branch,
            "year": t.year,
            "assigned_student_id": t.assigned_student_id,
            "faculty_id": t.faculty_id,
            "faculty_name": t.faculty_name,
            "due_date": t.due_date,
            "points": t.points,
            "status": t.status,
            "created_at": t.created_at.isoformat() if t.created_at else "",
            "total_submissions": len(submissions),
            "submitted_count": submitted_count,
            "completed_count": completed_count,
            "my_submission": my_submission
        })
        
    return {
        "total": len(results),
        "tasks": results
    }

@router.post("")
def create_task(
    req: CreateTaskRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["faculty", "admin"]:
        raise HTTPException(status_code=403, detail="Only Faculty and Admin can create academic tasks.")
        
    faculty_id = current_user.staff_id or ("ADM-001" if current_user.role == "admin" else "FAC-001")
    faculty_name = current_user.name
    
    sub_name = req.subject_name.strip() if req.subject_name else f"Course {req.subject_code}"
    task = Task(
        title=req.title.strip(),
        description=req.description.strip(),
        subject_code=req.subject_code.strip(),
        subject_name=sub_name,
        branch=req.branch or "ALL",
        year=req.year or 0,
        assigned_student_id=req.assigned_student_id,
        faculty_id=faculty_id,
        faculty_name=faculty_name,
        due_date=req.due_date.strip(),
        points=req.points or 100,
        status="Active",
        created_at=datetime.utcnow()
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    
    return {
        "message": "Academic task created successfully",
        "task_id": task.id,
        "task": {
            "id": task.id,
            "title": task.title,
            "due_date": task.due_date,
            "branch": task.branch,
            "year": task.year
        }
    }

@router.get("/{task_id}")
def get_task_details(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
        
    submissions = db.query(TaskSubmission).filter(TaskSubmission.task_id == task_id).all()
    
    # Submissions viewable by faculty/admin or filtered for student
    subs_data = []
    if current_user.role in ["faculty", "admin"]:
        for s in submissions:
            subs_data.append({
                "id": s.id,
                "student_id": s.student_id,
                "student_name": s.student_name,
                "submission_text": s.submission_text,
                "attachment_url": s.attachment_url,
                "status": s.status,
                "submitted_at": s.submitted_at.isoformat() if s.submitted_at else None,
                "reviewed_at": s.reviewed_at.isoformat() if s.reviewed_at else None,
                "grade": s.grade,
                "feedback": s.feedback
            })
    else:
        my_sub = next((s for s in submissions if s.student_id == current_user.student_id), None)
        if my_sub:
            subs_data.append({
                "id": my_sub.id,
                "student_id": my_sub.student_id,
                "student_name": my_sub.student_name,
                "submission_text": my_sub.submission_text,
                "attachment_url": my_sub.attachment_url,
                "status": my_sub.status,
                "submitted_at": my_sub.submitted_at.isoformat() if my_sub.submitted_at else None,
                "grade": my_sub.grade,
                "feedback": my_sub.feedback
            })

    return {
        "task": {
            "id": task.id,
            "title": task.title,
            "description": task.description,
            "subject_code": task.subject_code,
            "subject_name": task.subject_name,
            "branch": task.branch,
            "year": task.year,
            "assigned_student_id": task.assigned_student_id,
            "faculty_id": task.faculty_id,
            "faculty_name": task.faculty_name,
            "due_date": task.due_date,
            "points": task.points,
            "status": task.status,
            "created_at": task.created_at.isoformat() if task.created_at else ""
        },
        "submissions": subs_data
    }

@router.post("/{task_id}/submit")
def submit_task(
    task_id: int,
    req: SubmitTaskRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "student" or not current_user.student_id:
        raise HTTPException(status_code=403, detail="Only students can submit assignments.")
        
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
        
    sub = db.query(TaskSubmission).filter(
        TaskSubmission.task_id == task_id,
        TaskSubmission.student_id == current_user.student_id
    ).first()
    
    if not sub:
        sub = TaskSubmission(
            task_id=task_id,
            student_id=current_user.student_id,
            student_name=current_user.name,
            submission_text=req.submission_text,
            attachment_url=req.attachment_url,
            status="Submitted",
            submitted_at=datetime.utcnow()
        )
        db.add(sub)
    else:
        sub.submission_text = req.submission_text
        sub.attachment_url = req.attachment_url
        sub.status = "Submitted"
        sub.submitted_at = datetime.utcnow()
        
    # Update student completed assignment count
    student = db.query(Student).filter(Student.student_id == current_user.student_id).first()
    if student:
        student.assignments_completed = (student.assignments_completed or 0) + 1
        student.growth_points = (student.growth_points or 0) + 15
        student.comeback_score = calculate_comeback_score(
            student.success_score or 70.0,
            student.prev_semester_score or 65.0,
            student.learning_streak or 1,
            student.growth_points
        )
        
    db.commit()
    db.refresh(sub)
    
    return {
        "message": "Task submitted successfully",
        "submission_id": sub.id,
        "status": sub.status,
        "submitted_at": sub.submitted_at.isoformat()
    }

@router.patch("/submissions/{submission_id}/review")
def review_submission(
    submission_id: int,
    req: ReviewSubmissionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["faculty", "admin"]:
        raise HTTPException(status_code=403, detail="Faculty or Admin authorization required to grade submissions.")
        
    sub = db.query(TaskSubmission).filter(TaskSubmission.id == submission_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Submission not found")
        
    sub.grade = req.grade.strip()
    sub.feedback = req.feedback.strip() if req.feedback else None
    sub.status = req.status or "Completed"
    sub.reviewed_at = datetime.utcnow()
    
    # Award points to student for completed work
    student = db.query(Student).filter(Student.student_id == sub.student_id).first()
    if student:
        student.growth_points = (student.growth_points or 0) + 20
        # Add growth league event
        evt = GrowthLeagueEvent(
            branch=student.branch,
            student_id=student.student_id,
            student_name=student.name,
            points=20,
            event_type="mentor_task",
            description=f"Completed assignment with Grade {sub.grade}",
            timestamp=datetime.utcnow()
        )
        db.add(evt)
        
    db.commit()
    db.refresh(sub)
    
    return {
        "message": "Submission reviewed and graded successfully",
        "submission": {
            "id": sub.id,
            "status": sub.status,
            "grade": sub.grade,
            "feedback": sub.feedback
        }
    }

@router.put("/{task_id}")
def update_task(
    task_id: int,
    req: UpdateTaskRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["faculty", "admin"]:
        raise HTTPException(status_code=403, detail="Faculty or Admin authorization required.")
        
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
        
    if req.title is not None: task.title = req.title.strip()
    if req.description is not None: task.description = req.description.strip()
    if req.subject_code is not None: task.subject_code = req.subject_code.strip()
    if req.subject_name is not None: task.subject_name = req.subject_name.strip()
    if req.branch is not None: task.branch = req.branch
    if req.year is not None: task.year = req.year
    if req.due_date is not None: task.due_date = req.due_date.strip()
    if req.points is not None: task.points = req.points
    if req.status is not None: task.status = req.status
    
    db.commit()
    db.refresh(task)
    return {"message": "Task updated successfully", "task_id": task.id}

@router.delete("/{task_id}")
def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["faculty", "admin"]:
        raise HTTPException(status_code=403, detail="Faculty or Admin authorization required.")
        
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
        
    db.delete(task)
    db.commit()
    return {"message": "Task deleted successfully"}
