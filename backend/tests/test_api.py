import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.scoring_engine import calculate_student_success_score, calculate_comeback_score

client = TestClient(app)

def test_health_check():
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"

def test_login_admin():
    response = client.post("/api/v1/auth/login", json={
        "username": "admin@campusiq.edu",
        "password": "Admin@123",
        "role": "admin"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["role"] == "admin"

def test_student_and_faculty_signup():
    import uuid
    uid = uuid.uuid4().hex[:6]
    # 1. Sign up real student
    st_resp = client.post("/api/v1/auth/signup/student", json={
        "name": "Arjun Kumar",
        "email": f"arjun.{uid}@campusiq.edu",
        "student_id": f"STU-{uid}".upper(),
        "branch": "AIML",
        "year": 3,
        "semester": 5,
        "phone": "+91 9123456780",
        "career_goal": "Machine Learning Engineer",
        "password": "Student@Password123"
    })
    assert st_resp.status_code == 200
    st_data = st_resp.json()
    assert "access_token" in st_data
    assert st_data["user"]["role"] == "student"

    # 2. Sign up real faculty
    fac_resp = client.post("/api/v1/auth/signup/faculty", json={
        "name": "Dr. Ramesh Sharma",
        "email": f"ramesh.{uid}@campusiq.edu",
        "staff_id": f"FAC-{uid}".upper(),
        "department": "AIML",
        "designation": "Associate Professor",
        "specialization": "Deep Learning & NLP",
        "phone": "+91 9876501234",
        "password": "Faculty@Password123"
    })
    assert fac_resp.status_code == 200
    fac_data = fac_resp.json()
    assert "access_token" in fac_data
    assert fac_data["user"]["role"] == "faculty"

def test_login_role_mismatch_forbidden():
    # Attempting to access faculty portal with student credentials
    response = client.post("/api/v1/auth/login", json={
        "username": "admin@campusiq.edu",
        "password": "Admin@123",
        "role": "student"
    })
    assert response.status_code == 403

def test_scoring_engine_calculation():
    test_student = {
        "academic_score": 80.0,
        "attendance_pct": 90.0,
        "lms_activity_score": 70.0,
        "engagement_score": 80.0,
        "placement_readiness_score": 85.0,
        "skills_score": 75.0,
    }
    # Expected: (0.3*80) + (0.2*90) + (0.15*70) + (0.1*80) + (0.15*85) + (0.1*75)
    # 24 + 18 + 10.5 + 8 + 12.75 + 7.5 = 80.75 -> 80.8
    result = calculate_student_success_score(test_student)
    assert result["success_score"] == 80.8
    assert result["risk_category"] == "LOW"
    assert result["is_provisional"] is False

def test_scoring_engine_provisional_missing_lms():
    test_student = {
        "academic_score": 80.0,
        "attendance_pct": 90.0,
        "lms_activity_score": None,  # Missing!
        "engagement_score": 80.0,
        "placement_readiness_score": 85.0,
        "skills_score": 75.0,
    }
    result = calculate_student_success_score(test_student)
    assert result["is_provisional"] is True
    assert "lms" in result["missing_indicators"]
    assert result["success_score"] > 0

def test_comeback_score_reward_delta():
    # Baseline was 40, now 65 (+25 positive comeback delta!)
    cb = calculate_comeback_score(65.0, 40.0, streak=5, growth_points=200)
    assert cb > 70.0  # Recognized as a strong comeback

def test_what_if_simulator():
    sim_payload = {
        "student_id": "AIML-901",
        "academic_score": 85.0,
        "attendance_pct": 92.0,
        "lms_activity_score": 88.0,
        "engagement_score": 80.0,
        "coding_score": 85.0,
        "aptitude_score": 90.0,
        "mock_interview_score": 88.0
    }
    response = client.post("/api/v1/simulator/what-if", json=sim_payload)
    assert response.status_code == 200
    data = response.json()
    assert "simulated_score" in data
    assert "score_delta" in data
    assert "top_driver" in data

def test_quiz_submission():
    # Login as student first
    login_resp = client.post("/api/v1/auth/login", json={
        "username": "arjun.student@campusiq.edu",
        "password": "Student@Password123",
        "role": "student"
    })
    assert login_resp.status_code == 200
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Get questions
    q_resp = client.get("/api/v1/quiz/questions", headers=headers)
    assert q_resp.status_code == 200
    questions = q_resp.json()["questions"]
    assert len(questions) > 0
    q1 = questions[0]
    
    # Submit answer
    sub_resp = client.post("/api/v1/quiz/submit", json={
        "question_id": q1["id"],
        "student_id": "AIML-901",
        "selected_answer": "20, 30, 40, 50, 70",
        "time_spent_secs": 35
    }, headers=headers)
    assert sub_resp.status_code == 200
    data = sub_resp.json()
    assert "is_correct" in data
    assert "points_earned" in data
