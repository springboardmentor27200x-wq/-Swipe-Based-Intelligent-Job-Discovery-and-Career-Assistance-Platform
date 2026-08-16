from typing import List
from sqlalchemy.orm import Session
from app.models_jobseeker import SwipeAction, SwipeActionType, Job
from app.models_recruiter import JobSkill



def get_preferred_skill_weights(db: Session, profile_id) -> dict:
    """
    Builds a preference weight per skill from the seeker's swipe history:
    +1 for each skill on a job they saved/applied to, -1 for each skill
    on a job they skipped. This is what turns swipe behavior into an
    actual ranking signal instead of dead data.
    """
    swipes = db.query(SwipeAction).filter_by(job_seeker_profile_id=profile_id).all()
    weights = {}

    for swipe in swipes:
        job_skills = [js.skill.name for js in db.query(JobSkill).filter_by(job_id=swipe.job_id).all()]
        direction = 1 if swipe.action in (SwipeActionType.save, SwipeActionType.apply) else -1
        for skill_name in job_skills:
            weights[skill_name.lower()] = weights.get(skill_name.lower(), 0) + direction

    return weights


def swipe_learning_boost(job_required_skills: List[str], preferred_weights: dict) -> float:
    """
    Returns a small adjustment (roughly -10 to +10) to add to a job's
    match_score, based on how much this job's skills overlap with skills
    the user has historically swiped right (or left) on.
    """
    if not preferred_weights or not job_required_skills:
        return 0.0
    total = sum(preferred_weights.get(s.lower(), 0) for s in job_required_skills)
    # Scale down so it nudges the ranking rather than dominating the
    # skill-overlap score -- tune this divisor as you gather more data.
    return max(-10.0, min(10.0, total * 2))