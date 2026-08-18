from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional
from uuid import UUID
from datetime import datetime
import re
from .models import UserRole

# Shared properties
class UserBase(BaseModel):
    email: EmailStr

# Properties to receive via API on registration
class UserRegister(UserBase):
    password: str = Field(..., min_length=8)
    role: UserRole
    full_name: str
    phone: Optional[str] = None
    location: Optional[str] = None
    company_name: Optional[str] = None
    company_website: Optional[str] = None

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, v):
        if not re.search(r"[0-9]", v):
            raise ValueError("Password must contain at least 1 number")
        if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", v):
            raise ValueError("Password must contain at least 1 special character")
        return v

    @field_validator("role")
    @classmethod
    def validate_role(cls, v):
        if v not in [UserRole.job_seeker, UserRole.recruiter]:
            raise ValueError("Role must be either job_seeker or recruiter")
        return v

# Properties to receive via API on login
class UserLogin(UserBase):
    password: str

# Token response schema
class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

# Schema to refresh access token
class TokenRefreshRequest(BaseModel):
    refresh_token: str

# Profile schemas for responses
class JobSeekerProfileOut(BaseModel):
    id: UUID
    full_name: str
    phone: Optional[str] = None
    location: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class RecruiterProfileOut(BaseModel):
    id: UUID
    full_name: str
    company_name: str
    company_website: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# User response schema
class UserOut(UserBase):
    id: UUID
    role: UserRole
    is_active: bool
    is_verified: bool
    created_at: datetime
    updated_at: datetime
    job_seeker_profile: Optional[JobSeekerProfileOut] = None
    recruiter_profile: Optional[RecruiterProfileOut] = None

    class Config:
        from_attributes = True

from typing import List
from .models import CompanyType, JobType, ExperienceLevel, SwipeDirection

# Company Schemas
class CompanyBase(BaseModel):
    name: str
    type: CompanyType = CompanyType.startup
    website: Optional[str] = None
    location: Optional[str] = None
    description: Optional[str] = None

class CompanyCreate(CompanyBase):
    pass

class CompanyOut(CompanyBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    open_jobs_count: Optional[int] = 0

    class Config:
        from_attributes = True

# Job Schemas
class JobBase(BaseModel):
    title: str
    description: Optional[str] = None
    job_type: JobType = JobType.full_time
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    location: Optional[str] = None
    experience_level: ExperienceLevel = ExperienceLevel.fresher
    skills_required: Optional[List[str]] = []
    is_active: bool = True

class JobCreate(JobBase):
    company_id: UUID

class JobUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    job_type: Optional[JobType] = None
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    location: Optional[str] = None
    experience_level: Optional[ExperienceLevel] = None
    skills_required: Optional[List[str]] = None
    is_active: Optional[bool] = None

class JobOut(JobBase):
    id: UUID
    company_id: UUID
    recruiter_id: UUID
    posted_at: datetime
    updated_at: datetime
    company: Optional[CompanyOut] = None
    ai_match_score: Optional[int] = 85
    applicant_count: Optional[int] = 0
    competition_level: Optional[str] = "Low" # Low, Medium, High
    is_early_applicant: Optional[bool] = False
    is_fresher_friendly: Optional[bool] = True
    posted_time_ago: Optional[str] = "Recently"

    class Config:
        from_attributes = True

# Swipe Schemas
class SwipeCreate(BaseModel):
    job_id: UUID
    direction: SwipeDirection
    status: Optional[str] = "applied"

class SwipeStatusUpdate(BaseModel):
    status: str # applied, shortlisted, interview, rejected, hired

class SwipeOut(BaseModel):
    id: UUID
    user_id: UUID
    job_id: UUID
    direction: SwipeDirection
    status: Optional[str] = "applied"
    created_at: datetime
    job: Optional[JobOut] = None

    class Config:
        from_attributes = True

# Notification Schemas
class NotificationCreate(BaseModel):
    user_id: UUID
    type: str = "info"
    title: str
    message: str
    link: Optional[str] = None

class NotificationOut(BaseModel):
    id: UUID
    user_id: UUID
    type: str
    title: str
    message: str
    link: Optional[str] = None
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True

# Analytics Schemas
class SeekerAnalyticsOut(BaseModel):
    total_applications: int = 0
    saved_jobs_count: int = 0
    shortlisted_count: int = 0
    interview_count: int = 0
    average_ats_score: int = 0
    top_matching_skills: List[str] = []
    recent_activity: List[dict] = []

class RecruiterAnalyticsOut(BaseModel):
    total_active_jobs: int = 0
    total_applicants: int = 0
    total_swipes_received: int = 0
    shortlisted_candidates: int = 0
    conversion_rate: float = 0.0
    top_performing_job: Optional[str] = None
    recent_applications: List[dict] = []

class AdminAnalyticsOut(BaseModel):
    total_users: int = 0
    total_seekers: int = 0
    total_recruiters: int = 0
    total_jobs: int = 0
    total_swipes: int = 0
    system_health: str = "100% Operational"


# Resume Schemas
class ResumeOut(BaseModel):
    id: UUID
    user_id: UUID
    filename: str
    parsed_skills: List[str] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# ATS Analysis Schemas
class ATSAnalysisResponse(BaseModel):
    ats_score: int
    match_rating: str  # "Strong Match" | "Moderate Match" | "Low Match"
    is_high_match: bool  # Score >= 80%
    matched_keywords: List[str]
    missing_keywords: List[str]
    suggestions: List[str]
    salary_recommendation: Optional[str] = None

# Messaging Schemas
class MessageCreate(BaseModel):
    content: str

class MessageOut(BaseModel):
    id: UUID
    conversation_id: UUID
    sender_id: UUID
    content: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True

class ConversationCreate(BaseModel):
    job_id: UUID
    job_seeker_id: Optional[UUID] = None

class ConversationOut(BaseModel):
    id: UUID
    job_seeker_id: UUID
    recruiter_id: UUID
    job_id: UUID
    created_at: datetime
    updated_at: datetime
    job_title: Optional[str] = None
    company_name: Optional[str] = None
    other_party_name: Optional[str] = None
    last_message: Optional[str] = None
    unread_count: Optional[int] = 0

    class Config:
        from_attributes = True



