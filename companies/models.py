from django.db import models
from django.contrib.auth.models import User


class RecruiterProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    company_name = models.CharField(max_length=150)
    designation = models.CharField(max_length=100)
    verified = models.BooleanField(default=False)

    def __str__(self):
        return self.company_name


class Company(models.Model):
    recruiter = models.OneToOneField(
    RecruiterProfile,
    on_delete=models.CASCADE,
    null=True,
    blank=True
)
    name = models.CharField(max_length=150)
    company_type = models.CharField(max_length=100)
    website = models.URLField(blank=True)
    description = models.TextField(blank=True)
    logo = models.ImageField(upload_to='company_logos/', blank=True, null=True)
    location = models.CharField(max_length=100)

    def __str__(self):
        return self.name
