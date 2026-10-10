from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
from app.core.database import get_db
from app.api.auth import get_current_user
from app.models.models import User, Student, Staff, Intervention

router = APIRouter(prefix="/interventions", tags=["Interventions"])

class CreateInterventionRequest(BaseModel):
    student_id: str
    concern: str
    action_plan: str
    assigned_faculty_id: str
    due_date: str

class UpdateInterventionStatusRequest(BaseModel):
    status: str  # Pending, In Progress, Completed
    notes: Optional[str] = None
    follow_up_date: Optional[str] = None
    outcome_notes: Optional[str] = None

@router.get("")
def list_interventions(
    status: Optional[str] = None,
    student_id: Optional[str] = None,
    faculty_id: Optional[str] = None,
    branch: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Intervention).join(Student, Intervention.student_id == Student.student_id)
    
    if current_user.role == "student":
        # Students only see their own interventions
        query = query.filter(Intervention.student_id == current_user.student_id)
    elif current_user.role == "faculty" and current_user.branch:
        query = query.filter(Student.branch == current_user.branch)
        
    if status and status != "ALL":
        query = query.filter(Intervention.status == status)
    if student_id:
        query = query.filter(Intervention.student_id == student_id)
    if faculty_id:
        query = query.filter(Intervention.assigned_faculty_id == faculty_id)
    if branch and branch != "ALL":
        query = query.filter(Student.branch == branch)
        
    items = query.order_by(Intervention.created_at.desc()).all()
    
    results = []
    for item in items:
        st = db.query(Student).filter(Student.student_id == item.student_id).first()
        fac = db.query(Staff).filter(Staff.staff_id == item.assigned_faculty_id).first()
        results.append({
            "id": item.id,
            "student_id": item.student_id,
            "student_name": st.name if st else "Unknown",
            "branch": st.branch if st else "",
            "year": st.year if st else 2,
            "concern": item.concern,
            "action_plan": item.action_plan,
            "assigned_faculty_id": item.assigned_faculty_id,
            "faculty_name": fac.name if fac else item.assigned_faculty_id,
            "created_at": item.created_at.isoformat() if item.created_at else "",
            "due_date": item.due_date,
            "status": item.status,
            "notes": item.notes,
            "follow_up_date": item.follow_up_date,
            "outcome_notes": item.outcome_notes,
            "is_overdue": item.is_overdue
        })
        
    return {
        "total": len(results),
        "interventions": results
    }

@router.post("")
def create_intervention(
    req: CreateInterventionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["faculty", "admin"]:
        raise HTTPException(status_code=403, detail="Faculty or Admin authorization required to create an intervention.")
        
    student = db.query(Student).filter(Student.student_id == req.student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
        
    intervention = Intervention(
        student_id=req.student_id,
        concern=req.concern,
        action_plan=req.action_plan,
        assigned_faculty_id=req.assigned_faculty_id,
        created_at=datetime.utcnow(),
        due_date=req.due_date,
        status="Pending",
        notes="Intervention initiated."
    )
    db.add(intervention)
    db.commit()
    db.refresh(intervention)
    
    return {
        "message": f"Intervention successfully created for student {student.name} ({student.student_id})",
        "intervention": intervention
    }

@router.patch("/{intervention_id}/status")
def update_intervention_status(
    intervention_id: int,
    req: UpdateInterventionStatusRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["faculty", "admin"]:
        raise HTTPException(status_code=403, detail="Faculty or Admin authorization required to update an intervention.")
        
    intervention = db.query(Intervention).filter(Intervention.id == intervention_id).first()
    if not intervention:
        raise HTTPException(status_code=404, detail="Intervention not found")
        
    intervention.status = req.status
    if req.notes:
        intervention.notes = req.notes
    if req.follow_up_date:
        intervention.follow_up_date = req.follow_up_date
    if req.outcome_notes:
        intervention.outcome_notes = req.outcome_notes
        
    db.commit()
    db.refresh(intervention)
    return {
        "message": f"Intervention #{intervention_id} status updated to {req.status}",
        "intervention": intervention
    }
