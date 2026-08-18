from sqlalchemy.orm import Session
from sqlalchemy import select
from datetime import datetime
from . import models, schemas, auth
from .services.ats_engine import analyze_ats_match

def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

def get_user_by_id(db: Session, user_id):
    return db.query(models.User).filter(models.User.id == user_id).first()

def create_user(db: Session, user_in: schemas.UserRegister):
    hashed_pwd = auth.hash_password(user_in.password)
    
    # Create the user row
    db_user = models.User(
        email=user_in.email,
        password_hash=hashed_pwd,
        role=user_in.role
    )
    db.add(db_user)
    db.flush()  # Populates user ID without committing transaction
    
    # Create role-specific profile row
    if user_in.role == models.UserRole.job_seeker:
        db_profile = models.JobSeekerProfile(
            user_id=db_user.id,
            full_name=user_in.full_name,
            phone=user_in.phone,
            location=user_in.location
        )
        db.add(db_profile)
    elif user_in.role == models.UserRole.recruiter:
        db_profile = models.RecruiterProfile(
            user_id=db_user.id,
            full_name=user_in.full_name,
            company_name=user_in.company_name or "N/A",
            company_website=user_in.company_website
        )
        db.add(db_profile)
        
    db.commit()
    db.refresh(db_user)
    return db_user

def create_refresh_token(db: Session, user_id, token_str: str, expires_at: datetime):
    db_token = models.RefreshToken(
        user_id=user_id,
        token=token_str,
        expires_at=expires_at
    )
    db.add(db_token)
    db.commit()
    db.refresh(db_token)
    return db_token

def get_refresh_token(db: Session, token_str: str):
    return db.query(models.RefreshToken).filter(
        models.RefreshToken.token == token_str,
        models.RefreshToken.revoked == False
    ).first()

def revoke_refresh_token(db: Session, token_str: str):
    db_token = db.query(models.RefreshToken).filter(models.RefreshToken.token == token_str).first()
    if db_token:
        db_token.revoked = True
        db.commit()
    return db_token

# Company CRUD
def get_companies(db: Session, skip: int = 0, limit: int = 50, company_type: str = None):
    query = db.query(models.Company)
    if company_type:
        query = query.filter(models.Company.type == company_type)
    companies = query.offset(skip).limit(limit).all()
    # Attach open jobs count
    for comp in companies:
        comp.open_jobs_count = db.query(models.Job).filter(models.Job.company_id == comp.id, models.Job.is_active == True).count()
    return companies

def get_company_by_id(db: Session, company_id):
    comp = db.query(models.Company).filter(models.Company.id == company_id).first()
    if comp:
        comp.open_jobs_count = db.query(models.Job).filter(models.Job.company_id == comp.id, models.Job.is_active == True).count()
    return comp

def create_company(db: Session, company_in: schemas.CompanyCreate):
    db_company = models.Company(**company_in.model_dump())
    db.add(db_company)
    db.commit()
    db.refresh(db_company)
    db_company.open_jobs_count = 0
    return db_company

# Job CRUD
def build_job_filter_query(db: Session, company_type=None, remote: bool = None, job_type=None, 
                           salary_min: int = None, salary_max: int = None, 
                           skills: str = None, location: str = None, 
                           experience_level=None):
    query = db.query(models.Job).filter(models.Job.is_active == True)

    if company_type:
        query = query.join(models.Company).filter(models.Company.type == company_type)

    if remote is True:
        query = query.filter(
            (models.Job.job_type == models.JobType.remote) | 
            (models.Job.location.ilike("%remote%"))
        )
    elif job_type:
        query = query.filter(models.Job.job_type == job_type)

    if salary_min is not None:
        query = query.filter((models.Job.salary_max >= salary_min) | (models.Job.salary_min >= salary_min))

    if salary_max is not None:
        query = query.filter((models.Job.salary_min <= salary_max) | (models.Job.salary_max <= salary_max))

    if location:
        query = query.filter(models.Job.location.ilike(f"%{location}%"))

    if experience_level:
        query = query.filter(models.Job.experience_level == experience_level)

    # Simple skills filtering (case-insensitive search in skills_required array/json)
    if skills:
        skill_list = [s.strip().lower() for s in skills.split(",") if s.strip()]
        for s in skill_list:
            query = query.filter(models.Job.skills_required.cast(models.Text).ilike(f"%{s}%"))

    return query

def enrich_job_metrics(db: Session, job: models.Job):
    if not job:
        return job
    # Calculate applicant count
    applicant_count = db.query(models.Swipe).filter(
        models.Swipe.job_id == job.id,
        models.Swipe.direction == models.SwipeDirection.right
    ).count()
    job.applicant_count = applicant_count

    # Competition Level
    if applicant_count < 10:
        job.competition_level = "Low"
    elif applicant_count <= 50:
        job.competition_level = "Medium"
    else:
        job.competition_level = "High"

    # Early Applicant Badge & relative time
    if job.posted_at:
        now = datetime.now(job.posted_at.tzinfo) if job.posted_at.tzinfo else datetime.now()
        seconds_diff = (now - job.posted_at).total_seconds()
        job.is_early_applicant = applicant_count < 15 and seconds_diff < 172800 # 48 hours
        
        if seconds_diff < 3600:
            job.posted_time_ago = f"{max(1, int(seconds_diff // 60))}m ago"
        elif seconds_diff < 86400:
            job.posted_time_ago = f"{int(seconds_diff // 3600)}h ago"
        else:
            job.posted_time_ago = f"{int(seconds_diff // 86400)}d ago"
    else:
        job.is_early_applicant = False
        job.posted_time_ago = "Recently"

    # Fresher friendly badge
    exp_val = str(job.experience_level.value if hasattr(job.experience_level, 'value') else job.experience_level).lower()
    job.is_fresher_friendly = exp_val in ["fresher", "1-3yrs", "0-1", "entry"]
    return job

def get_jobs(db: Session, skip: int = 0, limit: int = 20, company_type=None, remote: bool = None,
             job_type=None, salary_min: int = None, salary_max: int = None,
             skills: str = None, location: str = None, experience_level=None):
    query = build_job_filter_query(db, company_type, remote, job_type, salary_min, salary_max, skills, location, experience_level)
    jobs = query.order_by(models.Job.posted_at.desc()).offset(skip).limit(limit).all()
    for job in jobs:
        enrich_job_metrics(db, job)
    return jobs

def get_job_by_id(db: Session, job_id):
    job = db.query(models.Job).filter(models.Job.id == job_id).first()
    if job:
        enrich_job_metrics(db, job)
    return job

def create_job(db: Session, job_in: schemas.JobCreate, recruiter_id):
    db_job = models.Job(**job_in.model_dump(), recruiter_id=recruiter_id)
    db.add(db_job)
    db.commit()
    db.refresh(db_job)
    return db_job

def update_job(db: Session, db_job: models.Job, job_in: schemas.JobUpdate):
    update_data = job_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_job, key, value)
    db.commit()
    db.refresh(db_job)
    return db_job

# Swipe CRUD
def record_swipe(db: Session, user_id, job_id, direction: models.SwipeDirection):
    # Upsert logic: if swipe exists, update direction; otherwise insert
    existing = db.query(models.Swipe).filter(
        models.Swipe.user_id == user_id,
        models.Swipe.job_id == job_id
    ).first()
    
    if existing:
        existing.direction = direction
        existing.created_at = datetime.now()
        db.commit()
        db.refresh(existing)
        return existing
    else:
        db_swipe = models.Swipe(user_id=user_id, job_id=job_id, direction=direction)
        db.add(db_swipe)
        db.commit()
        db.refresh(db_swipe)
        return db_swipe

def get_user_swipes(db: Session, user_id, direction: models.SwipeDirection = None):
    query = db.query(models.Swipe).filter(models.Swipe.user_id == user_id)
    if direction:
        query = query.filter(models.Swipe.direction == direction)
    return query.order_by(models.Swipe.created_at.desc()).all()

def delete_user_swipes(db: Session, user_id):
    db.query(models.Swipe).filter(models.Swipe.user_id == user_id).delete()
    db.commit()
    return True

# Resume CRUD
def upsert_resume(db: Session, user_id, filename: str, file_path: str, raw_text: str, parsed_skills: list):
    db_resume = db.query(models.Resume).filter(models.Resume.user_id == user_id).first()
    if db_resume:
        db_resume.filename = filename
        db_resume.file_path = file_path
        db_resume.raw_text = raw_text
        db_resume.parsed_skills = parsed_skills
    else:
        db_resume = models.Resume(
            user_id=user_id,
            filename=filename,
            file_path=file_path,
            raw_text=raw_text,
            parsed_skills=parsed_skills
        )
        db.add(db_resume)
    db.commit()
    db.refresh(db_resume)
    return db_resume

def get_user_resume(db: Session, user_id):
    return db.query(models.Resume).filter(models.Resume.user_id == user_id).first()

# Recommendations CRUD
def get_recommendations(db: Session, user_id, skip: int = 0, limit: int = 20,
                        company_type=None, remote: bool = None, job_type=None,
                        salary_min: int = None, salary_max: int = None,
                        skills: str = None, location: str = None, experience_level=None):
    # Subquery for swiped job IDs by this user
    swiped_job_ids = select(models.Swipe.job_id).where(models.Swipe.user_id == user_id)

    query = build_job_filter_query(db, company_type, remote, job_type, salary_min, salary_max, skills, location, experience_level)
    query = query.filter(models.Job.id.notin_(swiped_job_ids))
    jobs = query.order_by(models.Job.posted_at.desc()).offset(skip).limit(limit).all()

    # Get user resume for AI compatibility scoring
    user_resume = get_user_resume(db, user_id)
    
    # Attach dynamic AI Match Score and metrics to each job
    for job in jobs:
        enrich_job_metrics(db, job)
        if user_resume and user_resume.raw_text:
            res = analyze_ats_match(
                resume_text=user_resume.raw_text,
                resume_skills=user_resume.parsed_skills or [],
                job_title=job.title,
                job_description=job.description or "",
                job_skills=job.skills_required or []
            )
            job.ai_match_score = res["ats_score"]
        else:
            job.ai_match_score = 85 # Default baseline match before resume upload

    # Sort recommendation feed by AI match score descending
    jobs.sort(key=lambda j: getattr(j, 'ai_match_score', 85), reverse=True)
    return jobs

# Notification CRUD
def get_user_notifications(db: Session, user_id, limit: int = 30):
    return db.query(models.Notification).filter(
        models.Notification.user_id == user_id
    ).order_by(models.Notification.created_at.desc()).limit(limit).all()

def create_notification(db: Session, user_id, type_str: str, title: str, message: str, link: str = None):
    notif = models.Notification(
        user_id=user_id,
        type=type_str,
        title=title,
        message=message,
        link=link
    )
    db.add(notif)
    db.commit()
    db.refresh(notif)
    return notif

def mark_notification_read(db: Session, notification_id, user_id):
    notif = db.query(models.Notification).filter(
        models.Notification.id == notification_id,
        models.Notification.user_id == user_id
    ).first()
    if notif:
        notif.is_read = True
        db.commit()
        db.refresh(notif)
    return notif

def mark_all_notifications_read(db: Session, user_id):
    db.query(models.Notification).filter(
        models.Notification.user_id == user_id,
        models.Notification.is_read == False
    ).update({"is_read": True}, synchronize_session=False)
    db.commit()
    return True

# Swipe Status CRUD
def update_swipe_status(db: Session, swipe_id, status_str: str):
    swipe = db.query(models.Swipe).filter(models.Swipe.id == swipe_id).first()
    if swipe:
        swipe.status = status_str
        db.commit()
        db.refresh(swipe)
    return swipe

# Analytics CRUD
def get_seeker_analytics(db: Session, user_id):
    swipes = db.query(models.Swipe).filter(models.Swipe.user_id == user_id).all()
    right_swipes = [s for s in swipes if s.direction == models.SwipeDirection.right]
    shortlisted = [s for s in right_swipes if getattr(s, 'status', 'applied') == 'shortlisted']
    interviews = [s for s in right_swipes if getattr(s, 'status', 'applied') in ['interview', 'interview_scheduled']]
    
    resume = get_user_resume(db, user_id)
    skills = resume.parsed_skills if resume and resume.parsed_skills else ["Python", "React", "FastAPI", "SQL"]
    
    recent_activity = []
    for s in right_swipes[-5:]:
        job = get_job_by_id(db, s.job_id)
        if job:
            recent_activity.append({
                "job_title": job.title,
                "company_name": job.company.name if job.company else "N/A",
                "status": getattr(s, 'status', 'applied'),
                "date": s.created_at.strftime("%Y-%m-%d") if s.created_at else "Today"
            })
            
    return {
        "total_applications": len(right_swipes),
        "saved_jobs_count": len(right_swipes),
        "shortlisted_count": len(shortlisted),
        "interview_count": len(interviews),
        "average_ats_score": 82 if resume else 65,
        "top_matching_skills": skills[:8],
        "recent_activity": recent_activity
    }

def get_recruiter_analytics(db: Session, recruiter_id):
    jobs = db.query(models.Job).filter(models.Job.recruiter_id == recruiter_id, models.Job.is_active == True).all()
    job_ids = [j.id for j in jobs]
    
    if not job_ids:
        return {
            "total_active_jobs": 0,
            "total_applicants": 0,
            "total_swipes_received": 0,
            "shortlisted_candidates": 0,
            "conversion_rate": 0.0,
            "top_performing_job": None,
            "recent_applications": []
        }
        
    all_swipes = db.query(models.Swipe).filter(models.Swipe.job_id.in_(job_ids)).all()
    right_swipes = [s for s in all_swipes if s.direction == models.SwipeDirection.right]
    shortlisted = [s for s in right_swipes if getattr(s, 'status', 'applied') in ['shortlisted', 'interview', 'hired']]
    
    top_job = jobs[0].title if jobs else None
    
    recent_apps = []
    for s in right_swipes[-10:]:
        job = next((j for j in jobs if j.id == s.job_id), None)
        seeker = get_user_by_id(db, s.user_id)
        seeker_name = seeker.job_seeker_profile.full_name if seeker and seeker.job_seeker_profile else "Applicant"
        if job:
            recent_apps.append({
                "applicant_name": seeker_name,
                "job_title": job.title,
                "status": getattr(s, 'status', 'applied'),
                "applied_at": s.created_at.strftime("%Y-%m-%d") if s.created_at else "Today"
            })
            
    conv_rate = round((len(shortlisted) / len(right_swipes) * 100), 1) if right_swipes else 0.0
    
    return {
        "total_active_jobs": len(jobs),
        "total_applicants": len(right_swipes),
        "total_swipes_received": len(all_swipes),
        "shortlisted_candidates": len(shortlisted),
        "conversion_rate": conv_rate,
        "top_performing_job": top_job,
        "recent_applications": recent_apps
    }

def get_admin_analytics(db: Session):
    total_users = db.query(models.User).count()
    seekers = db.query(models.User).filter(models.User.role == models.UserRole.job_seeker).count()
    recruiters = db.query(models.User).filter(models.User.role == models.UserRole.recruiter).count()
    total_jobs = db.query(models.Job).count()
    total_swipes = db.query(models.Swipe).count()
    
    return {
        "total_users": total_users,
        "total_seekers": seekers,
        "total_recruiters": recruiters,
        "total_jobs": total_jobs,
        "total_swipes": total_swipes,
        "system_health": "100% Operational"
    }

# Messaging CRUD
def get_or_create_conversation(db: Session, job_seeker_id, recruiter_id, job_id):
    conv = db.query(models.Conversation).filter(
        models.Conversation.job_seeker_id == job_seeker_id,
        models.Conversation.recruiter_id == recruiter_id,
        models.Conversation.job_id == job_id
    ).first()

    if not conv:
        conv = models.Conversation(
            job_seeker_id=job_seeker_id,
            recruiter_id=recruiter_id,
            job_id=job_id
        )
        db.add(conv)
        db.commit()
        db.refresh(conv)
    return conv

def get_user_conversations(db: Session, user_id):
    return db.query(models.Conversation).filter(
        (models.Conversation.job_seeker_id == user_id) | (models.Conversation.recruiter_id == user_id)
    ).order_by(models.Conversation.updated_at.desc()).all()

def get_conversation_by_id(db: Session, conversation_id):
    return db.query(models.Conversation).filter(models.Conversation.id == conversation_id).first()

def get_conversation_messages(db: Session, conversation_id):
    return db.query(models.Message).filter(
        models.Message.conversation_id == conversation_id
    ).order_by(models.Message.created_at.asc()).all()

def create_message(db: Session, conversation_id, sender_id, content: str):
    import datetime
    msg = models.Message(
        conversation_id=conversation_id,
        sender_id=sender_id,
        content=content
    )
    db.add(msg)
    
    # Touch conversation updated_at timestamp
    conv = get_conversation_by_id(db, conversation_id)
    if conv:
        conv.updated_at = datetime.datetime.now(datetime.timezone.utc)

    db.commit()
    db.refresh(msg)
    return msg


def mark_conversation_read(db: Session, conversation_id, user_id):
    db.query(models.Message).filter(
        models.Message.conversation_id == conversation_id,
        models.Message.sender_id != user_id,
        models.Message.is_read == False
    ).update({"is_read": True}, synchronize_session=False)
    db.commit()
    return True




