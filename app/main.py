from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware

from .saved import router as saved_router

import os
from pathlib import Path

from .database import engine, Base
from . import models

from .auth import router as auth_router
from .resume import router as resume_router
from .ats import router as ats_router
from .jobs import router as jobs_router
from .matching import router as matching_router
from . import ai_suggestions

# Milestone 4
from .applications import router as applications_router
from .notifications import router as notifications_router
from .analytics import router as analytics_router


# ======================================================
# PATH CONFIGURATION
# ======================================================

# backend/
BASE_DIR = Path(__file__).resolve().parent.parent

FRONTEND_DIR = BASE_DIR / "frontend"
RESUMES_DIR = BASE_DIR / "resumes"


# Make sure resume folder exists
RESUMES_DIR.mkdir(
    parents=True,
    exist_ok=True
)


# ======================================================
# CORS
# ======================================================

allowed_origins_env = os.getenv(
    "ALLOWED_ORIGINS",
    "*"
)

ALLOWED_ORIGINS = [
    origin.strip()
    for origin in allowed_origins_env.split(",")
    if origin.strip()
]

# Authorization header is used by the application.
# Cookies are not required.
USE_CREDENTIALS = "*" not in ALLOWED_ORIGINS


# ======================================================
# DATABASE
# ======================================================

Base.metadata.create_all(
    bind=engine
)


# ======================================================
# FASTAPI APP
# ======================================================

app = FastAPI(
    title="SwipeX API",
    version="2.0.0"
)


# ======================================================
# CORS
# ======================================================

app.add_middleware(
    CORSMiddleware,

    allow_origins=ALLOWED_ORIGINS,

    allow_credentials=USE_CREDENTIALS,

    allow_methods=["*"],

    allow_headers=["*"],
)


# ======================================================
# STATIC FILES
# ======================================================

for folder in ("css", "js", "images"):
    folder_path = FRONTEND_DIR / folder
    if folder_path.is_dir():
        app.mount(
            f"/{folder}",
            StaticFiles(directory=str(folder_path)),
            name=folder
        )




# ======================================================
# API ROUTERS
# ======================================================

app.include_router(
    auth_router
)

app.include_router(
    resume_router
)

app.include_router(
    ats_router
)

app.include_router(
    jobs_router
)

app.include_router(
    matching_router
)

app.include_router(
    ai_suggestions.router
)

app.include_router(
    saved_router
)


# ======================================================
# MILESTONE 4 ROUTERS
# ======================================================

app.include_router(
    applications_router
)

app.include_router(
    notifications_router
)

app.include_router(
    analytics_router
)


# ======================================================
# HEALTH CHECK
# ======================================================

@app.get("/health")
def health_check():

    return {
        "status": "healthy",
        "service": "SwipeX API",
        "version": "2.0.0"
    }


# ======================================================
# FRONTEND ROUTES & HEALTH
# ======================================================

def _serve_file_or_json(file_path: Path, page_name: str):
    if file_path.exists():
        return FileResponse(str(file_path))
    legacy_path = FRONTEND_DIR / "legacy_static_html_backup" / file_path.name
    if legacy_path.exists():
        return FileResponse(str(legacy_path))
    return {
        "status": "online",
        "service": "SwipeX Backend API",
        "page": page_name,
        "docs": "/docs",
        "health": "/health"
    }

@app.get("/")
def home():
    db_status = "Disconnected ❌"
    db_dialect = engine.name if hasattr(engine, "name") else "unknown"
    table_counts = {}
    
    try:
        from sqlalchemy import text, inspect
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        db_status = "Connected Successfully ✅"
        
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        
        from .database import SessionLocal
        from .models import User, Job, Application, SavedJob, Notification, ResumeScoreHistory
        db = SessionLocal()
        try:
            table_counts = {
                "users": db.query(User).count(),
                "jobs": db.query(Job).count(),
                "applications": db.query(Application).count(),
                "saved_jobs": db.query(SavedJob).count(),
                "notifications": db.query(Notification).count(),
                "resume_score_history": db.query(ResumeScoreHistory).count(),
            }
        except Exception:
            table_counts = {"tables": tables}
        finally:
            db.close()
            
    except Exception as e:
        db_status = f"Connection Error: {str(e)}"

    return {
        "service": "SwipeX Intelligent Job Discovery API",
        "status": "healthy ✅",
        "version": "2.0.0",
        "database_connection": {
            "status": db_status,
            "engine": db_dialect,
            "record_counts": table_counts
        },
        "documentation": {
            "swagger_ui": "/docs",
            "redoc_ui": "/redoc",
            "openapi_schema": "/openapi.json"
        },
        "api_endpoints": {
            "authentication": [
                "POST /auth/register",
                "POST /auth/login",
                "GET /auth/me"
            ],
            "job_discovery_and_matching": [
                "GET /jobs",
                "POST /jobs",
                "GET /jobs/{id}",
                "GET /matching/recommendations"
            ],
            "applications_and_tracking": [
                "GET /applications",
                "POST /applications",
                "PUT /applications/{id}/status",
                "GET /track"
            ],
            "ats_resume_analyzer": [
                "POST /ats/analyze",
                "POST /resume/upload"
            ],
            "notifications": [
                "GET /notifications",
                "PUT /notifications/{id}/read"
            ],
            "analytics_and_insights": [
                "GET /analytics/dashboard",
                "GET /analytics/recruiter"
            ]
        }
    }

@app.get("/login")
def login_page():
    return _serve_file_or_json(FRONTEND_DIR / "login.html", "login")

@app.get("/register")
def register_page():
    return _serve_file_or_json(FRONTEND_DIR / "register.html", "register")

@app.get("/dashboard")
def dashboard_page():
    return _serve_file_or_json(FRONTEND_DIR / "dashboard.html", "dashboard")

@app.get("/upload")
def upload_page():
    return _serve_file_or_json(FRONTEND_DIR / "upload.html", "upload")

@app.get("/jobs-page")
def jobs_page():
    return _serve_file_or_json(FRONTEND_DIR / "jobs.html", "jobs")

@app.get("/companies")
def companies_page():
    return _serve_file_or_json(FRONTEND_DIR / "companies.html", "companies")

@app.get("/saved")
def saved_page():
    return _serve_file_or_json(FRONTEND_DIR / "saved.html", "saved")

@app.get("/profile")
def profile_page():
    return _serve_file_or_json(FRONTEND_DIR / "profile.html", "profile")

@app.get("/match")
def match_page():
    return _serve_file_or_json(FRONTEND_DIR / "match.html", "match")

@app.get("/recruiter")
def recruiter_page():
    return _serve_file_or_json(FRONTEND_DIR / "recruiter.html", "recruiter")

@app.get("/candidates")
def candidates_page():
    return _serve_file_or_json(FRONTEND_DIR / "candidates.html", "candidates")

@app.get("/applications")
def applications_page():
    return _serve_file_or_json(FRONTEND_DIR / "applications.html", "applications")

@app.get("/track")
def track_page():
    return _serve_file_or_json(FRONTEND_DIR / "track.html", "track")


# ======================================================
# DATABASE TEST
# ======================================================

@app.get("/db-test")
def db_test():
    try:
        from sqlalchemy import text, inspect
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        
        return {
            "status": "success",
            "message": "Database Connected Successfully ✅",
            "engine_dialect": engine.name,
            "active_tables": tables
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"Database Connection Failed ❌: {str(e)}"
        }
