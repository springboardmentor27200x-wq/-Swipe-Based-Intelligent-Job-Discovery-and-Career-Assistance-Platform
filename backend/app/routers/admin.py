"""
admin.py
-----------------------------------------------------------------------
Mounts at /api/admin/*. NEW file — does not modify any existing router.

/api/admin/signup   -> public route, but requires a correct admin_secret
                       (set via ADMIN_SECRET_KEY in .env). This is the
                       ONLY way an admin account can be created — the
                       existing /api/auth/signup route still explicitly
                       blocks role=admin (unchanged, see auth.py).

Everything else under /api/admin requires role == admin, enforced via
the existing require_role() dependency from app/dependencies.py.

Admin LOGIN reuses the existing /api/auth/login endpoint — no new
login endpoint needed, since that route already works for any role.
-----------------------------------------------------------------------
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.config import settings
from app.database import get_db
from app.dependencies import require_role
from app.models import User, UserRole, AuthProvider
from app.models_jobseeker import (
    JobSeekerProfile,
    Job,
    Application,
    ApplicationStatus,
    Resume,
    Notification,
    RecruiterProfile,
    Company,
)
from app.models_admin import PlatformSettings
from app.schemas import Token, UserOut
from app.schemas_admin import (
    AdminSignup,
    DashboardStats,
    JobSeekerListItem,
    RecruiterListItem,
    ToggleActiveResponse,
    JobListItem,
    ToggleJobActiveResponse,
    AdminListItem,
    TopJobItem,
    TopCompanyItem,
    DeleteUserResponse,
    PlatformSettingsOut,        # NEW
    PlatformSettingsUpdate,
)
from app.security import hash_password, create_access_token

router = APIRouter(prefix="/api/admin", tags=["Admin"])


@router.post("/signup", response_model=Token, status_code=status.HTTP_201_CREATED)
def admin_signup(payload: AdminSignup, db: Session = Depends(get_db)):
    if payload.admin_secret != settings.ADMIN_SECRET_KEY:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid admin secret key",
        )

    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists",
        )

    user = User(
        full_name=payload.full_name,
        email=payload.email,
        hashed_password=hash_password(payload.password),
        role=UserRole.admin,
        auth_provider=AuthProvider.local,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    from app.routers.auth import _issue_token
    return _issue_token(user, db)


@router.get("/dashboard/stats", response_model=DashboardStats)
def dashboard_stats(
    db: Session = Depends(get_db),
    _admin: User = Depends(require_role(UserRole.admin)),
):
    total_job_seekers = db.query(User).filter(User.role == UserRole.job_seeker).count()
    total_recruiters = db.query(User).filter(User.role == UserRole.recruiter).count()
    active_job_seekers = (
        db.query(User).filter(User.role == UserRole.job_seeker, User.is_active == True).count()
    )
    active_recruiters = (
        db.query(User).filter(User.role == UserRole.recruiter, User.is_active == True).count()
    )
    total_jobs = db.query(Job).count()
    total_applications = db.query(Application).count()

    return DashboardStats(
        total_job_seekers=total_job_seekers,
        total_recruiters=total_recruiters,
        total_jobs=total_jobs,
        total_applications=total_applications,
        active_job_seekers=active_job_seekers,
        active_recruiters=active_recruiters,
    )


@router.get("/jobseekers", response_model=list[JobSeekerListItem])
def list_job_seekers(
    db: Session = Depends(get_db),
    _admin: User = Depends(require_role(UserRole.admin)),
):
    rows = (
        db.query(User, JobSeekerProfile)
        .outerjoin(JobSeekerProfile, JobSeekerProfile.user_id == User.id)
        .filter(User.role == UserRole.job_seeker)
        .all()
    )
    result = []
    for user, profile in rows:
        result.append(
            JobSeekerListItem(
                id=profile.id if profile else user.id,
                user_id=user.id,
                full_name=user.full_name,
                email=user.email,
                is_active=user.is_active,
                headline=profile.headline if profile else None,
                location=profile.location if profile else None,
                created_at=user.created_at,
            )
        )
    return result


@router.get("/recruiters", response_model=list[RecruiterListItem])
def list_recruiters(
    db: Session = Depends(get_db),
    _admin: User = Depends(require_role(UserRole.admin)),
):
    rows = (
        db.query(User, RecruiterProfile, Company)
        .outerjoin(RecruiterProfile, RecruiterProfile.user_id == User.id)
        .outerjoin(Company, Company.id == RecruiterProfile.company_id)
        .filter(User.role == UserRole.recruiter)
        .all()
    )
    result = []
    for user, profile, company in rows:
        result.append(
            RecruiterListItem(
                id=profile.id if profile else user.id,
                user_id=user.id,
                full_name=user.full_name,
                email=user.email,
                is_active=user.is_active,
                company_name=company.name if company else None,
                created_at=user.created_at,
            )
        )
    return result


@router.put("/users/{user_id}/toggle-active", response_model=ToggleActiveResponse)
def toggle_user_active(
    user_id: str,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_role(UserRole.admin)),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.role == UserRole.admin:
        raise HTTPException(status_code=400, detail="Cannot deactivate another admin here")

    user.is_active = not user.is_active
    db.commit()
    db.refresh(user)
    return ToggleActiveResponse(id=user.id, is_active=user.is_active)

@router.get("/jobs", response_model=list[JobListItem])
def list_all_jobs(
    db: Session = Depends(get_db),
    _admin: User = Depends(require_role(UserRole.admin)),
):
    jobs = db.query(Job).order_by(Job.posted_at.desc()).all()
    result = []
    for job in jobs:
        applicant_count = (
            db.query(Application)
            .filter(Application.job_id == job.id, Application.status != ApplicationStatus.saved)
            .count()
        )
        result.append(
            JobListItem(
                id=job.id,
                title=job.title,
                company_name=job.company.name if job.company else "—",
                location=job.location,
                employment_type=job.employment_type.value,
                posted_at=job.posted_at,
                is_active=job.is_active,
                applicant_count=applicant_count,
            )
        )
    return result


@router.put("/jobs/{job_id}/toggle-active", response_model=ToggleJobActiveResponse)
def toggle_job_active(
    job_id: str,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_role(UserRole.admin)),
):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    job.is_active = not job.is_active
    db.commit()
    db.refresh(job)
    return ToggleJobActiveResponse(id=job.id, is_active=job.is_active)


@router.get("/admins", response_model=list[AdminListItem])
def list_admins(
    db: Session = Depends(get_db),
    _admin: User = Depends(require_role(UserRole.admin)),
):
    admins = db.query(User).filter(User.role == UserRole.admin).order_by(User.created_at).all()
    return [
        AdminListItem(id=a.id, full_name=a.full_name, email=a.email, created_at=a.created_at)
        for a in admins
    ]


@router.get("/insights/top-jobs", response_model=list[TopJobItem])
def top_jobs(
    db: Session = Depends(get_db),
    _admin: User = Depends(require_role(UserRole.admin)),
):
    rows = (
        db.query(Job, func.count(Application.id).label("applicant_count"))
        .outerjoin(
            Application,
            (Application.job_id == Job.id) & (Application.status != ApplicationStatus.saved),
        )
        .group_by(Job.id)
        .order_by(func.count(Application.id).desc())
        .limit(5)
        .all()
    )
    return [
        TopJobItem(
            job_id=job.id,
            title=job.title,
            company_name=job.company.name if job.company else "—",
            applicant_count=count,
        )
        for job, count in rows
    ]


@router.get("/insights/top-companies", response_model=list[TopCompanyItem])
def top_companies(
    db: Session = Depends(get_db),
    _admin: User = Depends(require_role(UserRole.admin)),
):
    rows = (
        db.query(Company, func.count(Job.id).label("job_count"))
        .outerjoin(Job, Job.company_id == Company.id)
        .filter(Company.name != "")
        .group_by(Company.id)
        .order_by(func.count(Job.id).desc())
        .limit(5)
        .all()
    )
    return [
        TopCompanyItem(company_id=c.id, company_name=c.name, job_count=count)
        for c, count in rows
    ]


@router.delete("/users/{user_id}", response_model=DeleteUserResponse)
def delete_user(
    user_id: str,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_role(UserRole.admin)),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.role == UserRole.admin:
        raise HTTPException(status_code=400, detail="Cannot delete an admin account here")

    if user.role == UserRole.job_seeker:
        profile = db.query(JobSeekerProfile).filter_by(user_id=user.id).first()
        if profile:
            has_data = (
                db.query(Resume).filter_by(profile_id=profile.id).first()
                or db.query(Application).filter_by(job_seeker_profile_id=profile.id).first()
            )
            if has_data:
                raise HTTPException(
                    status_code=400,
                    detail="This job seeker has resumes or applications on file. Disable the account instead of deleting it.",
                )
            db.delete(profile)

    elif user.role == UserRole.recruiter:
        profile = db.query(RecruiterProfile).filter_by(user_id=user.id).first()
        if profile:
            has_jobs = (
                db.query(Job)
                .join(Company, Job.company_id == Company.id)
                .filter(Company.owner_recruiter_profile_id == profile.id)
                .first()
            )
            if has_jobs:
                raise HTTPException(
                    status_code=400,
                    detail="This recruiter has posted jobs. Disable the account instead of deleting it.",
                )
            owned_companies = db.query(Company).filter_by(owner_recruiter_profile_id=profile.id).all()
            for c in owned_companies:
                db.delete(c)
            db.delete(profile)

    db.query(Notification).filter_by(user_id=user.id).delete()
    db.delete(user)
    db.commit()
    return DeleteUserResponse(id=user_id, deleted=True)

# ---------------------------------------------------------------------
# Platform settings (singleton row)
# ---------------------------------------------------------------------

def get_or_create_settings(db: Session) -> PlatformSettings:
    settings_row = db.query(PlatformSettings).first()
    if settings_row is None:
        settings_row = PlatformSettings()
        db.add(settings_row)
        db.commit()
        db.refresh(settings_row)
    return settings_row


@router.get("/settings", response_model=PlatformSettingsOut)
def get_settings(
    db: Session = Depends(get_db),
    _admin: User = Depends(require_role(UserRole.admin)),
):
    return get_or_create_settings(db)


@router.put("/settings", response_model=PlatformSettingsOut)
def update_settings(
    payload: PlatformSettingsUpdate,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_role(UserRole.admin)),
):
    settings_row = get_or_create_settings(db)
    updates = payload.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(settings_row, field, value)
    db.commit()
    db.refresh(settings_row)
    return settings_row
