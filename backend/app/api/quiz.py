import json
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
from app.core.database import get_db
from app.api.auth import get_current_user
from app.models.models import User, Student, QuizQuestion, AssessmentAttempt, GrowthLeagueEvent
from app.services.scoring_engine import calculate_comeback_score

router = APIRouter(prefix="/quiz", tags=["Gamified Learning Arena"])

class SubmitAnswerRequest(BaseModel):
    question_id: int
    student_id: str
    selected_answer: str
    time_spent_secs: int = 45

@router.get("/questions")
def get_quiz_questions(
    branch: Optional[str] = None,
    subject: Optional[str] = None,
    difficulty: Optional[str] = None,
    question_type: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(QuizQuestion)
    if branch and branch != "ALL":
        query = query.filter((QuizQuestion.branch == branch) | (QuizQuestion.branch == "ALL"))
    if subject and subject != "ALL":
        query = query.filter(QuizQuestion.subject == subject)
    if difficulty and difficulty != "ALL":
        query = query.filter(QuizQuestion.difficulty == difficulty)
    if question_type and question_type != "ALL":
        query = query.filter(QuizQuestion.question_type == question_type)
        
    questions = query.all()
    
    # Hide correct_answer and explanation before submission
    results = []
    for q in questions:
        try:
            options = json.loads(q.options_json) if isinstance(q.options_json, str) else []
        except Exception:
            options = []
            
        results.append({
            "id": q.id,
            "branch": q.branch,
            "subject": q.subject,
            "question_type": q.question_type,
            "title": q.title,
            "question_text": q.question_text,
            "image_svg": q.image_svg,
            "code_snippet": q.code_snippet,
            "options": options,
            "difficulty": q.difficulty
        })
        
    return {
        "count": len(results),
        "questions": results
    }

@router.post("/submit")
def submit_quiz_answer(
    req: SubmitAnswerRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    question = db.query(QuizQuestion).filter(QuizQuestion.id == req.question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
        
    student = db.query(Student).filter(Student.student_id == req.student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
        
    is_correct = (req.selected_answer.strip().lower() == question.correct_answer.strip().lower())
    points_awarded = 25 if is_correct else 5
    
    # Update student growth streak and growth points
    if is_correct:
        student.growth_points = (student.growth_points or 0) + points_awarded
        student.learning_streak = (student.learning_streak or 1) + 1
    else:
        student.growth_points = (student.growth_points or 0) + points_awarded
        
    student.comeback_score = calculate_comeback_score(
        student.success_score or 70.0,
        student.prev_semester_score or 65.0,
        student.learning_streak,
        student.growth_points
    )
    
    # Record attempt
    attempt = AssessmentAttempt(
        student_id=req.student_id,
        quiz_title=question.title,
        subject=question.subject,
        score=100.0 if is_correct else 0.0,
        total_questions=1,
        time_spent_secs=req.time_spent_secs,
        streak=student.learning_streak,
        date=datetime.utcnow()
    )
    db.add(attempt)
    
    # Add growth league event if correct
    if is_correct:
        league_event = GrowthLeagueEvent(
            branch=student.branch,
            student_id=student.student_id,
            student_name=student.name,
            points=points_awarded,
            event_type="quiz_solved",
            description=f"Solved '{question.title}' in Learning Arena",
            timestamp=datetime.utcnow()
        )
        db.add(league_event)
        
    db.commit()
    
    return {
        "is_correct": is_correct,
        "correct_answer": question.correct_answer,
        "explanation": question.explanation,
        "points_earned": points_awarded,
        "total_growth_points": student.growth_points,
        "new_streak": student.learning_streak,
        "updated_comeback_score": student.comeback_score
    }

@router.get("/history/{student_id}")
def get_quiz_history(
    student_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    attempts = db.query(AssessmentAttempt).filter(
        AssessmentAttempt.student_id == student_id
    ).order_by(AssessmentAttempt.date.desc()).limit(20).all()
    
    return {
        "student_id": student_id,
        "attempts": attempts
    }
