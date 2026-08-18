"""Authentication models — email verification & password reset tokens."""

import uuid
from django.db import models
from django.utils import timezone
from datetime import timedelta
from django.conf import settings


def _default_expiry_email():
    hours = settings.SWIPEX.get('EMAIL_VERIFY_EXPIRY_HOURS', 48)
    return timezone.now() + timedelta(hours=hours)


def _default_expiry_reset():
    hours = settings.SWIPEX.get('PASSWORD_RESET_EXPIRY_HOURS', 24)
    return timezone.now() + timedelta(hours=hours)


class EmailVerificationToken(models.Model):
    """One-time token for verifying a user's email address."""
    user       = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='email_tokens')
    token      = models.UUIDField(default=uuid.uuid4, unique=True, db_index=True)
    expires_at = models.DateTimeField(default=_default_expiry_email)
    is_used    = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'swipex_email_tokens'
        ordering = ['-created_at']

    def is_valid(self):
        return not self.is_used and self.expires_at > timezone.now()

    def __str__(self):
        return f"EmailToken({self.user.email})"


class PasswordResetToken(models.Model):
    """One-time token for resetting a user's password."""
    user       = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='reset_tokens')
    token      = models.UUIDField(default=uuid.uuid4, unique=True, db_index=True)
    expires_at = models.DateTimeField(default=_default_expiry_reset)
    is_used    = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'swipex_password_reset_tokens'
        ordering = ['-created_at']

    def is_valid(self):
        return not self.is_used and self.expires_at > timezone.now()

    def __str__(self):
        return f"ResetToken({self.user.email})"
