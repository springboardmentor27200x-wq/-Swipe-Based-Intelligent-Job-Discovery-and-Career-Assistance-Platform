"""Custom pipeline step for python-social-auth — sets role/provider and creates profile."""

from apps.users.models import User, UserProfile


def save_profile(backend, user, response, *args, **kwargs):
    """
    Runs during the social auth pipeline after a user is created/matched.
    Ensures auth_provider is recorded, email is marked verified (OAuth
    providers already verify email ownership), and a default Job Seeker
    profile exists if the user has none yet.
    """
    if backend.name == 'google-oauth2':
        user.auth_provider = User.AuthProvider.GOOGLE
    elif backend.name == 'github':
        user.auth_provider = User.AuthProvider.GITHUB

    # OAuth providers verify email ownership themselves
    user.is_email_verified = True

    # New social signups default to Job Seeker; they can be changed later via admin
    if kwargs.get('is_new'):
        user.role = User.Role.JOB_SEEKER

    user.save()

    if not hasattr(user, 'profile') and user.role == User.Role.JOB_SEEKER:
        UserProfile.objects.get_or_create(user=user)
