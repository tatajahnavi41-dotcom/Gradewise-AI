from typing import List, Dict, Any

def compute_growth_league_standings(students: List[Any], events: List[Any] = None) -> Dict[str, Any]:
    """
    Campus Growth League:
    Gamified branch competition fostering collaboration rather than cutthroat grades.
    Awards points for quizzes solved, comeback scores, roadmap milestones, and weekly challenges.
    """
    branch_stats = {
        "AIML": {"total_points": 0, "students_count": 0, "avg_comeback": 0.0, "total_streaks": 0, "quizzes_solved": 0},
        "AIDS": {"total_points": 0, "students_count": 0, "avg_comeback": 0.0, "total_streaks": 0, "quizzes_solved": 0},
        "CSE":  {"total_points": 0, "students_count": 0, "avg_comeback": 0.0, "total_streaks": 0, "quizzes_solved": 0},
    }
    
    leaderboard = []
    
    for s in students:
        b = s.branch
        if b in branch_stats:
            pts = s.growth_points or 50
            branch_stats[b]["total_points"] += pts
            branch_stats[b]["students_count"] += 1
            branch_stats[b]["avg_comeback"] += (s.comeback_score or 50.0)
            branch_stats[b]["total_streaks"] += (s.learning_streak or 1)
            
        leaderboard.append({
            "student_id": s.student_id,
            "name": s.name,
            "branch": s.branch,
            "year": s.year,
            "growth_points": s.growth_points or 50,
            "comeback_score": s.comeback_score or 50.0,
            "learning_streak": s.learning_streak or 1,
            "success_score": s.success_score or 70.0
        })
        
    # Calculate branch averages
    rankings = []
    for b, data in branch_stats.items():
        cnt = max(1, data["students_count"])
        avg_pts = round(data["total_points"] / cnt, 1)
        avg_cb = round(data["avg_comeback"] / cnt, 1)
        rankings.append({
            "branch": b,
            "total_points": data["total_points"],
            "avg_points_per_student": avg_pts,
            "avg_comeback_score": avg_cb,
            "total_streaks": data["total_streaks"],
            "students_count": cnt
        })
        
    rankings.sort(key=lambda x: x["total_points"], reverse=True)
    leaderboard.sort(key=lambda x: x["growth_points"], reverse=True)
    
    weekly_challenges = [
        {"id": 1, "title": "Graph Algorithms Sprint", "target": "Solve 3 DSA Graph Puzzles", "reward_pts": 75, "active": True},
        {"id": 2, "title": "SQL Query Optimization", "target": "Complete DBMS indexing quiz", "reward_pts": 50, "active": True},
        {"id": 3, "title": "Mock Placement Aptitude", "target": "Score >80% on Quant speed test", "reward_pts": 100, "active": True},
    ]
    
    return {
        "branch_standings": rankings,
        "top_growth_students": leaderboard[:10],
        "weekly_challenges": weekly_challenges
    }
