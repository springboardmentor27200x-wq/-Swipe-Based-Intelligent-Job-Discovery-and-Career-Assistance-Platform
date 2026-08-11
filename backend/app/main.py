import os
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.database import create_tables, SessionLocal
from app.seed import seed_database

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Import all API routers
from app.auth.router import router as auth_router, admin_router
from app.jobs.router import router as jobs_router, recruiter_router
from app.companies.router import router as companies_router
from app.swipe.router import router as swipe_router
from app.resume.router import router as resume_router
from app.recommendations.router import router as recommendations_router
from app.notifications.router import router as notifications_router
from app.analytics.router import router as analytics_router

app = FastAPI(
    title="SwipeX API",
    description="Swipe-Based Job Discovery and Career Assistance Platform Backend",
    version="1.0.0"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Startup Event: Initialize database and seed demo data
@app.on_event("startup")
def startup_event():
    logger.info("Initializing database tables...")
    create_tables()
    
    logger.info("Seeding database default entries...")
    db = SessionLocal()
    try:
        seed_database(db)
    except Exception as e:
        logger.error(f"Database seeding failed: {e}")
    finally:
        db.close()
        
    # Ensure upload directory exists
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    logger.info("Backend started successfully.")

# Mount uploaded files directory as static endpoints
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Health check
@app.get("/health", tags=["system"])
def health_check():
    return {
        "status": "healthy",
        "version": "1.0.0",
        "environment": "development"
    }

# Include routers under the /api prefix
app.include_router(auth_router, prefix="/api")
app.include_router(admin_router)  # note: it already has /api/admin prefix inside the router definition
app.include_router(jobs_router, prefix="/api")
app.include_router(recruiter_router) # note: it already has /api/recruiter prefix inside the router definition
app.include_router(companies_router) # note: it already has /api/companies prefix inside the router definition
app.include_router(swipe_router, prefix="/api")
app.include_router(resume_router, prefix="/api")
app.include_router(recommendations_router, prefix="/api")
app.include_router(notifications_router, prefix="/api")
app.include_router(analytics_router, prefix="/api")
