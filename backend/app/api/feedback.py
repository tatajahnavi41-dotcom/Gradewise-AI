from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
from app.core.database import get_db
from app.api.auth import get_current_user
from app.models.models import User, Feedback

router = APIRouter(prefix="/feedback", tags=["Feedback Centre"])

class SubmitFeedbackRequest(BaseModel):
    target_type: str  # course, faculty, campus, system
    category: str
    rating: int       # 1 to 5
    comments: str
    is_anonymous: bool = False

@router.post("")
def submit_feedback(
    req: SubmitFeedbackRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not (1 <= req.rating <= 5):
        raise HTTPException(status_code=400, detail="Rating must be between 1 and 5 stars")
        
    submitter_id = current_user.student_id or current_user.staff_id or current_user.username
    
    fb = Feedback(
        submitter_type=current_user.role,
        submitter_id=submitter_id,
        target_type=req.target_type,
        category=req.category,
        rating=req.rating,
        comments=req.comments,
        is_anonymous=req.is_anonymous,
        created_at=datetime.utcnow()
    )
    db.add(fb)
    db.commit()
    db.refresh(fb)
    
    return {
        "message": "Thank you! Your feedback has been securely submitted and logged.",
        "feedback_id": fb.id
    }

@router.get("")
def list_feedback(
    target_type: Optional[str] = None,
    category: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Feedback)
    if target_type and target_type != "ALL":
        query = query.filter(Feedback.target_type == target_type)
    if category and category != "ALL":
        query = query.filter(Feedback.category == category)
        
    all_fb = query.order_by(Feedback.created_at.desc()).all()
    
    results = []
    ratings = []
    for item in all_fb:
        ratings.append(item.rating)
        display_author = "Anonymous Student" if item.is_anonymous and current_user.role != "admin" else item.submitter_id
        results.append({
            "id": item.id,
            "submitter_type": item.submitter_type,
            "submitter_id": display_author,
            "target_type": item.target_type,
            "category": item.category,
            "rating": item.rating,
            "comments": item.comments,
            "is_anonymous": item.is_anonymous,
            "created_at": item.created_at.strftime("%Y-%m-%d %H:%M") if item.created_at else ""
        })
        
    avg_rating = round(sum(ratings) / max(1, len(ratings)), 1) if ratings else 0.0
    
    return {
        "total": len(results),
        "average_rating": avg_rating,
        "feedbacks": results
    }
