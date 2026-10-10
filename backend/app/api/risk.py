from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any
from app.core.database import get_db
from app.api.auth import get_current_user
from app.models.models import User, Student, SubjectMarks, Intervention, Staff
from app.services.early_warning import evaluate_risks_and_warnings
from app.services.segmentation import segment_students

router = APIRouter(prefix="/risks", tags=["Risk Intelligence & Segmentation"])

@router.get("")
def get_risk_intelligence(
    risk_type: Optional[str] = None, # ALL, ACADEMIC, ATTENDANCE, ASSIGNMENT, PLACEMENT
    severity: Optional[str] = None,  # ALL, CRITICAL, HIGH, MEDIUM
    branch: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["admin", "faculty"]:
        raise HTTPException(status_code=403, detail="Risk Intelligence is restricted to authorized faculty and administrators.")
        
    query = db.query(Student)
    if branch and branch != "ALL":
        query = query.filter(Student.branch == branch)
    elif current_user.role == "faculty" and current_user.branch:
        query = query.filter(Student.branch == current_user.branch)
        
    students = query.all()
    all_marks = db.query(SubjectMarks).all()
    marks_by_student = {}
    for m in all_marks:
        marks_by_student.setdefault(m.student_id, []).append(m)
        
    interventions = db.query(Intervention).all()
    interventions_by_student = {}
    for i in interventions:
        interventions_by_student.setdefault(i.student_id, []).append(i)
        
    flags = []
    
    for s in students:
        student_marks = marks_by_student.get(s.student_id, [])
        risk_res = evaluate_risks_and_warnings(s, student_marks)
        
        student_ints = interventions_by_student.get(s.student_id, [])
        latest_int_status = student_ints[0].status if student_ints else "No Active Intervention"
        
        for w in risk_res["warnings"]:
            if risk_type and risk_type != "ALL" and w["type"] != risk_type:
                continue
            if severity and severity != "ALL" and w["severity"] != severity:
                continue
                
            flags.append({
                "student_id": s.student_id,
                "student_name": s.name,
                "branch": s.branch,
                "year": s.year,
                "risk_type": w["type"],
                "severity": w["severity"],
                "indicator": w["indicator"],
                "actual_value": w["actual_value"],
                "threshold": w["threshold"],
                "triggering_rule": w["rule"],
                "evidence": w["evidence"],
                "recommended_action": w["recommended_action"],
                "assigned_mentor_id": s.primary_mentor_id,
                "intervention_status": latest_int_status
            })
            
    # Sort critical first, then high
    severity_order = {"CRITICAL": 0, "HIGH": 1, "WARNING": 2, "MODERATE": 3, "LOW": 4}
    flags.sort(key=lambda x: severity_order.get(x["severity"], 5))

    return {
        "total_flags": len(flags),
        "flags": flags
    }

@router.get("/segmentation")
def get_student_segmentation(
    branch: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["admin", "faculty"]:
        raise HTTPException(status_code=403, detail="Student Segmentation requires authorized faculty or admin access.")
        
    query = db.query(Student)
    if branch and branch != "ALL":
        query = query.filter(Student.branch == branch)
    elif current_user.role == "faculty" and current_user.branch:
        query = query.filter(Student.branch == current_user.branch)
        
    students = query.all()
    segments = segment_students(students)
    return segments
