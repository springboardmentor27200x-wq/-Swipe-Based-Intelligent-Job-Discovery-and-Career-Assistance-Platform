"""Authentication views — register, login, logout, password & email flows."""

from django.contrib.auth import authenticate
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone

from rest_framework import status, generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken, TokenError
from rest_framework_simplejwt.views import TokenRefreshView as BaseTokenRefreshView

from apps.users.models import User
from apps.users.serializers import UserSerializer
from .models import EmailVerificationToken, PasswordResetToken
from .serializers import (
    RegisterSerializer, LoginSerializer, ChangePasswordSerializer,
    PasswordResetRequestSerializer, PasswordResetConfirmSerializer,
    EmailVerifySerializer,
)


def _tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {'access': str(refresh.access_token), 'refresh': str(refresh)}


def _send_verification_email(user):
    token = EmailVerificationToken.objects.create(user=user)
    verify_url = f"{settings.SWIPEX['FRONTEND_URL']}/verify-email?token={token.token}"
    send_mail(
        subject='Verify your SwipeX account',
        message=f'Hi {user.first_name or user.email},\n\nPlease verify your email by visiting:\n{verify_url}\n\n'
                f'This link expires in {settings.SWIPEX["EMAIL_VERIFY_EXPIRY_HOURS"]} hours.',
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        fail_silently=True,
    )


# ─── Register ──────────────────────────────────────────────────────────────────
@api_view(['POST'])
@permission_classes([AllowAny])
def register_view(request):
    serializer = RegisterSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    user = serializer.save()

    _send_verification_email(user)
    tokens = _tokens_for_user(user)

    # Auto-generate recommendations for new job seekers immediately
    if user.role == User.Role.JOB_SEEKER:
        try:
            from apps.jobs.services import generate_recommendations_for_user
            generate_recommendations_for_user(user)
        except Exception:
            pass  # Never block registration if recommendation generation fails

    return Response({
        'success': True,
        'data': {
            'user': UserSerializer(user, context={'request': request}).data,
            'tokens': tokens,
        },
        'message': 'Registration successful. Please check your email to verify your account.'
    }, status=status.HTTP_201_CREATED)


# ─── Login ─────────────────────────────────────────────────────────────────────
@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    serializer = LoginSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    email    = serializer.validated_data['email']
    password = serializer.validated_data['password']

    user = authenticate(request, username=email, password=password)

    if user is None:
        return Response({
            'success': False,
            'error': {'code': 401, 'message': 'Invalid email or password.'}
        }, status=status.HTTP_401_UNAUTHORIZED)

    if not user.is_active:
        return Response({
            'success': False,
            'error': {'code': 403, 'message': 'This account has been deactivated.'}
        }, status=status.HTTP_403_FORBIDDEN)

    user.last_login = timezone.now()
    user.save(update_fields=['last_login'])

    tokens = _tokens_for_user(user)

    return Response({
        'success': True,
        'data': {
            'user': UserSerializer(user, context={'request': request}).data,
            'tokens': tokens,
        }
    })


# ─── Logout ────────────────────────────────────────────────────────────────────
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    refresh_token = request.data.get('refresh')
    if not refresh_token:
        return Response({
            'success': False,
            'error': {'code': 400, 'message': 'Refresh token is required.'}
        }, status=status.HTTP_400_BAD_REQUEST)

    try:
        token = RefreshToken(refresh_token)
        token.blacklist()
    except TokenError:
        return Response({
            'success': False,
            'error': {'code': 400, 'message': 'Invalid or expired token.'}
        }, status=status.HTTP_400_BAD_REQUEST)

    return Response({'success': True, 'message': 'Logged out successfully.'})


# ─── Token Refresh (wraps SimpleJWT to match response envelope) ───────────────
class TokenRefreshView(BaseTokenRefreshView):
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == 200:
            return Response({'success': True, 'data': response.data})
        return response


# ─── Change Password (authenticated) ──────────────────────────────────────────
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password_view(request):
    serializer = ChangePasswordSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    user = request.user
    if not user.check_password(serializer.validated_data['old_password']):
        return Response({
            'success': False,
            'error': {'code': 400, 'message': 'Old password is incorrect.'}
        }, status=status.HTTP_400_BAD_REQUEST)

    user.set_password(serializer.validated_data['new_password'])
    user.save(update_fields=['password'])

    return Response({'success': True, 'message': 'Password changed successfully.'})


# ─── Password Reset Request ────────────────────────────────────────────────────
@api_view(['POST'])
@permission_classes([AllowAny])
def password_reset_request_view(request):
    serializer = PasswordResetRequestSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    email = serializer.validated_data['email']

    try:
        user = User.objects.get(email=email)
        token = PasswordResetToken.objects.create(user=user)
        reset_url = f"{settings.SWIPEX['FRONTEND_URL']}/reset-password?token={token.token}"
        send_mail(
            subject='Reset your SwipeX password',
            message=f'Hi {user.first_name or user.email},\n\nReset your password here:\n{reset_url}\n\n'
                    f'This link expires in {settings.SWIPEX["PASSWORD_RESET_EXPIRY_HOURS"]} hours. '
                    f'If you did not request this, ignore this email.',
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=True,
        )
    except User.DoesNotExist:
        pass  # Do not reveal whether the email exists

    return Response({
        'success': True,
        'message': 'If an account exists with this email, a password reset link has been sent.'
    })


# ─── Password Reset Confirm ────────────────────────────────────────────────────
@api_view(['POST'])
@permission_classes([AllowAny])
def password_reset_confirm_view(request):
    serializer = PasswordResetConfirmSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    try:
        reset_token = PasswordResetToken.objects.get(token=serializer.validated_data['token'])
    except PasswordResetToken.DoesNotExist:
        return Response({
            'success': False,
            'error': {'code': 400, 'message': 'Invalid reset token.'}
        }, status=status.HTTP_400_BAD_REQUEST)

    if not reset_token.is_valid():
        return Response({
            'success': False,
            'error': {'code': 400, 'message': 'This reset token has expired or already been used.'}
        }, status=status.HTTP_400_BAD_REQUEST)

    user = reset_token.user
    user.set_password(serializer.validated_data['new_password'])
    user.save(update_fields=['password'])

    reset_token.is_used = True
    reset_token.save(update_fields=['is_used'])

    return Response({'success': True, 'message': 'Password reset successfully. You may now log in.'})


# ─── Email Verification ────────────────────────────────────────────────────────
@api_view(['POST'])
@permission_classes([AllowAny])
def verify_email_view(request):
    serializer = EmailVerifySerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    try:
        email_token = EmailVerificationToken.objects.get(token=serializer.validated_data['token'])
    except EmailVerificationToken.DoesNotExist:
        return Response({
            'success': False,
            'error': {'code': 400, 'message': 'Invalid verification token.'}
        }, status=status.HTTP_400_BAD_REQUEST)

    if not email_token.is_valid():
        return Response({
            'success': False,
            'error': {'code': 400, 'message': 'This verification link has expired or already been used.'}
        }, status=status.HTTP_400_BAD_REQUEST)

    user = email_token.user
    user.is_email_verified = True
    user.save(update_fields=['is_email_verified'])

    email_token.is_used = True
    email_token.save(update_fields=['is_used'])

    return Response({'success': True, 'message': 'Email verified successfully.'})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def resend_verification_view(request):
    user = request.user
    if user.is_email_verified:
        return Response({
            'success': False,
            'error': {'code': 400, 'message': 'Email is already verified.'}
        }, status=status.HTTP_400_BAD_REQUEST)

    _send_verification_email(user)
    return Response({'success': True, 'message': 'Verification email sent.'})
