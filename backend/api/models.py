from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db.models.signals import post_save
from django.dispatch import receiver
import uuid

class UserManager(BaseUserManager):
    def create_user(self, email, password=None, role='job_seeker', **extra_fields):
        if not email:
            raise ValueError('Users must have an email address')
        email = self.normalize_email(email)
        user = self.model(email=email, role=role, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, password, role='admin', **extra_fields)

class User(AbstractBaseUser, PermissionsMixin):
    ROLE_CHOICES = (
        ('job_seeker', 'Job Seeker'),
        ('recruiter', 'Recruiter'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(max_length=255, unique=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='job_seeker')
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    def __str__(self):
        return f"{self.email} ({self.get_role_display()})"


class Profile(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    full_name = models.CharField(max_length=150, blank=True, null=True)
    title = models.CharField(max_length=100, blank=True, null=True)
    bio = models.TextField(blank=True, null=True)
    avatar_url = models.TextField(blank=True, null=True)
    skills = models.JSONField(default=list, blank=True) # E.g., ["React", "Python"]
    target_domain = models.CharField(max_length=50, blank=True, null=True, default='ai_ml')
    
    # Contact & verification details
    date_of_birth = models.CharField(max_length=50, blank=True, null=True)
    phone = models.CharField(max_length=50, blank=True, null=True)
    location = models.CharField(max_length=150, blank=True, null=True)
    education = models.CharField(max_length=255, blank=True, null=True)
    experience_years = models.CharField(max_length=50, blank=True, null=True)
    portfolio_url = models.URLField(max_length=512, blank=True, null=True)
    github_url = models.URLField(max_length=512, blank=True, null=True)
    linkedin_url = models.URLField(max_length=512, blank=True, null=True)

    # Resume specific
    resume_url = models.TextField(blank=True, null=True) # Seeker specific
    resume_name = models.CharField(max_length=255, blank=True, null=True)
    resume_text = models.TextField(blank=True, null=True)
    
    # Recruiter specific
    company_name = models.CharField(max_length=150, blank=True, null=True) # Recruiter specific
    company_website = models.URLField(max_length=255, blank=True, null=True) # Recruiter specific
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Profile of {self.user.email}"


class Job(models.Model):
    ORG_CHOICES = (
        ('mnc', 'MNC'),
        ('startup', 'Startup'),
        ('newly_founded', 'Newly Founded Startup'),
    )
    
    JOB_TYPE_CHOICES = (
        ('remote', 'Remote'),
        ('internship', 'Internship'),
        ('full_time', 'Full Time'),
    )
    
    EXP_CHOICES = (
        ('fresher', 'Fresher'),
        ('junior', 'Junior'),
        ('mid', 'Mid-Level'),
        ('senior', 'Senior'),
    )
    
    COMPETITION_CHOICES = (
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    recruiter = models.ForeignKey(User, on_delete=models.CASCADE, related_name='jobs_posted')
    title = models.CharField(max_length=255)
    company_name = models.CharField(max_length=255)
    company_logo = models.TextField(blank=True, null=True)
    description = models.TextField()
    salary_range = models.CharField(max_length=100, blank=True, null=True) # E.g. "$120k - $150k"
    salary_min = models.IntegerField(default=0) # For range filters
    salary_max = models.IntegerField(default=0) # For range filters
    location = models.CharField(max_length=100, blank=True, null=True) # E.g. "San Francisco, CA" or "Remote"
    required_skills = models.JSONField(default=list, blank=True)
    
    # Filter tags
    organization_type = models.CharField(max_length=20, choices=ORG_CHOICES, default='startup')
    job_type = models.CharField(max_length=20, choices=JOB_TYPE_CHOICES, default='full_time')
    experience_level = models.CharField(max_length=20, choices=EXP_CHOICES, default='junior')
    is_fresher_friendly = models.BooleanField(default=False)
    applicant_count = models.IntegerField(default=0)
    competition_level = models.CharField(max_length=20, choices=COMPETITION_CHOICES, default='low')
    
    is_active = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} at {self.company_name}"


class Match(models.Model):
    STATUS_CHOICES = (
        ('swiped_left', 'Swiped Left'),
        ('swiped_right', 'Swiped Right'),
        ('matched', 'Matched'),
        ('saved_pending', 'Saved Pending'),
        ('applied', 'Applied'),
        ('shortlisted', 'Shortlisted'),
        ('interview_scheduled', 'Interview Scheduled'),
        ('selected', 'Selected / Hired'),
        ('rejected', 'Rejected'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    seeker = models.ForeignKey(User, on_delete=models.CASCADE, related_name='swipes')
    job = models.ForeignKey(Job, on_delete=models.CASCADE, related_name='applicants')
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='swiped_right')
    seeker_feedback = models.TextField(blank=True, null=True)
    recruiter_feedback = models.TextField(blank=True, null=True)
    cover_note = models.TextField(blank=True, null=True)
    interview_date = models.CharField(max_length=100, blank=True, null=True)
    interview_type = models.CharField(max_length=100, blank=True, null=True)
    applied_at = models.DateTimeField(blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('seeker', 'job')
        verbose_name_plural = 'Matches'

    def __str__(self):
        return f"Match: {self.seeker.email} -> {self.job.title} ({self.status})"


class Notification(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    type = models.CharField(max_length=50, default='mutual_match')
    title = models.CharField(max_length=255)
    message = models.TextField()
    link = models.CharField(max_length=255, blank=True, null=True, default='/applications')
    is_read = models.BooleanField(default=False)
    badge = models.CharField(max_length=50, blank=True, null=True, default='Match')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Notification for {self.user.email}: {self.title}"


# Signals to auto-create Profile and welcome notifications on User sign-up
@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        Profile.objects.create(
            user=instance,
            full_name=instance.email.split('@')[0].capitalize(),
            title='Technology Specialist' if instance.role == 'job_seeker' else 'Talent Recruiter',
            avatar_url=''
        )
        # Create a welcome notification
        if instance.role == 'job_seeker':
            Notification.objects.create(
                user=instance,
                type='mutual_match',
                title='Welcome to SwipeX!',
                message='Your profile is active. Upload your resume to auto-fill technical skills and calculate your ATS score.',
                link='/profile',
                badge='Welcome'
            )

@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    try:
        instance.profile.save()
    except Profile.DoesNotExist:
        Profile.objects.create(user=instance)
