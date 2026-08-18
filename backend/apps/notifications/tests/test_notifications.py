"""
SwipeX Notifications — Pytest test suite (Milestone 4)
"""

import pytest
from rest_framework.test import APIClient
from rest_framework import status as http_status

from apps.users.models import User, UserProfile
from apps.jobs.models import Company, Job, JobApplication
from apps.notifications.models import Notification


@pytest.fixture
def api():
    return APIClient()


@pytest.fixture
def recruiter(db):
    return User.objects.create_user(
        email='recruiter@notif.test', password='Pass1234!',
        role=User.Role.RECRUITER, first_name='Raj', last_name='Recruiter'
    )


@pytest.fixture
def seeker(db):
    return User.objects.create_user(
        email='seeker@notif.test', password='Pass1234!',
        role=User.Role.JOB_SEEKER, first_name='Ana', last_name='Seeker'
    )


@pytest.fixture
def company(db, recruiter):
    return Company.objects.create(name='NotifCo', company_type='startup', recruiter=recruiter)


@pytest.fixture
def published_job(db, recruiter, company):
    return Job.objects.create(
        recruiter=recruiter, company=company,
        title='QA Engineer', description='Test things.',
        experience_level='junior', job_type='full_time',
        work_mode='remote', location='Remote',
        status=Job.Status.PUBLISHED,
    )


def auth(client, user):
    resp = client.post('/api/v1/auth/login/', {'email': user.email, 'password': 'Pass1234!'}, format='json')
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {resp.data['data']['tokens']['access']}")
    return client


@pytest.mark.django_db
class TestApplicationSignals:
    def test_new_application_notifies_recruiter(self, api, seeker, recruiter, published_job):
        auth(api, seeker)
        r = api.post(f'/api/v1/jobs/{published_job.id}/apply/', {}, format='json')
        assert r.status_code == http_status.HTTP_201_CREATED

        notif = Notification.objects.filter(user=recruiter, type=Notification.NotificationType.NEW_APPLICATION).first()
        assert notif is not None
        assert published_job.title in notif.message

    def test_status_change_notifies_seeker(self, api, seeker, recruiter, published_job):
        app = JobApplication.objects.create(job_seeker=seeker, job=published_job)
        Notification.objects.filter(user=seeker).delete()  # clear the "new application" style noise if any

        auth(api, recruiter)
        r = api.patch(
            f'/api/v1/jobs/recruiter/jobs/{published_job.id}/applicants/{app.id}/',
            {'status': 'shortlisted'}, format='json'
        )
        assert r.status_code == http_status.HTTP_200_OK

        notif = Notification.objects.filter(
            user=seeker, type=Notification.NotificationType.SHORTLISTED
        ).first()
        assert notif is not None
        assert 'Shortlisted' in notif.message or 'shortlisted' in notif.message.lower()


@pytest.mark.django_db
class TestNotificationAPI:
    def test_list_requires_auth(self, api):
        r = api.get('/api/v1/notifications/')
        assert r.status_code == http_status.HTTP_401_UNAUTHORIZED

    def test_list_and_unread_count(self, api, seeker):
        Notification.objects.create(user=seeker, title='Hello', type=Notification.NotificationType.SYSTEM)
        Notification.objects.create(user=seeker, title='World', type=Notification.NotificationType.SYSTEM)

        auth(api, seeker)
        r = api.get('/api/v1/notifications/')
        assert r.status_code == http_status.HTTP_200_OK
        assert len(r.data['data']) == 2
        assert r.data['unread_count'] == 2

        r2 = api.get('/api/v1/notifications/unread-count/')
        assert r2.data['data']['unread_count'] == 2

    def test_mark_read(self, api, seeker):
        notif = Notification.objects.create(user=seeker, title='Hi', type=Notification.NotificationType.SYSTEM)
        auth(api, seeker)
        r = api.patch(f'/api/v1/notifications/{notif.id}/read/')
        assert r.status_code == http_status.HTTP_200_OK
        notif.refresh_from_db()
        assert notif.is_read is True

    def test_mark_all_read(self, api, seeker):
        Notification.objects.create(user=seeker, title='A', type=Notification.NotificationType.SYSTEM)
        Notification.objects.create(user=seeker, title='B', type=Notification.NotificationType.SYSTEM)
        auth(api, seeker)
        r = api.post('/api/v1/notifications/mark-all-read/')
        assert r.status_code == http_status.HTTP_200_OK
        assert r.data['data']['marked_read'] == 2
        assert Notification.objects.filter(user=seeker, is_read=False).count() == 0

    def test_delete_notification(self, api, seeker):
        notif = Notification.objects.create(user=seeker, title='Bye', type=Notification.NotificationType.SYSTEM)
        auth(api, seeker)
        r = api.delete(f'/api/v1/notifications/{notif.id}/')
        assert r.status_code == http_status.HTTP_204_NO_CONTENT
        assert not Notification.objects.filter(id=notif.id).exists()

    def test_cannot_see_other_users_notifications(self, api, seeker, recruiter):
        notif = Notification.objects.create(user=recruiter, title='Private', type=Notification.NotificationType.SYSTEM)
        auth(api, seeker)
        r = api.get('/api/v1/notifications/')
        assert all(n['id'] != str(notif.id) for n in r.data['data'])

        r2 = api.patch(f'/api/v1/notifications/{notif.id}/read/')
        assert r2.status_code == http_status.HTTP_404_NOT_FOUND

    def test_manual_create_notification(self, api, seeker):
        auth(api, seeker)
        r = api.post('/api/v1/notifications/create/', {'title': 'Reminder', 'message': 'Do the thing'}, format='json')
        assert r.status_code == http_status.HTTP_201_CREATED
        assert r.data['data']['title'] == 'Reminder'


@pytest.mark.django_db
class TestGenerateNotificationsCommand:
    def test_command_runs_without_error(self, seeker, published_job):
        from django.core.management import call_command
        call_command('generate_notifications', '--hours', '9999')
        # Should not raise; resume reminder should fire for seekers without a resume
        assert Notification.objects.filter(
            user=seeker, type=Notification.NotificationType.RESUME_REMINDER
        ).exists()

    def test_resume_reminder_not_duplicated_on_repeated_runs(self, seeker, published_job):
        """
        Production-readiness fix: if `generate_notifications` runs on a
        schedule (e.g. a daily cron job), a seeker without a resume must not
        get a fresh duplicate "Improve your resume" notification every run.
        """
        from django.core.management import call_command

        call_command('generate_notifications', '--hours', '9999')
        call_command('generate_notifications', '--hours', '9999')
        call_command('generate_notifications', '--hours', '9999')

        count = Notification.objects.filter(
            user=seeker, type=Notification.NotificationType.RESUME_REMINDER
        ).count()
        assert count == 1

    def test_startup_hiring_alert_generated_for_startup_job(self, seeker, recruiter):
        """
        Milestone 4 fix: startup/newly-founded companies must trigger a
        dedicated STARTUP_HIRING notification, using the real Company data
        model — not a fake/hardcoded notification.
        """
        from django.core.management import call_command
        from django.utils import timezone

        startup = Company.objects.create(
            name='TechNova Labs', company_type=Company.CompanyType.NEW_STARTUP, recruiter=recruiter
        )
        job = Job.objects.create(
            recruiter=recruiter, company=startup,
            title='Software Engineer', description='Build things fast.',
            experience_level='junior', job_type='full_time',
            work_mode='remote', location='Remote',
            status=Job.Status.PUBLISHED,
        )
        job.published_at = timezone.now()
        job.save(update_fields=['published_at'])

        # Give the seeker enough of a profile to clear the match-quality bar
        # (mirrors "a new startup opportunity matching your profile" from the spec).
        UserProfile.objects.create(user=seeker, open_to_remote=True)

        call_command('generate_notifications', '--hours', '9999')

        notif = Notification.objects.filter(
            user=seeker, job=job, type=Notification.NotificationType.STARTUP_HIRING
        ).first()
        assert notif is not None
        assert 'TechNova Labs' in notif.message
        assert job.title in notif.message

    def test_startup_hiring_alert_not_generated_for_mnc_job(self, seeker, recruiter):
        """A job at a non-startup company must never fire a STARTUP_HIRING alert."""
        from django.core.management import call_command
        from django.utils import timezone

        mnc = Company.objects.create(name='GlobalCorp', company_type=Company.CompanyType.MNC, recruiter=recruiter)
        job = Job.objects.create(
            recruiter=recruiter, company=mnc,
            title='Backend Engineer', description='Scale things.',
            experience_level='junior', job_type='full_time',
            work_mode='remote', location='Remote',
            status=Job.Status.PUBLISHED,
        )
        job.published_at = timezone.now()
        job.save(update_fields=['published_at'])

        call_command('generate_notifications', '--hours', '9999')

        assert not Notification.objects.filter(
            user=seeker, job=job, type=Notification.NotificationType.STARTUP_HIRING
        ).exists()
