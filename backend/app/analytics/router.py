import json
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Any
from fastapi import APIRouter, Depends
from sqlalchemy import func, case, and_
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth.utils import get_current_active_user
from app.models.user import User
from app.models.application import Application
from app.models.job import Job
from app.models.company import Company
from app.models.swipe import Swipe

router = APIRouter(prefix="/analytics", tags=["analytics"])

@router.get("/overview")
def get_overview(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    one_week_ago = datetime.now(timezone.utc) - timedelta(days=7)

    # Single aggregate query instead of 4 separate count()/scalar() round-trips.
    app_row = (
        db.query(
            func.sum(case((Application.status != "saved", 1), else_=0)).label("total_apps"),
            func.sum(case((Application.status == "saved", 1), else_=0)).label("saved_jobs"),
            func.avg(Application.match_score).label("avg_score"),
            func.sum(
                case(
                    (and_(Application.status != "saved", Application.applied_at >= one_week_ago), 1),
                    else_=0,
                )
            ).label("apps_this_week"),
        )
        .filter(Application.user_id == current_user.id)
        .first()
    )

    # Single aggregate query instead of 2 separate count() round-trips.
    swipe_row = (
        db.query(
            func.sum(case((Swipe.direction == "right", 1), else_=0)).label("right_swipes"),
            func.sum(case((Swipe.direction == "left", 1), else_=0)).label("left_swipes"),
        )
        .filter(Swipe.user_id == current_user.id)
        .first()
    )

    total_apps = int(app_row.total_apps or 0)
    saved_jobs = int(app_row.saved_jobs or 0)
    apps_this_week = int(app_row.apps_this_week or 0)
    avg_score = round(float(app_row.avg_score), 1) if app_row.avg_score is not None else 72.5

    right_swipes = int(swipe_row.right_swipes or 0)
    left_swipes = int(swipe_row.left_swipes or 0)

    return {
        "total_applications": total_apps,
        "saved_jobs": saved_jobs,
        "profile_views": 14 + (right_swipes // 3), # simulated profile views based on swipes
        "match_score_avg": avg_score,
        "applications_this_week": apps_this_week,
        "swipe_stats": {
            "right": right_swipes,
            "left": left_swipes
        }
    }

@router.get("/application-stats")
def get_application_stats(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    statuses = ["applied", "saved", "shortlisted", "interview", "rejected", "offered"]

    # Single GROUP BY query instead of one count() query per status.
    rows = (
        db.query(Application.status, func.count(Application.id))
        .filter(Application.user_id == current_user.id)
        .group_by(Application.status)
        .all()
    )
    counts = {status: count for status, count in rows}
    return {status: counts.get(status, 0) for status in statuses}

@router.get("/skill-gaps")
def get_skill_gaps(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    # Parse user skills
    user_skills = []
    if current_user.skills:
        try:
            user_skills = json.loads(current_user.skills)
        except Exception:
            user_skills = [s.strip().lower() for s in current_user.skills.split(",")]
    user_skills_lower = [s.lower() for s in user_skills]

    # Get skills from jobs user applied to or saved, or from active jobs
    jobs = db.query(Job).filter(Job.is_active == True).limit(50).all()
    
    missing_skills_freq = {}
    for job in jobs:
        if job.skills_required:
            try:
                job_skills = json.loads(job.skills_required)
            except Exception:
                job_skills = []
            
            for skill in job_skills:
                if skill.lower() not in user_skills_lower:
                    missing_skills_freq[skill] = missing_skills_freq.get(skill, 0) + 1

    # Sort and get top 8 missing skills
    sorted_gaps = sorted(missing_skills_freq.items(), key=lambda x: x[1], reverse=True)
    
    # Format for chart display: [{ "name": "React", "frequency": 12 }]
    chart_data = [{"name": name, "frequency": count} for name, count in sorted_gaps[:8]]
    
    # If empty, add default recommendations
    if not chart_data:
        chart_data = [
            {"name": "Docker", "frequency": 5},
            {"name": "AWS", "frequency": 4},
            {"name": "TypeScript", "frequency": 3},
            {"name": "Kubernetes", "frequency": 2}
        ]
        
    return chart_data

@router.get("/activity")
def get_activity(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    # Activity over the last 7 days.
    # Previously this ran 2 queries per day (14 total) in a loop; now it
    # runs 2 grouped queries total and buckets the results in Python.
    today = datetime.now(timezone.utc).date()
    start_day = today - timedelta(days=6)
    start_dt = datetime.combine(start_day, datetime.min.time(), tzinfo=timezone.utc)

    app_rows = (
        db.query(func.date(Application.applied_at), func.count(Application.id))
        .filter(
            Application.user_id == current_user.id,
            Application.status != "saved",
            Application.applied_at >= start_dt,
        )
        .group_by(func.date(Application.applied_at))
        .all()
    )
    app_counts = {str(day): count for day, count in app_rows}

    swipe_rows = (
        db.query(func.date(Swipe.created_at), func.count(Swipe.id))
        .filter(
            Swipe.user_id == current_user.id,
            Swipe.created_at >= start_dt,
        )
        .group_by(func.date(Swipe.created_at))
        .all()
    )
    swipe_counts = {str(day): count for day, count in swipe_rows}

    activity_data = []
    for i in range(6, -1, -1):
        day = today - timedelta(days=i)
        key = day.isoformat()
        activity_data.append({
            "date": day.strftime("%a"), # e.g. "Mon"
            "applications": app_counts.get(key, 0),
            "swipes": swipe_counts.get(key, 0)
        })

    return activity_data

@router.get("/top-companies")
def get_top_companies(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    # Fetch user applications
    user_apps = db.query(Application).filter(Application.user_id == current_user.id).all()
    if not user_apps:
        return []
        
    job_ids = [app.job_id for app in user_apps]
    jobs = db.query(Job).filter(Job.id.in_(job_ids)).all()
    
    company_counts = {}
    for job in jobs:
        company_counts[job.company_id] = company_counts.get(job.company_id, 0) + 1
        
    companies = db.query(Company).filter(Company.id.in_(list(company_counts.keys()))).all()
    
    results = []
    for c in companies:
        results.append({
            "name": c.name,
            "logo_url": c.logo_url,
            "company_type": c.company_type,
            "count": company_counts[c.id]
        })
        
    results.sort(key=lambda x: x["count"], reverse=True)
    return results[:5]
