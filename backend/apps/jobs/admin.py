"""Django admin configuration for Jobs app — Milestone 2."""

from django.contrib import admin
from .models import Company, Skill, Job, JobApplication, SwipeHistory, SavedJob, Recommendation


@admin.register(Skill)
class SkillAdmin(admin.ModelAdmin):
    list_display  = ['name', 'slug', 'created_at']
    search_fields = ['name']
    prepopulated_fields = {'slug': ('name',)}


@admin.register(Company)
class CompanyAdmin(admin.ModelAdmin):
    list_display   = ['name', 'company_type', 'industry', 'headquarters', 'is_verified', 'recruiter']
    list_filter    = ['company_type', 'is_verified', 'company_size']
    search_fields  = ['name', 'industry', 'headquarters']
    readonly_fields = ['id', 'slug', 'created_at', 'updated_at']
    list_editable  = ['is_verified']


class SkillInline(admin.TabularInline):
    model = Job.skills_required.through
    extra = 1
    verbose_name = 'Required Skill'


@admin.register(Job)
class JobAdmin(admin.ModelAdmin):
    list_display   = ['title', 'company', 'recruiter', 'status', 'job_type', 'work_mode',
                      'experience_level', 'competition_level', 'applicant_count', 'published_at']
    list_filter    = ['status', 'job_type', 'work_mode', 'experience_level', 'competition_level']
    search_fields  = ['title', 'company__name', 'location']
    readonly_fields = ['id', 'applicant_count', 'competition_level', 'created_at', 'updated_at', 'published_at']
    filter_horizontal = ['skills_required', 'skills_preferred']
    list_editable  = ['status']
    ordering       = ['-created_at']

    fieldsets = (
        ('Core', {'fields': ('id', 'recruiter', 'company', 'title', 'description', 'requirements', 'benefits')}),
        ('Skills', {'fields': ('skills_required', 'skills_preferred')}),
        ('Compensation', {'fields': ('salary_min', 'salary_max', 'salary_currency', 'salary_visible')}),
        ('Classification', {'fields': ('job_type', 'work_mode', 'experience_level', 'location', 'openings', 'is_fresher_friendly')}),
        ('Status', {'fields': ('status', 'deadline', 'applicant_count', 'competition_level')}),
        ('Timestamps', {'fields': ('created_at', 'updated_at', 'published_at')}),
    )


@admin.register(JobApplication)
class JobApplicationAdmin(admin.ModelAdmin):
    list_display   = ['job_seeker', 'job', 'status', 'applied_at']
    list_filter    = ['status']
    search_fields  = ['job_seeker__email', 'job__title']
    readonly_fields = ['id', 'applied_at', 'updated_at']
    list_editable  = ['status']


@admin.register(SwipeHistory)
class SwipeHistoryAdmin(admin.ModelAdmin):
    list_display   = ['job_seeker', 'job', 'direction', 'swiped_at']
    list_filter    = ['direction']
    search_fields  = ['job_seeker__email', 'job__title']
    readonly_fields = ['id', 'swiped_at']


@admin.register(SavedJob)
class SavedJobAdmin(admin.ModelAdmin):
    list_display   = ['job_seeker', 'job', 'saved_at']
    search_fields  = ['job_seeker__email', 'job__title']
    readonly_fields = ['id', 'saved_at']


@admin.register(Recommendation)
class RecommendationAdmin(admin.ModelAdmin):
    list_display   = ['job_seeker', 'job', 'score', 'match_percentage', 'generated_at']
    list_filter    = []
    search_fields  = ['job_seeker__email', 'job__title']
    readonly_fields = ['id', 'generated_at', 'match_percentage']
