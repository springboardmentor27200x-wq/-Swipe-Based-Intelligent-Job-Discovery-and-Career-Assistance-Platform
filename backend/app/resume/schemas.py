from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import List, Dict, Optional

class ResumeResponse(BaseModel):
    id: int
    user_id: int
    filename: str
    file_size: int
    is_primary: bool
    skills_extracted: List[str]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ATSAnalysisRequest(BaseModel):
    resume_id: int
    job_id: int

class ATSAnalysisResponse(BaseModel):
    resume_id: int
    job_id: int
    score: float
    matched_skills: List[str]
    missing_skills: List[str]
    matched_keywords: List[str]
    missing_keywords: List[str]
    suggestions: List[str]
    sections_found: Dict[str, bool]

    model_config = ConfigDict(from_attributes=True)
