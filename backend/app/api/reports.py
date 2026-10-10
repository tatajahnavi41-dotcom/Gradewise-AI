import csv
import io
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from fastapi.responses import PlainTextResponse
from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any
from app.core.database import get_db
from app.api.auth import get_current_user
from app.models.models import User, Student, Staff, Intervention, Feedback

router = APIRouter(prefix="/reports", tags=["Reports & Data Exports"])

@router.get("/summary")
def get_campus_reports_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    students = db.query(Student).all()
    total_students = len(students)
    
    # Branch-wise comparison
    branch_stats = {}
    for b in ["AIML", "AIDS", "CSE"]:
        b_students = [s for s in students if s.branch == b]
        b_cnt = max(1, len(b_students))
        avg_success = round(sum(s.success_score or 0 for s in b_students) / b_cnt, 1)
        avg_att = round(sum(s.attendance_pct or 0 for s in b_students) / b_cnt, 1)
        avg_cgpa = round(sum(s.cgpa or 0 for s in b_students) / b_cnt, 2)
        avg_placement = round(sum(s.placement_readiness_score or 0 for s in b_students) / b_cnt, 1)
        high_risk_cnt = len([s for s in b_students if s.risk_category == "HIGH"])
        
        branch_stats[b] = {
            "branch": b,
            "students_count": len(b_students),
            "average_success_score": avg_success,
            "average_attendance": avg_att,
            "average_cgpa": avg_cgpa,
            "average_placement_readiness": avg_placement,
            "high_risk_count": high_risk_cnt
        }
        
    # Interventions breakdown
    interventions = db.query(Intervention).all()
    resolved = len([i for i in interventions if i.status == "Completed"])
    in_prog = len([i for i in interventions if i.status == "In Progress"])
    pending = len([i for i in interventions if i.status == "Pending"])
    resolution_rate = round((resolved / max(1, len(interventions))) * 100.0, 1)
    
    # Data Quality
    provisional_records = len([s for s in students if s.is_provisional])
    complete_records = total_students - provisional_records
    completeness_rate = round((complete_records / max(1, total_students)) * 100.0, 1)
    
    return {
        "report_generated_at": "2026-10-09",
        "dataset_size": total_students,
        "branches_comparison": list(branch_stats.values()),
        "intervention_metrics": {
            "total": len(interventions),
            "completed": resolved,
            "in_progress": in_prog,
            "pending": pending,
            "resolution_rate_pct": resolution_rate
        },
        "data_quality": {
            "complete_records": complete_records,
            "provisional_records": provisional_records,
            "completeness_pct": completeness_rate
        }
    }

@router.get("/export-csv")
def export_dataset_csv(
    data_type: str = "students",  # students, interventions
    branch: Optional[str] = None,
    risk: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    output = io.StringIO()
    
    if data_type == "students":
        writer = csv.writer(output)
        writer.writerow([
            "student_id", "name", "branch", "year", "semester", "cgpa",
            "academic_score", "attendance_pct", "success_score", "comeback_score",
            "class_rank", "risk_category", "career_goal"
        ])
        
        query = db.query(Student)
        if branch and branch != "ALL":
            query = query.filter(Student.branch == branch)
        if risk and risk != "ALL":
            query = query.filter(Student.risk_category == risk)
            
        for s in query.all():
            writer.writerow([
                s.student_id, s.name, s.branch, s.year, s.semester, s.cgpa,
                s.academic_score, s.attendance_pct, s.success_score, s.comeback_score,
                s.class_rank, s.risk_category, s.career_goal
            ])
            
        filename = f"CampusIQ_Students_Report_{branch or 'All'}.csv"
        
    else:  # interventions
        writer = csv.writer(output)
        writer.writerow([
            "id", "student_id", "concern", "action_plan", "assigned_faculty_id",
            "due_date", "status", "outcome_notes"
        ])
        
        for i in db.query(Intervention).all():
            writer.writerow([
                i.id, i.student_id, i.concern, i.action_plan, i.assigned_faculty_id,
                i.due_date, i.status, i.outcome_notes or ""
            ])
            
        filename = "CampusIQ_Interventions_Report.csv"
        
    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
