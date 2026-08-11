import json
import logging
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from datetime import datetime, timezone, timedelta

from app.models.user import User
from app.models.job import Job
from app.models.swipe import Swipe
from app.models.company import Company

logger = logging.getLogger(__name__)

# Fallback vectorizer in case sklearn fails
try:
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.metrics.pairwise import cosine_similarity
    import numpy as np
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False


class RecommendationEngine:
    def compute_job_match_score(self, user: User, job: Job, db: Session = None) -> float:
        # Load user skills
        user_skills = []
        if user.skills:
            try:
                user_skills = json.loads(user.skills)
            except Exception:
                user_skills = [s.strip().lower() for s in user.skills.split(",")]
        user_skills_lower = [s.lower() for s in user_skills]

        # Load job skills
        job_skills = []
        if job.skills_required:
            try:
                job_skills = json.loads(job.skills_required)
            except Exception:
                job_skills = [s.strip().lower() for s in job.skills_required.split(",")]
        job_skills_lower = [s.lower() for s in job_skills]

        # 1. Skill overlap score (40%)
        skill_score = 0.0
        if job_skills_lower:
            matched_skills = [s for s in job_skills_lower if s in user_skills_lower]
            skill_score = (len(matched_skills) / len(job_skills_lower)) * 100
        else:
            skill_score = 100.0  # no skills required implies perfect match

        # 2. Experience level match (30%)
        # Map experience levels to years: fresher (0-1), junior (1-3), mid (3-5), senior (5-8), lead (8+)
        exp_score = 100.0
        exp_years = user.experience_years or 0
        
        req_min = 0
        req_max = 99
        if job.experience_level == "fresher":
            req_min = 0
            req_max = 1
        elif job.experience_level == "junior":
            req_min = 1
            req_max = 3
        elif job.experience_level == "mid":
            req_min = 3
            req_max = 5
        elif job.experience_level == "senior":
            req_min = 5
            req_max = 8
        elif job.experience_level == "lead":
            req_min = 8
            req_max = 99

        if exp_years < req_min:
            # Underqualified
            exp_score = (exp_years / req_min) * 100 if req_min > 0 else 100.0
            # penalty
            exp_score *= 0.8
        elif exp_years > req_max:
            # Overqualified
            exp_score = 90.0  # slight deduction, but still capable
        else:
            exp_score = 100.0

        # 3. Job location / remote preference (20%)
        location_score = 50.0
        # If remote is preferred and job is remote
        if job.is_remote:
            location_score = 100.0
        elif user.location and job.location:
            if user.location.lower() in job.location.lower() or job.location.lower() in user.location.lower():
                location_score = 100.0

        # 4. Swipe behavior modification (10%)
        # Learn from what the user liked: if they swiped right on jobs with similar skills, boost the score
        swipe_boost = 0.0
        if db and user.id:
            try:
                # Get last 20 right swipes
                right_swipes = db.query(Swipe).filter(
                    Swipe.user_id == user.id,
                    Swipe.direction == "right"
                ).order_by(Swipe.created_at.desc()).limit(20).all()

                if right_swipes:
                    right_job_ids = [s.job_id for s in right_swipes]
                    liked_jobs = db.query(Job).filter(Job.id.in_(right_job_ids)).all()
                    
                    # Collate all skills from liked jobs
                    liked_skills = []
                    for lj in liked_jobs:
                        if lj.skills_required:
                            try:
                                skills = json.loads(lj.skills_required)
                                liked_skills.extend([s.lower() for s in skills])
                            except Exception:
                                pass
                    
                    if liked_skills:
                        # Find overlapping skills between this job and what the user has previously liked
                        liked_overlap = [s for s in job_skills_lower if s in liked_skills]
                        if liked_overlap:
                            # Boost based on overlap
                            swipe_boost = (len(liked_overlap) / len(job_skills_lower)) * 10.0
            except Exception as e:
                logger.warning(f"Failed to calculate swipe behavior boost: {e}")

        # Compute total weighted score
        weighted_score = (0.4 * skill_score) + (0.3 * exp_score) + (0.2 * location_score) + (0.1 * 100.0) + swipe_boost
        weighted_score = min(max(weighted_score, 0.0), 100.0)
        return round(weighted_score, 1)

    def get_recommendations(self, user: User, db: Session, limit: int = 20) -> List[Dict[str, Any]]:
        # Exclude jobs already swiped
        swiped_job_ids = db.query(Swipe.job_id).filter(Swipe.user_id == user.id).all()
        swiped_job_ids = [r[0] for r in swiped_job_ids]

        # Query active jobs
        active_jobs = db.query(Job).filter(
            Job.is_active == True,
            ~Job.id.in_(swiped_job_ids) if swiped_job_ids else True
        ).all()

        recommendations = []
        for job in active_jobs:
            score = self.compute_job_match_score(user, job, db)
            
            # Fetch company details
            company = db.query(Company).filter(Company.id == job.company_id).first()
            
            recommendations.append({
                "job": job,
                "company": company,
                "match_score": score
            })

        # Sort by match score descending
        recommendations.sort(key=lambda x: x["match_score"], reverse=True)
        return recommendations[:limit]

    def get_trending_jobs(self, db: Session, limit: int = 10) -> List[Dict[str, Any]]:
        # Trending = recently posted + lower competition or high growth
        recent_date = datetime.now(timezone.utc) - timedelta(days=14)
        trending_jobs = db.query(Job).filter(
            Job.is_active == True,
            Job.created_at >= recent_date
        ).order_by(Job.applicant_count.desc(), Job.created_at.desc()).limit(limit).all()

        results = []
        for job in trending_jobs:
            company = db.query(Company).filter(Company.id == job.company_id).first()
            results.append({
                "job": job,
                "company": company,
                "match_score": 75.0  # default for anonymous trending jobs
            })
        return results
