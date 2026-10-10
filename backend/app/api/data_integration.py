import csv
import io
import os
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse, PlainTextResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from app.core.database import get_db
from app.api.auth import get_current_user
from app.models.models import User, Student
from app.services.scoring_engine import calculate_student_success_score, calculate_comeback_score

router = APIRouter(prefix="/data", tags=["Data Integration Centre"])

class CommitRowsRequest(BaseModel):
    data_type: str  # academics, attendance, lms, placement
    rows: List[Dict[str, Any]]

@router.post("/preview-csv")
async def preview_csv(
    data_type: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin authorization required for Data Integration operations.")
        
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files (.csv) are accepted.")
        
    contents = await file.read()
    text = contents.decode("utf-8", errors="replace")
    reader = csv.DictReader(io.StringIO(text))
    
    if not reader.fieldnames:
        raise HTTPException(status_code=400, detail="CSV file appears empty or missing header line.")
        
    headers = [h.strip() for h in reader.fieldnames]
    
    # Required headers checking
    req_columns = {
        "academics": ["student_id", "academic_score"],
        "attendance": ["student_id", "attendance_pct"],
        "lms": ["student_id", "lms_activity_score"],
        "placement": ["student_id", "coding_score"]
    }
    
    expected = req_columns.get(data_type, ["student_id"])
    missing_cols = [c for c in expected if c not in headers]
    if missing_cols:
        raise HTTPException(
            status_code=400,
            detail=f"Missing mandatory columns for '{data_type}' template: {', '.join(missing_cols)}"
        )
        
    valid_rows = []
    row_errors = []
    seen_ids = set()
    
    all_valid_ids = {s.student_id for s in db.query(Student.student_id).all()}
    
    for row_idx, row in enumerate(reader, start=2):
        s_id = row.get("student_id", "").strip()
        if not s_id:
            row_errors.append({"row": row_idx, "student_id": "N/A", "error": "Missing student_id"})
            continue
            
        if s_id in seen_ids:
            row_errors.append({"row": row_idx, "student_id": s_id, "error": f"Duplicate student_id '{s_id}' in uploaded file"})
            continue
        seen_ids.add(s_id)
        
        if s_id not in all_valid_ids:
            row_errors.append({"row": row_idx, "student_id": s_id, "error": f"Student ID '{s_id}' does not exist in college registry"})
            continue
            
        # Validate ranges
        has_val_error = False
        parsed_row = dict(row)
        for k, v in row.items():
            if k == "student_id":
                continue
            if v is not None and v.strip() != "":
                try:
                    num_val = float(v.strip())
                    if "score" in k or "pct" in k:
                        if not (0 <= num_val <= 100):
                            row_errors.append({"row": row_idx, "student_id": s_id, "error": f"Field '{k}' value {num_val} out of bounds [0-100]"})
                            has_val_error = True
                            break
                    parsed_row[k] = num_val
                except ValueError:
                    row_errors.append({"row": row_idx, "student_id": s_id, "error": f"Field '{k}' has non-numeric value: '{v}'"})
                    has_val_error = True
                    break
                    
        if not has_val_error:
            valid_rows.append(parsed_row)
            
    return {
        "filename": file.filename,
        "data_type": data_type,
        "total_rows_parsed": len(valid_rows) + len(row_errors),
        "valid_count": len(valid_rows),
        "error_count": len(row_errors),
        "sample_valid_rows": valid_rows[:8],
        "errors": row_errors
    }

@router.post("/commit-data")
def commit_imported_data(
    req: CommitRowsRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin authorization required to commit CSV data.")
        
    updated_count = 0
    
    for row in req.rows:
        s_id = row.get("student_id")
        if not s_id:
            continue
            
        student = db.query(Student).filter(Student.student_id == s_id).first()
        if not student:
            continue
            
        # Apply fields
        if "academic_score" in row and row["academic_score"] is not None:
            student.academic_score = float(row["academic_score"])
            if "cgpa" in row and row["cgpa"] is not None:
                student.cgpa = float(row["cgpa"])
            else:
                student.cgpa = round(student.academic_score / 10.0 * 0.94, 2)
                
        if "attendance_pct" in row and row["attendance_pct"] is not None:
            student.attendance_pct = float(row["attendance_pct"])
            student.attendance_risk = (student.attendance_pct < 65.0)
            
        if "lms_activity_score" in row and row["lms_activity_score"] is not None:
            student.lms_activity_score = float(row["lms_activity_score"])
            
        if "engagement_score" in row and row["engagement_score"] is not None:
            student.engagement_score = float(row["engagement_score"])
            
        if "coding_score" in row and row["coding_score"] is not None:
            student.coding_score = float(row["coding_score"])
            
        if "aptitude_score" in row and row["aptitude_score"] is not None:
            student.aptitude_score = float(row["aptitude_score"])
            
        if "mock_interview_score" in row and row["mock_interview_score"] is not None:
            student.mock_interview_score = float(row["mock_interview_score"])
            
        # Update placement readiness if subscores were updated
        if student.coding_score is not None and student.aptitude_score is not None:
            student.placement_readiness_score = round(
                (student.coding_score + student.aptitude_score + (student.mock_interview_score or 60.0)) / 3.0, 1
            )
            student.skills_score = round((student.coding_score * 0.6 + student.aptitude_score * 0.4), 1)
            
        # Recalculate explainable success score
        calc_res = calculate_student_success_score({
            "academic_score": student.academic_score,
            "attendance_pct": student.attendance_pct,
            "lms_activity_score": student.lms_activity_score,
            "engagement_score": student.engagement_score,
            "placement_readiness_score": student.placement_readiness_score,
            "skills_score": student.skills_score,
        })
        student.success_score = calc_res["success_score"]
        student.risk_category = calc_res["risk_category"]
        student.is_provisional = calc_res["is_provisional"]
        student.comeback_score = calculate_comeback_score(
            student.success_score,
            student.prev_semester_score or 65.0,
            student.learning_streak or 1,
            student.growth_points or 50
        )
        
        updated_count += 1
        
    db.commit()
    return {
        "message": f"Successfully updated and recalculated {updated_count} student records in database.",
        "updated_records": updated_count
    }

@router.get("/download-template/{template_name}")
def download_sample_template(template_name: str):
    base_csv_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "sample_csvs")
    filename = f"{template_name}_template.csv"
    filepath = os.path.join(base_csv_dir, filename)
    
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail=f"Template '{template_name}' not found.")
        
    return FileResponse(
        path=filepath,
        filename=filename,
        media_type="text/csv"
    )
