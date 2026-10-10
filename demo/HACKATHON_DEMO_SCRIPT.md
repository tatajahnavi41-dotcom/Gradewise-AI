# 🏆 CampusIQ — Hackathon Judge Demo Script & Guide

Use this script when presenting live to hackathon judges or recording an evaluation walkthrough.

---

## 🔑 Demo Account Credentials

| Persona | Role | Email / Username | Password | Key Characteristics |
| :--- | :--- | :--- | :--- | :--- |
| **Dr. Admin** | Administrator | `admin@campusiq.edu` | `Admin@123` | Full access across all 180 students, 25 staff, CSV import |
| **Dr. Rajesh Kulkarni** | Faculty | `faculty.aiml@campusiq.edu` | `Faculty@123` | AIML HoD, 20 mentees capacity, enters marks & attendance |
| **Dr. Harish Chandra** | Faculty | `faculty.cse@campusiq.edu` | `Faculty@123` | CSE HoD, Operating Systems & Networks specialization |
| **Aarav Sharma** | Student (Topper) | `student.aiml@campusiq.edu` | `Student@123` | Student ID: `AIML-001`, Rank #1, Balanced High Performer |
| **Rohan Gupta** | Student (Comeback) | `student.comeback@campusiq.edu` | `Student@123` | Student ID: `AIML-015`, Huge improvement (+18 delta) |
| **Kunal Verma** | Student (At-Risk) | `student.atrisk@campusiq.edu` | `Student@123` | Student ID: `CSE-020`, Attendance & academic mentoring support |

> **Pro-Tip for Judges:** On the Login page (`http://localhost:5173`) and in the top-right Navbar, use the **1-Click Demo Switcher** cards to instantly log in as any role without typing passwords!

---

## 🚀 5-Minute Live Walkthrough Flow

### Step 1: Open Login Page (`/`)
1. Show the **CampusIQ Branding**, modern dark navy and midnight aesthetic, and role selector.
2. Click the **"Campus Administrator"** 1-click card.
3. Show the server-side role verification and redirection to the Admin Intelligence Dashboard.

### Step 2: Admin Campus Intelligence (`admin-dashboard`)
1. Point to dynamic summary cards:
   - **Total Students:** 180 (AIML: 60, AIDS: 60, CSE: 60)
   - **Total Staff:** 25 (20 Teaching, 5 Support)
   - **Average Success Score:** 72.8/100
   - **Active Interventions:** 42 in progress
2. Test the **Branch Filter** (Switch between AIML, AIDS, CSE) and observe the charts recalculating dynamically.
3. Show the automated **Institutional Insights** generated from database queries.

### Step 3: Risk Intelligence & Student Segmentation (`risk-intelligence` & `student-segmentation`)
1. Navigate to **Risk Intelligence**:
   - Filter by **Attendance** to show students below the 60% statutory university threshold.
   - Click **"Launch Intervention"** directly from an alert card to show the pre-populated modal.
2. Navigate to **Student Segmentation**:
   - Show the 7 diagnostic clusters: *Balanced High Performers*, *High Academics Low Placement*, *Low Academics Low Attendance*, *Good Academics Low LMS Engagement*, *Comeback Champions*, *Declining Trend*, and *Data Incomplete*.
   - Click on any cluster to view the roster with individual diagnostic reasons.

### Step 4: Faculty Mentorship & Smart Matching (`faculty-dashboard` & `mentor-matching`)
1. Use the **Demo Switcher** in the top navbar to switch to **"Faculty (Dr. Rajesh Kulkarni)"**.
2. Notice that data is strictly partitioned to the AIML department.
3. Go to **"Smart Mentor Matching"**:
   - Select a struggling student from the dropdown.
   - Show how the algorithm matches faculty specialization with student career goals and filters by mentee workload capacity.
   - Click **"Assign Mentor"** and observe the live confirmation.
4. Show the **"Update Marks"** button: Enter new internal marks for a student and show the instantaneous score recalculation.

### Step 5: Student Growth Journey (`student-dashboard`)
1. Use the **Demo Switcher** to switch to **"Student: Comeback Champion (AIML-015)"**.
2. Highlight our standout differentiator: **The Comeback Score**:
   - Even if the student's total score is 68, they receive a high Comeback Index because they started from 48!
3. Click **"Audit Score Breakdown"**:
   - Modal displays the transparent 6-component weighted formula:
   $$\text{Success Score} = 0.30(\text{Acad}) + 0.20(\text{Att}) + 0.15(\text{LMS}) + 0.10(\text{Eng}) + 0.15(\text{Place}) + 0.10(\text{Skills})$$
4. Open **"Next Exam Difficulty Radar"**:
   - Show how the algorithm calculates a *Vulnerability Index* by crossing syllabus exam ratings with the student's weak units.
5. Open **"Career Mission Mode"**:
   - Show how their career ambition (*AI/ML Engineer*) is broken into verified skills radar and milestone tiers.

### Step 6: Gamified Learning Arena & What-If Simulator
1. Open **"Gamified Arena"**:
   - View the **Binary Search Tree** SVG visual challenge.
   - Click option `20, 30, 40, 50, 70` and click **"Submit Answer"**.
   - Watch the celebratory **confetti animation**, verified explanation, and +25 Growth Points awarded to the student's learning streak!
2. Open **"What-If Simulator"**:
   - Drag the attendance slider from 60% to 85%.
   - Watch the projected score and risk level shift in real-time without modifying the official database!

---

## ❓ Frequently Asked Questions by Judges

**Q1: Is this just a static frontend mockup?**  
*Answer:* Not at all! This is a complete full-stack web application. The frontend communicates with a Python FastAPI backend over REST APIs. All 180 students, 25 staff, 900 subject marks, and 78 interventions are queried and persisted in a real SQLite database.

**Q2: Does your AI require expensive OpenAI / Claude API keys?**  
*Answer:* No. CampusIQ is architected with an explainable, deterministic heuristic engine. It runs 100% offline and locally using normalized mathematical weights and rule-based diagnostic algorithms. There are zero external API costs or latency delays.

**Q3: How does CampusIQ handle students with missing data?**  
*Answer:* CampusIQ includes provisional renormalization. If a student is missing LMS logs, the engine dynamically renormalizes the remaining 5 weights rather than silently assigning a 0 or 100, and explicitly flags the record as provisional with a warning banner.
