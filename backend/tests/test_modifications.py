import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_password_reset_flow():
    # 1. Request forgot password code
    resp = client.post("/api/v1/auth/forgot-password", json={"identifier": "admin@campusiq.edu"})
    assert resp.status_code == 200
    data = resp.json()
    assert "reset_code" in data
    code = data["reset_code"]
    
    # 2. Reset password using valid code
    reset_resp = client.post("/api/v1/auth/reset-password", json={
        "identifier": "admin@campusiq.edu",
        "reset_code": code,
        "new_password": "NewAdminPassword@123"
    })
    assert reset_resp.status_code == 200
    
    # 3. Verify login with new password
    login_resp = client.post("/api/v1/auth/login", json={
        "username": "admin@campusiq.edu",
        "password": "NewAdminPassword@123"
    })
    assert login_resp.status_code == 200
    
    # 4. Restore original password for subsequent tests
    token = login_resp.json()["access_token"]
    client.post("/api/v1/auth/change-password", json={
        "old_password": "NewAdminPassword@123",
        "new_password": "Admin@123"
    }, headers={"Authorization": f"Bearer {token}"})

def test_role_selection_and_verification():
    # Ensure student account is created
    client.post("/api/v1/auth/signup/student", json={
        "name": "Priya Sharma",
        "email": "priya.student@campusiq.edu",
        "student_id": "AIML-902",
        "branch": "AIML",
        "year": 3,
        "semester": 5,
        "career_goal": "Full Stack AI Developer",
        "password": "Student@Password123"
    })

    # Login as student
    login_resp = client.post("/api/v1/auth/login", json={
        "username": "priya.student@campusiq.edu",
        "password": "Student@Password123"
    })
    assert login_resp.status_code == 200
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Verify student role succeeds
    v_resp = client.post("/api/v1/auth/verify-role", json={"selected_role": "student"}, headers=headers)
    assert v_resp.status_code == 200
    
    # Selecting admin or faculty role should return 403 Forbidden
    v_forbidden = client.post("/api/v1/auth/verify-role", json={"selected_role": "admin"}, headers=headers)
    assert v_forbidden.status_code == 403

def test_task_workflow():
    # 1. Ensure faculty exists
    client.post("/api/v1/auth/signup/faculty", json={
        "name": "Prof. Anita Desai",
        "email": "anita.faculty@campusiq.edu",
        "staff_id": "FAC-AIML-903",
        "department": "AIML",
        "designation": "Assistant Professor",
        "specialization": "Deep Learning Optimization",
        "password": "Faculty@Password123"
    })

    fac_login = client.post("/api/v1/auth/login", json={
        "username": "anita.faculty@campusiq.edu",
        "password": "Faculty@Password123"
    })
    assert fac_login.status_code == 200
    fac_token = fac_login.json()["access_token"]
    fac_headers = {"Authorization": f"Bearer {fac_token}"}
    
    # 2. Faculty creates a new task
    task_resp = client.post("/api/v1/tasks", json={
        "title": "Automated Test Assignment: Deep Learning Optimization",
        "description": "Evaluate Adam vs SGD with Momentum on CIFAR-10.",
        "subject_code": "ML302",
        "subject_name": "Machine Learning Techniques",
        "branch": "AIML",
        "year": 3,
        "due_date": "2026-11-01",
        "points": 100
    }, headers=fac_headers)
    assert task_resp.status_code == 200
    task_id = task_resp.json()["task"]["id"]
    
    # 3. Student logs in and submits task
    st_login = client.post("/api/v1/auth/login", json={
        "username": "priya.student@campusiq.edu",
        "password": "Student@Password123"
    })
    assert st_login.status_code == 200
    st_token = st_login.json()["access_token"]
    st_headers = {"Authorization": f"Bearer {st_token}"}
    
    sub_resp = client.post(f"/api/v1/tasks/{task_id}/submit", json={
        "submission_text": "Completed benchmark comparing loss convergence across 50 epochs.",
        "attachment_url": "https://github.com/student/dl-opt-results"
    }, headers=st_headers)
    assert sub_resp.status_code == 200
    sub_id = sub_resp.json()["submission_id"]
    
    # 4. Faculty reviews and grades submission
    review_resp = client.patch(f"/api/v1/tasks/submissions/{sub_id}/review", json={
        "grade": "O",
        "feedback": "Outstanding analysis with learning rate warmup!",
        "status": "Completed"
    }, headers=fac_headers)
    assert review_resp.status_code == 200
    assert review_resp.json()["submission"]["status"] == "Completed"

def test_admin_student_and_faculty_crud():
    # Admin logs in
    admin_login = client.post("/api/v1/auth/login", json={
        "username": "admin@campusiq.edu",
        "password": "Admin@123"
    })
    admin_token = admin_login.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    
    # 1. Create Student
    st_payload = {
        "student_id": "TEST-ST-999",
        "name": "Test Student Automated",
        "email": "test.student999@campusiq.edu",
        "branch": "CSE",
        "year": 3,
        "semester": 5,
        "cgpa": 8.5,
        "attendance_pct": 88.0,
        "study_hours": 18.0,
        "phone": "+91 9876543210"
    }
    create_st = client.post("/api/v1/admin/students", json=st_payload, headers=admin_headers)
    assert create_st.status_code == 200
    
    # 2. Update Student
    update_st = client.put("/api/v1/admin/students/TEST-ST-999", json={
        "cgpa": 8.9,
        "study_hours": 20.0
    }, headers=admin_headers)
    assert update_st.status_code == 200
    
    # 3. Toggle Status
    toggle_st = client.patch("/api/v1/admin/students/TEST-ST-999/status", headers=admin_headers)
    assert toggle_st.status_code == 200
    
    # 4. Delete Student
    del_st = client.delete("/api/v1/admin/students/TEST-ST-999", headers=admin_headers)
    assert del_st.status_code == 200

    # 5. Create Staff
    staff_payload = {
        "staff_id": "FAC-TEST-888",
        "name": "Prof. Test Faculty",
        "email": "prof.test888@campusiq.edu",
        "department": "AIML",
        "role_type": "teaching",
        "designation": "Assistant Professor",
        "specialization": "Deep Learning Systems",
        "assigned_branch": "AIML"
    }
    create_fac = client.post("/api/v1/admin/staff", json=staff_payload, headers=admin_headers)
    assert create_fac.status_code == 200
    
    # 6. Delete Staff
    del_fac = client.delete("/api/v1/admin/staff/FAC-TEST-888", headers=admin_headers)
    assert del_fac.status_code == 200

def test_profile_update():
    # Login as student
    st_login = client.post("/api/v1/auth/login", json={
        "username": "priya.student@campusiq.edu",
        "password": "Student@Password123"
    })
    assert st_login.status_code == 200
    st_token = st_login.json()["access_token"]
    st_headers = {"Authorization": f"Bearer {st_token}"}
    
    # Update profile
    prof_resp = client.put("/api/v1/auth/profile", json={
        "phone": "+91 9988776655",
        "bio": "Passionate AI & Data enthusiast aiming for Top Tier research lab.",
        "career_goal": "AI Research Scientist"
    }, headers=st_headers)
    assert prof_resp.status_code == 200
    
    # Retrieve profile to verify persistence
    me_resp = client.get("/api/v1/auth/me", headers=st_headers)
    assert me_resp.status_code == 200
    data = me_resp.json()
    assert data["phone"] == "+91 9988776655"
    assert data["student_details"]["career_goal"] == "AI Research Scientist"
