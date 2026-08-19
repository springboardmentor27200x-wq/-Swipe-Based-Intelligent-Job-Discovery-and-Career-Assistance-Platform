from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Profile, Job, Match, Notification

User = get_user_model()

class ProfileSerializer(serializers.ModelSerializer):
    fullName = serializers.CharField(source='full_name', required=False, allow_blank=True, allow_null=True)
    avatarUrl = serializers.CharField(source='avatar_url', required=False, allow_blank=True, allow_null=True)
    dateOfBirth = serializers.CharField(source='date_of_birth', required=False, allow_blank=True, allow_null=True)
    experienceYears = serializers.CharField(source='experience_years', required=False, allow_blank=True, allow_null=True)
    targetDomain = serializers.CharField(source='target_domain', required=False, allow_blank=True, allow_null=True)
    portfolioUrl = serializers.CharField(source='portfolio_url', required=False, allow_blank=True, allow_null=True)
    githubUrl = serializers.CharField(source='github_url', required=False, allow_blank=True, allow_null=True)
    linkedinUrl = serializers.CharField(source='linkedin_url', required=False, allow_blank=True, allow_null=True)
    resumeUrl = serializers.CharField(source='resume_url', required=False, allow_blank=True, allow_null=True)
    resumeName = serializers.CharField(source='resume_name', required=False, allow_blank=True, allow_null=True)
    resumeText = serializers.CharField(source='resume_text', required=False, allow_blank=True, allow_null=True)
    companyName = serializers.CharField(source='company_name', required=False, allow_blank=True, allow_null=True)
    companyWebsite = serializers.CharField(source='company_website', required=False, allow_blank=True, allow_null=True)

    class Meta:
        model = Profile
        fields = [
            'full_name', 'title', 'bio', 'avatar_url', 'skills', 
            'date_of_birth', 'phone', 'location', 'education', 'experience_years', 'target_domain',
            'portfolio_url', 'github_url', 'linkedin_url',
            'resume_url', 'resume_name', 'resume_text', 'company_name', 'company_website',
            'fullName', 'avatarUrl', 'dateOfBirth', 'experienceYears', 'targetDomain',
            'portfolioUrl', 'githubUrl', 'linkedinUrl',
            'resumeUrl', 'resumeName', 'resumeText', 'companyName', 'companyWebsite'
        ]

class UserSerializer(serializers.ModelSerializer):
    profile = ProfileSerializer(read_only=True)
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)
    
    class Meta:
        model = User
        fields = ['id', 'email', 'role', 'profile', 'created_at', 'createdAt']

class UserRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    fullName = serializers.CharField(write_only=True)
    dateOfBirth = serializers.CharField(write_only=True, required=False, allow_blank=True, allow_null=True)
    phone = serializers.CharField(write_only=True, required=False, allow_blank=True, allow_null=True)
    
    class Meta:
        model = User
        fields = ['email', 'password', 'role', 'fullName', 'dateOfBirth', 'phone']
        
    def create(self, validated_data):
        password = validated_data.pop('password')
        fullName = validated_data.pop('fullName')
        date_of_birth = validated_data.pop('dateOfBirth', None)
        phone = validated_data.pop('phone', None)
        email = validated_data.get('email')
        role = validated_data.get('role', 'job_seeker')
        
        user = User.objects.create_user(
            email=email,
            password=password,
            role=role
        )
        
        # Profile is created by signal, now update details
        profile = user.profile
        profile.full_name = fullName
        if date_of_birth:
            profile.date_of_birth = date_of_birth
        if phone:
            profile.phone = phone
        if role == 'recruiter':
            profile.company_name = "My Tech Startup"
            profile.company_website = "https://example.com"
        profile.save()
        
        return user

class JobSerializer(serializers.ModelSerializer):
    recruiterId = serializers.UUIDField(source='recruiter.id', read_only=True)
    companyName = serializers.CharField(source='company_name')
    companyLogo = serializers.CharField(source='company_logo', required=False, allow_blank=True, allow_null=True)
    salaryRange = serializers.CharField(source='salary_range', required=False, allow_blank=True, allow_null=True)
    salaryMin = serializers.IntegerField(source='salary_min', required=False, allow_null=True)
    salaryMax = serializers.IntegerField(source='salary_max', required=False, allow_null=True)
    requiredSkills = serializers.JSONField(source='required_skills')
    organizationType = serializers.CharField(source='organization_type', required=False)
    jobType = serializers.CharField(source='job_type', required=False)
    experienceLevel = serializers.CharField(source='experience_level', required=False)
    isFresherFriendly = serializers.BooleanField(source='is_fresher_friendly', required=False)
    applicantCount = serializers.IntegerField(source='applicant_count', required=False)
    competitionLevel = serializers.CharField(source='competition_level', required=False)
    isActive = serializers.BooleanField(source='is_active', required=False)

    class Meta:
        model = Job
        fields = [
            'id', 'recruiter', 'recruiterId', 'title', 'company_name', 'companyName', 
            'company_logo', 'companyLogo', 'description', 'salary_range', 'salaryRange', 
            'salary_min', 'salaryMin', 'salary_max', 'salaryMax', 'location', 
            'required_skills', 'requiredSkills', 'organization_type', 'organizationType', 
            'job_type', 'jobType', 'experience_level', 'experienceLevel', 
            'is_fresher_friendly', 'isFresherFriendly', 'applicant_count', 'applicantCount', 
            'competition_level', 'competitionLevel', 'is_active', 'isActive', 'created_at'
        ]
        read_only_fields = ['id', 'recruiter', 'created_at']

class MatchSerializer(serializers.ModelSerializer):
    job = JobSerializer(read_only=True)
    candidate = serializers.SerializerMethodField()
    swipedAt = serializers.DateTimeField(source='created_at', read_only=True)
    appliedAt = serializers.DateTimeField(source='applied_at', read_only=True)
    coverNote = serializers.CharField(source='cover_note', read_only=True)
    recruiterFeedback = serializers.CharField(source='recruiter_feedback', read_only=True)
    interviewDate = serializers.CharField(source='interview_date', read_only=True)
    interviewType = serializers.CharField(source='interview_type', read_only=True)
    
    class Meta:
        model = Match
        fields = [
            'id', 'job', 'candidate', 'status', 'seeker_feedback', 'recruiter_feedback', 
            'cover_note', 'coverNote', 'recruiterFeedback', 'interview_date', 'interviewDate',
            'interview_type', 'interviewType', 'applied_at', 'appliedAt', 'created_at', 'swipedAt'
        ]
        
    def get_candidate(self, obj):
        return {
            'id': str(obj.seeker.id),
            'email': obj.seeker.email,
            'profile': ProfileSerializer(obj.seeker.profile).data
        }

class NotificationSerializer(serializers.ModelSerializer):
    isRead = serializers.BooleanField(source='is_read')
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)

    class Meta:
        model = Notification
        fields = ['id', 'type', 'title', 'message', 'link', 'is_read', 'isRead', 'badge', 'created_at', 'createdAt']
