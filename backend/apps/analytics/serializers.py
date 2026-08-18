from rest_framework import serializers
from .models import SkillGapSnapshot


class SkillGapSnapshotSerializer(serializers.ModelSerializer):
    job_title = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model  = SkillGapSnapshot
        fields = [
            'id', 'job', 'job_title', 'matched_skills', 'missing_skills',
            'priority_skills', 'learning_suggestions', 'match_percentage', 'created_at',
        ]
        read_only_fields = fields

    def get_job_title(self, obj):
        return obj.job.title if obj.job_id else None
