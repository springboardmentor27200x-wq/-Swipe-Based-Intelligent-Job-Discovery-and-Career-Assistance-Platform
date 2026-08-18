"""Django admin configuration for Resumes app — Milestone 3."""

from django.contrib import admin
from .models import Resume, ATSScore


@admin.register(Resume)
class ResumeAdmin(admin.ModelAdmin):
    list_display = ['user', 'original_filename', 'file_type', 'is_primary', 'parse_status', 'uploaded_at']
    list_filter = ['file_type', 'is_primary', 'parse_status']
    search_fields = ['user__email', 'original_filename', 'parsed_name']
    readonly_fields = ['id', 'uploaded_at', 'updated_at', 'raw_text']


@admin.register(ATSScore)
class ATSScoreAdmin(admin.ModelAdmin):
    list_display = ['resume', 'job', 'overall_score', 'compatibility_label', 'computed_at']
    search_fields = ['resume__user__email', 'job__title']
    readonly_fields = ['id', 'computed_at']
