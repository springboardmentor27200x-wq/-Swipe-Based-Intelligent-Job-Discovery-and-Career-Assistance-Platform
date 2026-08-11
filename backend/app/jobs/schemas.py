import json
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict


class CompanyResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    logo_url: Optional[str] = None
    description: Optional[str] = None
    company_type: str
    industry: str
    size: str
    location: str
    website: Optional[str] = None
    founded_year: Optional[int] = None
    is_hiring: bool = True
    rating: float = 0.0


class CompanyCreate(BaseModel):
    name: str
    logo_url: Optional[str] = None
    description: Optional[str] = None
    company_type: str  # mnc, startup, new_startup
    industry: str
    size: str
    location: str
    website: Optional[str] = None
    founded_year: Optional[int] = None


class JobCreate(BaseModel):
    title: str
    company_id: int
    description: str
    requirements: List[str] = []
    skills_required: List[str] = []
    job_type: str  # full_time, part_time, internship, contract, remote
    experience_level: str  # fresher, junior, mid, senior, lead
    min_salary: Optional[int] = None
    max_salary: Optional[int] = None
    location: str
    is_remote: bool = False
    tags: List[str] = []
    benefits: List[str] = []
    deadline: Optional[datetime] = None


class JobUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    requirements: Optional[List[str]] = None
    skills_required: Optional[List[str]] = None
    job_type: Optional[str] = None
    experience_level: Optional[str] = None
    min_salary: Optional[int] = None
    max_salary: Optional[int] = None
    location: Optional[str] = None
    is_remote: Optional[bool] = None
    is_active: Optional[bool] = None
    tags: Optional[List[str]] = None
    benefits: Optional[List[str]] = None
    deadline: Optional[datetime] = None


class JobResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    company_id: int
    description: str
    requirements: List[str] = []
    skills_required: List[str] = []
    job_type: str
    experience_level: str
    min_salary: Optional[int] = None
    max_salary: Optional[int] = None
    location: str
    is_remote: bool
    is_active: bool
    posted_by: int
    applicant_count: int
    competition_level: str
    tags: List[str] = []
    benefits: List[str] = []
    deadline: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime


class JobDetailResponse(BaseModel):
    """Extended job response with company info and user-specific fields."""
    id: int
    title: str
    company_id: int
    description: str
    requirements: List[str] = []
    skills_required: List[str] = []
    job_type: str
    experience_level: str
    min_salary: Optional[int] = None
    max_salary: Optional[int] = None
    location: str
    is_remote: bool
    is_active: bool
    posted_by: int
    applicant_count: int
    competition_level: str
    tags: List[str] = []
    benefits: List[str] = []
    deadline: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    # Enriched fields
    company: Optional[CompanyResponse] = None
    days_since_posted: int = 0
    is_saved: bool = False
    is_applied: bool = False
    match_score: Optional[float] = None


class JobFilter(BaseModel):
    search: Optional[str] = None
    job_type: Optional[str] = None
    company_type: Optional[str] = None
    is_remote: Optional[bool] = None
    min_salary: Optional[int] = None
    max_salary: Optional[int] = None
    experience_level: Optional[str] = None
    skills: Optional[str] = None  # comma-separated
    limit: int = 20
    offset: int = 0
