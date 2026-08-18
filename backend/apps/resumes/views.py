"""
SwipeX Resume Views — Milestone 3
Upload, parse, manage resumes, and compute ATS / compatibility scores.
"""

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404

from apps.users.permissions import IsJobSeeker
from apps.jobs.models import Job, Skill

from .models import Resume
from .parsing import extract_text_and_links, parse_resume_text, ResumeParseError
from .serializers import ResumeSerializer, ResumeUploadSerializer, ATSScoreSerializer
from .services import get_primary_resume, get_or_compute_ats


def _parse_and_save(resume: Resume):
    """Extract text + parse structured fields for a freshly-uploaded resume."""
    try:
        resume.file.open('rb')
        text, hyperlinks = extract_text_and_links(resume.file, resume.file_type)
        known_skills = list(Skill.objects.values_list('name', flat=True))
        parsed = parse_resume_text(text, known_skill_names=known_skills, hyperlinks=hyperlinks)

        resume.raw_text = text
        for field, value in parsed.items():
            setattr(resume, field, value)
        resume.parse_status = Resume.ParseStatus.SUCCESS
        resume.parse_error = ''
    except ResumeParseError as exc:
        resume.parse_status = Resume.ParseStatus.FAILED
        resume.parse_error = str(exc)
    except Exception as exc:  # pragma: no cover - defensive
        resume.parse_status = Resume.ParseStatus.FAILED
        resume.parse_error = f'Unexpected parsing error: {exc}'
    finally:
        try:
            resume.file.close()
        except Exception:
            pass
        resume.save()
    return resume


# ══════════════════════════════════════════════════════════════════════════════
# UPLOAD / LIST / DETAIL
# ══════════════════════════════════════════════════════════════════════════════

@api_view(['POST'])
@permission_classes([IsAuthenticated, IsJobSeeker])
@parser_classes([MultiPartParser, FormParser])
def upload_resume(request):
    """
    POST /api/v1/resumes/upload/
    multipart/form-data: file=<resume.pdf|.docx>
    Parses the resume immediately and sets it as the primary resume.
    """
    serializer = ResumeUploadSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    uploaded_file = serializer.validated_data['file']
    file_type = serializer.file_type

    resume = Resume.objects.create(
        user=request.user,
        file=uploaded_file,
        original_filename=uploaded_file.name,
        file_type=file_type,
        file_size=uploaded_file.size,
        is_primary=True,
    )
    resume = _parse_and_save(resume)

    data = ResumeSerializer(resume, context={'request': request}).data
    if resume.parse_status == Resume.ParseStatus.FAILED:
        return Response(
            {'success': False, 'error': {'message': resume.parse_error}, 'data': data},
            status=status.HTTP_422_UNPROCESSABLE_ENTITY,
        )
    return Response({'success': True, 'data': data}, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsJobSeeker])
def list_resumes(request):
    """GET /api/v1/resumes/ — all resumes uploaded by the current job seeker."""
    qs = Resume.objects.filter(user=request.user)
    return Response({'success': True, 'data': ResumeSerializer(qs, many=True, context={'request': request}).data})


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsJobSeeker])
def primary_resume(request):
    """GET /api/v1/resumes/primary/ — the active resume used for scoring & recommendations."""
    resume = Resume.objects.filter(user=request.user, is_primary=True).first()
    if not resume:
        return Response({'success': True, 'data': None})
    return Response({'success': True, 'data': ResumeSerializer(resume, context={'request': request}).data})


@api_view(['GET', 'DELETE'])
@permission_classes([IsAuthenticated, IsJobSeeker])
def resume_detail(request, pk):
    """GET/DELETE /api/v1/resumes/<pk>/"""
    resume = get_object_or_404(Resume, pk=pk, user=request.user)
    if request.method == 'DELETE':
        was_primary = resume.is_primary
        resume.file.delete(save=False)
        resume.delete()
        if was_primary:
            fallback = Resume.objects.filter(user=request.user).order_by('-uploaded_at').first()
            if fallback:
                fallback.is_primary = True
                fallback.save(update_fields=['is_primary'])
        return Response({'success': True, 'message': 'Resume deleted.'}, status=status.HTTP_204_NO_CONTENT)
    return Response({'success': True, 'data': ResumeSerializer(resume, context={'request': request}).data})


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsJobSeeker])
def set_primary_resume(request, pk):
    """POST /api/v1/resumes/<pk>/set-primary/"""
    resume = get_object_or_404(Resume, pk=pk, user=request.user)
    resume.is_primary = True
    resume.save()
    return Response({'success': True, 'data': ResumeSerializer(resume, context={'request': request}).data})


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsJobSeeker])
def reparse_resume(request, pk):
    """POST /api/v1/resumes/<pk>/reparse/ — re-run parsing (e.g. after a fix)."""
    resume = get_object_or_404(Resume, pk=pk, user=request.user)
    resume = _parse_and_save(resume)
    return Response({'success': True, 'data': ResumeSerializer(resume, context={'request': request}).data})


# ══════════════════════════════════════════════════════════════════════════════
# ATS SCORING / COMPATIBILITY
# ══════════════════════════════════════════════════════════════════════════════

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsJobSeeker])
def resume_job_match(request, job_id):
    """
    GET /api/v1/resumes/match/<job_id>/
    ATS score, compatibility label, missing skills/keywords & suggestions for
    the user's primary resume against a specific job.
    """
    job = get_object_or_404(Job, pk=job_id)
    resume = get_primary_resume(request.user)
    if not resume:
        return Response({
            'success': True,
            'data': None,
            'message': 'Upload a resume to see your ATS score and compatibility for this job.',
        })
    ats = get_or_compute_ats(resume, job)
    return Response({'success': True, 'data': ATSScoreSerializer(ats, context={'request': request}).data})
