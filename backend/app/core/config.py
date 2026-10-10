import os
from dotenv import load_dotenv

# Load .env if present
load_dotenv()

class Settings:
    PROJECT_NAME: str = "CampusIQ — AI-Powered Student Analytics & Success Platform"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "campusiq_super_secret_jwt_key_hackathon_2026_secure")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # SQLite Database
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    raw_db_url = os.getenv("DATABASE_URL", "")
    if not raw_db_url or raw_db_url.startswith("mongodb"):
        DATABASE_URL: str = f"sqlite:///{os.path.join(BASE_DIR, 'campus_iq.db')}"
    else:
        DATABASE_URL: str = raw_db_url
    
    # MongoDB Atlas Cloud Database
    MONGODB_URI: str = os.getenv(
        "MONGODB_URI",
        os.getenv(
            "DB_URL",
            os.getenv(
                "MONGODB_URL",
                "mongodb+srv://tatajahnavi41_db_user:txdXLTbumxvQk6Qf@cluster0.jukaa2w.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
            )
        )
    )
    MONGODB_DB_NAME: str = os.getenv("MONGODB_DB_NAME", "campusiq")
    
    # Success Scoring Weights
    WEIGHT_ACADEMICS: float = 0.30
    WEIGHT_ATTENDANCE: float = 0.20
    WEIGHT_LMS: float = 0.15
    WEIGHT_ENGAGEMENT: float = 0.10
    WEIGHT_PLACEMENT: float = 0.15
    WEIGHT_SKILLS: float = 0.10
    
    # Risk Thresholds
    RISK_HIGH_SCORE: float = 50.0
    RISK_MEDIUM_SCORE: float = 70.0
    ATTENDANCE_CRITICAL_THRESHOLD: float = 60.0
    ACADEMIC_CRITICAL_THRESHOLD: float = 40.0
    CODING_PREP_THRESHOLD: float = 50.0
    APTITUDE_PREP_THRESHOLD: float = 50.0

settings = Settings()
