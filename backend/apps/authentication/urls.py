from django.urls import path
from . import views

urlpatterns = [
    path('register/', views.register_view, name='auth_register'),
    path('login/', views.login_view, name='auth_login'),
    path('logout/', views.logout_view, name='auth_logout'),
    path('token/refresh/', views.TokenRefreshView.as_view(), name='token_refresh'),

    path('change-password/', views.change_password_view, name='auth_change_password'),
    path('password-reset/', views.password_reset_request_view, name='auth_password_reset_request'),
    path('password-reset/confirm/', views.password_reset_confirm_view, name='auth_password_reset_confirm'),

    path('verify-email/', views.verify_email_view, name='auth_verify_email'),
    path('verify-email/resend/', views.resend_verification_view, name='auth_resend_verification'),
]
