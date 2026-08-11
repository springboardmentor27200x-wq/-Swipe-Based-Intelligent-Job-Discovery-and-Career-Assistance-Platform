from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    full_name = Column(String(255), nullable=False)
    hashed_password = Column(String(512), nullable=False)
    role = Column(String(50), default="job_seeker", nullable=False)  # job_seeker, recruiter, admin
    avatar_url = Column(String(512), nullable=True)
    title = Column(String(255), nullable=True)  # current job title
    location = Column(String(255), nullable=True)
    bio = Column(Text, nullable=True)
    skills = Column(Text, default="[]")  # JSON string list
    experience_years = Column(Integer, default=0)
    education = Column(String(512), nullable=True)
    linkedin_url = Column(String(512), nullable=True)
    github_url = Column(String(512), nullable=True)
    portfolio_url = Column(String(512), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
