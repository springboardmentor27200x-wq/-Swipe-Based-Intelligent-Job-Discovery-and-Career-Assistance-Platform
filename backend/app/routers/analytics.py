from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from .. import schemas, crud, models
from .auth import get_current_user

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])

@router.get("/seeker", response_model=schemas.SeekerAnalyticsOut)
def get_seeker_analytics(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Fetch application analytics, ATS stats, and recent activity for job seekers."""
    if current_user.role != models.UserRole.job_seeker and current_user.role != models.UserRole.admin:
        raise HTTPException(status_code=403, detail="Only job seekers can access job seeker analytics")
    return crud.get_seeker_analytics(db, current_user.id)

@router.get("/recruiter", response_model=schemas.RecruiterAnalyticsOut)
def get_recruiter_analytics(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Fetch hiring funnel analytics, job performance, and applicant metrics for recruiters."""
    if current_user.role != models.UserRole.recruiter and current_user.role != models.UserRole.admin:
        raise HTTPException(status_code=403, detail="Only recruiters can access recruiter analytics")
    return crud.get_recruiter_analytics(db, current_user.id)

@router.get("/admin", response_model=schemas.AdminAnalyticsOut)
def get_admin_analytics(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Fetch platform-wide analytics and telemetry for administrators."""
    if current_user.role != models.UserRole.admin:
        raise HTTPException(status_code=403, detail="Admin privileges required")
    return crud.get_admin_analytics(db)
