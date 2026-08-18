"""Resumes app URL configuration — Milestone 3."""

from django.urls import path
from . import views

urlpatterns = [
    path('upload/', views.upload_resume, name='resume_upload'),
    path('', views.list_resumes, name='resume_list'),
    path('primary/', views.primary_resume, name='resume_primary'),
    path('match/<uuid:job_id>/', views.resume_job_match, name='resume_job_match'),
    path('<uuid:pk>/', views.resume_detail, name='resume_detail'),
    path('<uuid:pk>/set-primary/', views.set_primary_resume, name='resume_set_primary'),
    path('<uuid:pk>/reparse/', views.reparse_resume, name='resume_reparse'),
]
