from django.db import models
from django.contrib.auth.models import User


class Resume(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    resume_file = models.FileField(upload_to='resumes/')
    education = models.TextField()
    skills = models.TextField()
    experience = models.TextField(blank=True)
    projects = models.TextField(blank=True)

    def __str__(self):
        return f"{self.user.username}'s Resume"

from django.db import models


class Skill(models.Model):
    name = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.name