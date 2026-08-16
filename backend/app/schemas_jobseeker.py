"""
schemas_jobseeker.py
-----------------------------------------------------------------------
NEW Pydantic schemas for the Job Seeker Dashboard endpoints. Kept in a
separate file so app/schemas.py (your existing auth schemas) is left
untouched. Same style as your existing schemas.py.
-----------------------------------------------------------------------
"""

import uuid
from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel, Field

from app.models_jobseeker import (
    CompanyType,
    EmploymentType,
    ExperienceLevel,
    ApplicationStatus,
    SwipeActionType,
    NotificationType,
)


# ---- Profile ----

class SkillOut(BaseModel):
    id: uuid.UUID
    name: str

    class Config:
        from_attributes = True


class PortfolioLinkOut(BaseModel):
    id: uuid.UUID
    url: str
    label: Optional[str] = None

    class Config:
        from_attributes = True


class ProfileOut(BaseModel):
    full_name: str
    email: str
    headline: Optional[str] = None
    location: Optional[str] = None
    experience_level: Optional[ExperienceLevel] = None
    skills: List[SkillOut] = []
    portfolio_links: List[PortfolioLinkOut] = []
    profile_completion: int

    class Config:
        from_attributes = True


class ProfileUpdateIn(BaseModel):
    headline: Optional[str] = None
    location: Optional[str] = None
    experience_level: Optional[ExperienceLevel] = None
    skills: Optional[List[str]] = None        
    portfolio_links: Optional[List[str]] = None 


# ---- Resume ----

class ResumeOut(BaseModel):
    id: uuid.UUID
    file_name: str
    uploaded_at: datetime
    is_primary: bool

    class Config:
        from_attributes = True


class ATSAnalysisOut(BaseModel):
    score: float
    missing_skills: List[str]
    missing_keywords: List[str]
    suggestions: List[str]

    class Config:
        from_attributes = True


# ---- Jobs / Discover ----

class JobOut(BaseModel):
    id: uuid.UUID
    title: str
    company_name: str
    company_type: CompanyType
    location: str
    employment_type: EmploymentType
    experience_level: ExperienceLevel
    salary_min: Optional[float] = None
    salary_max: Optional[float] = None
    posted_at: datetime
    applicant_count: int          # computed: non-"saved" applications for this job
    competition_level: str        # computed: "Low" | "Medium" | "High"
    match_score: Optional[float] = None  # computed per-user on personalized endpoints
    skills: List[str] = []         # required skills for this job, for the skills filter + display

    class Config:
        from_attributes = True


class SwipeActionIn(BaseModel):
    job_id: uuid.UUID
    action: SwipeActionType


# ---- Applications ----

class ApplicationOut(BaseModel):
    id: uuid.UUID
    job: JobOut
    status: ApplicationStatus
    ats_match_score: Optional[float] = None
    applied_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ApplicationStatusUpdateIn(BaseModel):
    status: ApplicationStatus


# ---- Notifications ----

class NotificationOut(BaseModel):
    id: uuid.UUID
    type: NotificationType
    text: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ---- Combined dashboard overview (one call for the Overview tab) ----

class DashboardOverviewOut(BaseModel):
    profile: ProfileOut
    resume_count: int
    application_counts: dict  # {"saved": 2, "applied": 4, "interview": 1, "shortlisted": 1, "rejected": 3}
    latest_ats: Optional[ATSAnalysisOut] = None
    recommended_jobs: List[JobOut]
    recent_notifications: List[NotificationOut]

class MessageOut(BaseModel):
    id: uuid.UUID
    application_id: uuid.UUID
    sender_user_id: uuid.UUID
    sender_name: str
    is_mine: bool
    body: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True


class MessageCreateIn(BaseModel):
    body: str


class CompanySeekerOut(BaseModel):
    id: uuid.UUID
    name: str
    company_type: CompanyType
    website: Optional[str] = None
    logo_url: Optional[str] = None
    active_jobs_count: int = 0

    class Config:
        from_attributes = True

