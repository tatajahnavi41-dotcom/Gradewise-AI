from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, Dict, Any
from app.core.database import get_db
from app.models.models import Student
from app.services.scoring_engine import calculate_student_success_score

router = APIRouter(prefix="/simulator", tags=["What-If Simulator"])

class SimulationRequest(BaseModel):
    student_id: Optional[str] = None
    academic_score: float
    attendance_pct: float
    lms_activity_score: float
    engagement_score: float
    coding_score: float
    aptitude_score: float
    mock_interview_score: float

@router.post("/what-if")
def run_what_if_simulation(
    req: SimulationRequest,
    db: Session = Depends(get_db)
):
    """
    Hypothetical simulation engine.
    Calculates projected score and risk shifts without modifying the actual database records.
    """
    # 1. Placement readiness is aggregate of coding, aptitude, and mock interview
    sim_placement = round((req.coding_score + req.aptitude_score + req.mock_interview_score) / 3.0, 1)
    sim_skills = round((req.coding_score * 0.6 + req.aptitude_score * 0.4), 1)
    
    sim_dict = {
        "academic_score": req.academic_score,
        "attendance_pct": req.attendance_pct,
        "lms_activity_score": req.lms_activity_score,
        "engagement_score": req.engagement_score,
        "placement_readiness_score": sim_placement,
        "skills_score": sim_skills,
    }
    
    sim_result = calculate_student_success_score(sim_dict)
    
    # 2. Baseline comparison if student_id is provided
    baseline_score = 65.0
    baseline_risk = "MEDIUM"
    if req.student_id:
        student = db.query(Student).filter(Student.student_id == req.student_id).first()
        if student:
            baseline_score = student.success_score or 65.0
            baseline_risk = student.risk_category or "MEDIUM"
            
    score_delta = round(sim_result["success_score"] - baseline_score, 1)
    
    # 3. Identify most influential component
    contributions = sim_result["components"]
    sorted_contribs = sorted(
        [(k, v["weighted_contribution"]) for k, v in contributions.items() if not v.get("is_missing")],
        key=lambda x: x[1],
        reverse=True
    )
    top_driver = sorted_contribs[0][0] if sorted_contribs else "academics"
    
    driver_labels = {
        "academics": "Academic Marks (30% weight)",
        "attendance": "Classroom Attendance (20% weight)",
        "lms": "LMS & Courseware Activity (15% weight)",
        "placement": "Placement Readiness Benchmark (15% weight)",
        "engagement": "Campus & Peer Engagement (10% weight)",
        "skills": "Practical Technical Skills (10% weight)"
    }
    
    return {
        "baseline_score": baseline_score,
        "baseline_risk": baseline_risk,
        "simulated_score": sim_result["success_score"],
        "simulated_risk": sim_result["risk_category"],
        "score_delta": score_delta,
        "top_driver": driver_labels.get(top_driver, top_driver),
        "breakdown": contributions,
        "notice": "This calculation is a hypothetical what-if scenario designed to guide student planning and does not modify official college records."
    }
