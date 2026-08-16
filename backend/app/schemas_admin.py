"""
schemas_admin.py
-----------------------------------------------------------------------
Pydantic schemas for the admin signup + admin dashboard endpoints.
NEW file — does not modify app/schemas.py.
-----------------------------------------------------------------------
"""

import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field


class AdminSignup(BaseModel):
    full_name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(min_length=8, max_length=72)
    admin_secret: str  # must match settings.ADMIN_SECRET_KEY


class DashboardStats(BaseModel):
    total_job_seekers: int
    total_recruiters: int
    total_jobs: int
    total_applications: int
    active_job_seekers: int
    active_recruiters: int


class JobSeekerListItem(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    full_name: str
    email: EmailStr
    is_active: bool
    headline: Optional[str] = None
    location: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class RecruiterListItem(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    full_name: str
    email: EmailStr
    is_active: bool
    company_name: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ToggleActiveResponse(BaseModel):
    id: uuid.UUID
    is_active: bool

class JobListItem(BaseModel):
    id: uuid.UUID
    title: str
    company_name: str
    location: str
    employment_type: str
    posted_at: datetime
    is_active: bool
    applicant_count: int


class ToggleJobActiveResponse(BaseModel):
    id: uuid.UUID
    is_active: bool


class AdminListItem(BaseModel):
    id: uuid.UUID
    full_name: str
    email: EmailStr
    created_at: datetime


class TopJobItem(BaseModel):
    job_id: uuid.UUID
    title: str
    company_name: str
    applicant_count: int


class TopCompanyItem(BaseModel):
    company_id: uuid.UUID
    company_name: str
    job_count: int


class DeleteUserResponse(BaseModel):
    id: uuid.UUID
    deleted: bool

class PlatformSettingsOut(BaseModel):
    maintenance_mode: bool
    allow_new_signups: bool
    allow_google_oauth: bool
    max_resume_versions: int
    daily_swipe_limit: int

    class Config:
        from_attributes = True


class PlatformSettingsUpdate(BaseModel):
    maintenance_mode: bool | None = None
    allow_new_signups: bool | None = None
    allow_google_oauth: bool | None = None
    max_resume_versions: int | None = Field(default=None, ge=1, le=20)
    daily_swipe_limit: int | None = Field(default=None, ge=1, le=1000)
