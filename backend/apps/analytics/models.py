"""
SwipeX Analytics Models — Milestone 4
Skill Gap Analysis history. Dashboard/application/recommendation analytics
are computed on the fly from existing Milestone 1-3 models (Job, JobApplication,
Recommendation, Resume, ATSScore) and don't need their own tables.
"""

import uuid
from django.db import models


class SkillGapSnapshot(models.Model):
    """
    A stored run of the Skill Gap Analysis for a job seeker against a job
    (or against their overall target role when job is null).
    """
    id         = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    job_seeker = models.ForeignKey(
        'users.User', on_delete=models.CASCADE,
        related_name='skill_gap_snapshots', limit_choices_to={'role': 'job_seeker'}
    )
    job = models.ForeignKey('jobs.Job', on_delete=models.CASCADE, null=True, blank=True, related_name='skill_gap_snapshots')

    matched_skills   = models.JSONField(default=list, blank=True)
    missing_skills   = models.JSONField(default=list, blank=True)
    priority_skills  = models.JSONField(default=list, blank=True, help_text='Missing skills ranked by importance')
    learning_suggestions = models.JSONField(default=list, blank=True)
    match_percentage = models.FloatField(default=0.0)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'swipex_skill_gap_snapshots'
        ordering = ['-created_at']

    def __str__(self):
        target = self.job.title if self.job_id else 'overall profile'
        return f"SkillGap({self.job_seeker.email} vs {target}, {self.match_percentage:.0f}%)"
