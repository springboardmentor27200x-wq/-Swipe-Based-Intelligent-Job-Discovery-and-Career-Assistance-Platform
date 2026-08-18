"""Role-based permission classes for SwipeX."""

from rest_framework.permissions import BasePermission
from .models import User


class IsJobSeeker(BasePermission):
    """Grants access only to users with the Job Seeker role."""
    message = 'Access restricted to Job Seekers.'

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_job_seeker)


class IsRecruiter(BasePermission):
    """Grants access only to users with the Recruiter role."""
    message = 'Access restricted to Recruiters.'

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_recruiter)


class IsAdminUser(BasePermission):
    """Grants access only to platform Admins."""
    message = 'Access restricted to Admins.'

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_admin_user)


class IsRecruiterOrAdmin(BasePermission):
    """Grants access to Recruiters and Admins."""
    message = 'Access restricted to Recruiters and Admins.'

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        return request.user.is_recruiter or request.user.is_admin_user
