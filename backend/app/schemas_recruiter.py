"""
schemas_recruiter.py
-----------------------------------------------------------------------
NEW Pydantic schemas for the recruiter dashboard endpoints. Kept separate
from schemas.py and schemas_jobseeker.py, which are untouched.
-----------------------------------------------------------------------
"""

import uuid
from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel

from app.models_jobseeker import CompanyType, EmploymentType, ExperienceLevel, ApplicationStatus


# ---- Company profile ----

class CompanyOut(BaseModel):
    id: uuid.UUID
    name: str
    company_type: Optional[CompanyType] = None
    website: Optional[str] = None
    logo_url: Optional[str] = None

    class Config:
        from_attributes = True


class CompanyUpdateIn(BaseModel):
    name: Optional[str] = None
    company_type: Optional[CompanyType] = None
    website: Optional[str] = None
    logo_url: Optional[str] = None


# ---- Jobs (recruiter's own postings) ----

class JobCreateIn(BaseModel):
    title: str
    description: Optional[str] = None
    location: str
    employment_type: EmploymentType
    experience_level: ExperienceLevel
    salary_min: Optional[float] = None
    salary_max: Optional[float] = None
    skills: List[str] = []
    company_id: Optional[uuid.UUID] = None


class RecruiterJobOut(BaseModel):
    id: uuid.UUID
    title: str
    location: str
    employment_type: EmploymentType
    experience_level: ExperienceLevel
    salary_min: Optional[float] = None
    salary_max: Optional[float] = None
    posted_at: datetime
    is_active: bool
    applicant_count: int      # computed: non-"saved" applications for this job
    competition_level: str    # computed: "Low" | "Medium" | "High"
    skills: List[str] = []
    company_id: uuid.UUID       # NEW
    company_name: str

    class Config:
        from_attributes = True


# ---- Applicants / pipeline ----

class ApplicantOut(BaseModel):
    application_id: uuid.UUID
    job_id: uuid.UUID
    job_title: str
    candidate_name: str
    candidate_email: str
    status: ApplicationStatus
    ats_match_score: Optional[float] = None
    resume_id: Optional[uuid.UUID] = None
    resume_file_name: Optional[str] = None
    applied_at: Optional[datetime] = None


class ApplicantStatusUpdateIn(BaseModel):
    status: ApplicationStatus


# ---- Combined dashboard overview ----

class RecruiterStatsOut(BaseModel):
    active_jobs: int
    total_applicants: int
    shortlisted: int
    interviews: int


class RecruiterDashboardOverviewOut(BaseModel):
    company: CompanyOut
    stats: RecruiterStatsOut
    jobs: List[RecruiterJobOut]
    pipeline: dict  # {"applied": [...], "shortlisted": [...], "interview": [...], "rejected": [...]}

class CompanyCreateIn(BaseModel):
    name: str
    company_type: CompanyType
    website: Optional[str] = None


class CompanyListItemOut(BaseModel):
    id: uuid.UUID
    name: str
    company_type: CompanyType
    website: Optional[str] = None
    is_active: bool

    class Config:
        from_attributes = True