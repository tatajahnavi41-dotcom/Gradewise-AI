from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.database import engine, Base, get_db
from app.core.mongo_database import ping_mongo, sync_data_to_mongo
from app.data.seed_data import seed_database
from app.api import (
    auth, students, faculty, admin, risk,
    interventions, quiz, simulator, feedback,
    data_integration, reports, materials, tasks
)

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="CampusIQ — AI-Powered Student Analytics & Success Platform API",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

# Enable CORS for frontend Vite development server and production builds
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount all routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(students.router, prefix=settings.API_V1_STR)
app.include_router(faculty.router, prefix=settings.API_V1_STR)
app.include_router(admin.router, prefix=settings.API_V1_STR)
app.include_router(tasks.router, prefix=settings.API_V1_STR)
app.include_router(risk.router, prefix=settings.API_V1_STR)
app.include_router(interventions.router, prefix=settings.API_V1_STR)
app.include_router(quiz.router, prefix=settings.API_V1_STR)
app.include_router(simulator.router, prefix=settings.API_V1_STR)
app.include_router(feedback.router, prefix=settings.API_V1_STR)
app.include_router(data_integration.router, prefix=settings.API_V1_STR)
app.include_router(reports.router, prefix=settings.API_V1_STR)
app.include_router(materials.router, prefix=settings.API_V1_STR)

@app.on_event("startup")
def startup_event():
    # Ensure tables exist and database is initialized with synthetic dataset
    Base.metadata.create_all(bind=engine)
    from app.core.database import migrate_db_safe
    migrate_db_safe()
    seed_database()

@app.get("/")
def root():
    return {
        "platform": "CampusIQ — AI-Powered Student Analytics & Success Platform",
        "status": "operational",
        "version": "1.0.0",
        "docs": "/api/docs"
    }

@app.get("/api/v1/health")
def health_check():
    mongo_health = ping_mongo()
    return {
        "status": "healthy",
        "services": {
            "database": "sqlite_connected",
            "mongodb_atlas": mongo_health,
            "scoring_engine": "active",
            "early_warning_engine": "active",
            "task_monitoring": "active",
            "dataset_mode": "clean_database"
        }
    }

@app.get("/api/v1/mongo/status")
def get_mongo_status():
    return ping_mongo()

@app.post("/api/v1/mongo/sync")
def sync_mongodb_atlas(db: Session = Depends(get_db)):
    return sync_data_to_mongo(db)
