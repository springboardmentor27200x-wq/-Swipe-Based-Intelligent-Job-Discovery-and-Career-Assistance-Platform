from rest_framework import generics
from django.contrib.auth.models import User
from .serializers import RegisterSerializer
from rest_framework import generics
from .models import JobSeekerProfile
from .serializers import JobSeekerProfileSerializer
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import UserProfile
from rest_framework import generics
from .ai_engine import ( extract_resume_text, calculate_ats_score, generate_suggestions ) 
from jobs.models import Job

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer

class JobSeekerProfileCreateView(generics.CreateAPIView):
    queryset = JobSeekerProfile.objects.all()
    serializer_class = JobSeekerProfileSerializer

class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        profile = UserProfile.objects.get(user=request.user)

        return Response({
            "username": request.user.username,
            "role": profile.role
        })


class JobSeekerProfileView(generics.RetrieveUpdateAPIView): 
    serializer_class = JobSeekerProfileSerializer 
    permission_classes = [IsAuthenticated] 
    def get_object(self): 
        profile, created = JobSeekerProfile.objects.get_or_create( 
        user=self.request.user
        ) 
        return profile

class ATSScoreView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request, job_id):

        profile = JobSeekerProfile.objects.get(user=request.user)

        if not profile.resume:
            return Response({
                "error": "Resume not uploaded"
            })

        job = Job.objects.get(id=job_id)

        resume_text = extract_resume_text(profile.resume.path)

        result = calculate_ats_score(
            resume_text,
            job.description
        )

        suggestions = generate_suggestions(result)

        return Response({
            "ats_score": result["score"],
            "matched_skills": result["matched_skills"],
            "missing_skills": result["missing_skills"],
            "suggestions": suggestions,
        })