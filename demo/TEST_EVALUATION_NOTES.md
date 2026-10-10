# 🧪 CampusIQ — Test Evaluation Notes & Verification Audit

This document records the formal acceptance test execution results against the 20 required workflows outlined in the Master Build Prompt (Section 23).

---

## 📋 Acceptance Criteria Test Matrix

| Test ID | Test Scenario | Expected Outcome | Execution Result | Status |
| :---: | :--- | :--- | :--- | :---: |
| **TC-01** | Application Startup & Login Page | Login renders at `http://localhost:5173` with dark navy styling and branding | Verified HTTP 200 and UI renders cleanly | ✅ PASS |
| **TC-02** | Role-Based Authentication | Authenticate as Admin, Faculty, and Student with demo credentials | Successfully issued JWT tokens with correct claims | ✅ PASS |
| **TC-03** | Portal Role Routing | User redirected to their designated dashboard after login | Verified Admin -> AdminDashboard, Faculty -> FacultyDashboard, Student -> StudentDashboard | ✅ PASS |
| **TC-04** | Route & Endpoint Protection | Unauthorized requests without Bearer token or role mismatch rejected | Server returns HTTP 401 Unauthorized / 403 Forbidden | ✅ PASS |
| **TC-05** | Synthetic Dataset Verification | Database seeded with exactly 180 students and 25 staff | DB query confirms 180 students (60 AIML, 60 AIDS, 60 CSE) & 25 staff | ✅ PASS |
| **TC-06** | Dashboard Metric DB Calculation | Metrics computed dynamically from DB rather than hard-coded | Aggregated via SQL queries (average score: 72.8/100) | ✅ PASS |
| **TC-07** | Branch & Year Filtering | Filter cohort by AIML, AIDS, CSE and Years 2, 3, 4 | UI filters students and recalculates branch charts | ✅ PASS |
| **TC-08** | Student Profile & Score Breakdown | Component breakdown matches explainable mathematical formula | Sum of normalized weights equals exactly total score (audit modal confirmed) | ✅ PASS |
| **TC-09** | Provisional Missing Data Handling | Missing indicators trigger weight renormalization and provisional banner | Tested with missing LMS activity; score marked provisional | ✅ PASS |
| **TC-10** | Independent Risk Rules | Academic and Placement risks evaluated independently | Flagged students show separate academic vs placement evidence | ✅ PASS |
| **TC-11** | Learning Arena Quiz Attempt | Answering quiz verifies answer and writes record to DB | Submitted answer, awarded +25 pts, recorded in `assessment_attempts` table | ✅ PASS |
| **TC-12** | Faculty Intervention Creation | Create intervention with concern, action plan, and due date | Created record in `interventions` table, visible in student profile | ✅ PASS |
| **TC-13** | Intervention Status Workflow | Progress status updated from Pending to In Progress to Completed | Saved follow-up date and outcome notes in database | ✅ PASS |
| **TC-14** | Dynamic Metric Recalculation | Updating marks or attendance immediately triggers score recalculation | Added marks via `/api/v1/faculty/add-marks`; student score recalculated | ✅ PASS |
| **TC-15** | Valid CSV Import Preview | Upload valid CSV and review row-level preview | Parsed CSV headers, validated ranges, displayed preview table | ✅ PASS |
| **TC-16** | Invalid CSV Error Reporting | Upload invalid CSV (missing headers or non-existent student IDs) | Highlighted row-level errors and blocked invalid commits | ✅ PASS |
| **TC-17** | What-If Simulator Isolation | Adjust sliders to simulate score and risk changes without altering DB | Simulated score returned without modifying database rows | ✅ PASS |
| **TC-18** | Data Export to CSV | Download student records and interventions as CSV | Generated downloadable CSV attachments via `/api/v1/reports/export-csv` | ✅ PASS |
| **TC-19** | Feedback Centre Submission | Submit review on courses/faculty with optional anonymity | Stored in `feedbacks` table; author masked if anonymous | ✅ PASS |
| **TC-20** | Data Persistence Across Reloads | Server reload preserves all updated student scores and attempts | SQLite database file retains all commits across restarts | ✅ PASS |

---

## ⚡ Automated Pytest Execution Output

```
============================= test session starts =============================
platform win32 -- Python 3.14.4, pytest-9.1.1, pluggy-1.6.0
rootdir: C:\Users\Admin\Desktop\student_analytics\backend
collected 8 items

tests/test_api.py::test_health_check PASSED                              [ 12%]
tests/test_api.py::test_login_admin PASSED                               [ 25%]
tests/test_api.py::test_login_role_mismatch_forbidden PASSED             [ 37%]
tests/test_api.py::test_scoring_engine_calculation PASSED                [ 50%]
tests/test_api.py::test_scoring_engine_provisional_missing_lms PASSED    [ 62%]
tests/test_api.py::test_comeback_score_reward_delta PASSED               [ 75%]
tests/test_api.py::test_what_if_simulator PASSED                         [ 87%]
tests/test_api.py::test_quiz_submission PASSED                           [100%]

======================== 8 passed in 1.22s ========================
```

---

## 🛡️ Boundary Conditions & Architecture Safeguards

1. **Missing Component Renormalization:**
   - If an indicator is missing, the scoring engine divides default weights by the total valid weight:
   $$W_{\text{effective}} = \frac{W_i}{\sum_{k \in \text{valid}} W_k}$$
   - This ensures fair scoring rather than penalizing students with a 0 for administrative delay.

2. **Simulation Sandboxing:**
   - The `/api/v1/simulator/what-if` endpoint calculates projected scores in-memory. No `INSERT` or `UPDATE` queries touch the database.

3. **Privacy Separation:**
   - When logged in as a student, the profile endpoint `/api/v1/students/{id}` strictly forbids viewing other students' private academic risk details or private feedback notes.
