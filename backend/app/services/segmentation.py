import json
from typing import List, Dict, Any

def segment_students(students: List[Any]) -> Dict[str, Any]:
    """
    Categorizes the student body into 7 actionable diagnostic segments with explicit reasoning.
    A student can be analyzed across multiple segments for nuanced intervention.
    """
    segments = {
        "balanced_high_performers": {
            "title": "Balanced High Performers",
            "description": "Consistently strong across academics, attendance, skills, and placement preparation.",
            "color": "emerald",
            "students": []
        },
        "high_academics_low_placement": {
            "title": "High Academics but Low Placement Readiness",
            "description": "High CGPA/marks but lacking coding test scores, interview practice, or aptitude benchmarks.",
            "color": "amber",
            "students": []
        },
        "low_academics_low_attendance": {
            "title": "Low Academics & Low Attendance",
            "description": "Double jeopardy of critical attendance (<70%) and poor test scores (<50%). High exam debarment risk.",
            "color": "rose",
            "students": []
        },
        "good_academics_low_engagement": {
            "title": "Good Academics but Low LMS Engagement",
            "description": "Solid exam scores but passive in LMS discussions, submissions, and peer activities.",
            "color": "indigo",
            "students": []
        },
        "comeback_champions": {
            "title": "Comeback Champions (Improving)",
            "description": "Students demonstrating substantial positive gains vs their previous semester baseline.",
            "color": "teal",
            "students": []
        },
        "declining_trend": {
            "title": "Declining Trend (Needs Mentoring)",
            "description": "Scores dropped notably compared to previous semester or recent diagnostic tests.",
            "color": "orange",
            "students": []
        },
        "data_incomplete": {
            "title": "Data Incomplete (Requires Review)",
            "description": "Records with missing indicators requiring administrative or faculty data entry.",
            "color": "slate",
            "students": []
        }
    }
    
    for s in students:
        s_summary = {
            "student_id": s.student_id,
            "name": s.name,
            "branch": s.branch,
            "year": s.year,
            "cgpa": s.cgpa,
            "success_score": s.success_score,
            "attendance_pct": s.attendance_pct,
            "placement_readiness": s.placement_readiness_score,
            "comeback_score": s.comeback_score,
            "risk_category": s.risk_category
        }
        
        # 1. Data incomplete
        if s.is_provisional or (s.missing_indicators and s.missing_indicators != "[]"):
            try:
                missing = json.loads(s.missing_indicators) if isinstance(s.missing_indicators, str) else []
            except Exception:
                missing = []
            s_item = dict(s_summary)
            s_item["reason"] = f"Missing components: {', '.join(missing) if missing else 'Provisional record'}"
            segments["data_incomplete"]["students"].append(s_item)

        # 2. Balanced High Performers
        if (s.academic_score or 0) >= 75 and (s.attendance_pct or 0) >= 80 and (s.placement_readiness_score or 0) >= 70:
            s_item = dict(s_summary)
            s_item["reason"] = "Maintains >75% academic score, >80% attendance, and >70% placement readiness."
            segments["balanced_high_performers"]["students"].append(s_item)

        # 3. High Academics Low Placement
        if (s.academic_score or 0) >= 75 and (s.placement_readiness_score or 0) < 55:
            s_item = dict(s_summary)
            s_item["reason"] = f"Strong academic mark ({s.academic_score:.0f}%) but low placement preparedness ({s.placement_readiness_score:.0f}%)."
            segments["high_academics_low_placement"]["students"].append(s_item)

        # 4. Low Academics Low Attendance
        if (s.academic_score or 0) < 55 and (s.attendance_pct or 0) < 70:
            s_item = dict(s_summary)
            s_item["reason"] = f"Struggling academics ({s.academic_score:.0f}%) coupled with low attendance ({s.attendance_pct:.0f}%)."
            segments["low_academics_low_attendance"]["students"].append(s_item)

        # 5. Good Academics Low Engagement
        if (s.academic_score or 0) >= 70 and (s.lms_activity_score or 0) < 50:
            s_item = dict(s_summary)
            s_item["reason"] = f"Exam marks are good ({s.academic_score:.0f}%) but LMS participation is minimal ({s.lms_activity_score:.0f}%)."
            segments["good_academics_low_engagement"]["students"].append(s_item)

        # 6. Comeback Champions
        if (s.success_score or 0) - (s.prev_semester_score or 0) >= 5.0 or (s.comeback_score or 0) >= 65.0:
            s_item = dict(s_summary)
            delta = (s.success_score or 0) - (s.prev_semester_score or 0)
            s_item["reason"] = f"Positive improvement of +{delta:.1f} points over previous baseline!"
            segments["comeback_champions"]["students"].append(s_item)

        # 7. Declining Trend
        if (s.prev_semester_score or 0) - (s.success_score or 0) >= 6.0:
            s_item = dict(s_summary)
            drop = (s.prev_semester_score or 0) - (s.success_score or 0)
            s_item["reason"] = f"Recent performance dropped by -{drop:.1f} points. Mentor check-in suggested."
            segments["declining_trend"]["students"].append(s_item)

    # Attach summary count to each segment
    result = {}
    for k, v in segments.items():
        result[k] = {
            "title": v["title"],
            "description": v["description"],
            "color": v["color"],
            "count": len(v["students"]),
            "students": v["students"]
        }
        
    return result
