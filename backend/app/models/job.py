from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey
from app.database import Base


class Job(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    description = Column(Text, nullable=False)
    requirements = Column(Text, default="[]")  # JSON list
    skills_required = Column(Text, default="[]")  # JSON list
    job_type = Column(String(50), nullable=False)  # full_time, part_time, internship, contract, remote
    experience_level = Column(String(50), nullable=False)  # fresher, junior, mid, senior, lead
    min_salary = Column(Integer, nullable=True)  # monthly INR
    max_salary = Column(Integer, nullable=True)
    location = Column(String(255), nullable=False)
    is_remote = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    posted_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    applicant_count = Column(Integer, default=0)
    competition_level = Column(String(20), default="low")  # low, medium, high
    tags = Column(Text, default="[]")  # JSON list
    benefits = Column(Text, default="[]")  # JSON list
    deadline = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
