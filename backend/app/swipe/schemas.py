from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict


class SwipeRequest(BaseModel):
    job_id: int
    direction: str  # left, right
    action: str  # skip, apply, save


class SwipeResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    job_id: int
    direction: str
    action: str
    created_at: datetime


class SwipeHistoryItem(BaseModel):
    id: int
    job_id: int
    job_title: Optional[str] = None
    company_name: Optional[str] = None
    direction: str
    action: str
    created_at: datetime


class SwipeStats(BaseModel):
    total_swiped: int
    applied: int
    saved: int
    skipped: int
