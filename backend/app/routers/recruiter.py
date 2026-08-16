"""
recruiter.py
-----------------------------------------------------------------------
NEW router. Does not modify auth.py, models.py, schemas.py,
models_jobseeker.py, schemas_jobseeker.py, or jobseeker.py.

Mounts at /api/recruiter/*. Every route requires a logged-in user with
role == recruiter (enforced via require_role from your existing
dependencies.py).

A Job created here is the SAME `Job` row the job seeker's
/api/jobseeker/jobs/discover endpoint reads from — so a job posted
through this router shows up on the job seeker dashboard automatically,
no extra wiring needed.

Endpoints:
  GET    /api/recruiter/company                       -> active company profile
  PUT    /api/recruiter/company                        -> update active company profile
  GET    /api/recruiter/companies                       -> list all companies this recruiter owns
  POST   /api/recruiter/companies                       -> create a new company
  PUT    /api/recruiter/companies/{company_id}/activate  -> switch active company
  GET    /api/recruiter/jobs                            -> this recruiter's job postings (all owned companies)
  POST   /api/recruiter/jobs                            -> create a job posting (optionally for a specific company)
  GET    /api/recruiter/applicants                       -> pipeline (optional ?status_filter=)
  PUT    /api/recruiter/applicants/{application_id}/status -> move a candidate's stage
  GET    /api/recruiter/dashboard                        -> combined overview
-----------------------------------------------------------------------
"""

import uuid
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import require_role
from app.models import User, UserRole
from app.schemas_jobseeker import NotificationOut
from app.schemas_jobseeker import MessageOut, MessageCreateIn
from app.models_jobseeker import (
    Company,
    CompanyType,
    RecruiterProfile,
    Job,
    Skill,
    Application,
    ApplicationStatus,
    JobSeekerProfile,
    Resume,
    Notification,
    NotificationType,
    Message,
)
from app.models_recruiter import JobSkill
from app.schemas_recruiter import (
    CompanyOut,
    CompanyUpdateIn,
    CompanyCreateIn,
    CompanyListItemOut,
    JobCreateIn,
    RecruiterJobOut,
    ApplicantOut,
    ApplicantStatusUpdateIn,
    RecruiterDashboardOverviewOut,
    RecruiterStatsOut,
)

from app.routers.jobseeker import generate_notifications_for_new_job

router = APIRouter(prefix="/api/recruiter", tags=["Recruiter"])

recruiter_only = require_role(UserRole.recruiter)

# Pipeline stages a recruiter actually manages. "saved" is a job seeker's
# private wishlist item and deliberately never surfaced here.
PIPELINE_STATUSES = [
    ApplicationStatus.applied,
    ApplicationStatus.shortlisted,
    ApplicationStatus.interview,
    ApplicationStatus.rejected,
]


# ---------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------

def get_or_create_recruiter_profile(db: Session, user: User) -> RecruiterProfile:
    profile = db.query(RecruiterProfile).filter_by(user_id=user.id).first()
    if profile is None:
        # Every recruiter needs a Company row too (company_type is a
        # required column) — created with placeholder values the
        # recruiter fills in via the Company Profile tab.
        company = Company(name="", company_type=CompanyType.startup)
        db.add(company)
        db.flush()  # get company.id without a full commit

        profile = RecruiterProfile(user_id=user.id, company_id=company.id)
        db.add(profile)
        db.commit()
        db.refresh(profile)

        # This placeholder company is owned by the recruiter who triggered its creation
        company.owner_recruiter_profile_id = profile.id
        db.commit()
    return profile


def get_owned_company_ids(db: Session, profile: RecruiterProfile) -> list:
    """All company IDs this recruiter owns (can have more than one)."""
    return [
        c.id
        for c in db.query(Company).filter_by(owner_recruiter_profile_id=profile.id).all()
    ]


def get_applicant_count(db: Session, job_id) -> int:
    return (
        db.query(Application)
        .filter(Application.job_id == job_id, Application.status != ApplicationStatus.saved)
        .count()
    )


def compute_competition_level(applicant_count: int) -> str:
    if applicant_count < 10:
        return "Low"
    if applicant_count < 30:
        return "Medium"
    return "High"


def job_to_recruiter_out(db: Session, job: Job) -> RecruiterJobOut:
    applicant_count = get_applicant_count(db, job.id)
    skill_names = [
        js.skill.name
        for js in db.query(JobSkill).filter_by(job_id=job.id).all()
    ]
    return RecruiterJobOut(
        id=job.id,
        title=job.title,
        location=job.location,
        employment_type=job.employment_type,
        experience_level=job.experience_level,
        salary_min=job.salary_min,
        salary_max=job.salary_max,
        posted_at=job.posted_at,
        is_active=job.is_active,
        applicant_count=applicant_count,
        competition_level=compute_competition_level(applicant_count),
        skills=skill_names,
        company_id=job.company_id,
        company_name=job.company.name,
    )


def application_to_applicant_out(db: Session, app_row: Application) -> ApplicantOut:
    seeker_profile = app_row.job_seeker_profile
    candidate_user = seeker_profile.user

    primary_resume = (
        db.query(Resume)
        .filter_by(profile_id=seeker_profile.id, is_primary=True)
        .first()
    )
    if primary_resume is None:
        primary_resume = (
            db.query(Resume)
            .filter_by(profile_id=seeker_profile.id)
            .order_by(Resume.uploaded_at.desc())
            .first()
        )

    return ApplicantOut(
        application_id=app_row.id,
        job_id=app_row.job_id,
        job_title=app_row.job.title,
        candidate_name=candidate_user.full_name,
        candidate_email=candidate_user.email,
        status=app_row.status,
        ats_match_score=app_row.ats_match_score,
        resume_id=primary_resume.id if primary_resume else None,
        resume_file_name=primary_resume.file_name if primary_resume else None,
        applied_at=app_row.applied_at,
    )


def status_change_notification_text(status: ApplicationStatus, job_title: str, company_name: str) -> str:
    if status == ApplicationStatus.shortlisted:
        return f"You've been shortlisted for {job_title} at {company_name}!"
    if status == ApplicationStatus.interview:
        return f"You've been selected for an interview for {job_title} at {company_name}."
    if status == ApplicationStatus.rejected:
        return f"Your application for {job_title} at {company_name} was not selected this time."
    return f"Your application status for {job_title} at {company_name} was updated to {status.value}."


# ---------------------------------------------------------------------
# Company profile (active company)
# ---------------------------------------------------------------------

@router.get("/company", response_model=CompanyOut)
def get_company(
    db: Session = Depends(get_db),
    current_user: User = Depends(recruiter_only),
):
    profile = get_or_create_recruiter_profile(db, current_user)
    return profile.company


@router.put("/company", response_model=CompanyOut)
def update_company(
    payload: CompanyUpdateIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(recruiter_only),
):
    profile = get_or_create_recruiter_profile(db, current_user)
    company = profile.company

    if payload.name is not None:
        company.name = payload.name
    if payload.company_type is not None:
        company.company_type = payload.company_type
    if payload.website is not None:
        company.website = payload.website
    if payload.logo_url is not None:
        company.logo_url = payload.logo_url

    db.commit()
    db.refresh(company)
    return company


# ---------------------------------------------------------------------
# Companies (multi-company support — list / create / switch active)
# ---------------------------------------------------------------------

@router.get("/companies", response_model=List[CompanyListItemOut])
def list_companies(
    db: Session = Depends(get_db),
    current_user: User = Depends(recruiter_only),
):
    profile = get_or_create_recruiter_profile(db, current_user)
    companies = (
        db.query(Company)
        .filter_by(owner_recruiter_profile_id=profile.id)
        .order_by(Company.name)
        .all()
    )
    return [
        CompanyListItemOut(
            id=c.id,
            name=c.name,
            company_type=c.company_type,
            website=c.website,
            is_active=(c.id == profile.company_id),
        )
        for c in companies
    ]


@router.post("/companies", response_model=CompanyListItemOut, status_code=status.HTTP_201_CREATED)
def create_company(
    payload: CompanyCreateIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(recruiter_only),
):
    profile = get_or_create_recruiter_profile(db, current_user)

    company = Company(
        name=payload.name,
        company_type=payload.company_type,
        website=payload.website,
        owner_recruiter_profile_id=profile.id,
    )
    db.add(company)
    db.flush()

    # If the recruiter's current active company is still an empty placeholder,
    # make this new one the active company automatically.
    if not profile.company or not profile.company.name:
        profile.company_id = company.id

    db.commit()
    db.refresh(company)

    return CompanyListItemOut(
        id=company.id,
        name=company.name,
        company_type=company.company_type,
        website=company.website,
        is_active=(company.id == profile.company_id),
    )


@router.put("/companies/{company_id}/activate", status_code=status.HTTP_204_NO_CONTENT)
def activate_company(
    company_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(recruiter_only),
):
    profile = get_or_create_recruiter_profile(db, current_user)
    company = (
        db.query(Company)
        .filter_by(id=company_id, owner_recruiter_profile_id=profile.id)
        .first()
    )
    if company is None:
        raise HTTPException(status_code=404, detail="Company not found")

    profile.company_id = company.id
    db.commit()
    return None


# ---------------------------------------------------------------------
# Jobs
# ---------------------------------------------------------------------

@router.get("/jobs", response_model=List[RecruiterJobOut])
def list_jobs(
    db: Session = Depends(get_db),
    current_user: User = Depends(recruiter_only),
):
    profile = get_or_create_recruiter_profile(db, current_user)
    owned_ids = get_owned_company_ids(db, profile)
    jobs = (
        db.query(Job)
        .filter(Job.company_id.in_(owned_ids))
        .order_by(Job.posted_at.desc())
        .all()
    )
    return [job_to_recruiter_out(db, job) for job in jobs]


@router.post("/jobs", response_model=RecruiterJobOut, status_code=status.HTTP_201_CREATED)
def create_job(
    payload: JobCreateIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(recruiter_only),
):
    profile = get_or_create_recruiter_profile(db, current_user)

    # Resolve which of the recruiter's companies this job belongs to
    if payload.company_id:
        company = (
            db.query(Company)
            .filter_by(id=payload.company_id, owner_recruiter_profile_id=profile.id)
            .first()
        )
        if company is None:
            raise HTTPException(status_code=404, detail="Company not found or not owned by you")
    else:
        company = profile.company

    if not company or not company.name:
        raise HTTPException(
            status_code=400,
            detail="Set up your company profile (name, type) before posting a job.",
        )

    job = Job(
        company_id=company.id,
        title=payload.title,
        description=payload.description,
        location=payload.location,
        employment_type=payload.employment_type,
        experience_level=payload.experience_level,
        salary_min=payload.salary_min,
        salary_max=payload.salary_max,
    )
    db.add(job)
    db.flush()  # get job.id without a full commit

    for name in payload.skills:
        skill = db.query(Skill).filter_by(name=name).first()
        if skill is None:
            skill = Skill(name=name)
            db.add(skill)
            db.flush()
        db.add(JobSkill(job_id=job.id, skill_id=skill.id))

    db.commit()
    db.refresh(job)

    generate_notifications_for_new_job(db, job)

    return job_to_recruiter_out(db, job)


# ---------------------------------------------------------------------
# Applicants / pipeline
# ---------------------------------------------------------------------

@router.get("/applicants", response_model=List[ApplicantOut])
def list_applicants(
    status_filter: Optional[ApplicationStatus] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(recruiter_only),
):
    profile = get_or_create_recruiter_profile(db, current_user)
    owned_ids = get_owned_company_ids(db, profile)

    query = (
        db.query(Application)
        .join(Job, Application.job_id == Job.id)
        .filter(Job.company_id.in_(owned_ids))
        .filter(Application.status.in_(PIPELINE_STATUSES))
    )
    if status_filter is not None:
        if status_filter == ApplicationStatus.saved:
            return []  # saved jobs are private to the job seeker, never shown to recruiters
        query = query.filter(Application.status == status_filter)

    rows = query.order_by(Application.updated_at.desc()).all()
    return [application_to_applicant_out(db, row) for row in rows]


@router.put("/applicants/{application_id}/status", response_model=ApplicantOut)
def update_applicant_status(
    application_id: uuid.UUID,
    payload: ApplicantStatusUpdateIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(recruiter_only),
):
    profile = get_or_create_recruiter_profile(db, current_user)
    owned_ids = get_owned_company_ids(db, profile)

    app_row = (
        db.query(Application)
        .join(Job, Application.job_id == Job.id)
        .filter(Application.id == application_id, Job.company_id.in_(owned_ids))
        .first()
    )
    if app_row is None:
        raise HTTPException(status_code=404, detail="Applicant not found")

    app_row.status = payload.status

    seeker_user_id = app_row.job_seeker_profile.user_id
    db.add(
        Notification(
            user_id=seeker_user_id,
            type=NotificationType.general,
            text=status_change_notification_text(payload.status, app_row.job.title, app_row.job.company.name),
        )
    )

    db.commit()
    db.refresh(app_row)
    return application_to_applicant_out(db, app_row)


@router.get("/applicants/{application_id}/messages", response_model=List[MessageOut])
def list_applicant_messages(
    application_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(recruiter_only),
):
    profile = get_or_create_recruiter_profile(db, current_user)
    owned_ids = get_owned_company_ids(db, profile)
    application = (
        db.query(Application)
        .join(Job, Application.job_id == Job.id)
        .filter(Application.id == application_id, Job.company_id.in_(owned_ids))
        .first()
    )
    if application is None:
        raise HTTPException(status_code=404, detail="Applicant not found")

    messages = db.query(Message).filter_by(application_id=application_id).order_by(Message.created_at).all()
    db.query(Message).filter(
        Message.application_id == application_id, Message.sender_user_id != current_user.id
    ).update({"is_read": True})
    db.commit()

    return [
        MessageOut(
            id=m.id, application_id=m.application_id, sender_user_id=m.sender_user_id,
            sender_name=m.sender.full_name, is_mine=(m.sender_user_id == current_user.id),
            body=m.body, is_read=m.is_read, created_at=m.created_at,
        )
        for m in messages
    ]


@router.post("/applicants/{application_id}/messages", response_model=MessageOut, status_code=status.HTTP_201_CREATED)
def send_applicant_message(
    application_id: uuid.UUID,
    payload: MessageCreateIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(recruiter_only),
):
    profile = get_or_create_recruiter_profile(db, current_user)
    owned_ids = get_owned_company_ids(db, profile)
    application = (
        db.query(Application)
        .join(Job, Application.job_id == Job.id)
        .filter(Application.id == application_id, Job.company_id.in_(owned_ids))
        .first()
    )
    if application is None:
        raise HTTPException(status_code=404, detail="Applicant not found")

    message = Message(application_id=application_id, sender_user_id=current_user.id, body=payload.body)
    db.add(message)

    seeker_user_id = application.job_seeker_profile.user_id
    db.add(Notification(
        user_id=seeker_user_id,
        type=NotificationType.general,
        text=f"New message from {application.job.company.name} about {application.job.title}.",
    ))

    db.commit()
    db.refresh(message)
    return MessageOut(
        id=message.id, application_id=message.application_id, sender_user_id=message.sender_user_id,
        sender_name=current_user.full_name, is_mine=True, body=message.body,
        is_read=message.is_read, created_at=message.created_at,
    )


@router.delete("/applicants/{application_id}/messages", status_code=status.HTTP_204_NO_CONTENT)
def clear_applicant_messages(
    application_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(recruiter_only),
):
    profile = get_or_create_recruiter_profile(db, current_user)
    owned_ids = get_owned_company_ids(db, profile)
    application = (
        db.query(Application)
        .join(Job, Application.job_id == Job.id)
        .filter(Application.id == application_id, Job.company_id.in_(owned_ids))
        .first()
    )
    if application is None:
        raise HTTPException(status_code=404, detail="Applicant not found")

    db.query(Message).filter_by(application_id=application_id).delete()
    db.commit()
    return None


@router.delete("/applicants/{application_id}/messages/{message_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_applicant_message(
    application_id: uuid.UUID,
    message_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(recruiter_only),
):
    profile = get_or_create_recruiter_profile(db, current_user)
    owned_ids = get_owned_company_ids(db, profile)
    application = (
        db.query(Application)
        .join(Job, Application.job_id == Job.id)
        .filter(Application.id == application_id, Job.company_id.in_(owned_ids))
        .first()
    )
    if application is None:
        raise HTTPException(status_code=404, detail="Applicant not found")

    message = db.query(Message).filter_by(id=message_id, application_id=application_id).first()
    if message is None:
        raise HTTPException(status_code=404, detail="Message not found")
    if message.sender_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only delete your own messages")

    db.delete(message)
    db.commit()
    return None


# ---------------------------------------------------------------------
# Combined overview
# ---------------------------------------------------------------------

@router.get("/dashboard", response_model=RecruiterDashboardOverviewOut)
def dashboard_overview(
    db: Session = Depends(get_db),
    current_user: User = Depends(recruiter_only),
):
    profile = get_or_create_recruiter_profile(db, current_user)
    owned_ids = get_owned_company_ids(db, profile)

    jobs = (
        db.query(Job)
        .filter(Job.company_id.in_(owned_ids))
        .order_by(Job.posted_at.desc())
        .all()
    )
    job_outs = [job_to_recruiter_out(db, job) for job in jobs]

    active_jobs = sum(1 for j in jobs if j.is_active)

    all_applications = (
        db.query(Application)
        .join(Job, Application.job_id == Job.id)
        .filter(Job.company_id.in_(owned_ids))
        .filter(Application.status.in_(PIPELINE_STATUSES))
        .all()
    )
    total_applicants = len(all_applications)
    shortlisted = sum(1 for a in all_applications if a.status == ApplicationStatus.shortlisted)
    interviews = sum(1 for a in all_applications if a.status == ApplicationStatus.interview)

    pipeline = {s.value: [] for s in PIPELINE_STATUSES}
    for app_row in all_applications:
        pipeline[app_row.status.value].append(application_to_applicant_out(db, app_row))

    return RecruiterDashboardOverviewOut(
        company=profile.company,
        stats=RecruiterStatsOut(
            active_jobs=active_jobs,
            total_applicants=total_applicants,
            shortlisted=shortlisted,
            interviews=interviews,
        ),
        jobs=job_outs,
        pipeline=pipeline,
    )


# ---------------------------------------------------------------------
# Notifications
# ---------------------------------------------------------------------

@router.get("/notifications", response_model=List[NotificationOut])
def list_recruiter_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(recruiter_only),
):
    return (
        db.query(Notification)
        .filter_by(user_id=current_user.id)
        .order_by(Notification.created_at.desc())
        .all()
    )


@router.put("/notifications/read-all", status_code=status.HTTP_204_NO_CONTENT)
def mark_all_recruiter_notifications_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(recruiter_only),
):
    db.query(Notification).filter_by(user_id=current_user.id, is_read=False).update({"is_read": True})
    db.commit()
    return None


@router.put("/notifications/{notification_id}/read", response_model=NotificationOut)
def mark_recruiter_notification_read(
    notification_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(recruiter_only),
):
    notification = db.query(Notification).filter_by(id=notification_id, user_id=current_user.id).first()
    if notification is None:
        raise HTTPException(status_code=404, detail="Notification not found")
    notification.is_read = True
    db.commit()
    db.refresh(notification)
    return notification


@router.delete("/notifications/{notification_id}", status_code=status.HTTP_204_NO_CONTENT)
def dismiss_recruiter_notification(
    notification_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(recruiter_only),
):
    notification = db.query(Notification).filter_by(id=notification_id, user_id=current_user.id).first()
    if notification is None:
        raise HTTPException(status_code=404, detail="Notification not found")
    db.delete(notification)
    db.commit()
    return None