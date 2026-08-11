from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.swipe import Swipe
from app.models.job import Job
from app.models.company import Company
from app.models.application import Application
from app.models.notification import Notification
from app.models.user import User
from app.auth.utils import get_current_active_user
from app.swipe.schemas import SwipeRequest, SwipeResponse, SwipeHistoryItem, SwipeStats

router = APIRouter(prefix="/swipe", tags=["swipe"])

VALID_DIRECTIONS = {"left", "right"}
VALID_ACTIONS = {"skip", "apply", "save"}


def _compute_competition(count: int) -> str:
    if count < 20:
        return "low"
    elif count <= 50:
        return "medium"
    else:
        return "high"


@router.post("/", response_model=SwipeResponse, status_code=status.HTTP_201_CREATED)
def record_swipe(
    payload: SwipeRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Record a swipe action on a job."""
    if payload.direction not in VALID_DIRECTIONS:
        raise HTTPException(status_code=400, detail=f"direction must be one of {VALID_DIRECTIONS}")
    if payload.action not in VALID_ACTIONS:
        raise HTTPException(status_code=400, detail=f"action must be one of {VALID_ACTIONS}")

    job = db.query(Job).filter(Job.id == payload.job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    # Check if already swiped
    existing_swipe = db.query(Swipe).filter(
        Swipe.user_id == current_user.id,
        Swipe.job_id == payload.job_id,
    ).first()
    if existing_swipe:
        # Update existing swipe
        existing_swipe.direction = payload.direction
        existing_swipe.action = payload.action
        db.commit()
        db.refresh(existing_swipe)
        swipe = existing_swipe
    else:
        swipe = Swipe(
            user_id=current_user.id,
            job_id=payload.job_id,
            direction=payload.direction,
            action=payload.action,
        )
        db.add(swipe)
        db.commit()
        db.refresh(swipe)

    # Handle right-swipe actions
    if payload.direction == "right":
        existing_app = db.query(Application).filter(
            Application.user_id == current_user.id,
            Application.job_id == payload.job_id,
        ).first()

        # Compute match score
        match_score = None
        try:
            from app.recommendations.engine import RecommendationEngine
            engine = RecommendationEngine()
            match_score = engine.compute_job_match_score(current_user, job)
        except Exception:
            pass

        if payload.action == "apply":
            if not existing_app:
                # Get primary resume
                from app.models.resume import Resume
                primary_resume = db.query(Resume).filter(
                    Resume.user_id == current_user.id,
                    Resume.is_primary == True,
                ).first()

                app = Application(
                    user_id=current_user.id,
                    job_id=payload.job_id,
                    resume_id=primary_resume.id if primary_resume else None,
                    status="applied",
                    match_score=match_score,
                )
                db.add(app)

                # Update applicant count
                job.applicant_count = (job.applicant_count or 0) + 1
                job.competition_level = _compute_competition(job.applicant_count)
                db.commit()

                # Send notification
                company = db.query(Company).filter(Company.id == job.company_id).first()
                notif = Notification(
                    user_id=current_user.id,
                    title="✅ Application Submitted!",
                    message=f"Your application for {job.title} at {company.name if company else 'the company'} has been submitted.",
                    type="application",
                    job_id=job.id,
                )
                db.add(notif)
                db.commit()

            elif existing_app.status == "saved":
                # Upgrade from saved to applied
                existing_app.status = "applied"
                existing_app.match_score = match_score
                job.applicant_count = (job.applicant_count or 0) + 1
                job.competition_level = _compute_competition(job.applicant_count)
                db.commit()

        elif payload.action == "save":
            if not existing_app:
                app = Application(
                    user_id=current_user.id,
                    job_id=payload.job_id,
                    status="saved",
                    match_score=match_score,
                )
                db.add(app)
                db.commit()

                # Notify about match score if good
                if match_score and match_score >= 70:
                    company = db.query(Company).filter(Company.id == job.company_id).first()
                    notif = Notification(
                        user_id=current_user.id,
                        title="🎯 High Match Found!",
                        message=f"You have a {match_score:.0f}% match for {job.title} at {company.name if company else 'the company'}!",
                        type="match",
                        job_id=job.id,
                    )
                    db.add(notif)
                    db.commit()

    return SwipeResponse(
        id=swipe.id,
        job_id=swipe.job_id,
        direction=swipe.direction,
        action=swipe.action,
        created_at=swipe.created_at,
    )


@router.get("/history", response_model=List[SwipeHistoryItem])
def get_swipe_history(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Get the user's swipe history with job details."""
    swipes = (
        db.query(Swipe)
        .filter(Swipe.user_id == current_user.id)
        .order_by(Swipe.created_at.desc())
        .all()
    )

    result = []
    for swipe in swipes:
        job = db.query(Job).filter(Job.id == swipe.job_id).first()
        company = None
        if job:
            company = db.query(Company).filter(Company.id == job.company_id).first()

        result.append(SwipeHistoryItem(
            id=swipe.id,
            job_id=swipe.job_id,
            job_title=job.title if job else None,
            company_name=company.name if company else None,
            direction=swipe.direction,
            action=swipe.action,
            created_at=swipe.created_at,
        ))

    return result


@router.get("/stats", response_model=SwipeStats)
def get_swipe_stats(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Get the user's swipe statistics."""
    total = db.query(Swipe).filter(Swipe.user_id == current_user.id).count()
    applied = db.query(Swipe).filter(Swipe.user_id == current_user.id, Swipe.action == "apply").count()
    saved = db.query(Swipe).filter(Swipe.user_id == current_user.id, Swipe.action == "save").count()
    skipped = db.query(Swipe).filter(Swipe.user_id == current_user.id, Swipe.action == "skip").count()

    return SwipeStats(
        total_swiped=total,
        applied=applied,
        saved=saved,
        skipped=skipped,
    )


@router.get("/applications")
def get_user_applications(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Get the user's active job applications."""
    apps = (
        db.query(Application)
        .filter(Application.user_id == current_user.id)
        .order_by(Application.applied_at.desc())
        .all()
    )

    result = []
    for app in apps:
        job = db.query(Job).filter(Job.id == app.job_id).first()
        company = None
        if job:
            company = db.query(Company).filter(Company.id == job.company_id).first()

        result.append({
            "id": app.id,
            "job_id": app.job_id,
            "job_title": job.title if job else "Unknown Job",
            "company_name": company.name if company else "Unknown Company",
            "company_logo_url": company.logo_url if company else None,
            "status": app.status,
            "match_score": app.match_score,
            "applied_at": app.applied_at,
        })

    return result


@router.delete("/applications/{application_id}", status_code=status.HTTP_204_NO_CONTENT)
def withdraw_application(
    application_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Withdraw / delete one of the current user's applications."""
    application = (
        db.query(Application)
        .filter(Application.id == application_id, Application.user_id == current_user.id)
        .first()
    )
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    db.delete(application)
    db.commit()
    return None
