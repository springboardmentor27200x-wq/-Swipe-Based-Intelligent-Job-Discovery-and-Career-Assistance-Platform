from rest_framework import serializers
from .models import Job
from .models import Application, Notification

class ApplicationSerializer(serializers.ModelSerializer):
    job_title = serializers.CharField(source="job.title", read_only=True)
    company = serializers.CharField(source="job.company.name", read_only=True)
    location = serializers.CharField(source="job.location", read_only=True)

    class Meta:
        model = Application
        fields = "__all__"


class JobSerializer(serializers.ModelSerializer):

    company_name = serializers.CharField(
        source="company.name",
        read_only=True
    )

    applicant_count = serializers.SerializerMethodField()
    competition = serializers.SerializerMethodField()

    class Meta:
        model = Job
        fields = "__all__"

    def get_applicant_count(self, obj):
        return Application.objects.filter(job=obj).count()

    def get_competition(self, obj):
        count = Application.objects.filter(job=obj).count()

        if count <= 2:
            return "Low"
        elif count <= 5:
            return "Medium"
        else:
            return "High"

from rest_framework import serializers
from .models import SavedJob

class SavedJobSerializer(serializers.ModelSerializer):

    job_title = serializers.CharField(source="job.title", read_only=True)
    company = serializers.CharField(source="job.company.name", read_only=True)
    location = serializers.CharField(source="job.location", read_only=True)
    salary = serializers.DecimalField(
        source="job.salary",
        max_digits=10,
        decimal_places=2,
        read_only=True
    )

    class Meta:
        model = SavedJob
        fields = [
            "id",
            "user",
            "job",
            "saved_at",
            "job_title",
            "company",
            "location",
            "salary",
        ]
        read_only_fields = ["user"]

class NotificationSerializer(serializers.ModelSerializer):

    class Meta:
        model = Notification
        fields = "__all__"
        read_only_fields = ["user"]