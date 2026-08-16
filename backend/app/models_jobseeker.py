"""
models_jobseeker.py
-----------------------------------------------------------------------
NEW models added on top of the existing auth models (app/models.py).
Nothing in app/models.py is modified — these tables reference the
existing `users` table via ForeignKey("users.id") only.

Same style as your existing models.py: Column-based declarative,
UUID primary keys, shared `Base` from app.database.

Covers the SwipeX Job Seeker Dashboard PRD sections:
  - Profile & Resume Management
  - Swipe-Based Job Discovery
  - Real-Time Job Freshness & Competition Tracking (computed, not stored)
  - AI Resume Analyzer & ATS Scoring
  - Application Tracking System
  - Smart Notifications & Alerts

These tables are picked up automatically by Base.metadata.create_all()
in main.py, AS LONG AS this module is imported somewhere before that
call runs. See the "one required edit" note in the accompanying README.
-----------------------------------------------------------------------
"""

import enum
import uuid
from datetime import datetime

from sqlalchemy import (
    Column,
    String,
    Text,
    Integer,
    Float,
    Boolean,
    DateTime,
    Enum,
    ForeignKey,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


# ---------------------------------------------------------------------
# Enums
# ---------------------------------------------------------------------

class CompanyType(str, enum.Enum):
    mnc = "MNC"
    startup = "Startup"
    newly_founded = "Newly Founded"


class EmploymentType(str, enum.Enum):
    full_time = "Full-time"
    internship = "Internship"
    remote = "Remote"
    hybrid = "Hybrid"


class ExperienceLevel(str, enum.Enum):
    fresher = "Fresher"
    junior = "0-2 yrs"
    mid = "2-5 yrs"
    senior = "5+ yrs"


class ApplicationStatus(str, enum.Enum):
    saved = "saved"
    applied = "applied"
    interview = "interview"
    shortlisted = "shortlisted"
    rejected = "rejected"


class SwipeActionType(str, enum.Enum):
    skip = "skip"
    save = "save"
    apply = "apply"


class NotificationType(str, enum.Enum):
    high_match = "high-match"
    startup = "startup"
    low_competition = "low-competition"
    general = "general"


# ---------------------------------------------------------------------
# Job seeker profile + related tables
# ---------------------------------------------------------------------

class JobSeekerProfile(Base):
    __tablename__ = "job_seeker_profiles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), unique=True, nullable=False)
    headline = Column(String, nullable=True)
    location = Column(String, nullable=True)
    experience_level = Column(Enum(ExperienceLevel), nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User")
    skills = relationship("JobSeekerSkill", back_populates="profile", cascade="all, delete-orphan")
    portfolio_links = relationship("PortfolioLink", back_populates="profile", cascade="all, delete-orphan")
    resumes = relationship("Resume", back_populates="profile", cascade="all, delete-orphan")
    applications = relationship("Application", back_populates="job_seeker_profile", cascade="all, delete-orphan")
    swipe_actions = relationship("SwipeAction", back_populates="job_seeker_profile", cascade="all, delete-orphan")

    # profile_completion is intentionally NOT a column — compute it in
    # the service layer from whether headline/skills/resume/portfolio
    # are populated, so it can never go stale.


class Skill(Base):
    __tablename__ = "skills"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, unique=True, index=True, nullable=False)


class JobSeekerSkill(Base):
    """Join table: which skills a job seeker has tagged on their profile."""
    __tablename__ = "job_seeker_skills"
    __table_args__ = (UniqueConstraint("profile_id", "skill_id", name="uq_profile_skill"),)

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    profile_id = Column(UUID(as_uuid=True), ForeignKey("job_seeker_profiles.id"), nullable=False)
    skill_id = Column(UUID(as_uuid=True), ForeignKey("skills.id"), nullable=False)

    profile = relationship("JobSeekerProfile", back_populates="skills")
    skill = relationship("Skill")


class PortfolioLink(Base):
    __tablename__ = "portfolio_links"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    profile_id = Column(UUID(as_uuid=True), ForeignKey("job_seeker_profiles.id"), nullable=False)
    url = Column(String, nullable=False)
    label = Column(String, nullable=True)

    profile = relationship("JobSeekerProfile", back_populates="portfolio_links")


class Resume(Base):
    __tablename__ = "resumes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    profile_id = Column(UUID(as_uuid=True), ForeignKey("job_seeker_profiles.id"), nullable=False)
    file_name = Column(String, nullable=False)
    file_url = Column(String, nullable=False)  # path/URL in S3, GCS, or local storage
    version_number = Column(Integer, default=1)
    is_primary = Column(Boolean, default=False)
    uploaded_at = Column(DateTime, default=datetime.utcnow)

    profile = relationship("JobSeekerProfile", back_populates="resumes")
    ats_analyses = relationship("ATSAnalysis", back_populates="resume", cascade="all, delete-orphan")


# ---------------------------------------------------------------------
# Recruiter / Company / Job
# ---------------------------------------------------------------------

class RecruiterProfile(Base):
    __tablename__ = "recruiter_profiles"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id"), nullable=True)

    company = relationship("Company", foreign_keys=[company_id])


class Job(Base):
    __tablename__ = "jobs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    location = Column(String, nullable=False)
    employment_type = Column(Enum(EmploymentType), nullable=False)
    experience_level = Column(Enum(ExperienceLevel), nullable=False)
    salary_min = Column(Float, nullable=True)
    salary_max = Column(Float, nullable=True)
    posted_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)

    company = relationship("Company", back_populates="jobs")
    applications = relationship("Application", back_populates="job")
    swipe_actions = relationship("SwipeAction", back_populates="job")

    # applicant_count and competition_level are deliberately NOT columns —
    # compute applicant_count as count(Application where job_id=this and
    # status != 'saved'), and derive competition_level (Low/Medium/High)
    # from that count + how recently posted_at is, in the service layer.


# ---------------------------------------------------------------------
# Application — one row per (job seeker, job) pair, status tracks stage
# ---------------------------------------------------------------------

class Application(Base):
    __tablename__ = "applications"
    __table_args__ = (UniqueConstraint("job_seeker_profile_id", "job_id", name="uq_seeker_job"),)

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    job_seeker_profile_id = Column(UUID(as_uuid=True), ForeignKey("job_seeker_profiles.id"), nullable=False)
    job_id = Column(UUID(as_uuid=True), ForeignKey("jobs.id"), nullable=False)
    status = Column(Enum(ApplicationStatus), nullable=False, default=ApplicationStatus.saved)
    ats_match_score = Column(Float, nullable=True)
    applied_at = Column(DateTime, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    job_seeker_profile = relationship("JobSeekerProfile", back_populates="applications")
    job = relationship("Job", back_populates="applications")
    messages = relationship(
        "Message", back_populates="application", order_by="Message.created_at",
        cascade="all, delete-orphan",
    )


class SwipeAction(Base):
    """
    Raw log of every skip/save/apply on the Discover feed — feeds the
    recommendation engine. Kept separate from Application because a
    skip should NOT create a permanent application row.
    """
    __tablename__ = "swipe_actions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    job_seeker_profile_id = Column(UUID(as_uuid=True), ForeignKey("job_seeker_profiles.id"), nullable=False)
    job_id = Column(UUID(as_uuid=True), ForeignKey("jobs.id"), nullable=False)
    action = Column(Enum(SwipeActionType), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    job_seeker_profile = relationship("JobSeekerProfile", back_populates="swipe_actions")
    job = relationship("Job", back_populates="swipe_actions")


# ---------------------------------------------------------------------
# ATS analysis
# ---------------------------------------------------------------------

class ATSAnalysis(Base):
    __tablename__ = "ats_analyses"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    resume_id = Column(UUID(as_uuid=True), ForeignKey("resumes.id"), nullable=False)
    job_id = Column(UUID(as_uuid=True), ForeignKey("jobs.id"), nullable=True)
    score = Column(Float, nullable=False)
    missing_skills = Column(Text, nullable=True)    # JSON-encoded list, e.g. '["Docker","GraphQL"]'
    missing_keywords = Column(Text, nullable=True)  # JSON-encoded list
    suggestions = Column(Text, nullable=True)       # JSON-encoded list
    analyzed_at = Column(DateTime, default=datetime.utcnow)

    resume = relationship("Resume", back_populates="ats_analyses")
    job = relationship("Job")


# ---------------------------------------------------------------------
# Notifications
# ---------------------------------------------------------------------

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    type = Column(Enum(NotificationType), nullable=False)
    text = Column(String, nullable=False)
    is_read = Column(Boolean, default=False)
    related_job_id = Column(UUID(as_uuid=True), ForeignKey("jobs.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")
    related_job = relationship("Job")


class Message(Base):
    """A single message in the thread attached to one application.
    Either party (the job seeker or the recruiter who owns that job)
    can send messages here — sender_user_id tells you which."""
    __tablename__ = "messages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    application_id = Column(UUID(as_uuid=True), ForeignKey("applications.id"), nullable=False)
    sender_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    body = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    application = relationship("Application", back_populates="messages")
    sender = relationship("User")


class Company(Base):
    __tablename__ = "companies"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    company_type = Column(Enum(CompanyType), nullable=False)
    website = Column(String, nullable=True)
    logo_url = Column(String, nullable=True)
    owner_recruiter_profile_id = Column(UUID(as_uuid=True), ForeignKey("recruiter_profiles.id"), nullable=True)

    owner = relationship(
        "RecruiterProfile",
        foreign_keys=[owner_recruiter_profile_id],
        backref="owned_companies",
    )
    jobs = relationship("Job", back_populates="company")