from django.urls import path
from . import views

urlpatterns = [
    path('me/', views.MeView.as_view(), name='user_me'),
    path('profile/', views.JobSeekerProfileView.as_view(), name='jobseeker_profile'),
    path('recruiter-profile/', views.RecruiterProfileView.as_view(), name='recruiter_profile'),
]
