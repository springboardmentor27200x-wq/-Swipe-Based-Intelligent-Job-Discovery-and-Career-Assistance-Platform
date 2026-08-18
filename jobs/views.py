from rest_framework import viewsets
from rest_framework import viewsets
from .models import Job
from .serializers import JobSerializer
from .models import SavedJob
from .serializers import SavedJobSerializer
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q


class JobViewSet(viewsets.ModelViewSet):

    serializer_class = JobSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        # Recruiters see/manage only their own jobs
        if getattr(user, "role", None) == "recruiter":
            return Job.objects.filter(
                recruiter=user
            )

        # Job seekers can see all jobs
        return Job.objects.all()

    def perform_create(self, serializer):
        serializer.save(
            recruiter=self.request.user
        )

from rest_framework import viewsets

class SavedJobViewSet(viewsets.ModelViewSet):

    serializer_class = SavedJobSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return SavedJob.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.models import User
from .models import Job, Application


class ApplyJobView(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request):

        job_id = request.data.get("job_id")

        try:
            job = Job.objects.get(id=job_id)
        except Job.DoesNotExist:
            return Response({"error": "Job not found"}, status=404)

        Application.objects.create(
            applicant=request.user,
            job=job,
            status="Applied"
        )

        return Response({"message": "Application Saved"})

from rest_framework.generics import ListAPIView
from .models import Application
from .serializers import ApplicationSerializer

class AppliedJobsView(ListAPIView):
    queryset = Application.objects.all()
    serializer_class = ApplicationSerializer

from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from rest_framework.views import APIView

class RecommendedJobsView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):
        jobs = Job.objects.all()

        serializer = JobSerializer(jobs, many=True)

        return Response(serializer.data)

from rest_framework.response import Response

from .models import Job, Application, SavedJob


class DashboardStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        total_jobs = Job.objects.count()

        applied_jobs = Application.objects.filter(
            applicant=user
        ).count()

        saved_jobs = SavedJob.objects.filter(
            user=user
        ).count()

        shortlisted = Application.objects.filter(
            applicant=user,
            status="Shortlisted"
        ).count()

        interviews = Application.objects.filter(
            applicant=user,
            status="Interview"
        ).count()

        rejected = Application.objects.filter(
            applicant=user,
            status="Rejected"
        ).count()

        pending = Application.objects.filter(
            applicant=user,
            status="Pending"
        ).count()

        return Response({
            "total_jobs": total_jobs,
            "applied_jobs": applied_jobs,
            "saved_jobs": saved_jobs,
            "shortlisted": shortlisted,
            "interviews": interviews,
            "rejected": rejected,
            "pending": pending,
        })

from .models import Notification
from .serializers import NotificationSerializer


class NotificationView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):

        user = request.user

        # --------------------------------
        # 1. LOW COMPETITION ALERTS
        # --------------------------------

        low_competition_jobs = []

        for job in Job.objects.all():

            applicant_count = Application.objects.filter(
                job=job
            ).count()

            if applicant_count <= 2:
                low_competition_jobs.append(job)

        for job in low_competition_jobs:

            exists = Notification.objects.filter(
                user=user,
                notification_type="competition",
                message__icontains=job.title
            ).exists()

            if not exists:

                Notification.objects.create(
                    user=user,
                    title="🔥 Low Competition Opportunity",
                    message=f"{job.title} currently has very few applicants. Apply early!",
                    notification_type="competition"
                )

        # --------------------------------
        # 2. PERSONALIZED RECOMMENDATIONS
        # --------------------------------

        saved_jobs = SavedJob.objects.filter(
            user=user
        )

        keywords = []

        for saved in saved_jobs:

            keywords.extend(
                saved.job.title.lower().split()
            )

        for word in keywords:

            matching_jobs = Job.objects.filter(
                Q(title__icontains=word) |
                Q(description__icontains=word)
            ).distinct()

            for job in matching_jobs:

                exists = Notification.objects.filter(
                    user=user,
                    notification_type="recommendation",
                    message__icontains=job.title
                ).exists()

                if not exists:

                    Notification.objects.create(
                        user=user,
                        title="🤖 Personalized Job Recommendation",
                        message=f"{job.title} matches your saved-job interests.",
                        notification_type="recommendation"
                    )

        # --------------------------------
        # 3. RETURN NOTIFICATIONS
        # --------------------------------

        notifications = Notification.objects.filter(
            user=user
        ).order_by("-created_at")

        serializer = NotificationSerializer(
            notifications,
            many=True
        )

        return Response(serializer.data)

    def post(self, request):

        notification = Notification.objects.create(
            user=request.user,
            title=request.data.get("title"),
            message=request.data.get("message"),
            notification_type=request.data.get(
                "notification_type",
                "job"
            )
        )

        serializer = NotificationSerializer(notification)

        return Response(serializer.data)


# ============================================================
# RECRUITER DASHBOARD
# ============================================================

from django.db.models import Count
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated


class RecruiterDashboardStatsView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):

        # Jobs posted by this recruiter
        recruiter_jobs = Job.objects.filter(
            recruiter=request.user
        )

        total_jobs = recruiter_jobs.count()

        # Applications received for recruiter's jobs
        applications = Application.objects.filter(
            job__in=recruiter_jobs
        )

        total_applicants = applications.count()

        shortlisted = applications.filter(
            status="Shortlisted"
        ).count()

        interviews = applications.filter(
            status="Interview"
        ).count()

        rejected = applications.filter(
            status="Rejected"
        ).count()

        pending = applications.filter(
            status="Pending"
        ).count()

        return Response({
            "total_jobs": total_jobs,
            "total_applicants": total_applicants,
            "shortlisted": shortlisted,
            "interviews": interviews,
            "rejected": rejected,
            "pending": pending,
        })


# ============================================================
# RECRUITER APPLICANTS
# ============================================================

class RecruiterApplicantsView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):

        recruiter_jobs = Job.objects.filter(
            recruiter=request.user
        )

        applications = Application.objects.filter(
            job__in=recruiter_jobs
        ).select_related(
            "applicant",
            "job"
        ).order_by("-applied_at")

        data = []

        for application in applications:

            data.append({
                "id": application.id,
                "applicant_id": application.applicant.id,
                "applicant_name": application.applicant.username,
                "email": application.applicant.email,
                "job_id": application.job.id,
                "job_title": application.job.title,
                "status": application.status,
                "applied_at": application.applied_at,
            })

        return Response(data)


# ============================================================
# UPDATE APPLICATION STATUS
# ============================================================

class UpdateApplicationStatusView(APIView):

    permission_classes = [IsAuthenticated]

    def patch(self, request, application_id):

        try:
            application = Application.objects.get(
                id=application_id,
                job__recruiter=request.user
            )

        except Application.DoesNotExist:

            return Response(
                {"error": "Application not found"},
                status=404
            )

        new_status = request.data.get("status")

        allowed_statuses = [
            "Pending",
            "Shortlisted",
            "Interview",
            "Selected",
            "Rejected",
        ]

        if new_status not in allowed_statuses:

            return Response(
                {
                    "error": "Invalid status",
                    "allowed_statuses": allowed_statuses
                },
                status=400
            )

        application.status = new_status
        application.save()

        return Response({
            "message": "Application status updated successfully",
            "application_id": application.id,
            "status": application.status,
        })


# ============================================================
# RECRUITER APPLICATION TRENDS
# ============================================================

class RecruiterApplicationTrendsView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):

        recruiter_jobs = Job.objects.filter(
            recruiter=request.user
        )

        applications = Application.objects.filter(
            job__in=recruiter_jobs
        )

        job_data = (
            applications
            .values("job__title")
            .annotate(count=Count("id"))
            .order_by("-count")
        )

        data = []

        for item in job_data:

            data.append({
                "job": item["job__title"],
                "applications": item["count"],
            })

        return Response(data)

# ============================================================
# RECRUITER - VIEW APPLICANTS
# ============================================================

class RecruiterApplicantsView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):

        applications = Application.objects.filter(
            job__recruiter=request.user
        ).select_related(
            "applicant",
            "job"
        ).order_by("-applied_at")

        data = []

        for application in applications:

            data.append({
                "id": application.id,
                "applicant_name": application.applicant.username,
                "email": application.applicant.email,
                "job_title": application.job.title,
                "status": application.status,
                "applied_at": application.applied_at,
            })

        return Response(data)

# ============================================================
# RECRUITER - UPDATE APPLICATION STATUS
# ============================================================

class UpdateApplicationStatusView(APIView):

    permission_classes = [IsAuthenticated]

    def patch(self, request, application_id):

        try:
            application = Application.objects.get(
                id=application_id,
                job__recruiter=request.user
            )
        except Application.DoesNotExist:
            return Response(
                {"error": "Application not found"},
                status=404
            )

        new_status = request.data.get("status")

        allowed_statuses = [
            "Pending",
            "Shortlisted",
            "Interview",
            "Rejected",
        ]

        if new_status not in allowed_statuses:
            return Response(
                {"error": "Invalid status"},
                status=400
            )

        application.status = new_status
        application.save()

        return Response({
            "message": "Application status updated successfully",
            "status": application.status
        })


# ============================================================
# RECRUITER - DASHBOARD STATS
# ============================================================

class RecruiterDashboardStatsView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):

        recruiter_jobs = Job.objects.filter(
            recruiter=request.user
        )

        applications = Application.objects.filter(
            job__in=recruiter_jobs
        )

        return Response({
            "total_jobs": recruiter_jobs.count(),
            "total_applicants": applications.count(),
            "pending": applications.filter(
                status="Pending"
            ).count(),
            "shortlisted": applications.filter(
                status="Shortlisted"
            ).count(),
            "interviews": applications.filter(
                status="Interview"
            ).count(),
            "rejected": applications.filter(
                status="Rejected"
            ).count(),
        })


# ============================================================
# RECRUITER - APPLICATION TRENDS
# ============================================================

class RecruiterApplicationTrendsView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):

        recruiter_jobs = Job.objects.filter(
            recruiter=request.user
        )

        applications = Application.objects.filter(
            job__in=recruiter_jobs
        )

        data = []

        for job in recruiter_jobs:

            count = applications.filter(
                job=job
            ).count()

            data.append({
                "job": job.title,
                "applications": count
            })

        return Response(data)

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Application, Job


class RecruiterApplicantsView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):

        applications = Application.objects.filter(
            job__recruiter=request.user
        ).select_related(
            "applicant",
            "job"
        ).order_by("-applied_at")

        data = []

        for application in applications:

            data.append({
                "id": application.id,
                "applicant_name": application.applicant.username,
                "email": application.applicant.email,
                "job_title": application.job.title,
                "status": application.status,
                "applied_at": application.applied_at,
            })

        return Response(data)