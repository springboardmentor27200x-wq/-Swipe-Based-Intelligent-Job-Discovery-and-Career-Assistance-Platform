"""Shared helper functions for the Resumes module — used by resumes.views and jobs.serializers."""

from .models import Resume, ATSScore
from .scoring import compute_ats_score


def get_primary_resume(user):
    if not user or not getattr(user, 'is_authenticated', False):
        return None
    if not getattr(user, 'is_job_seeker', False):
        return None
    return Resume.objects.filter(user=user, is_primary=True, parse_status=Resume.ParseStatus.SUCCESS).first()


def get_or_compute_ats(resume, job) -> ATSScore:
    """Returns a fresh/cached ATSScore row for this resume+job pair."""
    result = compute_ats_score(resume, job)
    ats, _created = ATSScore.objects.update_or_create(
        resume=resume, job=job,
        defaults=result,
    )
    return ats
