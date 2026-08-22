from rest_framework import serializers
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth.password_validation import validate_password

User = get_user_model()

class UserRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    role = serializers.ChoiceField(choices=User.ROLE_CHOICES, required=True)

    class Meta:
        model = User
        fields = ('id', 'email', 'password', 'role')

    def validate_email(self, value):
        normalized_email = value.strip().lower()
        if User.objects.filter(email__iexact=normalized_email).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return normalized_email

    def create(self, validated_data):
        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            role=validated_data['role']
        )
        user.is_verified = True
        user.save()
        return user

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'email', 'role', 'is_verified', 'created_at', 'updated_at')
        read_only_fields = ('id', 'email', 'role', 'is_verified', 'created_at', 'updated_at')

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['email'] = user.email
        token['role'] = user.role
        token['is_verified'] = user.is_verified
        return token

    def validate(self, attrs):
        # Normalize email in authentication request to match registered emails case-insensitively
        username_field = self.username_field
        if username_field in attrs:
            attrs[username_field] = attrs[username_field].strip().lower()
        elif 'email' in attrs:
            attrs['email'] = attrs['email'].strip().lower()
            
        data = super().validate(attrs)
        data['user'] = UserSerializer(self.user).data
        return data

class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        normalized_email = value.strip().lower()
        if not User.objects.filter(email__iexact=normalized_email).exists():
            raise serializers.ValidationError("User with this email does not exist.")
        return normalized_email

class ResetPasswordSerializer(serializers.Serializer):
    token = serializers.CharField()
    password = serializers.CharField(write_only=True, validators=[validate_password])

class VerifyEmailSerializer(serializers.Serializer):
    token = serializers.CharField()

