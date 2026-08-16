from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware

from app.config import settings
from app.database import Base, engine
from app.routers import auth, jobseeker, recruiter, admin   
from app import models_jobseeker  # noqa: F401 -- registers new tables with Base.metadata
from app import models_recruiter
from app import models_admin

# Creates all tables (users, etc.) on startup if they don't exist yet.
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="SwipeX API",
    description="Module 1: User Authentication & Role-Based Access",
    version="1.0.0",
)

# Required by Authlib to store OAuth state/nonce between redirect steps.
app.add_middleware(SessionMiddleware, secret_key=settings.SECRET_KEY)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(jobseeker.router)
app.include_router(recruiter.router) 
app.include_router(admin.router)


@app.get("/")
def health_check():
    return {"status": "ok", "service": "SwipeX API - Module 1"}
