import json
from typing import Dict, Any, List, Optional
from app.core.config import settings

def calculate_student_success_score(student_dict: Dict[str, Any]) -> Dict[str, Any]:
    """
    Computes explainable Student Success Score (0-100) using normalized indicators.
    Handles missing values by dynamically renormalizing available indicator weights.
    Returns full explainable audit trail.
    """
    raw_components = {
        "academics": student_dict.get("academic_score"),
        "attendance": student_dict.get("attendance_pct"),
        "lms": student_dict.get("lms_activity_score"),
        "engagement": student_dict.get("engagement_score"),
        "placement": student_dict.get("placement_readiness_score"),
        "skills": student_dict.get("skills_score"),
    }
    
    default_weights = {
        "academics": settings.WEIGHT_ACADEMICS,
        "attendance": settings.WEIGHT_ATTENDANCE,
        "lms": settings.WEIGHT_LMS,
        "engagement": settings.WEIGHT_ENGAGEMENT,
        "placement": settings.WEIGHT_PLACEMENT,
        "skills": settings.WEIGHT_SKILLS,
    }
    
    missing_keys = [k for k, v in raw_components.items() if v is None]
    valid_keys = [k for k, v in raw_components.items() if v is not None]
    
    # If fewer than 2 indicators available, mark as unavailable
    if len(valid_keys) < 2:
        return {
            "success_score": 0.0,
            "is_provisional": True,
            "status": "UNAVAILABLE",
            "missing_indicators": missing_keys,
            "components": {},
            "explanation": "Insufficient data available to compute a reliable success score."
        }
    
    # Renormalize weights among available components
    total_valid_weight = sum(default_weights[k] for k in valid_keys)
    normalized_weights = {k: default_weights[k] / total_valid_weight for k in valid_keys}
    
    breakdown = {}
    total_score = 0.0
    
    for k in valid_keys:
        val = float(raw_components[k])
        # clamp 0 - 100
        val = max(0.0, min(100.0, val))
        weight = normalized_weights[k]
        contribution = val * weight
        total_score += contribution
        breakdown[k] = {
            "score": round(val, 1),
            "original_weight": default_weights[k],
            "effective_weight": round(weight, 4),
            "weighted_contribution": round(contribution, 2)
        }
        
    for k in missing_keys:
        breakdown[k] = {
            "score": None,
            "original_weight": default_weights[k],
            "effective_weight": 0.0,
            "weighted_contribution": 0.0,
            "is_missing": True
        }
        
    rounded_total = round(total_score, 1)
    
    # Determine risk category
    if rounded_total < settings.RISK_HIGH_SCORE:
        risk_category = "HIGH"
    elif rounded_total < settings.RISK_MEDIUM_SCORE:
        risk_category = "MEDIUM"
    else:
        risk_category = "LOW"
        
    is_provisional = len(missing_keys) > 0
    
    return {
        "success_score": rounded_total,
        "risk_category": risk_category,
        "is_provisional": is_provisional,
        "missing_indicators": missing_keys,
        "components": breakdown,
        "explanation": f"Score calculated with {len(valid_keys)}/6 components. {'Provisional score due to missing: ' + ', '.join(missing_keys) if is_provisional else 'All indicators verified.'}"
    }

def calculate_comeback_score(current_score: float, prev_score: float, streak: int = 1, growth_points: int = 0) -> float:
    """
    Computes Comeback Score rewarding positive delta and persistence.
    Even if current_score is 55, an improvement from 38 represents a massive +17 comeback!
    """
    delta = current_score - prev_score
    base_delta_component = delta * 1.6 if delta > 0 else delta * 0.5
    streak_bonus = min(streak * 2.5, 20.0)
    points_factor = min(growth_points / 25.0, 15.0)
    
    total = max(0.0, round(50.0 + base_delta_component + streak_bonus + points_factor, 1))
    return min(100.0, total)
