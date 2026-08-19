from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    RegisterView, LoginView, LogoutView, OAuthPlaceholderView, ProfileView, JobListView, 
    SwipeActionView, ResetDeckView, ResumeUploadView, ATSRecommendationsView, 
    SeekerAnalyticsView, SeekerApplicationsView, SeekerApplyView, SeekerWithdrawView,
    NotificationListView, NotificationMarkReadView, NotificationReadAllView,
    RecruiterApplicantsView, RecruiterApplicationStatusView, RecruiterAnalyticsView,
    MatchListView
)

urlpatterns = [
    # Auth & Tokens
    path('register', RegisterView.as_view(), name='register'),
    path('login', LoginView.as_view(), name='login'),
    path('logout', LogoutView.as_view(), name='logout'),
    path('token/refresh', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/oauth-placeholder', OAuthPlaceholderView.as_view(), name='oauth_placeholder'),
    
    # Profile
    path('profile', ProfileView.as_view(), name='profile'),
    
    # Jobs
    path('jobs', JobListView.as_view(), name='jobs'),
    
    # Seeker Specific
    path('seeker/swipe', SwipeActionView.as_view(), name='swipe'),
    path('seeker/reset-deck', ResetDeckView.as_view(), name='reset-deck'),
    path('seeker/upload-resume', ResumeUploadView.as_view(), name='upload-resume'),
    path('seeker/ats-recommendations', ATSRecommendationsView.as_view(), name='ats-recommendations'),
    path('seeker/analytics', SeekerAnalyticsView.as_view(), name='seeker-analytics'),
    path('seeker/applications', SeekerApplicationsView.as_view(), name='seeker-applications'),
    path('seeker/apply', SeekerApplyView.as_view(), name='seeker-apply'),
    path('seeker/applications/<str:id>/withdraw', SeekerWithdrawView.as_view(), name='seeker-withdraw'),
    
    # Notifications
    path('notifications', NotificationListView.as_view(), name='notifications-list'),
    path('notifications/<str:id>/read', NotificationMarkReadView.as_view(), name='notification-mark-read'),
    path('notifications/read-all', NotificationReadAllView.as_view(), name='notifications-read-all'),
    
    # Recruiter Specific
    path('recruiter/applicants', RecruiterApplicantsView.as_view(), name='recruiter-applicants'),
    path('recruiter/applications/<str:id>/status', RecruiterApplicationStatusView.as_view(), name='recruiter-application-status'),
    path('recruiter/analytics', RecruiterAnalyticsView.as_view(), name='recruiter-analytics'),
    
    # Matches
    path('matches', MatchListView.as_view(), name='matches'),
]
