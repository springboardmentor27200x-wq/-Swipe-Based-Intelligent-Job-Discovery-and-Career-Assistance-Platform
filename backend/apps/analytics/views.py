"""
SwipeX Analytics Views — Milestone 4

GET  /api/v1/dashboard/seeker/            — job seeker dashboard analytics
GET  /api/v1/dashboard/recruiter/         — recruiter dashboard analytics
GET  /api/v1/analytics/                   — role-aware alias to the dashboard above
GET  /api/v1/application-history/         — application tracking history + charts
GET  /api/v1/skill-gap/?job_id=<uuid>     — skill gap analysis (job-specific or overall)
POST /api/v1/skill-gap/                   — run + store a skill-gap analysis snapshot
GET  /api/v1/skill-gap/history/           — stored skill-gap analysis snapshots
GET  /api/v1/recommendations/history/     — recommendation history for the seeker
"""

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404

from apps.users.permissions import IsJobSeeker, IsRecruiter

from . import services
from .models import SkillGapSnapshot
from .serializers import SkillGapSnapshotSerializer


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsJobSeeker])
def seeker_dashboard(request):
    """GET /api/v1/dashboard/seeker/"""
    data = services.seeker_dashboard_data(request.user, request=request)
    return Response({'success': True, 'data': data})


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsRecruiter])
def recruiter_dashboard(request):
    """GET /api/v1/dashboard/recruiter/"""
    data = services.recruiter_dashboard_data(request.user)
    return Response({'success': True, 'data': data})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def analytics_overview(request):
    """
    GET /api/v1/analytics/ — role-aware convenience alias so the frontend can
    hit a single endpoint regardless of the logged-in user's role.
    """
    user = request.user
    if user.is_job_seeker:
        data = services.seeker_dashboard_data(user, request=request)
    elif user.is_recruiter:
        data = services.recruiter_dashboard_data(user)
    else:
        data = {}
    return Response({'success': True, 'data': data})


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsJobSeeker])
def application_history(request):
    """GET /api/v1/application-history/"""
    data = services.application_history_data(request.user)
    return Response({'success': True, 'data': data})


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated, IsJobSeeker])
def skill_gap(request):
    """
    GET  /api/v1/skill-gap/?job_id=<uuid>  — compute (not stored) skill gap
    POST /api/v1/skill-gap/  { job_id? }   — compute AND store a snapshot
    """
    job_id = request.query_params.get('job_id') or request.data.get('job_id')
    job = None
    if job_id:
        from apps.jobs.models import Job
        job = get_object_or_404(Job, pk=job_id)

    result = services.compute_skill_gap(request.user, job=job)

    if request.method == 'POST':
        snapshot = SkillGapSnapshot.objects.create(
            job_seeker=request.user,
            job=job,
            matched_skills=result['matched_skills'],
            missing_skills=result['missing_skills'],
            priority_skills=result['priority_skills'],
            learning_suggestions=result['learning_suggestions'],
            match_percentage=result['match_percentage'],
        )
        return Response(
            {'success': True, 'data': SkillGapSnapshotSerializer(snapshot).data},
            status=status.HTTP_201_CREATED,
        )

    return Response({'success': True, 'data': result})


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsJobSeeker])
def skill_gap_history(request):
    """GET /api/v1/skill-gap/history/"""
    qs = SkillGapSnapshot.objects.filter(job_seeker=request.user).select_related('job')[:50]
    return Response({'success': True, 'data': SkillGapSnapshotSerializer(qs, many=True).data})


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsJobSeeker])
def recommendations_history(request):
    """
    GET /api/v1/recommendations/history/
    Current recommendation set for the seeker, ordered by most-recently
    (re)generated, each with an explanation of why it was recommended.
    """
    from apps.jobs.models import Recommendation
    from apps.jobs.serializers import RecommendationSerializer

    qs = Recommendation.objects.filter(job_seeker=request.user).select_related(
        'job', 'job__company'
    ).order_by('-generated_at')[:50]
    return Response({
        'success': True,
        'data': RecommendationSerializer(qs, many=True, context={'request': request}).data,
    })
