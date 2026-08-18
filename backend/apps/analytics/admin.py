from django.contrib import admin
from .models import SkillGapSnapshot


@admin.register(SkillGapSnapshot)
class SkillGapSnapshotAdmin(admin.ModelAdmin):
    list_display = ('job_seeker', 'job', 'match_percentage', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('job_seeker__email', 'job__title')
    readonly_fields = ('id', 'created_at')
