"""
SwipeX Analytics — Pytest test suite (Milestone 4)
"""

import pytest
from rest_framework.test import APIClient
from rest_framework import status as http_status

from apps.users.models import User
from apps.jobs.models import Company, Job, Skill, JobApplication, SavedJob, Recommendation


@pytest.fixture
def api():
    return APIClient()


@pytest.fixture
def recruiter(db):
    return User.objects.create_user(
        email='recruiter@analytics.test', password='Pass1234!',
        role=User.Role.RECRUITER, first_name='Raj', last_name='Recruiter'
    )


@pytest.fixture
def seeker(db):
    return User.objects.create_user(
        email='seeker@analytics.test', password='Pass1234!',
        role=User.Role.JOB_SEEKER, first_name='Ana', last_name='Seeker'
    )


@pytest.fixture
def company(db, recruiter):
    return Company.objects.create(name='AnalyticsCo', company_type='startup', recruiter=recruiter)


@pytest.fixture
def skills(db):
    return [Skill.objects.create(name=n, slug=n.lower()) for n in ['Python', 'React', 'Docker']]


@pytest.fixture
def published_job(db, recruiter, company, skills):
    job = Job.objects.create(
        recruiter=recruiter, company=company,
        title='Backend Engineer', description='Build great APIs with Python.',
        experience_level='junior', job_type='full_time',
        work_mode='remote', location='Bangalore',
        status=Job.Status.PUBLISHED,
    )
    job.skills_required.set(skills[:2])  # Python, React
    return job


def auth(client, user):
    resp = client.post('/api/v1/auth/login/', {'email': user.email, 'password': 'Pass1234!'}, format='json')
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {resp.data['data']['tokens']['access']}")
    return client


@pytest.mark.django_db
class TestSeekerDashboard:
    def test_requires_seeker_role(self, api, recruiter):
        auth(api, recruiter)
        r = api.get('/api/v1/dashboard/seeker/')
        assert r.status_code == http_status.HTTP_403_FORBIDDEN

    def test_seeker_dashboard_shape(self, api, seeker, published_job):
        SavedJob.objects.create(job_seeker=seeker, job=published_job)
        auth(api, seeker)
        r = api.get('/api/v1/dashboard/seeker/')
        assert r.status_code == http_status.HTTP_200_OK
        data = r.data['data']
        for key in [
            'resume_score', 'average_match_percentage', 'applications_count',
            'saved_jobs_count', 'interviews_count', 'skill_gap',
            'top_recommended_jobs', 'recent_activity', 'charts',
        ]:
            assert key in data
        assert data['saved_jobs_count'] == 1
        assert 'application_timeline' in data['charts']
        assert 'match_score_trend' in data['charts']


@pytest.mark.django_db
class TestRecruiterDashboard:
    def test_recruiter_dashboard_shape(self, api, recruiter, seeker, published_job):
        JobApplication.objects.create(job_seeker=seeker, job=published_job)
        auth(api, recruiter)
        r = api.get('/api/v1/dashboard/recruiter/')
        assert r.status_code == http_status.HTTP_200_OK
        data = r.data['data']
        for key in [
            'jobs_posted', 'applications_received', 'shortlisted', 'hiring_funnel',
            'most_popular_jobs', 'average_ats_score', 'candidate_skill_distribution', 'charts',
        ]:
            assert key in data
        assert data['jobs_posted'] == 1
        assert data['applications_received'] == 1
        assert len(data['hiring_funnel']) == 7

    def test_applications_per_job_uses_live_count(self, api, recruiter, company):
        """
        Milestone 4 fix (retained after Applications-Over-Time chart removal):
        applications-per-job must reflect the real, live count of
        JobApplication rows — not a cached counter that can drift.
        """
        seekers = [
            User.objects.create_user(
                email=f'apply{i}@analytics.test', password='Pass1234!',
                role=User.Role.JOB_SEEKER, first_name='S', last_name=str(i),
            ) for i in range(3)
        ]
        job = Job.objects.create(
            recruiter=recruiter, company=company,
            title='Data Analyst', description='Crunch numbers.',
            experience_level='junior', job_type='full_time',
            work_mode='remote', location='Remote',
            status=Job.Status.PUBLISHED,
        )
        for s in seekers:
            JobApplication.objects.create(job_seeker=s, job=job)

        auth(api, recruiter)
        r = api.get('/api/v1/dashboard/recruiter/')
        assert r.status_code == http_status.HTTP_200_OK

        per_job = r.data['data']['charts']['applications_per_job']
        assert any(j['job'] == 'Data Analyst' and j['count'] == 3 for j in per_job)
        # The removed "Applications Over Time" chart's data must not linger
        # in the API response.
        assert 'application_trend' not in r.data['data']['charts']


@pytest.mark.django_db
class TestAnalyticsOverview:
    def test_role_aware_alias(self, api, seeker, recruiter):
        auth(api, seeker)
        r = api.get('/api/v1/analytics/')
        assert r.status_code == http_status.HTTP_200_OK
        assert 'applications_count' in r.data['data']


@pytest.mark.django_db
class TestApplicationHistory:
    def test_application_history_cards_and_charts(self, api, seeker, published_job):
        JobApplication.objects.create(job_seeker=seeker, job=published_job)
        auth(api, seeker)
        r = api.get('/api/v1/application-history/')
        assert r.status_code == http_status.HTTP_200_OK
        data = r.data['data']
        assert data['dashboard_cards']['total_applied'] == 1
        assert 'status_distribution' in data['charts']
        assert len(data['applications']) == 1

    def test_applications_over_time_removed_from_response(self, api, seeker, recruiter, company, skills):
        """
        Milestone 4.3: the "Applications Over Time" chart was removed from
        both dashboards per final deployment decision (the underlying
        rendering was unreliable). The API must not return dead chart data
        for it, while everything else — cards, status distribution, full
        application list — must keep working exactly as before.
        """
        jobs = []
        for i in range(3):
            job = Job.objects.create(
                recruiter=recruiter, company=company,
                title=f'Role {i}', description='Test role.',
                experience_level='junior', job_type='full_time',
                work_mode='remote', location='Remote',
                status=Job.Status.PUBLISHED,
            )
            jobs.append(job)
            JobApplication.objects.create(job_seeker=seeker, job=job)

        auth(api, seeker)
        r = api.get('/api/v1/application-history/')
        assert r.status_code == http_status.HTTP_200_OK
        data = r.data['data']

        assert data['dashboard_cards']['total_applied'] == 3
        assert 'applications_over_time' not in data['charts']
        assert 'status_distribution' in data['charts']
        assert sum(data['charts']['status_distribution'].values()) == 3
        assert len(data['applications']) == 3


@pytest.mark.django_db
class TestSkillGap:
    def test_skill_gap_for_specific_job(self, api, seeker, published_job):
        auth(api, seeker)
        r = api.get(f'/api/v1/skill-gap/?job_id={published_job.id}')
        assert r.status_code == http_status.HTTP_200_OK
        data = r.data['data']
        assert 'matched_skills' in data
        assert 'missing_skills' in data
        assert 'priority_skills' in data
        assert 'learning_suggestions' in data
        # No resume uploaded → everything required is "missing"
        assert set(data['missing_skills']) == {'Python', 'React'}

    def test_skill_gap_post_stores_snapshot(self, api, seeker, published_job):
        auth(api, seeker)
        r = api.post('/api/v1/skill-gap/', {'job_id': str(published_job.id)}, format='json')
        assert r.status_code == http_status.HTTP_201_CREATED

        r2 = api.get('/api/v1/skill-gap/history/')
        assert r2.status_code == http_status.HTTP_200_OK
        assert len(r2.data['data']) == 1
        assert r2.data['data'][0]['job_title'] == published_job.title


@pytest.mark.django_db
class TestRecommendationsHistory:
    def test_recommendations_history_returns_explanation(self, api, seeker, published_job):
        auth(api, seeker)
        # Trigger recommendation generation via the existing M2/M3 endpoint
        r = api.get('/api/v1/jobs/recommended/')
        assert r.status_code == http_status.HTTP_200_OK

        r2 = api.get('/api/v1/recommendations/history/')
        assert r2.status_code == http_status.HTTP_200_OK
        assert len(r2.data['data']) >= 1
        rec = r2.data['data'][0]
        assert 'explanation' in rec
        assert 'summary' in rec['explanation']
