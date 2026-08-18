"""Authentication serializers — registration, login, password management."""

from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from apps.users.models import User, UserProfile, RecruiterProfile


class RegisterSerializer(serializers.ModelSerializer):
    password         = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)
    company_name     = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model  = User
        fields = ['email', 'first_name', 'last_name', 'role', 'password', 'password_confirm', 'company_name']

    def validate_role(self, value):
        if value == User.Role.ADMIN:
            raise serializers.ValidationError("Self-registration as Admin is not permitted.")
        return value

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({'password_confirm': 'Passwords do not match.'})
        if attrs.get('role') == User.Role.RECRUITER and not attrs.get('company_name'):
            raise serializers.ValidationError({'company_name': 'Company name is required for recruiters.'})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        company_name = validated_data.pop('company_name', '')
        password = validated_data.pop('password')

        user = User.objects.create_user(password=password, **validated_data)

        if user.role == User.Role.RECRUITER:
            RecruiterProfile.objects.create(user=user, company_name=company_name)
        else:
            UserProfile.objects.create(user=user)

        return user


class LoginSerializer(serializers.Serializer):
    email    = serializers.EmailField()
    password = serializers.CharField(write_only=True)


class ChangePasswordSerializer(serializers.Serializer):
    old_password     = serializers.CharField(write_only=True)
    new_password     = serializers.CharField(write_only=True, validators=[validate_password])
    new_password_confirm = serializers.CharField(write_only=True)

    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError({'new_password_confirm': 'Passwords do not match.'})
        return attrs


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()


class PasswordResetConfirmSerializer(serializers.Serializer):
    token            = serializers.UUIDField()
    new_password     = serializers.CharField(write_only=True, validators=[validate_password])
    new_password_confirm = serializers.CharField(write_only=True)

    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError({'new_password_confirm': 'Passwords do not match.'})
        return attrs


class EmailVerifySerializer(serializers.Serializer):
    token = serializers.UUIDField()
