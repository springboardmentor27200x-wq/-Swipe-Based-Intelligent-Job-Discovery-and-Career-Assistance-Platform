"""Jobs app URL configuration — Milestone 2 Final."""

from django.urls import path
from . import views

urlpatterns = [
    # ── Skills ────────────────────────────────────────────────────────────────
    path('skills/', views.skill_list, name='skill_list'),

    # ── Companies ─────────────────────────────────────────────────────────────
    path('companies/', views.CompanyListCreateView.as_view(), name='company_list_create'),
    path('companies/mine/', views.my_companies, name='my_companies'),
    path('companies/<uuid:pk>/', views.CompanyDetailView.as_view(), name='company_detail'),

    # ── Public job listing & detail ───────────────────────────────────────────
    path('', views.public_job_list, name='job_list'),
    path('<uuid:pk>/', views.public_job_detail, name='job_detail'),
    path('<uuid:pk>/apply/', views.apply_to_job, name='job_apply'),

    # ── Job Seeker — discovery ────────────────────────────────────────────────
    path('feed/', views.job_feed, name='job_feed'),
    path('recommended/', views.recommended_jobs, name='recommended_jobs'),
    path('latest/', views.latest_jobs, name='latest_jobs'),
    path('startups/', views.startup_jobs, name='startup_jobs'),
    path('mncs/', views.mnc_jobs, name='mnc_jobs'),

    # ── Job Seeker — actions ──────────────────────────────────────────────────
    path('swipe/', views.swipe, name='swipe'),
    path('swipe/history/', views.swipe_history, name='swipe_history'),
    path('saved/', views.saved_jobs, name='saved_jobs'),
    path('saved/<uuid:job_pk>/', views.unsave_job, name='unsave_job'),
    path('applications/', views.my_applications, name='my_applications'),
    path('seeker/stats/', views.seeker_dashboard_stats, name='seeker_stats'),

    # ── Recruiter — job management ────────────────────────────────────────────
    path('recruiter/jobs/', views.RecruiterJobListCreateView.as_view(), name='recruiter_job_list'),
    path('recruiter/jobs/<uuid:pk>/', views.RecruiterJobDetailView.as_view(), name='recruiter_job_detail'),
    path('recruiter/jobs/<uuid:pk>/publish/', views.publish_job, name='recruiter_job_publish'),
    path('recruiter/jobs/<uuid:pk>/close/', views.close_job, name='recruiter_job_close'),
    path('recruiter/jobs/<uuid:pk>/applicants/', views.recruiter_applicants, name='recruiter_applicants'),
    path('recruiter/jobs/<uuid:job_pk>/applicants/<uuid:app_pk>/', views.update_application_status, name='update_app_status'),
    path('recruiter/jobs/<uuid:job_pk>/applicants/<uuid:app_pk>/profile/', views.applicant_profile, name='applicant_profile'),
    path('recruiter/stats/', views.recruiter_dashboard_stats, name='recruiter_stats'),
]
