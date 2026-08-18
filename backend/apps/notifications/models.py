"""
SwipeX Notifications Models — Milestone 4
Smart Notification System for Job Seekers and Recruiters.
"""

import uuid
from django.db import models


class Notification(models.Model):
    """A single in-app notification for a User (job seeker or recruiter)."""

    class NotificationType(models.TextChoices):
        # Job seeker notifications
        NEW_JOB              = 'new_job',              'New Job Match'
        STARTUP_HIRING        = 'startup_hiring',        'Startup Hiring Alert'
        HIGH_MATCH            = 'high_match',            'High Match Job Alert'
        LOW_COMPETITION        = 'low_competition',        'Low Competition Job Alert'
        RESUME_REMINDER         = 'resume_reminder',         'Resume Improvement Reminder'
        SAVED_JOB_REMINDER       = 'saved_job_reminder',       'Saved Job Reminder'
        APPLICATION_STATUS        = 'application_status',        'Application Status Update'
        SHORTLISTED                = 'shortlisted',                'Shortlisted'
        INTERVIEW_SCHEDULED          = 'interview_scheduled',          'Interview Scheduled'

        # Recruiter notifications
        NEW_APPLICATION                = 'new_application',                'New Application'
        CANDIDATE_SHORTLIST_SUGGESTION   = 'candidate_shortlist_suggestion',   'Candidate Shortlist Suggestion'
        JOB_EXPIRATION_REMINDER            = 'job_expiration_reminder',            'Job Expiration Reminder'

        # Generic / system
        SYSTEM                               = 'system',                               'System'

    class Priority(models.TextChoices):
        LOW    = 'low',    'Low'
        NORMAL = 'normal', 'Normal'
        HIGH   = 'high',   'High'

    id   = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        'users.User', on_delete=models.CASCADE, related_name='notifications',
    )

    title    = models.CharField(max_length=255)
    message  = models.TextField(blank=True)
    type     = models.CharField(max_length=40, choices=NotificationType.choices, default=NotificationType.SYSTEM)
    priority = models.CharField(max_length=10, choices=Priority.choices, default=Priority.NORMAL)

    # Optional deep-link data so the frontend can route the user on click
    link      = models.CharField(max_length=500, blank=True, help_text='Frontend route, e.g. /jobs/<id>')
    job       = models.ForeignKey('jobs.Job', on_delete=models.CASCADE, null=True, blank=True, related_name='notifications')
    application = models.ForeignKey('jobs.JobApplication', on_delete=models.CASCADE, null=True, blank=True, related_name='notifications')

    is_read    = models.BooleanField(default=False)
    read_at    = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'swipex_notifications'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'is_read']),
            models.Index(fields=['user', '-created_at']),
        ]

    def __str__(self):
        return f"Notification({self.user.email}, {self.type}, read={self.is_read})"

    def mark_read(self):
        if not self.is_read:
            from django.utils import timezone
            self.is_read = True
            self.read_at = timezone.now()
            self.save(update_fields=['is_read', 'read_at'])
