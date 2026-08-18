"""
SwipeX Jobs Views — Milestone 2
Recruiter: CRUD jobs + company
Job Seeker: feed, swipe, save, apply, search, filter, recommendations
"""

from rest_framework import generics, status, filters
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db.models import Q

from apps.users.permissions import IsJobSeeker, IsRecruiter, IsRecruiterOrAdmin
from .models import Company, Job, JobApplication, SwipeHistory, SavedJob, Recommendation, Skill
from .serializers import (
    CompanySerializer, JobSerializer, JobListSerializer,
    JobApplicationSerializer, SwipeSerializer, SwipeHistorySerializer,
    SavedJobSerializer, RecommendationSerializer, SkillSerializer,
)
from .services import get_job_feed, generate_recommendations_for_user


# ══════════════════════════════════════════════════════════════════════════════
# SKILL endpoints
# ══════════════════════════════════════════════════════════════════════════════

@api_view(['GET'])
@permission_classes([AllowAny])
def skill_list(request):
    """GET /api/v1/jobs/skills/?search=py"""
    qs = Skill.objects.all()
    q  = request.query_params.get('search')
    if q:
        qs = qs.filter(name__icontains=q)
    return Response({'success': True, 'data': SkillSerializer(qs[:50], many=True).data})


# ══════════════════════════════════════════════════════════════════════════════
# COMPANY endpoints
# ══════════════════════════════════════════════════════════════════════════════

class CompanyListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/v1/jobs/companies/   — public list
    POST /api/v1/jobs/companies/   — recruiter creates company
    """
    serializer_class = CompanySerializer

    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsAuthenticated(), IsRecruiter()]

    def get_queryset(self):
        return Company.objects.all().order_by('name')

    def perform_create(self, serializer):
        serializer.save(recruiter=self.request.user)

    def list(self, request, *args, **kwargs):
        qs   = self.get_queryset()
        data = CompanySerializer(qs, many=True, context={'request': request}).data
        return Response({'success': True, 'data': data})

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response({'success': True, 'data': serializer.data}, status=status.HTTP_201_CREATED)


class CompanyDetailView(generics.RetrieveUpdateDestroyAPIView):
    """GET/PATCH/DELETE /api/v1/jobs/companies/<pk>/"""
    serializer_class = CompanySerializer
    lookup_field     = 'pk'

    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsAuthenticated(), IsRecruiter()]

    def get_queryset(self):
        if self.request.method == 'GET':
            return Company.objects.all()
        return Company.objects.filter(recruiter=self.request.user)

    def retrieve(self, request, *args, **kwargs):
        obj  = self.get_object()
        data = CompanySerializer(obj, context={'request': request}).data
        return Response({'success': True, 'data': data})

    def update(self, request, *args, **kwargs):
        partial    = kwargs.pop('partial', False)
        obj        = self.get_object()
        serializer = self.get_serializer(obj, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({'success': True, 'data': serializer.data})

    def destroy(self, request, *args, **kwargs):
        self.get_object().delete()
        return Response({'success': True, 'message': 'Company deleted.'}, status=status.HTTP_204_NO_CONTENT)


# ══════════════════════════════════════════════════════════════════════════════
# RECRUITER — Job CRUD
# ══════════════════════════════════════════════════════════════════════════════

class RecruiterJobListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/v1/jobs/recruiter/jobs/   — list own jobs
    POST /api/v1/jobs/recruiter/jobs/   — create job
    """
    permission_classes = [IsAuthenticated, IsRecruiter]
    serializer_class   = JobSerializer

    def get_queryset(self):
        return Job.objects.filter(recruiter=self.request.user).select_related('company').prefetch_related('skills_required')

    def list(self, request, *args, **kwargs):
        qs   = self.get_queryset()
        data = JobListSerializer(qs, many=True, context={'request': request}).data
        return Response({'success': True, 'data': data, 'count': len(data)})

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        job = serializer.save(recruiter=request.user)
        return Response(
            {'success': True, 'data': JobSerializer(job, context={'request': request}).data},
            status=status.HTTP_201_CREATED
        )


class RecruiterJobDetailView(generics.RetrieveUpdateDestroyAPIView):
    """GET/PATCH/DELETE /api/v1/jobs/recruiter/jobs/<pk>/"""
    permission_classes = [IsAuthenticated, IsRecruiter]
    serializer_class   = JobSerializer
    lookup_field       = 'pk'

    def get_queryset(self):
        return Job.objects.filter(recruiter=self.request.user)

    def retrieve(self, request, *args, **kwargs):
        obj  = self.get_object()
        data = JobSerializer(obj, context={'request': request}).data
        return Response({'success': True, 'data': data})

    def update(self, request, *args, **kwargs):
        partial    = kwargs.pop('partial', True)
        obj        = self.get_object()
        serializer = self.get_serializer(obj, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({'success': True, 'data': serializer.data})

    def destroy(self, request, *args, **kwargs):
        self.get_object().delete()
        return Response({'success': True, 'message': 'Job deleted.'}, status=status.HTTP_204_NO_CONTENT)


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsRecruiter])
def publish_job(request, pk):
    """POST /api/v1/jobs/recruiter/jobs/<pk>/publish/"""
    job = get_object_or_404(Job, pk=pk, recruiter=request.user)
    if job.status == Job.Status.PUBLISHED:
        return Response({'success': False, 'error': {'message': 'Job already published.'}},
                        status=status.HTTP_400_BAD_REQUEST)
    job.publish()
    return Response({'success': True, 'message': 'Job published.', 'data': JobSerializer(job).data})


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsRecruiter])
def close_job(request, pk):
    """POST /api/v1/jobs/recruiter/jobs/<pk>/close/"""
    job = get_object_or_404(Job, pk=pk, recruiter=request.user)
    job.close()
    return Response({'success': True, 'message': 'Job closed.', 'data': JobSerializer(job).data})


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsRecruiter])
def recruiter_applicants(request, pk):
    """GET /api/v1/jobs/recruiter/jobs/<pk>/applicants/"""
    job = get_object_or_404(Job, pk=pk, recruiter=request.user)
    apps = JobApplication.objects.filter(job=job).select_related('job_seeker')
    return Response({'success': True, 'data': JobApplicationSerializer(apps, many=True, context={'request': request}).data})


@api_view(['PATCH'])
@permission_classes([IsAuthenticated, IsRecruiter])
def update_application_status(request, job_pk, app_pk):
    """
    PATCH /api/v1/jobs/recruiter/jobs/<job_pk>/applicants/<app_pk>/
    Body: { status, note? }
    Advances the applicant through the recruitment pipeline (Applied →
    Resume Reviewed → Shortlisted → Interview Scheduled → Interview
    Completed → Offered → Accepted/Rejected) and records the change in
    status_history for a full audit trail.
    """
    job = get_object_or_404(Job, pk=job_pk, recruiter=request.user)
    app = get_object_or_404(JobApplication, pk=app_pk, job=job)
    new_status = request.data.get('status')
    if new_status not in [s[0] for s in JobApplication.Status.choices]:
        return Response({'success': False, 'error': {'message': 'Invalid status.'}},
                        status=status.HTTP_400_BAD_REQUEST)
    note = request.data.get('note', '')
    app.record_status_change(new_status, note=note)
    return Response({'success': True, 'data': JobApplicationSerializer(app, context={'request': request}).data})


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsRecruiter])
def applicant_profile(request, job_pk, app_pk):
    """
    GET /api/v1/jobs/recruiter/jobs/<job_pk>/applicants/<app_pk>/profile/

    Full applicant profile for a recruiter to make a shortlist/interview/
    offer/reject decision: personal details, parsed resume (education,
    experience, projects, skills, certifications), resume file for
    preview/download, ATS score & compatibility against THIS job, matched /
    missing skills, resume suggestions, and the application's status +
    full status history.
    """
    job = get_object_or_404(Job, pk=job_pk, recruiter=request.user)
    app = get_object_or_404(JobApplication.objects.select_related('job_seeker', 'job_seeker__profile'), pk=app_pk, job=job)
    seeker = app.job_seeker
    profile = getattr(seeker, 'profile', None)

    resume = None
    resume_data = None
    ats_data = None
    try:
        from apps.resumes.models import Resume
        from apps.resumes.serializers import ResumeSerializer
        from apps.resumes.services import get_or_compute_ats

        resume = Resume.objects.filter(user=seeker, is_primary=True).first()
        if resume:
            resume_data = ResumeSerializer(resume, context={'request': request}).data
            if resume.parse_status == Resume.ParseStatus.SUCCESS:
                from apps.resumes.serializers import ATSScoreSerializer
                ats = get_or_compute_ats(resume, job)
                ats_data = ATSScoreSerializer(ats, context={'request': request}).data
    except Exception:
        pass

    personal = {
        'full_name': seeker.full_name,
        'email': seeker.email,
        'phone': (profile.phone if profile else '') or (resume.parsed_phone if resume else ''),
        'location': profile.location if profile else '',
        'headline': profile.headline if profile else '',
        'bio': profile.bio if profile else '',
        'linkedin': (profile.linkedin if profile else '') or (resume.parsed_linkedin_url if resume else ''),
        'github': (profile.github if profile else '') or (resume.parsed_github_url if resume else ''),
        'website': profile.website if profile else '',
        'years_of_experience': profile.years_of_experience if profile else (resume.estimated_years_experience if resume else 0),
        'current_ctc': profile.current_ctc if profile else None,
        'expected_ctc': profile.expected_ctc if profile else None,
    }

    data = {
        'application': {
            'id': str(app.id),
            'status': app.status,
            'status_display': app.get_status_display(),
            'status_history': app.status_history,
            'cover_note': app.cover_note,
            'applied_at': app.applied_at,
            'updated_at': app.updated_at,
        },
        'job': {'id': str(job.id), 'title': job.title},
        'personal': personal,
        'resume': resume_data,
        'education': resume.parsed_education if resume else [],
        'experience': resume.parsed_experience if resume else [],
        'projects': resume.parsed_projects if resume else [],
        'skills': resume.all_skills if resume else [],
        'certifications': resume.parsed_certifications if resume else [],
        'ats': ats_data,
    }
    return Response({'success': True, 'data': data})


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsRecruiter])
def recruiter_dashboard_stats(request):
    """
    GET /api/v1/jobs/recruiter/stats/
    Milestone 3.1: extended with a recruitment-pipeline breakdown and the
    average ATS compatibility score across all applicants.
    """
    recruiter = request.user
    jobs      = Job.objects.filter(recruiter=recruiter)
    applications = JobApplication.objects.filter(job__recruiter=recruiter)
    total_applicants = applications.count()

    Status = JobApplication.Status
    new_applications = applications.filter(status=Status.PENDING).count()
    shortlisted      = applications.filter(status=Status.SHORTLISTED).count()
    interviews       = applications.filter(
        status__in=[Status.INTERVIEW_SCHEDULED, Status.INTERVIEW_COMPLETED]
    ).count()
    offers           = applications.filter(status__in=[Status.OFFERED, Status.ACCEPTED]).count()
    rejected         = applications.filter(status=Status.REJECTED).count()

    average_ats_score = None
    try:
        from apps.resumes.models import Resume
        from apps.resumes.services import get_or_compute_ats
        scores = []
        for app in applications.select_related('job', 'job_seeker'):
            resume = Resume.objects.filter(
                user=app.job_seeker, is_primary=True, parse_status=Resume.ParseStatus.SUCCESS
            ).first()
            if resume:
                scores.append(get_or_compute_ats(resume, app.job).overall_score)
        if scores:
            average_ats_score = round(sum(scores) / len(scores), 1)
    except Exception:
        pass

    return Response({'success': True, 'data': {
        'total_jobs':         jobs.count(),
        'active_jobs':        jobs.filter(status=Job.Status.PUBLISHED).count(),
        'draft_jobs':         jobs.filter(status=Job.Status.DRAFT).count(),
        'closed_jobs':        jobs.filter(status=Job.Status.CLOSED).count(),
        'total_applicants':   total_applicants,
        'new_applications':   new_applications,
        'shortlisted':        shortlisted,
        'interviews':         interviews,
        'offers':             offers,
        'rejected':           rejected,
        'average_ats_score':  average_ats_score,
    }})


# ══════════════════════════════════════════════════════════════════════════════
# JOB SEEKER — Discovery endpoints
# ══════════════════════════════════════════════════════════════════════════════

@api_view(['GET'])
@permission_classes([AllowAny])
def public_job_list(request):
    """
    GET /api/v1/jobs/
    Public job listing with search + filters.
    """
    qs     = Job.objects.filter(status=Job.Status.PUBLISHED)
    search = request.query_params.get('search')
    if search:
        qs = qs.filter(
            Q(title__icontains=search) |
            Q(company__name__icontains=search) |
            Q(skills_required__name__icontains=search)
        ).distinct()

    # filters
    for field in ['job_type', 'work_mode', 'experience_level', 'competition_level']:
        val = request.query_params.get(field)
        if val:
            qs = qs.filter(**{field: val})
    if request.query_params.get('company_type'):
        qs = qs.filter(company__company_type=request.query_params['company_type'])
    if request.query_params.get('location'):
        qs = qs.filter(location__icontains=request.query_params['location'])
    if request.query_params.get('skills'):
        skill_list = [s.strip() for s in request.query_params['skills'].split(',')]
        qs = qs.filter(skills_required__name__in=skill_list).distinct()
    if request.query_params.get('fresher_friendly') in ['true', '1']:
        qs = qs.filter(is_fresher_friendly=True)
    if request.query_params.get('low_competition') in ['true', '1']:
        qs = qs.filter(competition_level='low')
    if request.query_params.get('recently_posted') in ['true', '1']:
        from django.utils import timezone
        from datetime import timedelta
        qs = qs.filter(published_at__gte=timezone.now() - timedelta(days=7))
    if request.query_params.get('salary_min'):
        qs = qs.filter(salary_max__gte=int(request.query_params['salary_min']))
    if request.query_params.get('salary_max'):
        qs = qs.filter(salary_min__lte=int(request.query_params['salary_max']))

    qs = qs.select_related('company').prefetch_related('skills_required').order_by('-published_at')
    return Response({'success': True, 'data': JobListSerializer(qs, many=True, context={'request': request}).data, 'count': qs.count()})


@api_view(['GET'])
@permission_classes([AllowAny])
def public_job_detail(request, pk):
    """GET /api/v1/jobs/<pk>/"""
    job  = get_object_or_404(Job, pk=pk, status=Job.Status.PUBLISHED)
    data = JobSerializer(job, context={'request': request}).data
    return Response({'success': True, 'data': data})


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsJobSeeker])
def job_feed(request):
    """
    GET /api/v1/jobs/feed/
    Personalised feed — unswiped published jobs ranked by recommendation score.
    """
    filters = {k: v for k, v in request.query_params.items() if k not in ['search']}
    search  = request.query_params.get('search')
    qs      = get_job_feed(request.user, filters=filters or None, search=search or None)
    return Response({
        'success': True,
        'data': JobListSerializer(qs[:100], many=True, context={'request': request}).data
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsJobSeeker])
def recommended_jobs(request):
    """GET /api/v1/jobs/recommended/ — refresh and return top recommendations."""
    recs  = generate_recommendations_for_user(request.user)
    return Response({
        'success': True,
        'data': RecommendationSerializer(recs, many=True, context={'request': request}).data
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def latest_jobs(request):
    """GET /api/v1/jobs/latest/"""
    from django.utils import timezone
    from datetime import timedelta
    cutoff = timezone.now() - timedelta(days=7)
    qs     = Job.objects.filter(status=Job.Status.PUBLISHED, published_at__gte=cutoff).order_by('-published_at')[:20]
    return Response({'success': True, 'data': JobListSerializer(qs, many=True, context={'request': request}).data})


@api_view(['GET'])
@permission_classes([AllowAny])
def startup_jobs(request):
    """GET /api/v1/jobs/startups/"""
    qs = Job.objects.filter(status=Job.Status.PUBLISHED,
                            company__company_type__in=['startup', 'new_startup']
                            ).order_by('-published_at')[:50]
    return Response({'success': True, 'data': JobListSerializer(qs, many=True, context={'request': request}).data})


@api_view(['GET'])
@permission_classes([AllowAny])
def mnc_jobs(request):
    """GET /api/v1/jobs/mncs/"""
    qs = Job.objects.filter(status=Job.Status.PUBLISHED, company__company_type='mnc').order_by('-published_at')[:50]
    return Response({'success': True, 'data': JobListSerializer(qs, many=True, context={'request': request}).data})


# ══════════════════════════════════════════════════════════════════════════════
# SWIPE
# ══════════════════════════════════════════════════════════════════════════════

@api_view(['POST'])
@permission_classes([IsAuthenticated, IsJobSeeker])
def swipe(request):
    """
    POST /api/v1/jobs/swipe/
    Body: { job_id, direction, apply, save }
    """
    serializer = SwipeSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    data      = serializer.validated_data
    job       = get_object_or_404(Job, pk=data['job_id'], status=Job.Status.PUBLISHED)
    direction = data['direction']
    user      = request.user

    # Record / overwrite swipe
    swipe_obj, created = SwipeHistory.objects.update_or_create(
        job_seeker=user, job=job,
        defaults={'direction': direction}
    )

    result = {'swiped': direction, 'saved': False, 'applied': False}

    if direction in ('right', 'up'):
        # Auto-save on right swipe
        if data.get('save', True):
            SavedJob.objects.get_or_create(job_seeker=user, job=job)
            result['saved'] = True

        # Apply if requested
        if data.get('apply'):
            app, app_created = JobApplication.objects.get_or_create(
                job_seeker=user, job=job,
                defaults={'status': JobApplication.Status.PENDING}
            )
            if app_created:
                # update applicant count
                job.applicant_count = JobApplication.objects.filter(job=job).count()
                job.update_competition()
                job.save(update_fields=['applicant_count'])
            result['applied'] = True

    return Response({'success': True, 'data': result})


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsJobSeeker])
def swipe_history(request):
    """GET /api/v1/jobs/swipe/history/"""
    qs = SwipeHistory.objects.filter(job_seeker=request.user).select_related('job', 'job__company')[:100]
    return Response({'success': True, 'data': SwipeHistorySerializer(qs, many=True, context={'request': request}).data})


# ══════════════════════════════════════════════════════════════════════════════
# SAVED JOBS
# ══════════════════════════════════════════════════════════════════════════════

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsJobSeeker])
def saved_jobs(request):
    """GET /api/v1/jobs/saved/"""
    qs = SavedJob.objects.filter(job_seeker=request.user).select_related('job', 'job__company')
    return Response({'success': True, 'data': SavedJobSerializer(qs, many=True, context={'request': request}).data})


@api_view(['DELETE'])
@permission_classes([IsAuthenticated, IsJobSeeker])
def unsave_job(request, job_pk):
    """
    DELETE /api/v1/jobs/saved/<job_pk>/
    Removes the saved job AND the swipe history entry so the job
    reappears in the user's discover feed immediately.
    """
    saved = get_object_or_404(SavedJob, job_seeker=request.user, job_id=job_pk)
    saved.delete()
    # Remove swipe history so the feed includes this job again
    SwipeHistory.objects.filter(job_seeker=request.user, job_id=job_pk).delete()
    return Response(
        {'success': True, 'message': 'Job removed from saved list and will reappear in your feed.'},
        status=status.HTTP_204_NO_CONTENT
    )


# ══════════════════════════════════════════════════════════════════════════════
# APPLICATIONS
# ══════════════════════════════════════════════════════════════════════════════

@api_view(['POST'])
@permission_classes([IsAuthenticated, IsJobSeeker])
def apply_to_job(request, pk):
    """POST /api/v1/jobs/<pk>/apply/"""
    job = get_object_or_404(Job, pk=pk, status=Job.Status.PUBLISHED)
    if JobApplication.objects.filter(job_seeker=request.user, job=job).exists():
        return Response({'success': False, 'error': {'message': 'Already applied.'}},
                        status=status.HTTP_400_BAD_REQUEST)
    app = JobApplication.objects.create(
        job_seeker=request.user, job=job,
        cover_note=request.data.get('cover_note', ''),
        resume_url=request.data.get('resume_url', ''),
    )
    job.applicant_count = JobApplication.objects.filter(job=job).count()
    job.update_competition()
    job.save(update_fields=['applicant_count'])
    return Response({'success': True, 'data': JobApplicationSerializer(app, context={'request': request}).data},
                    status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsJobSeeker])
def my_applications(request):
    """GET /api/v1/jobs/applications/"""
    qs = JobApplication.objects.filter(job_seeker=request.user).select_related('job', 'job__company')
    return Response({'success': True, 'data': JobApplicationSerializer(qs, many=True, context={'request': request}).data})


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsJobSeeker])
def seeker_dashboard_stats(request):
    """GET /api/v1/jobs/seeker/stats/"""
    user = request.user
    return Response({'success': True, 'data': {
        'saved_jobs':         SavedJob.objects.filter(job_seeker=user).count(),
        'applied_jobs':       JobApplication.objects.filter(job_seeker=user).count(),
        'swipe_count':        SwipeHistory.objects.filter(job_seeker=user).count(),
        'right_swipes':       SwipeHistory.objects.filter(job_seeker=user, direction='right').count(),
        'recommendations':    Recommendation.objects.filter(job_seeker=user).count(),
        'shortlisted':        JobApplication.objects.filter(job_seeker=user, status='shortlisted').count(),
    }})


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsRecruiter])
def my_companies(request):
    """GET /api/v1/jobs/companies/mine/ — recruiter's own companies."""
    qs = Company.objects.filter(recruiter=request.user).order_by('name')
    return Response({'success': True, 'data': CompanySerializer(qs, many=True, context={'request': request}).data})
