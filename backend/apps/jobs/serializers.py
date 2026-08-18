"""Serializers for the Jobs module — Milestone 2."""

from rest_framework import serializers
from .models import Company, Skill, Job, JobApplication, SwipeHistory, SavedJob, Recommendation


# ── Skill ─────────────────────────────────────────────────────────────────────
class SkillSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Skill
        fields = ['id', 'name', 'slug']
        read_only_fields = ['slug']


# ── Company ───────────────────────────────────────────────────────────────────
class CompanySerializer(serializers.ModelSerializer):
    recruiter_email = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model  = Company
        fields = [
            'id', 'name', 'slug', 'logo', 'cover_image', 'company_type',
            'industry', 'description', 'website', 'headquarters',
            'company_size', 'founded_year', 'linkedin', 'twitter',
            'is_verified', 'created_at', 'updated_at', 'recruiter_email',
        ]
        read_only_fields = ['id', 'slug', 'is_verified', 'created_at', 'updated_at', 'recruiter_email']

    def get_recruiter_email(self, obj):
        return obj.recruiter.email if obj.recruiter else None


class CompanyMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Company
        fields = ['id', 'name', 'slug', 'logo', 'company_type', 'industry', 'headquarters']


# ── Job ───────────────────────────────────────────────────────────────────────
class JobSerializer(serializers.ModelSerializer):
    company_detail   = CompanyMiniSerializer(source='company', read_only=True)
    skills_required  = SkillSerializer(many=True, read_only=True)
    skills_preferred = SkillSerializer(many=True, read_only=True)

    # write-only skill name lists for create/update
    required_skill_names  = serializers.ListField(
        child=serializers.CharField(), write_only=True, required=False, default=list
    )
    preferred_skill_names = serializers.ListField(
        child=serializers.CharField(), write_only=True, required=False, default=list
    )

    is_saved    = serializers.SerializerMethodField()
    is_applied  = serializers.SerializerMethodField()
    match_score = serializers.SerializerMethodField()
    ats_score    = serializers.SerializerMethodField()
    ats_compatibility = serializers.SerializerMethodField()
    missing_skills    = serializers.SerializerMethodField()
    resume_suggestions = serializers.SerializerMethodField()

    class Meta:
        model  = Job
        fields = [
            'id', 'title', 'description', 'requirements', 'benefits',
            'company', 'company_detail',
            'skills_required', 'skills_preferred',
            'required_skill_names', 'preferred_skill_names',
            'salary_min', 'salary_max', 'salary_currency', 'salary_visible',
            'job_type', 'work_mode', 'experience_level', 'location', 'openings',
            'status', 'deadline', 'is_fresher_friendly',
            'applicant_count', 'competition_level',
            'created_at', 'updated_at', 'published_at',
            'is_saved', 'is_applied', 'match_score',
            'ats_score', 'ats_compatibility', 'missing_skills', 'resume_suggestions',
        ]
        read_only_fields = [
            'id', 'applicant_count', 'competition_level',
            'created_at', 'updated_at', 'published_at',
            'company_detail', 'skills_required', 'skills_preferred',
        ]

    def get_is_saved(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated and request.user.is_job_seeker:
            return SavedJob.objects.filter(job_seeker=request.user, job=obj).exists()
        return False

    def get_is_applied(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated and request.user.is_job_seeker:
            return JobApplication.objects.filter(job_seeker=request.user, job=obj).exists()
        return False

    def get_match_score(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated and request.user.is_job_seeker:
            rec = Recommendation.objects.filter(job_seeker=request.user, job=obj).first()
            return rec.match_percentage if rec else None
        return None

    def _primary_resume(self):
        """Milestone 3: fetch the requester's primary resume, if any."""
        request = self.context.get('request')
        if not request or not request.user.is_authenticated or not request.user.is_job_seeker:
            return None
        try:
            from apps.resumes.services import get_primary_resume
            return get_primary_resume(request.user)
        except Exception:
            return None

    def _ats_for(self, obj):
        resume = self._primary_resume()
        if not resume:
            return None
        try:
            from apps.resumes.services import get_or_compute_ats
            return get_or_compute_ats(resume, obj)
        except Exception:
            return None

    def get_ats_score(self, obj):
        ats = self._ats_for(obj)
        return ats.overall_score if ats else None

    def get_ats_compatibility(self, obj):
        ats = self._ats_for(obj)
        return ats.compatibility_label if ats else None

    def get_missing_skills(self, obj):
        ats = self._ats_for(obj)
        return ats.missing_skills if ats else None

    def get_resume_suggestions(self, obj):
        ats = self._ats_for(obj)
        return ats.suggestions if ats else None

    def _get_or_create_skills(self, names):
        from django.utils.text import slugify
        skills = []
        for name in names:
            name = name.strip()
            if name:
                slug = slugify(name)
                skill, _ = Skill.objects.get_or_create(slug=slug, defaults={'name': name})
                skills.append(skill)
        return skills

    def create(self, validated_data):
        req_names  = validated_data.pop('required_skill_names', [])
        pref_names = validated_data.pop('preferred_skill_names', [])
        job = Job.objects.create(**validated_data)
        job.skills_required.set(self._get_or_create_skills(req_names))
        job.skills_preferred.set(self._get_or_create_skills(pref_names))
        return job

    def update(self, instance, validated_data):
        req_names  = validated_data.pop('required_skill_names', None)
        pref_names = validated_data.pop('preferred_skill_names', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if req_names is not None:
            instance.skills_required.set(self._get_or_create_skills(req_names))
        if pref_names is not None:
            instance.skills_preferred.set(self._get_or_create_skills(pref_names))
        return instance


class JobListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for job feed / lists."""
    company_name = serializers.CharField(source='company.name', read_only=True)
    company_logo = serializers.ImageField(source='company.logo', read_only=True)
    company_type = serializers.CharField(source='company.company_type', read_only=True)
    skills       = serializers.SerializerMethodField()
    is_saved     = serializers.SerializerMethodField()
    is_applied   = serializers.SerializerMethodField()
    match_score  = serializers.SerializerMethodField()
    ats_score    = serializers.SerializerMethodField()
    ats_compatibility = serializers.SerializerMethodField()
    missing_skills = serializers.SerializerMethodField()

    class Meta:
        model  = Job
        fields = [
            'id', 'title', 'company', 'company_name', 'company_logo', 'company_type',
            'skills', 'salary_min', 'salary_max', 'salary_visible',
            'job_type', 'work_mode', 'experience_level', 'location',
            'status', 'applicant_count', 'competition_level',
            'is_fresher_friendly', 'deadline',
            'created_at', 'published_at',
            'is_saved', 'is_applied', 'match_score',
            'ats_score', 'ats_compatibility', 'missing_skills',
        ]

    def get_skills(self, obj):
        return list(obj.skills_required.values_list('name', flat=True))

    def get_is_saved(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated and request.user.is_job_seeker:
            return SavedJob.objects.filter(job_seeker=request.user, job=obj).exists()
        return False

    def get_is_applied(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated and request.user.is_job_seeker:
            return JobApplication.objects.filter(job_seeker=request.user, job=obj).exists()
        return False

    def get_match_score(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated and request.user.is_job_seeker:
            rec = Recommendation.objects.filter(job_seeker=request.user, job=obj).first()
            return rec.match_percentage if rec else None
        return None

    def _primary_resume(self):
        """Milestone 3: fetch + cache the requester's primary resume once per request."""
        request = self.context.get('request')
        if not request or not request.user.is_authenticated or not request.user.is_job_seeker:
            return None
        if '_primary_resume_cache' not in self.context:
            try:
                from apps.resumes.services import get_primary_resume
                self.context['_primary_resume_cache'] = get_primary_resume(request.user)
            except Exception:
                self.context['_primary_resume_cache'] = None
        return self.context['_primary_resume_cache']

    def _ats_for(self, obj):
        resume = self._primary_resume()
        if not resume:
            return None
        cache_key = f'_ats_cache_{obj.pk}'
        if cache_key not in self.context:
            try:
                from apps.resumes.services import get_or_compute_ats
                self.context[cache_key] = get_or_compute_ats(resume, obj)
            except Exception:
                self.context[cache_key] = None
        return self.context[cache_key]

    def get_ats_score(self, obj):
        ats = self._ats_for(obj)
        return ats.overall_score if ats else None

    def get_ats_compatibility(self, obj):
        ats = self._ats_for(obj)
        return ats.compatibility_label if ats else None

    def get_missing_skills(self, obj):
        ats = self._ats_for(obj)
        return ats.missing_skills if ats else None


# ── Application ───────────────────────────────────────────────────────────────
class JobApplicationSerializer(serializers.ModelSerializer):
    job_detail     = JobListSerializer(source='job', read_only=True)
    seeker_email   = serializers.EmailField(source='job_seeker.email', read_only=True)
    seeker_name    = serializers.SerializerMethodField(read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    ats_score      = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model  = JobApplication
        fields = [
            'id', 'job', 'job_detail', 'job_seeker', 'seeker_email', 'seeker_name',
            'status', 'status_display', 'status_history', 'cover_note', 'resume_url',
            'ats_score', 'applied_at', 'updated_at',
        ]
        read_only_fields = ['id', 'job_seeker', 'status_history', 'applied_at', 'updated_at']

    def get_seeker_name(self, obj):
        return obj.job_seeker.full_name

    def get_ats_score(self, obj):
        """Milestone 3.1 — resume ↔ this job compatibility, for quick scanning in the applicant list."""
        try:
            from apps.resumes.models import Resume
            from apps.resumes.services import get_or_compute_ats
            resume = Resume.objects.filter(user=obj.job_seeker, is_primary=True,
                                            parse_status=Resume.ParseStatus.SUCCESS).first()
            if not resume:
                return None
            return get_or_compute_ats(resume, obj.job).overall_score
        except Exception:
            return None


# ── Swipe ─────────────────────────────────────────────────────────────────────
class SwipeSerializer(serializers.Serializer):
    """Incoming swipe action payload."""
    job_id    = serializers.UUIDField()
    direction = serializers.ChoiceField(choices=SwipeHistory.Direction.choices)
    apply     = serializers.BooleanField(default=False)
    save      = serializers.BooleanField(default=False)


class SwipeHistorySerializer(serializers.ModelSerializer):
    job_detail = JobListSerializer(source='job', read_only=True)

    class Meta:
        model  = SwipeHistory
        fields = ['id', 'job', 'job_detail', 'direction', 'swiped_at']
        read_only_fields = ['id', 'swiped_at']


# ── Saved Job ─────────────────────────────────────────────────────────────────
class SavedJobSerializer(serializers.ModelSerializer):
    job_detail = JobListSerializer(source='job', read_only=True)

    class Meta:
        model  = SavedJob
        fields = ['id', 'job', 'job_detail', 'saved_at']
        read_only_fields = ['id', 'saved_at']


# ── Recommendation ────────────────────────────────────────────────────────────
class RecommendationSerializer(serializers.ModelSerializer):
    job_detail = JobListSerializer(source='job', read_only=True)

    class Meta:
        model  = Recommendation
        fields = ['id', 'job', 'job_detail', 'score', 'match_percentage', 'reasons', 'explanation', 'generated_at']
        read_only_fields = ['id', 'generated_at']
