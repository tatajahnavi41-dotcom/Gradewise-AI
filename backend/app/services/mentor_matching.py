import json
from typing import List, Dict, Any

def match_mentors_for_student(student: Any, staff_list: List[Any], subject_marks: List[Any] = None) -> List[Dict[str, Any]]:
    """
    Smart Mentor Matching Algorithm:
    Ranks faculty mentors by matching student's weak subjects, career ambitions,
    and faculty specialization, while factoring in mentor capacity / workload balance.
    """
    matches = []
    teaching_staff = [s for s in staff_list if s.role_type == "teaching"]
    
    weak_subject_names = [sm.subject_name.lower() for sm in subject_marks if sm.is_weak_subject] if subject_marks else []
    student_career = (student.career_goal or "").lower()
    student_branch = student.branch
    
    for faculty in teaching_staff:
        match_score = 0
        reasons = []
        
        # 1. Branch match
        if faculty.assigned_branch == student_branch or faculty.department == student_branch:
            match_score += 35
            reasons.append(f"Department Faculty ({student_branch})")
            
        # 2. Specialization match with Career Goal
        spec = (faculty.specialization or "").lower()
        if student_career in spec or any(word in spec for word in student_career.split() if len(word) > 3):
            match_score += 30
            reasons.append(f"Specialization aligns with student's goal: '{faculty.specialization}'")
            
        # 3. Weak subject match
        try:
            assigned_subs = json.loads(faculty.assigned_subjects) if isinstance(faculty.assigned_subjects, str) else []
        except Exception:
            assigned_subs = []
            
        sub_overlap = [sub for sub in assigned_subs if any(w in sub.lower() for w in weak_subject_names)]
        if sub_overlap:
            match_score += 25
            reasons.append(f"Teaches struggling subject: {', '.join(sub_overlap)}")
            
        # 4. Workload capacity bonus
        cap_remaining = (faculty.max_mentees or 20) - (faculty.current_mentees or 0)
        if cap_remaining > 5:
            match_score += 10
            reasons.append(f"High availability ({cap_remaining} open slots)")
        elif cap_remaining > 0:
            match_score += 5
            reasons.append(f"Capacity available ({cap_remaining} open slots)")
        else:
            match_score -= 20
            reasons.append("Currently at full capacity")
            
        match_score = max(10, min(99, match_score))
        
        matches.append({
            "faculty_id": faculty.staff_id,
            "faculty_name": faculty.name,
            "department": faculty.department,
            "designation": faculty.designation,
            "specialization": faculty.specialization,
            "current_mentees": faculty.current_mentees,
            "max_mentees": faculty.max_mentees,
            "match_score": match_score,
            "match_reasons": reasons,
            "is_current_mentor": faculty.staff_id == student.primary_mentor_id
        })
        
    # Sort highest match score first
    matches.sort(key=lambda x: x["match_score"], reverse=True)
    return matches
