from django.urls import path
from . import views

urlpatterns = [
    path('dashboard/seeker/', views.seeker_dashboard, name='seeker_dashboard'),
    path('dashboard/recruiter/', views.recruiter_dashboard, name='recruiter_dashboard'),
    path('analytics/', views.analytics_overview, name='analytics_overview'),
    path('application-history/', views.application_history, name='application_history'),
    path('skill-gap/', views.skill_gap, name='skill_gap'),
    path('skill-gap/history/', views.skill_gap_history, name='skill_gap_history'),
    path('recommendations/history/', views.recommendations_history, name='recommendations_history'),
]
