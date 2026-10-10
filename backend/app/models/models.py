from sqlalchemy import Column, Integer, String, Float, Boolean, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False)  # admin, faculty, student
    name = Column(String(100), nullable=False)
    student_id = Column(String(20), nullable=True)
    staff_id = Column(String(20), nullable=True)
    branch = Column(String(20), nullable=True)
    designation = Column(String(100), nullable=True)
    avatar = Column(String(255), nullable=True)
    phone = Column(String(30), nullable=True)
    bio = Column(Text, nullable=True)
    is_approved = Column(Boolean, default=True)
    is_active = Column(Boolean, default=True)
    reset_token = Column(String(100), nullable=True)
    reset_token_expiry = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Student(Base):
    __tablename__ = "students"
    
    student_id = Column(String(20), primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    branch = Column(String(20), index=True, nullable=False)  # AIML, AIDS, CSE
    year = Column(Integer, index=True, nullable=False)        # 2, 3, 4
    semester = Column(Integer, nullable=False)                # 3, 4, 5, 6, 7, 8
    profile_status = Column(String(50), default="Verified")   # Verified, Pending Verification, Demo Profile
    phone = Column(String(30), nullable=True)
    bio = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    study_hours = Column(Float, default=16.5)                 # Weekly study/lab hours
    
    # Core Normalized Metrics (0 - 100)
    cgpa = Column(Float, default=7.0)                         # e.g. 7.8 out of 10
    academic_score = Column(Float, default=70.0)              # normalized 0-100
    attendance_pct = Column(Float, default=80.0)              # 0 - 100
    lms_activity_score = Column(Float, default=75.0)          # 0 - 100
    engagement_score = Column(Float, default=70.0)            # 0 - 100
    placement_readiness_score = Column(Float, default=65.0)   # 0 - 100
    skills_score = Column(Float, default=68.0)                # 0 - 100
    
    # Sub-component Breakdown
    aptitude_score = Column(Float, default=65.0)
    coding_score = Column(Float, default=60.0)
    mock_interview_score = Column(Float, default=70.0)
    assignments_completed = Column(Integer, default=10)
    total_assignments = Column(Integer, default=12)
    
    # Computed Success Engine
    success_score = Column(Float, default=70.0)
    comeback_score = Column(Float, default=0.0)               # improvement delta vs baseline
    prev_semester_score = Column(Float, default=65.0)
    class_rank = Column(Integer, default=1)
    branch_rank = Column(Integer, default=1)
    
    # Risk Categorization
    risk_category = Column(String(20), default="LOW")         # LOW, MEDIUM, HIGH
    academic_risk = Column(Boolean, default=False)
    placement_risk = Column(Boolean, default=False)
    attendance_risk = Column(Boolean, default=False)
    assignment_risk = Column(Boolean, default=False)
    risk_reason = Column(Text, nullable=True)
    
    # Profile & Mentorship
    primary_mentor_id = Column(String(20), nullable=True)
    career_goal = Column(String(100), default="Software Developer")
    learning_style = Column(String(50), default="Visual & Practical")
    growth_points = Column(Integer, default=120)
    learning_streak = Column(Integer, default=3)
    
    # Data Quality
    is_provisional = Column(Boolean, default=False)
    missing_indicators = Column(Text, default="[]")           # JSON list of missing keys
    
    # Relationships
    marks = relationship("SubjectMarks", back_populates="student", cascade="all, delete-orphan")
    attempts = relationship("AssessmentAttempt", back_populates="student", cascade="all, delete-orphan")
    milestones = relationship("RoadmapMilestone", back_populates="student", cascade="all, delete-orphan")
    interventions = relationship("Intervention", back_populates="student", cascade="all, delete-orphan")

class Staff(Base):
    __tablename__ = "staff"
    
    staff_id = Column(String(20), primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    department = Column(String(50), nullable=False)           # AIML, AIDS, CSE, Administration, Placement
    role_type = Column(String(20), nullable=False)            # teaching, non-teaching
    designation = Column(String(100), nullable=False)
    specialization = Column(String(100), nullable=True)
    assigned_branch = Column(String(20), nullable=True)
    assigned_subjects = Column(Text, default="[]")            # JSON list
    max_mentees = Column(Integer, default=20)
    current_mentees = Column(Integer, default=0)
    phone = Column(String(30), nullable=True)
    bio = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)

class SubjectMarks(Base):
    __tablename__ = "subject_marks"
    
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(String(20), ForeignKey("students.student_id"), nullable=False)
    semester = Column(Integer, nullable=False)
    subject_code = Column(String(20), nullable=False)
    subject_name = Column(String(100), nullable=False)
    internal_marks = Column(Float, default=28.0)              # out of 40
    assignment_marks = Column(Float, default=16.0)            # out of 20
    lab_marks = Column(Float, default=17.0)                   # out of 20
    total_percentage = Column(Float, default=76.0)            # 0 - 100
    grade = Column(String(5), default="B+")
    is_weak_subject = Column(Boolean, default=False)
    exam_difficulty_rating = Column(Float, default=3.5)       # 1 to 5
    
    student = relationship("Student", back_populates="marks")

class AssessmentAttempt(Base):
    __tablename__ = "assessment_attempts"
    
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(String(20), ForeignKey("students.student_id"), nullable=False)
    quiz_title = Column(String(150), nullable=False)
    subject = Column(String(100), nullable=False)
    score = Column(Float, nullable=False)
    total_questions = Column(Integer, default=10)
    time_spent_secs = Column(Integer, default=180)
    streak = Column(Integer, default=1)
    date = Column(DateTime, default=datetime.utcnow)
    
    student = relationship("Student", back_populates="attempts")

class RoadmapMilestone(Base):
    __tablename__ = "roadmap_milestones"
    
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(String(20), ForeignKey("students.student_id"), nullable=False)
    track = Column(String(50), nullable=False)                 # academic, technical, placement, career
    title = Column(String(150), nullable=False)
    description = Column(Text, nullable=True)
    resource_url = Column(String(255), nullable=True)
    difficulty = Column(String(20), default="Medium")
    estimated_hours = Column(Float, default=4.0)
    status = Column(String(20), default="todo")               # todo, in_progress, completed
    target_date = Column(String(20), nullable=True)
    completed_at = Column(DateTime, nullable=True)
    score_achieved = Column(Float, nullable=True)
    
    student = relationship("Student", back_populates="milestones")

class Intervention(Base):
    __tablename__ = "interventions"
    
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(String(20), ForeignKey("students.student_id"), nullable=False)
    concern = Column(String(255), nullable=False)
    action_plan = Column(Text, nullable=False)
    assigned_faculty_id = Column(String(20), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    due_date = Column(String(20), nullable=False)
    status = Column(String(20), default="Pending")            # Pending, In Progress, Completed
    notes = Column(Text, nullable=True)
    follow_up_date = Column(String(20), nullable=True)
    outcome_notes = Column(Text, nullable=True)
    is_overdue = Column(Boolean, default=False)
    
    student = relationship("Student", back_populates="interventions")

class Feedback(Base):
    __tablename__ = "feedbacks"
    
    id = Column(Integer, primary_key=True, index=True)
    submitter_type = Column(String(20), nullable=False)       # student, faculty
    submitter_id = Column(String(20), nullable=False)
    target_type = Column(String(50), nullable=False)          # course, faculty, campus, system
    category = Column(String(100), nullable=False)
    rating = Column(Integer, default=4)                       # 1 - 5
    comments = Column(Text, nullable=False)
    is_anonymous = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class QuizQuestion(Base):
    __tablename__ = "quiz_questions"
    
    id = Column(Integer, primary_key=True, index=True)
    branch = Column(String(20), nullable=False)               # ALL, AIML, AIDS, CSE
    subject = Column(String(100), nullable=False)
    question_type = Column(String(50), default="mcq")         # mcq, visual_dsa, code_debug, flowchart_trace, concept_match
    title = Column(String(150), nullable=False)
    question_text = Column(Text, nullable=False)
    image_svg = Column(Text, nullable=True)
    code_snippet = Column(Text, nullable=True)
    options_json = Column(Text, nullable=False)               # JSON array of options
    correct_answer = Column(String(255), nullable=False)
    explanation = Column(Text, nullable=False)
    difficulty = Column(String(20), default="Medium")

class GrowthLeagueEvent(Base):
    __tablename__ = "growth_league_events"
    
    id = Column(Integer, primary_key=True, index=True)
    branch = Column(String(20), nullable=False)
    student_id = Column(String(20), nullable=False)
    student_name = Column(String(100), nullable=False)
    points = Column(Integer, default=50)
    event_type = Column(String(50), nullable=False)           # quiz_perfect, comeback_streak, roadmap_complete, mentor_task
    description = Column(String(255), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)

class LearningMaterial(Base):
    __tablename__ = "learning_materials"
    
    id = Column(Integer, primary_key=True, index=True)
    branch = Column(String(20), nullable=False)
    year = Column(Integer, nullable=False)
    subject_code = Column(String(20), nullable=False)
    subject_name = Column(String(100), nullable=False)
    title = Column(String(150), nullable=False)
    category = Column(String(50), default="Notes")            # Notes, Video, Lab Code, Cheat Sheet, Question Bank
    content_summary = Column(Text, nullable=False)
    download_url = Column(String(255), nullable=True)
    faculty_id = Column(String(20), nullable=True)
    date_added = Column(DateTime, default=datetime.utcnow)

class ExamSchedule(Base):
    __tablename__ = "exam_schedules"
    
    id = Column(Integer, primary_key=True, index=True)
    branch = Column(String(20), nullable=False)
    year = Column(Integer, nullable=False)
    semester = Column(Integer, nullable=False)
    subject_code = Column(String(20), nullable=False)
    subject_name = Column(String(100), nullable=False)
    exam_date = Column(String(50), nullable=False)
    syllabus_topics_json = Column(Text, nullable=False)
    difficulty_index = Column(Float, default=3.8)

class Task(Base):
    __tablename__ = "tasks"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(150), nullable=False)
    description = Column(Text, nullable=False)
    subject_code = Column(String(50), nullable=False)
    subject_name = Column(String(100), nullable=False)
    branch = Column(String(50), default="ALL")                # ALL, AIML, AIDS, CSE
    year = Column(Integer, default=0)                         # 0 for ALL, or 2, 3, 4
    assigned_student_id = Column(String(50), nullable=True)   # Specific student ID or None for class-wide
    faculty_id = Column(String(50), nullable=False)
    faculty_name = Column(String(100), nullable=False)
    due_date = Column(String(50), nullable=False)
    points = Column(Integer, default=100)
    status = Column(String(20), default="Active")             # Active, Closed
    created_at = Column(DateTime, default=datetime.utcnow)
    
    submissions = relationship("TaskSubmission", back_populates="task", cascade="all, delete-orphan")

class TaskSubmission(Base):
    __tablename__ = "task_submissions"
    
    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id"), nullable=False)
    student_id = Column(String(20), nullable=False)
    student_name = Column(String(100), nullable=False)
    submission_text = Column(Text, nullable=True)
    attachment_url = Column(String(255), nullable=True)
    status = Column(String(20), default="Pending")            # Pending, Submitted, Completed, Overdue
    submitted_at = Column(DateTime, nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    grade = Column(String(20), nullable=True)                 # e.g. "A+", "95/100"
    feedback = Column(Text, nullable=True)
    
    task = relationship("Task", back_populates="submissions")
