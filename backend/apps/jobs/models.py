"""
SwipeX Jobs Models
Milestone 2: Swipe System & Job Discovery
"""

import uuid
from django.db import models
from django.utils import timezone


class Company(models.Model):
    """Company entity — created/managed by recruiters."""

    class CompanyType(models.TextChoices):
        MNC         = 'mnc',         'MNC'
        STARTUP     = 'startup',     'Startup'
        NEW_STARTUP = 'new_startup', 'Newly Founded Startup'
        ENTERPRISE  = 'enterprise',  'Enterprise'
        SME         = 'sme',         'SME'

    class CompanySize(models.TextChoices):
        TINY   = '1-10',      '1–10 employees'
        SMALL  = '11-50',     '11–50 employees'
        MEDIUM = '51-200',    '51–200 employees'
        LARGE  = '201-500',   '201–500 employees'
        XLARGE = '501-1000',  '501–1 000 employees'
        XXLARGE = '1000+',   '1 000+ employees'

    id           = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    recruiter    = models.ForeignKey(
        'users.User', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='companies', limit_choices_to={'role': 'recruiter'}
    )

    name         = models.CharField(max_length=255)
    slug         = models.SlugField(max_length=255, unique=True, blank=True)
    logo         = models.ImageField(upload_to='company_logos/', null=True, blank=True)
    cover_image  = models.ImageField(upload_to='company_covers/', null=True, blank=True)
    company_type = models.CharField(max_length=20, choices=CompanyType.choices, default=CompanyType.STARTUP)
    industry     = models.CharField(max_length=150, blank=True)
    description  = models.TextField(blank=True)
    website      = models.URLField(blank=True)
    headquarters = models.CharField(max_length=200, blank=True)
    company_size = models.CharField(max_length=20, choices=CompanySize.choices, blank=True)
    founded_year = models.PositiveSmallIntegerField(null=True, blank=True)
    linkedin     = models.URLField(blank=True)
    twitter      = models.URLField(blank=True)

    is_verified  = models.BooleanField(default=False)
    created_at   = models.DateTimeField(auto_now_add=True)
    updated_at   = models.DateTimeField(auto_now=True)

    class Meta:
        db_table  = 'swipex_companies'
        ordering  = ['name']
        verbose_name_plural = 'Companies'

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            from django.utils.text import slugify
            base_slug = slugify(self.name)
            slug = base_slug
            n = 1
            while Company.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f"{base_slug}-{n}"
                n += 1
            self.slug = slug
        super().save(*args, **kwargs)


class Skill(models.Model):
    """Canonical skill tag — reused across Jobs and UserProfiles."""
    name       = models.CharField(max_length=100, unique=True)
    slug       = models.SlugField(max_length=100, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'swipex_skills'
        ordering = ['name']

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            from django.utils.text import slugify
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


class Job(models.Model):
    """A job posting created by a recruiter."""

    class JobType(models.TextChoices):
        FULL_TIME  = 'full_time',  'Full-Time'
        PART_TIME  = 'part_time',  'Part-Time'
        CONTRACT   = 'contract',   'Contract'
        INTERNSHIP = 'internship', 'Internship'
        FREELANCE  = 'freelance',  'Freelance'

    class WorkMode(models.TextChoices):
        REMOTE  = 'remote',  'Remote'
        HYBRID  = 'hybrid',  'Hybrid'
        ONSITE  = 'onsite',  'On-site'

    class ExperienceLevel(models.TextChoices):
        FRESHER = 'fresher', 'Fresher (0 yrs)'
        JUNIOR  = 'junior',  'Junior (1–3 yrs)'
        MID     = 'mid',     'Mid-Level (3–6 yrs)'
        SENIOR  = 'senior',  'Senior (6–10 yrs)'
        LEAD    = 'lead',    'Lead / Principal (10+ yrs)'

    class Status(models.TextChoices):
        DRAFT     = 'draft',     'Draft'
        PUBLISHED = 'published', 'Published'
        CLOSED    = 'closed',    'Closed'
        PAUSED    = 'paused',    'Paused'

    class CompetitionLevel(models.TextChoices):
        LOW    = 'low',    'Low'
        MEDIUM = 'medium', 'Medium'
        HIGH   = 'high',   'High'

    id        = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    recruiter = models.ForeignKey(
        'users.User', on_delete=models.CASCADE,
        related_name='posted_jobs', limit_choices_to={'role': 'recruiter'}
    )
    company   = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='jobs')

    # ── Core fields ───────────────────────────────────────────────────────────
    title       = models.CharField(max_length=255)
    description = models.TextField()
    requirements = models.TextField(blank=True)
    benefits    = models.TextField(blank=True)

    # Skills
    skills_required = models.ManyToManyField(Skill, blank=True, related_name='jobs')
    skills_preferred = models.ManyToManyField(Skill, blank=True, related_name='preferred_jobs')

    # ── Compensation ──────────────────────────────────────────────────────────
    salary_min      = models.PositiveIntegerField(null=True, blank=True, help_text='Monthly salary (INR)')
    salary_max      = models.PositiveIntegerField(null=True, blank=True)
    salary_currency = models.CharField(max_length=10, default='INR')
    salary_visible  = models.BooleanField(default=True)

    # ── Filters / Meta ────────────────────────────────────────────────────────
    job_type         = models.CharField(max_length=20, choices=JobType.choices, default=JobType.FULL_TIME)
    work_mode        = models.CharField(max_length=20, choices=WorkMode.choices, default=WorkMode.ONSITE)
    experience_level = models.CharField(max_length=20, choices=ExperienceLevel.choices, default=ExperienceLevel.JUNIOR)
    location         = models.CharField(max_length=200, blank=True)
    openings         = models.PositiveSmallIntegerField(default=1)

    # ── Status & Timing ───────────────────────────────────────────────────────
    status         = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)
    deadline       = models.DateField(null=True, blank=True)
    is_fresher_friendly = models.BooleanField(default=False)

    # ── Computed / cached fields (updated by signals) ─────────────────────────
    applicant_count   = models.PositiveIntegerField(default=0)
    competition_level = models.CharField(
        max_length=10, choices=CompetitionLevel.choices, default=CompetitionLevel.LOW
    )

    created_at   = models.DateTimeField(auto_now_add=True)
    updated_at   = models.DateTimeField(auto_now=True)
    published_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'swipex_jobs'
        ordering = ['-published_at', '-created_at']

    def __str__(self):
        return f"{self.title} @ {self.company.name}"

    def publish(self):
        self.status = self.Status.PUBLISHED
        self.published_at = timezone.now()
        self.save(update_fields=['status', 'published_at'])

    def close(self):
        self.status = self.Status.CLOSED
        self.save(update_fields=['status'])

    def update_competition(self):
        """Recompute competition level from applicant_count."""
        if self.applicant_count < 10:
            level = self.CompetitionLevel.LOW
        elif self.applicant_count < 50:
            level = self.CompetitionLevel.MEDIUM
        else:
            level = self.CompetitionLevel.HIGH
        if self.competition_level != level:
            self.competition_level = level
            self.save(update_fields=['competition_level'])


class JobApplication(models.Model):
    """
    A job seeker applying to a job.

    Milestone 3.1: the status field now models the full recruitment pipeline
    (Applied → Resume Reviewed → Shortlisted → Interview Scheduled →
    Interview Completed → Offered → Accepted / Rejected), and every status
    change is appended to `status_history` for a full audit trail visible on
    the recruiter's Applicant Profile view.
    """

    class Status(models.TextChoices):
        PENDING              = 'pending',              'Applied'
        REVIEWED             = 'reviewed',              'Resume Reviewed'
        SHORTLISTED          = 'shortlisted',            'Shortlisted'
        INTERVIEW_SCHEDULED  = 'interview_scheduled',     'Interview Scheduled'
        INTERVIEW_COMPLETED  = 'interview_completed',      'Interview Completed'
        OFFERED              = 'offered',               'Offered'
        ACCEPTED             = 'accepted',              'Accepted'
        REJECTED             = 'rejected',              'Rejected'
        WITHDRAWN            = 'withdrawn',              'Withdrawn'

    # Ordered pipeline used for progress display; REJECTED/WITHDRAWN/ACCEPTED
    # are terminal states reachable from (almost) anywhere in the pipeline.
    PIPELINE_ORDER = [
        Status.PENDING, Status.REVIEWED, Status.SHORTLISTED,
        Status.INTERVIEW_SCHEDULED, Status.INTERVIEW_COMPLETED,
        Status.OFFERED, Status.ACCEPTED,
    ]

    id         = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    job_seeker = models.ForeignKey(
        'users.User', on_delete=models.CASCADE,
        related_name='applications', limit_choices_to={'role': 'job_seeker'}
    )
    job        = models.ForeignKey(Job, on_delete=models.CASCADE, related_name='applications')

    status     = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    status_history = models.JSONField(
        default=list, blank=True,
        help_text='[{status, changed_at (iso), note}] — audit trail of every status change'
    )
    recruiter_notes = models.TextField(blank=True, help_text='Private notes visible only to the recruiter')
    cover_note = models.TextField(blank=True)
    resume_url = models.CharField(max_length=500, blank=True)

    applied_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table   = 'swipex_job_applications'
        unique_together = [('job_seeker', 'job')]
        ordering   = ['-applied_at']

    def __str__(self):
        return f"{self.job_seeker.email} → {self.job.title}"

    def record_status_change(self, new_status, note=''):
        """Append an entry to status_history and update the current status."""
        self.status = new_status
        entry = {
            'status': new_status,
            'changed_at': timezone.now().isoformat(),
        }
        if note:
            entry['note'] = note
        self.status_history = (self.status_history or []) + [entry]
        self.save(update_fields=['status', 'status_history', 'updated_at'])


class SwipeHistory(models.Model):
    """Records every swipe action by a job seeker."""

    class Direction(models.TextChoices):
        RIGHT = 'right', 'Right (Interested)'
        LEFT  = 'left',  'Left (Skip)'
        UP    = 'up',    'Up (Super Like)'

    id         = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    job_seeker = models.ForeignKey(
        'users.User', on_delete=models.CASCADE,
        related_name='swipe_history', limit_choices_to={'role': 'job_seeker'}
    )
    job       = models.ForeignKey(Job, on_delete=models.CASCADE, related_name='swipes')
    direction = models.CharField(max_length=10, choices=Direction.choices)
    swiped_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table       = 'swipex_swipe_history'
        unique_together = [('job_seeker', 'job')]
        ordering       = ['-swiped_at']

    def __str__(self):
        return f"{self.job_seeker.email} swiped {self.direction} on {self.job.title}"


class SavedJob(models.Model):
    """Job seeker saves a job for later."""
    id         = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    job_seeker = models.ForeignKey(
        'users.User', on_delete=models.CASCADE,
        related_name='saved_jobs', limit_choices_to={'role': 'job_seeker'}
    )
    job      = models.ForeignKey(Job, on_delete=models.CASCADE, related_name='saved_by')
    saved_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table       = 'swipex_saved_jobs'
        unique_together = [('job_seeker', 'job')]
        ordering       = ['-saved_at']

    def __str__(self):
        return f"{self.job_seeker.email} saved {self.job.title}"


class Recommendation(models.Model):
    """Rule-based recommendation score for a job seeker / job pair."""
    id         = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    job_seeker = models.ForeignKey(
        'users.User', on_delete=models.CASCADE,
        related_name='recommendations', limit_choices_to={'role': 'job_seeker'}
    )
    job   = models.ForeignKey(Job, on_delete=models.CASCADE, related_name='recommendations')
    score = models.FloatField(default=0.0, help_text='0.0 – 1.0 match score')
    reasons = models.JSONField(default=list, blank=True, help_text='List of reason strings')
    explanation = models.JSONField(
        default=dict, blank=True,
        help_text='Milestone 4: structured breakdown — matched/missing skills, ATS score, factor weights'
    )
    generated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table       = 'swipex_recommendations'
        unique_together = [('job_seeker', 'job')]
        ordering       = ['-score']

    def __str__(self):
        return f"Rec({self.job_seeker.email}, {self.job.title}, {self.score:.2f})"

    @property
    def match_percentage(self):
        return round(self.score * 100)
