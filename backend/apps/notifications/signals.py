"""
SwipeX Notifications — signal handlers.

Hooks into the existing `jobs` app models (JobApplication) without modifying
them, so Milestone 2/3 behaviour is completely untouched. Two signals:

  1. post_save(JobApplication, created=True)  → notify recruiter of new application
  2. pre_save + post_save(JobApplication)      → detect a status change and notify
     the job seeker (pre_save captures the previous status for comparison).
"""

from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver

from apps.jobs.models import JobApplication

from . import services


@receiver(pre_save, sender=JobApplication)
def _capture_previous_status(sender, instance, **kwargs):
    if not instance.pk:
        instance._previous_status = None
        return
    try:
        instance._previous_status = JobApplication.objects.only('status').get(pk=instance.pk).status
    except JobApplication.DoesNotExist:
        instance._previous_status = None


@receiver(post_save, sender=JobApplication)
def _on_application_saved(sender, instance, created, **kwargs):
    if created:
        try:
            services.notify_new_application(instance)
        except Exception:
            # Notifications must never break the core application flow.
            pass

        # High ATS-score applicants get flagged to the recruiter immediately.
        try:
            from apps.resumes.models import Resume
            from apps.resumes.services import get_or_compute_ats
            resume = Resume.objects.filter(
                user=instance.job_seeker, is_primary=True, parse_status=Resume.ParseStatus.SUCCESS
            ).first()
            if resume:
                ats = get_or_compute_ats(resume, instance.job)
                if ats.overall_score >= 85:
                    services.notify_candidate_shortlist_suggestion(instance)
        except Exception:
            pass
        return

    previous_status = getattr(instance, '_previous_status', None)
    if previous_status is not None and previous_status != instance.status:
        try:
            services.notify_application_status_change(instance)
        except Exception:
            pass
