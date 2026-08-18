"""Serializers for the Resumes module — Milestone 3."""

from rest_framework import serializers
from .models import Resume, ATSScore


class ResumeSerializer(serializers.ModelSerializer):
    all_skills = serializers.ReadOnlyField()

    class Meta:
        model = Resume
        fields = [
            'id', 'file', 'original_filename', 'file_type', 'file_size',
            'is_primary',
            'parsed_name', 'parsed_email', 'parsed_phone',
            'parsed_skills', 'parsed_technologies', 'all_skills',
            'parsed_education', 'parsed_experience', 'parsed_projects',
            'parsed_certifications',
            'has_github_link', 'has_linkedin_link',
            'parsed_github_url', 'parsed_linkedin_url', 'estimated_years_experience',
            'parse_status', 'parse_error',
            'uploaded_at', 'updated_at',
        ]
        read_only_fields = [
            'id', 'file_type', 'file_size', 'parsed_name', 'parsed_email',
            'parsed_phone', 'parsed_skills', 'parsed_technologies',
            'parsed_education', 'parsed_experience', 'parsed_projects',
            'parsed_certifications', 'has_github_link', 'has_linkedin_link',
            'parsed_github_url', 'parsed_linkedin_url',
            'estimated_years_experience', 'parse_status', 'parse_error',
            'uploaded_at', 'updated_at',
        ]


class ResumeUploadSerializer(serializers.Serializer):
    file = serializers.FileField()

    def validate_file(self, value):
        name = value.name.lower()
        if name.endswith('.pdf'):
            self.file_type = 'pdf'
        elif name.endswith('.docx'):
            self.file_type = 'docx'
        else:
            raise serializers.ValidationError('Only .pdf and .docx resumes are supported.')

        max_size = 10 * 1024 * 1024  # 10 MB
        if value.size > max_size:
            raise serializers.ValidationError('File too large — maximum size is 10MB.')
        return value


class ATSScoreSerializer(serializers.ModelSerializer):
    compatibility_label = serializers.ReadOnlyField()
    job_title = serializers.CharField(source='job.title', read_only=True)
    company_name = serializers.CharField(source='job.company.name', read_only=True)

    class Meta:
        model = ATSScore
        fields = [
            'id', 'job', 'job_title', 'company_name',
            'overall_score', 'compatibility_label',
            'skill_match', 'experience_match', 'keyword_match', 'education_match',
            'matched_skills', 'missing_skills', 'missing_keywords', 'suggestions',
            'computed_at',
        ]
        read_only_fields = fields
