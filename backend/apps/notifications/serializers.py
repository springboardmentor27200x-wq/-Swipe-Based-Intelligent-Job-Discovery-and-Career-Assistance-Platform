from rest_framework import serializers
from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    type_display = serializers.CharField(source='get_type_display', read_only=True)
    job_title    = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model  = Notification
        fields = [
            'id', 'title', 'message', 'type', 'type_display', 'priority',
            'link', 'job', 'job_title', 'application',
            'is_read', 'read_at', 'created_at',
        ]
        read_only_fields = fields

    def get_job_title(self, obj):
        return obj.job.title if obj.job_id else None
