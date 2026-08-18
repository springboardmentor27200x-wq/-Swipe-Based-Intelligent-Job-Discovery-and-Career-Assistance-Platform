from django.urls import path
from .views import RegisterView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import RegisterView, JobSeekerProfileCreateView
from .views import CurrentUserView
from .views import JobSeekerProfileView
from .views import ATSScoreView

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', TokenObtainPairView.as_view(), name='login'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('jobseeker/', JobSeekerProfileCreateView.as_view(), name='jobseeker'),
    path("me/", CurrentUserView.as_view(), name="current-user"),
    path('profile/', JobSeekerProfileView.as_view(), name='profile'),
    path('ats-score/<int:job_id>/', ATSScoreView.as_view(), name='ats-score'),
]
