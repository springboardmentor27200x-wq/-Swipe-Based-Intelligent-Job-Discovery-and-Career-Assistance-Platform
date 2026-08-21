import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'swipex.settings')
django.setup()

from django.contrib.auth import get_user_model
from notifications.models import Notification
from django.utils import timezone
import datetime

User = get_user_model()

def seed_all():
    now = timezone.now()
    notifs_data = [
        {"title": "New AI Job Match", "message": "You have a new 94% match for Backend Engineer (Django) at Supabase.", "type": "chat", "is_read": False, "delta": datetime.timedelta(minutes=2)},
        {"title": "ATS Analysis Completed", "message": "Your resume analysis is complete. Your latest ATS score is 69%.", "type": "application", "is_read": False, "delta": datetime.timedelta(minutes=15)},
        {"title": "Application Submitted", "message": "Your application for Frontend Architect at Prisma was submitted successfully.", "type": "application", "is_read": False, "delta": datetime.timedelta(hours=1)},
        {"title": "Interview Reminder", "message": "Your recruiter interview is scheduled for tomorrow at 10:00 AM.", "type": "interview", "is_read": True, "delta": datetime.timedelta(hours=3)},
        {"title": "AI Cover Letter Ready", "message": "Your personalized cover letter for Backend Engineer has been generated.", "type": "chat", "is_read": True, "delta": datetime.timedelta(days=1)},
        {"title": "Profile Recommendation", "message": "Add PostgreSQL and Docker to improve your job match opportunities.", "type": "application", "is_read": True, "delta": datetime.timedelta(days=1, hours=1)},
    ]
    
    users = User.objects.all()
    print(f"Found {users.count()} users. Seeding notifications...")
    
    for u in users:
        # Clean existing
        Notification.objects.filter(recipient=u).delete()
        for item in notifs_data:
            n = Notification.objects.create(
                recipient=u,
                title=item["title"],
                message=item["message"],
                notification_type=item["type"],
                is_read=item["is_read"]
            )
            Notification.objects.filter(id=n.id).update(created_at=now - item["delta"])
        print(f"Seeded notifications for user: {u.email}")
        
if __name__ == '__main__':
    seed_all()
