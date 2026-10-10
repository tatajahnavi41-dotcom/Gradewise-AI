from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
import json
from app.core.database import get_db
from app.api.auth import get_current_user
from app.models.models import User, LearningMaterial, ExamSchedule

router = APIRouter(prefix="/materials", tags=["Learning Materials & Tests"])

class AddMaterialRequest(BaseModel):
    branch: str
    year: int
    subject_code: str
    subject_name: str
    title: str
    category: str
    content_summary: str
    download_url: Optional[str] = "https://campusiq.internal/docs/resource.pdf"

@router.get("")
def list_materials(
    branch: Optional[str] = None,
    year: Optional[int] = None,
    category: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(LearningMaterial)
    if branch and branch != "ALL":
        query = query.filter((LearningMaterial.branch == branch) | (LearningMaterial.branch == "ALL"))
    if year:
        query = query.filter(LearningMaterial.year == year)
    if category and category != "ALL":
        query = query.filter(LearningMaterial.category == category)
        
    materials = query.order_by(LearningMaterial.date_added.desc()).all()
    return {
        "count": len(materials),
        "materials": materials
    }

@router.post("")
def add_material(
    req: AddMaterialRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["faculty", "admin"]:
        raise HTTPException(status_code=403, detail="Faculty authorization required to publish learning materials.")
        
    mat = LearningMaterial(
        branch=req.branch,
        year=req.year,
        subject_code=req.subject_code,
        subject_name=req.subject_name,
        title=req.title,
        category=req.category,
        content_summary=req.content_summary,
        download_url=req.download_url,
        faculty_id=current_user.staff_id or current_user.username,
        date_added=datetime.utcnow()
    )
    db.add(mat)
    db.commit()
    db.refresh(mat)
    
    return {
        "message": "Learning material published successfully",
        "material": mat
    }

@router.get("/exams")
def list_exam_schedules(
    branch: Optional[str] = None,
    year: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(ExamSchedule)
    if branch and branch != "ALL":
        query = query.filter((ExamSchedule.branch == branch) | (ExamSchedule.branch == "ALL"))
    if year:
        query = query.filter(ExamSchedule.year == year)
        
    exams = query.all()
    results = []
    for e in exams:
        try:
            topics = json.loads(e.syllabus_topics_json) if isinstance(e.syllabus_topics_json, str) else []
        except Exception:
            topics = []
        results.append({
            "id": e.id,
            "branch": e.branch,
            "year": e.year,
            "semester": e.semester,
            "subject_code": e.subject_code,
            "subject_name": e.subject_name,
            "exam_date": e.exam_date,
            "difficulty_index": e.difficulty_index,
            "syllabus_topics": topics
        })
    return {
        "exams": results
    }
