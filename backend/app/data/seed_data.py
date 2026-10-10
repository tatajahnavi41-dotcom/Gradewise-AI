import json
from datetime import datetime
from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine, Base
from app.core.security import hash_password
from app.models.models import User, Student, Staff

def seed_database():
    """
    Initializes database tables and ensures the initial Administrator account exists.
    Does NOT seed dummy students, dummy faculty, or dummy interventions.
    """
    db: Session = SessionLocal()

    # Ensure root Admin user exists
    admin_user = db.query(User).filter(User.email == "admin@campusiq.edu").first()
    if not admin_user:
        admin_user = User(
            username="admin",
            email="admin@campusiq.edu",
            hashed_password=hash_password("Admin@123"),
            role="admin",
            name="System Administrator",
            staff_id="ADM-001",
            branch="Administration",
            designation="Chief Campus Administrator",
            is_approved=True,
            is_active=True,
            created_at=datetime.utcnow()
        )
        db.add(admin_user)
        db.commit()
        print("Root administrator account initialized (admin@campusiq.edu).")
    else:
        print("Root administrator account already present.")

    db.close()

def clear_all_dummy_data():
    """
    Cleans out all dummy students, dummy staff, synthetic marks, and fake interventions.
    Preserves the root admin account.
    """
    db: Session = SessionLocal()
    from app.models.models import (
        Student, Staff, SubjectMarks, AssessmentAttempt,
        RoadmapMilestone, Intervention, Feedback, QuizQuestion,
        GrowthLeagueEvent, LearningMaterial, ExamSchedule, Task, TaskSubmission
    )
    
    # Delete synthetic entries
    db.query(SubjectMarks).delete()
    db.query(AssessmentAttempt).delete()
    db.query(RoadmapMilestone).delete()
    db.query(Intervention).delete()
    db.query(Feedback).delete()
    db.query(GrowthLeagueEvent).delete()
    db.query(LearningMaterial).delete()
    db.query(ExamSchedule).delete()
    db.query(TaskSubmission).delete()
    db.query(Task).delete()
    db.query(Student).delete()
    db.query(Staff).delete()
    
    # Delete non-admin users
    db.query(User).filter(User.role != "admin").delete()
    
    db.commit()
    print("All dummy data successfully cleared from SQLite database.")
    
    # Ensure admin user exists
    seed_database()
    
    # Sync clean state to MongoDB Atlas if connected
    try:
        from app.core.mongo_database import sync_data_to_mongo
        sync_data_to_mongo(db)
        print("MongoDB Atlas collections cleared and synchronized.")
    except Exception as e:
        print(f"MongoDB Atlas sync notice: {e}")
        
    db.close()

if __name__ == "__main__":
    clear_all_dummy_data()
