import os
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
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
    description="Gradewise-AI — AI-Powered Student Analytics & Success Platform API",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json"
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

# Check for production frontend build (supports unified full-stack deployments & Docker)
_base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
_candidates = [
    os.path.join(_base_dir, "frontend", "dist"),
    os.path.join(_base_dir, "frontend_dist"),
    "/app/frontend_dist"
]

frontend_dist_path = None
for _cand in _candidates:
    if os.path.exists(_cand) and os.path.isdir(_cand):
        frontend_dist_path = _cand
        break

if frontend_dist_path:
    assets_dir = os.path.join(frontend_dist_path, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}")
    def serve_spa_frontend(full_path: str):
        if full_path.startswith("api") or full_path.startswith("docs") or full_path.startswith("redoc") or full_path.startswith("openapi.json"):
            return {"error": "Not Found"}
        target = os.path.join(frontend_dist_path, full_path)
        if os.path.isfile(target):
            return FileResponse(target)
        index_file = os.path.join(frontend_dist_path, "index.html")
        if os.path.isfile(index_file):
            return FileResponse(index_file)
        return {"platform": "Gradewise-AI API", "status": "operational"}
