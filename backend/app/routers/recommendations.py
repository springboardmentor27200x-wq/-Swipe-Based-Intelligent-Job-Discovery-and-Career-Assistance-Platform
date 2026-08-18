from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from .. import schemas, crud, models
from .auth import get_current_user

router = APIRouter(prefix="/recommendations", tags=["recommendations"])

@router.get("", response_model=List[schemas.JobOut])
def get_recommendations(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    company_type: Optional[models.CompanyType] = None,
    remote: Optional[bool] = None,
    job_type: Optional[models.JobType] = None,
    salary_min: Optional[int] = None,
    salary_max: Optional[int] = None,
    skills: Optional[str] = None,
    location: Optional[str] = None,
    experience_level: Optional[models.ExperienceLevel] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    return crud.get_recommendations(
        db,
        user_id=current_user.id,
        skip=skip,
        limit=limit,
        company_type=company_type,
        remote=remote,
        job_type=job_type,
        salary_min=salary_min,
        salary_max=salary_max,
        skills=skills,
        location=location,
        experience_level=experience_level
    )
