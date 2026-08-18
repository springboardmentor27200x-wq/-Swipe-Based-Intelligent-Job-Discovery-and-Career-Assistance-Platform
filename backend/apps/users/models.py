"""
SwipeX User Models
Milestone 1: Custom User with Role-Based Access Control
"""

import uuid
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.utils import timezone


class UserManager(BaseUserManager):
    """Custom manager for SwipeX User model."""

    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Email address is required.')
        email = self.normalize_email(email)
        extra_fields.setdefault('is_active', True)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', User.Role.ADMIN)
        extra_fields.setdefault('is_email_verified', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    """
    SwipeX custom user supporting three roles:
      - JOB_SEEKER  : candidates exploring and applying for jobs
      - RECRUITER   : companies posting jobs and reviewing applicants
      - ADMIN       : platform administrators
    """

    class Role(models.TextChoices):
        JOB_SEEKER = 'job_seeker', 'Job Seeker'
        RECRUITER  = 'recruiter',  'Recruiter'
        ADMIN      = 'admin',      'Admin'

    class AuthProvider(models.TextChoices):
        EMAIL  = 'email',  'Email'
        GOOGLE = 'google', 'Google'
        GITHUB = 'github', 'GitHub'

    # ── Identity ──────────────────────────────────────────────────────────────
    id         = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email      = models.EmailField(unique=True, db_index=True)
    first_name = models.CharField(max_length=150, blank=True)
    last_name  = models.CharField(max_length=150, blank=True)
    avatar     = models.ImageField(upload_to='avatars/', null=True, blank=True)

    # ── Role & Auth ───────────────────────────────────────────────────────────
    role          = models.CharField(max_length=20, choices=Role.choices, default=Role.JOB_SEEKER)
    auth_provider = models.CharField(max_length=20, choices=AuthProvider.choices, default=AuthProvider.EMAIL)

    # ── Status ────────────────────────────────────────────────────────────────
    is_active         = models.BooleanField(default=True)
    is_staff          = models.BooleanField(default=False)
    is_email_verified = models.BooleanField(default=False)
    is_profile_complete = models.BooleanField(default=False)

    # ── Timestamps ────────────────────────────────────────────────────────────
    date_joined = models.DateTimeField(default=timezone.now)
    last_login  = models.DateTimeField(null=True, blank=True)

    objects = UserManager()

    USERNAME_FIELD  = 'email'
    REQUIRED_FIELDS = []

    class Meta:
        db_table  = 'swipex_users'
        ordering  = ['-date_joined']
        verbose_name = 'User'
        verbose_name_plural = 'Users'

    def __str__(self):
        return f"{self.email} ({self.get_role_display()})"

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}".strip() or self.email

    # ── Role helpers ──────────────────────────────────────────────────────────
    @property
    def is_job_seeker(self):
        return self.role == self.Role.JOB_SEEKER

    @property
    def is_recruiter(self):
        return self.role == self.Role.RECRUITER

    @property
    def is_admin_user(self):
        return self.role == self.Role.ADMIN


class UserProfile(models.Model):
    """
    Extended profile for Job Seekers.
    Milestone 2 will expand this significantly.
    """
    user     = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    headline = models.CharField(max_length=255, blank=True, help_text="e.g. Full Stack Developer")
    bio      = models.TextField(blank=True)
    location = models.CharField(max_length=150, blank=True)
    phone    = models.CharField(max_length=20, blank=True)
    website  = models.URLField(blank=True)
    linkedin = models.URLField(blank=True)
    github   = models.URLField(blank=True)

    # Experience
    years_of_experience = models.PositiveSmallIntegerField(default=0)
    current_ctc         = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    expected_ctc        = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    # Preferences (expanded in Milestone 3)
    preferred_job_types  = models.JSONField(default=list, blank=True)
    preferred_locations  = models.JSONField(default=list, blank=True)
    open_to_remote       = models.BooleanField(default=True)
    open_to_relocation   = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'swipex_user_profiles'

    def __str__(self):
        return f"Profile: {self.user.email}"


class RecruiterProfile(models.Model):
    """Extended profile for Recruiters."""
    user         = models.OneToOneField(User, on_delete=models.CASCADE, related_name='recruiter_profile')
    company_name = models.CharField(max_length=255)
    company_size = models.CharField(max_length=50, blank=True)
    industry     = models.CharField(max_length=100, blank=True)
    company_website = models.URLField(blank=True)
    designation  = models.CharField(max_length=150, blank=True)
    is_verified  = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'swipex_recruiter_profiles'

    def __str__(self):
        return f"Recruiter: {self.user.email} @ {self.company_name}"
