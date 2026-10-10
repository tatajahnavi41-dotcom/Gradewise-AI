from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def migrate_db_safe():
    try:
        with engine.connect() as conn:
            # Users table
            cols_u = [c[1] for c in conn.exec_driver_sql("PRAGMA table_info(users)").fetchall()]
            if cols_u:
                if "is_approved" not in cols_u:
                    conn.exec_driver_sql("ALTER TABLE users ADD COLUMN is_approved BOOLEAN DEFAULT 1")
                if "is_active" not in cols_u:
                    conn.exec_driver_sql("ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT 1")
                if "phone" not in cols_u:
                    conn.exec_driver_sql("ALTER TABLE users ADD COLUMN phone VARCHAR(30) DEFAULT NULL")
                if "bio" not in cols_u:
                    conn.exec_driver_sql("ALTER TABLE users ADD COLUMN bio TEXT DEFAULT NULL")
                if "reset_token" not in cols_u:
                    conn.exec_driver_sql("ALTER TABLE users ADD COLUMN reset_token VARCHAR(100) DEFAULT NULL")
                if "reset_token_expiry" not in cols_u:
                    conn.exec_driver_sql("ALTER TABLE users ADD COLUMN reset_token_expiry DATETIME DEFAULT NULL")
            
            # Students table
            cols_s = [c[1] for c in conn.exec_driver_sql("PRAGMA table_info(students)").fetchall()]
            if cols_s:
                if "profile_status" not in cols_s:
                    conn.exec_driver_sql("ALTER TABLE students ADD COLUMN profile_status VARCHAR(50) DEFAULT 'Verified'")
                if "is_active" not in cols_s:
                    conn.exec_driver_sql("ALTER TABLE students ADD COLUMN is_active BOOLEAN DEFAULT 1")
                if "phone" not in cols_s:
                    conn.exec_driver_sql("ALTER TABLE students ADD COLUMN phone VARCHAR(30) DEFAULT NULL")
                if "bio" not in cols_s:
                    conn.exec_driver_sql("ALTER TABLE students ADD COLUMN bio TEXT DEFAULT NULL")
                if "study_hours" not in cols_s:
                    conn.exec_driver_sql("ALTER TABLE students ADD COLUMN study_hours FLOAT DEFAULT 16.5")
                    
            # Staff table
            cols_st = [c[1] for c in conn.exec_driver_sql("PRAGMA table_info(staff)").fetchall()]
            if cols_st:
                if "is_active" not in cols_st:
                    conn.exec_driver_sql("ALTER TABLE staff ADD COLUMN is_active BOOLEAN DEFAULT 1")
                if "phone" not in cols_st:
                    conn.exec_driver_sql("ALTER TABLE staff ADD COLUMN phone VARCHAR(30) DEFAULT NULL")
                if "bio" not in cols_st:
                    conn.exec_driver_sql("ALTER TABLE staff ADD COLUMN bio TEXT DEFAULT NULL")
            
            conn.commit()
    except Exception as e:
        print(f"Migration notice: {e}")

# Run safe migrations on module initialization
migrate_db_safe()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
