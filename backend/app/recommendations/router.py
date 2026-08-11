import json
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth.utils import get_current_active_user
from app.models.user import User
from app.models.job import Job
from app.models.company import Company
from app.recommendations.engine import RecommendationEngine

router = APIRouter(prefix="/recommendations", tags=["recommendations"])
engine = RecommendationEngine()

def format_job_response(job: Job, company: Company, match_score: float) -> Dict[str, Any]:
    try:
        skills = json.loads(job.skills_required) if job.skills_required else []
    except Exception:
        skills = []
    try:
        requirements = json.loads(job.requirements) if job.requirements else []
    except Exception:
        requirements = []
    try:
        benefits = json.loads(job.benefits) if job.benefits else []
    except Exception:
        benefits = []

    return {
        "id": job.id,
        "title": job.title,
        "description": job.description,
        "requirements": requirements,
        "skills_required": skills,
        "job_type": job.job_type,
        "experience_level": job.experience_level,
        "min_salary": job.min_salary,
        "max_salary": job.max_salary,
        "location": job.location,
        "is_remote": job.is_remote,
        "is_active": job.is_active,
        "applicant_count": job.applicant_count,
        "competition_level": job.competition_level,
        "created_at": job.created_at,
        "match_score": match_score,
        "benefits": benefits,
        "company": {
            "id": company.id if company else None,
            "name": company.name if company else "Unknown Company",
            "logo_url": company.logo_url if company else None,
            "company_type": company.company_type if company else "startup",
            "industry": company.industry if company else "Technology",
            "location": company.location if company else "Remote",
            "rating": company.rating if company else 0.0,
            "size": company.size if company else "1-10"
        } if company else None
    }

@router.get("/", response_model=List[Dict[str, Any]])
def get_recommendations(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    recommendations = engine.get_recommendations(current_user, db)
    results = []
    for r in recommendations:
        results.append(format_job_response(r["job"], r["company"], r["match_score"]))
    return results

@router.get("/trending", response_model=List[Dict[str, Any]])
def get_trending(
    db: Session = Depends(get_db)
):
    trending = engine.get_trending_jobs(db)
    results = []
    for t in trending:
        results.append(format_job_response(t["job"], t["company"], t["match_score"]))
    return results

@router.get("/similar/{job_id}", response_model=List[Dict[str, Any]])
def get_similar_jobs(
    job_id: int,
    db: Session = Depends(get_db)
):
    target_job = db.query(Job).filter(Job.id == job_id).first()
    if not target_job:
        raise HTTPException(status_code=404, detail="Job not found")

    # Find jobs with similar titles or skills in the same industry
    target_skills = []
    if target_job.skills_required:
        try:
            target_skills = json.loads(target_job.skills_required)
        except Exception:
            pass

    all_jobs = db.query(Job).filter(
        Job.is_active == True,
        Job.id != job_id
    ).all()

    similar = []
    for job in all_jobs:
        # Simple overlap calculator
        job_skills = []
        if job.skills_required:
            try:
                job_skills = json.loads(job.skills_required)
            except Exception:
                pass
        
        overlap = len(set(s.lower() for s in target_skills).intersection(set(s.lower() for s in job_skills)))
        score = 50.0 + (overlap * 10.0) # Base score + skill overlap boost
        
        # Boost if same title keywords
        words1 = set(target_job.title.lower().split())
        words2 = set(job.title.lower().split())
        title_overlap = len(words1.intersection(words2))
        score += title_overlap * 15.0
        
        score = min(score, 100.0)
        
        if score >= 60.0:  # Only include jobs that are reasonably similar
            company = db.query(Company).filter(Company.id == job.company_id).first()
            similar.append({
                "job": job,
                "company": company,
                "score": score
            })

    # Sort descending
    similar.sort(key=lambda x: x["score"], reverse=True)
    
    results = []
    for s in similar[:10]: # limit to 10
        results.append(format_job_response(s["job"], s["company"], s["score"]))
    return results
