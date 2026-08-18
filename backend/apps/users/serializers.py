"""User serializers for SwipeX."""

from rest_framework import serializers
from .models import User, UserProfile, RecruiterProfile


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        exclude = ['user', 'id']


class RecruiterProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = RecruiterProfile
        exclude = ['user', 'id']


class UserSerializer(serializers.ModelSerializer):
    """Read-only user serializer — full detail including nested profile."""
    profile           = UserProfileSerializer(read_only=True)
    recruiter_profile = RecruiterProfileSerializer(read_only=True)
    full_name         = serializers.ReadOnlyField()
    is_job_seeker     = serializers.SerializerMethodField()
    is_recruiter      = serializers.SerializerMethodField()

    def get_is_job_seeker(self, obj):
        return obj.role == 'job_seeker'

    def get_is_recruiter(self, obj):
        return obj.role == 'recruiter'

    class Meta:
        model  = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'full_name',
            'avatar', 'role', 'auth_provider',
            'is_email_verified', 'is_profile_complete',
            'is_job_seeker', 'is_recruiter',
            'date_joined', 'last_login',
            'profile', 'recruiter_profile',
        ]
        read_only_fields = ['id', 'email', 'role', 'auth_provider', 'date_joined', 'last_login']


class UserUpdateSerializer(serializers.ModelSerializer):
    """Allows updating basic user fields."""
    class Meta:
        model  = User
        fields = ['first_name', 'last_name', 'avatar']


class UserProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model  = UserProfile
        exclude = ['user', 'id', 'created_at', 'updated_at']


class RecruiterProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model  = RecruiterProfile
        exclude = ['user', 'id', 'is_verified', 'created_at', 'updated_at']
