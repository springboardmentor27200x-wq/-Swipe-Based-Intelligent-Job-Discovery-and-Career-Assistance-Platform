from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
from ..database import get_db
from .. import schemas, crud, models
from .auth import get_current_user

router = APIRouter(prefix="/jobs", tags=["jobs"])

@router.get("", response_model=List[schemas.JobOut])
def list_jobs(
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
    db: Session = Depends(get_db)
):
    return crud.get_jobs(
        db,
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

@router.get("/{job_id}", response_model=schemas.JobOut)
def get_job(job_id: UUID, db: Session = Depends(get_db)):
    job = crud.get_job_by_id(db, job_id)
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job posting not found"
        )
    return job

@router.post("", response_model=schemas.JobOut, status_code=status.HTTP_201_CREATED)
def create_job(
    job_in: schemas.JobCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != models.UserRole.recruiter and current_user.role != models.UserRole.admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only recruiters can create job postings"
        )
    
    # Ensure company exists
    company = crud.get_company_by_id(db, job_in.company_id)
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Specified company does not exist"
        )
        
    return crud.create_job(db, job_in, recruiter_id=current_user.id)

@router.patch("/{job_id}", response_model=schemas.JobOut)
def update_job(
    job_id: UUID,
    job_in: schemas.JobUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    job = crud.get_job_by_id(db, job_id)
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job posting not found"
        )
    if job.recruiter_id != current_user.id and current_user.role != models.UserRole.admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to edit this job posting"
        )
    return crud.update_job(db, job, job_in)
