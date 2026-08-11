import json
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.job import Job
from app.models.company import Company
from app.models.user import User
from app.models.swipe import Swipe
from app.models.application import Application
from app.auth.utils import get_current_active_user, require_role
from app.jobs.schemas import (
    JobCreate,
    JobUpdate,
    JobDetailResponse,
    CompanyResponse,
    CompanyCreate,
)

router = APIRouter(prefix="/jobs", tags=["jobs"])


def _parse_json(value: str) -> list:
    try:
        return json.loads(value) if value else []
    except (json.JSONDecodeError, TypeError):
        return []


def _compute_competition(count: int) -> str:
    if count < 20:
        return "low"
    elif count <= 50:
        return "medium"
    else:
        return "high"


def _build_job_detail(
    job: Job,
    db: Session,
    current_user: Optional[User] = None,
    match_score: Optional[float] = None,
    company_map: Optional[dict] = None,
    application_map: Optional[dict] = None,
) -> JobDetailResponse:
    """Build a JobDetailResponse from a Job ORM object.

    For bulk listings, pass `company_map` ({company_id: Company}) and
    `application_map` ({(user_id, job_id): Application}) that were fetched
    once with a single batched query (see `_batch_job_lookups` below),
    instead of hitting the DB twice per job (which is what made job lists
    and the dashboard slow to load).
    """
    if company_map is not None:
        company = company_map.get(job.company_id)
    else:
        company = db.query(Company).filter(Company.id == job.company_id).first()
    company_resp = None
    if company:
        company_resp = CompanyResponse(
            id=company.id,
            name=company.name,
            logo_url=company.logo_url,
            description=company.description,
            company_type=company.company_type,
            industry=company.industry,
            size=company.size,
            location=company.location,
            website=company.website,
            founded_year=company.founded_year,
            is_hiring=company.is_hiring,
            rating=company.rating,
        )

    now = datetime.now(timezone.utc)
    created_at = job.created_at
    if created_at.tzinfo is None:
        created_at = created_at.replace(tzinfo=timezone.utc)
    days_since = (now - created_at).days

    is_saved = False
    is_applied = False
    if current_user:
        if application_map is not None:
            app = application_map.get((current_user.id, job.id))
        else:
            app = db.query(Application).filter(
                Application.user_id == current_user.id,
                Application.job_id == job.id,
            ).first()
        if app:
            is_applied = app.status == "applied"
            is_saved = app.status == "saved"

    updated_at = job.updated_at
    if updated_at is None:
        updated_at = job.created_at

    return JobDetailResponse(
        id=job.id,
        title=job.title,
        company_id=job.company_id,
        description=job.description,
        requirements=_parse_json(job.requirements),
        skills_required=_parse_json(job.skills_required),
        job_type=job.job_type,
        experience_level=job.experience_level,
        min_salary=job.min_salary,
        max_salary=job.max_salary,
        location=job.location,
        is_remote=job.is_remote,
        is_active=job.is_active,
        posted_by=job.posted_by,
        applicant_count=job.applicant_count,
        competition_level=job.competition_level,
        tags=_parse_json(job.tags),
        benefits=_parse_json(job.benefits),
        deadline=job.deadline,
        created_at=job.created_at,
        updated_at=updated_at,
        company=company_resp,
        days_since_posted=days_since,
        is_saved=is_saved,
        is_applied=is_applied,
        match_score=match_score,
    )


def _batch_job_lookups(jobs: List[Job], db: Session, current_user: Optional[User]):
    """Fetch all companies and applications for a list of jobs in two
    queries total, instead of two queries per job (N+1)."""
    company_ids = {j.company_id for j in jobs if j.company_id is not None}
    company_map = {}
    if company_ids:
        companies = db.query(Company).filter(Company.id.in_(company_ids)).all()
        company_map = {c.id: c for c in companies}

    application_map = {}
    if current_user and jobs:
        job_ids = [j.id for j in jobs]
        apps = (
            db.query(Application)
            .filter(
                Application.user_id == current_user.id,
                Application.job_id.in_(job_ids),
            )
            .all()
        )
        application_map = {(a.user_id, a.job_id): a for a in apps}

    return company_map, application_map


@router.get("/feed", response_model=List[JobDetailResponse])
def get_swipe_feed(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Return 10 jobs for swipe feed, excluding already-swiped jobs."""
    swiped_job_ids = (
        db.query(Swipe.job_id)
        .filter(Swipe.user_id == current_user.id)
        .subquery()
    )
    jobs = (
        db.query(Job)
        .filter(Job.is_active == True)
        .filter(Job.id.notin_(swiped_job_ids))
        .order_by(Job.created_at.desc())
        .limit(10)
        .all()
    )

    # Try to get match scores from recommendations engine
    match_scores: dict = {}
    try:
        from app.recommendations.engine import RecommendationEngine
        engine = RecommendationEngine()
        for job in jobs:
            match_scores[job.id] = engine.compute_job_match_score(current_user, job)
    except Exception:
        pass

    company_map, application_map = _batch_job_lookups(jobs, db, current_user)
    return [
        _build_job_detail(j, db, current_user, match_scores.get(j.id), company_map, application_map)
        for j in jobs
    ]


@router.get("/company/{company_id}", response_model=List[JobDetailResponse])
def get_jobs_by_company(
    company_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_active_user),
):
    """Get all active jobs for a given company."""
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    jobs = db.query(Job).filter(Job.company_id == company_id, Job.is_active == True).all()
    company_map, application_map = _batch_job_lookups(jobs, db, current_user)
    return [_build_job_detail(j, db, current_user, None, company_map, application_map) for j in jobs]


@router.get("/my-jobs", response_model=List[JobDetailResponse])
def get_my_jobs(
    current_user: User = Depends(require_role("recruiter", "admin")),
    db: Session = Depends(get_db),
):
    """Get all job postings created by the current recruiter/admin.

    NOTE: this must stay registered before the /{job_id} route below —
    otherwise FastAPI/Starlette would try to match "my-jobs" as a job_id
    path parameter and this endpoint would never be reached.
    """
    jobs = (
        db.query(Job)
        .filter(Job.posted_by == current_user.id)
        .order_by(Job.created_at.desc())
        .all()
    )
    company_map, application_map = _batch_job_lookups(jobs, db, current_user)
    return [_build_job_detail(j, db, current_user, None, company_map, application_map) for j in jobs]


@router.get("/{job_id}", response_model=JobDetailResponse)
def get_job(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_active_user),
):
    """Get job detail by ID."""
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return _build_job_detail(job, db, current_user)


@router.get("/", response_model=List[JobDetailResponse])
def list_jobs(
    search: Optional[str] = Query(None),
    job_type: Optional[str] = Query(None),
    company_type: Optional[str] = Query(None),
    is_remote: Optional[bool] = Query(None),
    min_salary: Optional[int] = Query(None),
    max_salary: Optional[int] = Query(None),
    experience_level: Optional[str] = Query(None),
    skills: Optional[str] = Query(None),
    limit: int = Query(20, le=100),
    offset: int = Query(0),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_active_user),
):
    """List jobs with optional filters."""
    query = db.query(Job).filter(Job.is_active == True)

    if search:
        search_term = f"%{search}%"
        query = query.filter(
            Job.title.ilike(search_term) | Job.description.ilike(search_term)
        )
    if job_type:
        query = query.filter(Job.job_type == job_type)
    if is_remote is not None:
        query = query.filter(Job.is_remote == is_remote)
    if min_salary is not None:
        query = query.filter(Job.min_salary >= min_salary)
    if max_salary is not None:
        query = query.filter(Job.max_salary <= max_salary)
    if experience_level:
        query = query.filter(Job.experience_level == experience_level)

    if company_type:
        company_ids = (
            db.query(Company.id).filter(Company.company_type == company_type).all()
        )
        ids = [c[0] for c in company_ids]
        query = query.filter(Job.company_id.in_(ids))

    if skills:
        skill_list = [s.strip() for s in skills.split(",") if s.strip()]
        for skill in skill_list:
            query = query.filter(Job.skills_required.ilike(f"%{skill}%"))

    total_jobs = query.count()
    jobs = query.order_by(Job.created_at.desc()).offset(offset).limit(limit).all()

    company_map, application_map = _batch_job_lookups(jobs, db, current_user)
    return [_build_job_detail(j, db, current_user, None, company_map, application_map) for j in jobs]


@router.post("/", response_model=JobDetailResponse, status_code=status.HTTP_201_CREATED)
def create_job(
    payload: JobCreate,
    current_user: User = Depends(require_role("recruiter", "admin")),
    db: Session = Depends(get_db),
):
    """Create a new job posting (recruiter/admin only)."""
    company = db.query(Company).filter(Company.id == payload.company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    job = Job(
        title=payload.title,
        company_id=payload.company_id,
        description=payload.description,
        requirements=json.dumps(payload.requirements),
        skills_required=json.dumps(payload.skills_required),
        job_type=payload.job_type,
        experience_level=payload.experience_level,
        min_salary=payload.min_salary,
        max_salary=payload.max_salary,
        location=payload.location,
        is_remote=payload.is_remote,
        posted_by=current_user.id,
        tags=json.dumps(payload.tags),
        benefits=json.dumps(payload.benefits),
        deadline=payload.deadline,
        competition_level="low",
        applicant_count=0,
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    return _build_job_detail(job, db, current_user)


@router.put("/{job_id}", response_model=JobDetailResponse)
def update_job(
    job_id: int,
    payload: JobUpdate,
    current_user: User = Depends(require_role("recruiter", "admin")),
    db: Session = Depends(get_db),
):
    """Update a job (recruiter/admin only)."""
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    if current_user.role == "recruiter" and job.posted_by != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this job")

    update_data = payload.model_dump(exclude_unset=True)
    for field in ("requirements", "skills_required", "tags", "benefits"):
        if field in update_data and isinstance(update_data[field], list):
            update_data[field] = json.dumps(update_data[field])

    for field, value in update_data.items():
        setattr(job, field, value)

    db.commit()
    db.refresh(job)
    return _build_job_detail(job, db, current_user)


@router.delete("/{job_id}", status_code=status.HTTP_200_OK)
def delete_job(
    job_id: int,
    current_user: User = Depends(require_role("recruiter", "admin")),
    db: Session = Depends(get_db),
):
    """Soft-delete a job (mark inactive)."""
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    if current_user.role == "recruiter" and job.posted_by != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this job")

    job.is_active = False
    db.commit()
    return {"message": f"Job {job_id} deactivated"}


# ---- Recruiter-specific routes ----

recruiter_router = APIRouter(prefix="/api/recruiter", tags=["recruiter"])


@recruiter_router.get("/applicants")
def get_recruiter_applicants(
    current_user: User = Depends(require_role("recruiter", "admin")),
    db: Session = Depends(get_db),
):
    """Get all applicants for the recruiter's job postings."""
    recruiter_jobs = db.query(Job).filter(Job.posted_by == current_user.id).all()
    job_ids = [j.id for j in recruiter_jobs]
    job_map = {j.id: j for j in recruiter_jobs}

    applications = (
        db.query(Application)
        .filter(Application.job_id.in_(job_ids))
        .all()
        if job_ids else []
    )

    user_ids = {app.user_id for app in applications}
    user_map = {}
    if user_ids:
        users = db.query(User).filter(User.id.in_(user_ids)).all()
        user_map = {u.id: u for u in users}

    result = []
    for app in applications:
        applicant = user_map.get(app.user_id)
        job = job_map.get(app.job_id)
        result.append({
            "application_id": app.id,
            "job_id": app.job_id,
            "job_title": job.title if job else None,
            "applicant_id": app.user_id,
            "applicant_name": applicant.full_name if applicant else None,
            "applicant_email": applicant.email if applicant else None,
            "status": app.status,
            "match_score": app.match_score,
            "applied_at": app.applied_at,
        })

    return result


@recruiter_router.put("/applications/{application_id}/status")
def update_application_status(
    application_id: int,
    status_update: dict,
    current_user: User = Depends(require_role("recruiter", "admin")),
    db: Session = Depends(get_db),
):
    """Update the status of an application."""
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    # Verify recruiter owns the job
    job = db.query(Job).filter(Job.id == app.job_id).first()
    if current_user.role == "recruiter" and (not job or job.posted_by != current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized to update this application")

    valid_statuses = {"applied", "saved", "shortlisted", "interview", "rejected", "offered"}
    new_status = status_update.get("status")
    if new_status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}")

    app.status = new_status
    db.commit()
    db.refresh(app)

    # Create a notification for the applicant
    from app.models.notification import Notification
    status_messages = {
        "shortlisted": ("🎉 You've been shortlisted!", f"Your application for {job.title} has been shortlisted."),
        "interview": ("📅 Interview Scheduled!", f"You have an interview scheduled for {job.title}."),
        "rejected": ("Application Update", f"Your application for {job.title} was not selected this time."),
        "offered": ("🎊 Job Offer!", f"Congratulations! You have received an offer for {job.title}."),
    }
    if new_status in status_messages:
        title, message = status_messages[new_status]
        notif = Notification(
            user_id=app.user_id,
            title=title,
            message=message,
            type="application",
            job_id=app.job_id,
        )
        db.add(notif)
        db.commit()

    return {"message": "Application status updated", "status": new_status}
