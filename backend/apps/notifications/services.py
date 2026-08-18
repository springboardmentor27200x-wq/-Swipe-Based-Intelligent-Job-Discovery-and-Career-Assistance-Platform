"""
SwipeX Notification Service Helpers — Milestone 4

Small, focused helper functions that create Notification rows. Used by
signals.py (instant, event-driven notifications) and by the
`generate_notifications` management command (batch / periodic notifications
such as high-match alerts, resume reminders, and job-expiration reminders).
"""

from django.utils import timezone
from datetime import timedelta

from .models import Notification


def create_notification(user, title, message='', type=Notification.NotificationType.SYSTEM,
                         priority=Notification.Priority.NORMAL, link='', job=None, application=None):
    """Create and return a single Notification row for `user`."""
    return Notification.objects.create(
        user=user, title=title, message=message, type=type, priority=priority,
        link=link, job=job, application=application,
    )


# ── Recruiter-facing events ────────────────────────────────────────────────────

def notify_new_application(application):
    """Fired when a job seeker applies — notifies the job's recruiter."""
    job = application.job
    create_notification(
        user=job.recruiter,
        title='New application received',
        message=f"{application.job_seeker.full_name} applied to \"{job.title}\".",
        type=Notification.NotificationType.NEW_APPLICATION,
        priority=Notification.Priority.NORMAL,
        link=f"/recruiter/jobs/{job.id}/applicants/{application.id}",
        job=job, application=application,
    )


def notify_candidate_shortlist_suggestion(application):
    """Fired when an applicant's ATS score is very high — nudges the recruiter to shortlist."""
    job = application.job
    create_notification(
        user=job.recruiter,
        title='Strong candidate worth shortlisting',
        message=f"{application.job_seeker.full_name}'s resume scores highly against \"{job.title}\".",
        type=Notification.NotificationType.CANDIDATE_SHORTLIST_SUGGESTION,
        priority=Notification.Priority.HIGH,
        link=f"/recruiter/jobs/{job.id}/applicants/{application.id}",
        job=job, application=application,
    )


def notify_job_expiration(job):
    """Fired (via management command) a few days before a job's deadline."""
    create_notification(
        user=job.recruiter,
        title='Job posting expiring soon',
        message=f"\"{job.title}\" reaches its deadline soon. Review or extend it if you're still hiring.",
        type=Notification.NotificationType.JOB_EXPIRATION_REMINDER,
        priority=Notification.Priority.NORMAL,
        link=f"/recruiter/jobs/{job.id}/applicants",
        job=job,
    )


# ── Job-seeker-facing events ───────────────────────────────────────────────────

def notify_application_status_change(application):
    """Fired whenever a recruiter advances an application's pipeline status."""
    job = application.job
    status_label = application.get_status_display()

    notif_type = Notification.NotificationType.APPLICATION_STATUS
    priority = Notification.Priority.NORMAL
    if application.status == 'shortlisted':
        notif_type = Notification.NotificationType.SHORTLISTED
        priority = Notification.Priority.HIGH
    elif application.status == 'interview_scheduled':
        notif_type = Notification.NotificationType.INTERVIEW_SCHEDULED
        priority = Notification.Priority.HIGH

    create_notification(
        user=application.job_seeker,
        title=f"Application update: {status_label}",
        message=f"Your application for \"{job.title}\" at {job.company.name} is now \"{status_label}\".",
        type=notif_type,
        priority=priority,
        link="/jobs/applied",
        job=job, application=application,
    )


def notify_new_job_match(job_seeker, job, score=None):
    """New published job that matches a seeker's profile/resume skills."""
    pct = f" ({round(score * 100)}% match)" if score is not None else ""
    create_notification(
        user=job_seeker,
        title='New job that matches your profile',
        message=f"\"{job.title}\" at {job.company.name}{pct} was just posted.",
        type=Notification.NotificationType.NEW_JOB,
        priority=Notification.Priority.NORMAL,
        link=f"/jobs/{job.id}",
        job=job,
    )


def notify_startup_hiring(job_seeker, job):
    """
    A startup / newly-founded company just published a job. Distinct from
    notify_new_job_match — this is specifically about the *company stage*,
    not the seeker's skill match, per Milestone 4's "Startup hiring alerts".
    """
    create_notification(
        user=job_seeker,
        title='Startup hiring alert',
        message=(
            f"{job.company.name} is hiring for {job.title} — a new startup "
            f"opportunity matching your profile."
        ),
        type=Notification.NotificationType.STARTUP_HIRING,
        priority=Notification.Priority.NORMAL,
        link=f"/jobs/{job.id}",
        job=job,
    )


def notify_high_match(job_seeker, job, score):
    create_notification(
        user=job_seeker,
        title='High-match opportunity',
        message=f"\"{job.title}\" at {job.company.name} is a {round(score * 100)}% match for you.",
        type=Notification.NotificationType.HIGH_MATCH,
        priority=Notification.Priority.HIGH,
        link=f"/jobs/{job.id}",
        job=job,
    )


def notify_low_competition(job_seeker, job):
    create_notification(
        user=job_seeker,
        title='Low-competition opportunity',
        message=f"\"{job.title}\" at {job.company.name} has few applicants so far — a great time to apply.",
        type=Notification.NotificationType.LOW_COMPETITION,
        priority=Notification.Priority.NORMAL,
        link=f"/jobs/{job.id}",
        job=job,
    )


def notify_resume_improvement_reminder(job_seeker, suggestion_count=0):
    create_notification(
        user=job_seeker,
        title='Improve your resume',
        message=(
            f"Your resume has {suggestion_count} suggested improvements that could raise your ATS score."
            if suggestion_count else
            "Upload or update your resume to unlock stronger job matches and ATS scoring."
        ),
        type=Notification.NotificationType.RESUME_REMINDER,
        priority=Notification.Priority.LOW,
        link="/profile",
    )


def notify_saved_job_reminder(job_seeker, job):
    create_notification(
        user=job_seeker,
        title="Don't forget to apply",
        message=f"You saved \"{job.title}\" at {job.company.name} a while ago — it's still open.",
        type=Notification.NotificationType.SAVED_JOB_REMINDER,
        priority=Notification.Priority.LOW,
        link="/jobs/saved",
        job=job,
    )


# ── Batch helpers used by the management command ──────────────────────────────

def recently_notified(user, job, type, hours=24):
    """Avoid spamming the same user/job/type combination repeatedly."""
    cutoff = timezone.now() - timedelta(hours=hours)
    return Notification.objects.filter(
        user=user, job=job, type=type, created_at__gte=cutoff
    ).exists()
