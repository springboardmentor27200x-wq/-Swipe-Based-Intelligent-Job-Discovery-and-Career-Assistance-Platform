from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Job

class SwipeJobView(APIView):
    def get(self, request):
        job = Job.objects.order_by('?').first()

        if not job:
            return Response({"message": "No jobs available"})

        return Response({
            "id": job.id,
            "title": job.title,
            "company": job.company.name,
            "location": job.location,
            "salary": str(job.salary),
            "job_type": job.job_type,
            "description": job.description,
        })