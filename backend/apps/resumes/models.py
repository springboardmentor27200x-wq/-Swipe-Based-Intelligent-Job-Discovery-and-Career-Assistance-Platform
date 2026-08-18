"""
SwipeX Resume Models — Milestone 3
AI Resume Analyzer, ATS Scoring & Resume-Job Compatibility.
"""

import uuid
import os
from django.db import models


def resume_upload_path(instance, filename):
    ext = filename.rsplit('.', 1)[-1].lower() if '.' in filename else 'pdf'
    safe_name = f"{uuid.uuid4().hex}.{ext}"
    return os.path.join('resumes', str(instance.user_id), safe_name)


class Resume(models.Model):
    """An uploaded resume (PDF/DOCX) belonging to a Job Seeker."""

    class FileType(models.TextChoices):
        PDF  = 'pdf',  'PDF'
        DOCX = 'docx', 'DOCX'

    class ParseStatus(models.TextChoices):
        PENDING = 'pending', 'Pending'
        SUCCESS = 'success', 'Success'
        FAILED  = 'failed',  'Failed'

    id   = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        'users.User', on_delete=models.CASCADE,
        related_name='resumes', limit_choices_to={'role': 'job_seeker'}
    )

    file              = models.FileField(upload_to=resume_upload_path)
    original_filename = models.CharField(max_length=255, blank=True)
    file_type         = models.CharField(max_length=10, choices=FileType.choices)
    file_size         = models.PositiveIntegerField(default=0, help_text='Size in bytes')

    is_primary = models.BooleanField(default=True, help_text='Active resume used for ATS scoring & recommendations')

    # ── Parsed content ────────────────────────────────────────────────────────
    raw_text = models.TextField(blank=True)

    parsed_name          = models.CharField(max_length=255, blank=True)
    parsed_email          = models.CharField(max_length=255, blank=True)
    parsed_phone           = models.CharField(max_length=50, blank=True)
    parsed_skills          = models.JSONField(default=list, blank=True)
    parsed_technologies    = models.JSONField(default=list, blank=True)
    parsed_education       = models.JSONField(default=list, blank=True)
    parsed_experience      = models.JSONField(default=list, blank=True)
    parsed_projects        = models.JSONField(default=list, blank=True)
    parsed_certifications  = models.JSONField(default=list, blank=True)
    has_github_link        = models.BooleanField(default=False)
    has_linkedin_link      = models.BooleanField(default=False)
    parsed_github_url      = models.CharField(max_length=255, blank=True)
    parsed_linkedin_url    = models.CharField(max_length=255, blank=True)
    estimated_years_experience = models.FloatField(default=0)

    parse_status = models.CharField(max_length=10, choices=ParseStatus.choices, default=ParseStatus.PENDING)
    parse_error  = models.TextField(blank=True)

    uploaded_at = models.DateTimeField(auto_now_add=True)
    updated_at  = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'swipex_resumes'
        ordering = ['-is_primary', '-uploaded_at']

    def __str__(self):
        return f"Resume({self.user.email}, {self.original_filename})"

    @property
    def all_skills(self):
        """Union of explicitly-detected skills and technologies."""
        return sorted(set(self.parsed_skills) | set(self.parsed_technologies))

    def save(self, *args, **kwargs):
        # Ensure only one primary resume per user
        if self.is_primary:
            Resume.objects.filter(user_id=self.user_id, is_primary=True).exclude(pk=self.pk).update(is_primary=False)
        super().save(*args, **kwargs)


class ATSScore(models.Model):
    """
    Cached ATS compatibility score between a Resume and a Job.
    Recomputed whenever the resume is re-parsed or the job changes materially.
    """
    id     = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    resume = models.ForeignKey(Resume, on_delete=models.CASCADE, related_name='ats_scores')
    job    = models.ForeignKey('jobs.Job', on_delete=models.CASCADE, related_name='ats_scores')

    overall_score      = models.FloatField(default=0.0, help_text='0-100')
    skill_match         = models.FloatField(default=0.0)
    experience_match     = models.FloatField(default=0.0)
    keyword_match        = models.FloatField(default=0.0)
    education_match       = models.FloatField(default=0.0)

    matched_skills = models.JSONField(default=list, blank=True)
    missing_skills = models.JSONField(default=list, blank=True)
    missing_keywords = models.JSONField(default=list, blank=True)
    suggestions      = models.JSONField(default=list, blank=True)

    computed_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'swipex_ats_scores'
        unique_together = [('resume', 'job')]
        ordering = ['-overall_score']

    def __str__(self):
        return f"ATS({self.resume.user.email} -> {self.job.title}: {self.overall_score:.0f}%)"

    @property
    def compatibility_label(self):
        if self.overall_score >= 85:
            return 'Excellent'
        if self.overall_score >= 70:
            return 'Good'
        if self.overall_score >= 50:
            return 'Fair'
        return 'Poor'
