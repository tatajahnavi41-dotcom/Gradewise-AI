from typing import Dict, Any, List
from app.core.config import settings

def evaluate_risks_and_warnings(student: Any, subject_marks: List[Any] = None) -> Dict[str, Any]:
    """
    Evaluates independent rule-based academic, attendance, assignment, and placement risks.
    Generates actionable evidence without requiring external AI APIs.
    """
    warnings = []
    
    academic_risk = False
    attendance_risk = False
    assignment_risk = False
    placement_risk = False
    
    # 1. Academic Risk
    if student.academic_score is not None and student.academic_score < settings.ACADEMIC_CRITICAL_THRESHOLD:
        academic_risk = True
        warnings.append({
            "type": "ACADEMIC",
            "severity": "CRITICAL",
            "indicator": "Academic Score",
            "actual_value": f"{student.academic_score:.1f}%",
            "threshold": f"< {settings.ACADEMIC_CRITICAL_THRESHOLD:.1f}%",
            "rule": "Academic marks below critical threshold (40%)",
            "evidence": f"Normalized academic performance is {student.academic_score:.1f}%. Immediate remedial coaching required.",
            "recommended_action": "Schedule 1-on-1 subject revision and assign foundational problem sets."
        })
    elif student.academic_score is not None and student.academic_score < 55.0:
        warnings.append({
            "type": "ACADEMIC",
            "severity": "MODERATE",
            "indicator": "Academic Score",
            "actual_value": f"{student.academic_score:.1f}%",
            "threshold": "< 55.0%",
            "rule": "Academic marks below average benchmark",
            "evidence": "Student is hovering near the passing boundary.",
            "recommended_action": "Targeted tutorial sessions on weaker modules."
        })
        
    # Check weak subjects in subject marks
    if subject_marks:
        weak_subjects = [sm for sm in subject_marks if sm.is_weak_subject or sm.total_percentage < 50.0]
        if len(weak_subjects) >= 2:
            academic_risk = True
            names = ", ".join([s.subject_name for s in weak_subjects])
            warnings.append({
                "type": "SUBJECT_DEFICIT",
                "severity": "HIGH",
                "indicator": "Weak Subjects Count",
                "actual_value": f"{len(weak_subjects)} subjects",
                "threshold": ">= 2 weak subjects",
                "rule": "Multiple subjects flagged as underperforming",
                "evidence": f"Struggling in: {names}.",
                "recommended_action": f"Focus review on {weak_subjects[0].subject_name} before mid-term assessments."
            })

    # 2. Attendance Risk
    if student.attendance_pct is not None and student.attendance_pct < settings.ATTENDANCE_CRITICAL_THRESHOLD:
        attendance_risk = True
        warnings.append({
            "type": "ATTENDANCE",
            "severity": "CRITICAL",
            "indicator": "Class Attendance",
            "actual_value": f"{student.attendance_pct:.1f}%",
            "threshold": f"< {settings.ATTENDANCE_CRITICAL_THRESHOLD:.1f}%",
            "rule": "Attendance below statutory 60% exam eligibility threshold",
            "evidence": f"Student attendance is {student.attendance_pct:.1f}%, risking debarment from university exams.",
            "recommended_action": "Issue formal attendance warning letter and conduct mentor counseling."
        })
    elif student.attendance_pct is not None and student.attendance_pct < 75.0:
        attendance_risk = True
        warnings.append({
            "type": "ATTENDANCE",
            "severity": "WARNING",
            "indicator": "Class Attendance",
            "actual_value": f"{student.attendance_pct:.1f}%",
            "threshold": "< 75.0%",
            "rule": "Attendance below 75% required minimum",
            "evidence": f"Current attendance is {student.attendance_pct:.1f}%. Missed {round((100-student.attendance_pct)*0.6)} class hours.",
            "recommended_action": "Require attendance catch-up log and parent notification."
        })

    # 3. Assignment Risk
    if student.total_assignments and student.total_assignments > 0:
        comp_ratio = (student.assignments_completed or 0) / student.total_assignments
        if comp_ratio < 0.65:
            assignment_risk = True
            warnings.append({
                "type": "ASSIGNMENT",
                "severity": "HIGH",
                "indicator": "Assignment Completion",
                "actual_value": f"{student.assignments_completed}/{student.total_assignments} ({comp_ratio*100:.0f}%)",
                "threshold": "< 65%",
                "rule": "Incomplete mandatory course assignments",
                "evidence": f"{student.total_assignments - (student.assignments_completed or 0)} submissions are pending or overdue.",
                "recommended_action": "Open assignment grace portal with faculty review."
            })

    # 4. Placement Risk
    if student.year >= 3:
        coding = student.coding_score if student.coding_score is not None else 0
        aptitude = student.aptitude_score if student.aptitude_score is not None else 0
        mock = student.mock_interview_score if student.mock_interview_score is not None else 0
        
        low_skills = []
        if coding < settings.CODING_PREP_THRESHOLD:
            low_skills.append(f"Coding ({coding:.0f}/100)")
        if aptitude < settings.APTITUDE_PREP_THRESHOLD:
            low_skills.append(f"Aptitude ({aptitude:.0f}/100)")
        if mock < 50.0:
            low_skills.append(f"Mock Interview ({mock:.0f}/100)")
            
        if len(low_skills) >= 2 or (student.placement_readiness_score and student.placement_readiness_score < 50.0):
            placement_risk = True
            warnings.append({
                "type": "PLACEMENT",
                "severity": "HIGH",
                "indicator": "Placement Readiness",
                "actual_value": f"{student.placement_readiness_score:.1f}%",
                "threshold": "< 50.0%",
                "rule": "Deficiencies in placement screening benchmarks",
                "evidence": f"Flagged criteria: {', '.join(low_skills) if low_skills else 'Overall readiness below 50%'}.",
                "recommended_action": "Enroll student into Career Mission Mode and daily LeetCode/DSA practice track."
            })
            
    # Risk Summary
    overall_severity = "LOW"
    if any(w["severity"] == "CRITICAL" for w in warnings):
        overall_severity = "CRITICAL"
    elif any(w["severity"] == "HIGH" for w in warnings):
        overall_severity = "HIGH"
    elif any(w["severity"] in ["WARNING", "MODERATE"] for w in warnings):
        overall_severity = "MEDIUM"

    return {
        "overall_severity": overall_severity,
        "academic_risk": academic_risk,
        "attendance_risk": attendance_risk,
        "assignment_risk": assignment_risk,
        "placement_risk": placement_risk,
        "warnings_count": len(warnings),
        "warnings": warnings
    }

def compute_exam_difficulty_radar(student: Any, subject_marks: List[Any], upcoming_exams: List[Any]) -> List[Dict[str, Any]]:
    """
    Generates Next Exam Difficulty Radar:
    Cross-references upcoming syllabus with student's weak topics and recent quiz performances.
    """
    radar = []
    subject_map = {sm.subject_code: sm for sm in subject_marks}
    
    for exam in upcoming_exams:
        sm = subject_map.get(exam.subject_code)
        student_sub_pct = sm.total_percentage if sm else 65.0
        is_weak = sm.is_weak_subject if sm else False
        
        # Difficulty rating 1-5 from schedule
        exam_diff = exam.difficulty_index if hasattr(exam, "difficulty_index") else 3.5
        
        # Threat score: higher exam difficulty + lower student marks = higher vulnerability
        vulnerability_score = round(max(10.0, min(100.0, (exam_diff * 14.0) + (100.0 - student_sub_pct) * 0.6)), 1)
        
        radar.append({
            "subject_code": exam.subject_code,
            "subject_name": exam.subject_name,
            "exam_date": exam.exam_date,
            "difficulty_index": exam_diff,
            "student_current_score": student_sub_pct,
            "vulnerability_score": vulnerability_score,
            "threat_level": "HIGH" if vulnerability_score > 65 else ("MEDIUM" if vulnerability_score > 40 else "LOW"),
            "recommended_focus": "Intensive revision on Units 3 & 4" if vulnerability_score > 65 else "Standard revision and formula practice",
            "practice_quiz_available": True
        })
        
    # Sort by highest vulnerability first
    radar.sort(key=lambda x: x["vulnerability_score"], reverse=True)
    return radar
