"""
SwipeX Jobs — Pytest test suite (Milestone 2)
Tests: Job APIs, Swipe APIs, Filters, Search
"""

import pytest
from rest_framework.test import APIClient
from rest_framework import status as http_status
from apps.users.models import User
from apps.jobs.models import Company, Job, SwipeHistory, SavedJob, JobApplication, Skill


# ── Fixtures ──────────────────────────────────────────────────────────────────

@pytest.fixture
def api():
    return APIClient()


@pytest.fixture
def recruiter(db):
    return User.objects.create_user(
        email='recruiter@test.com', password='Pass1234!',
        role=User.Role.RECRUITER, first_name='Raj', last_name='Recruiter'
    )


@pytest.fixture
def seeker(db):
    return User.objects.create_user(
        email='seeker@test.com', password='Pass1234!',
        role=User.Role.JOB_SEEKER, first_name='Ana', last_name='Seeker'
    )


@pytest.fixture
def company(db, recruiter):
    return Company.objects.create(
        name='AcmeCorp', company_type='startup',
        industry='Technology', recruiter=recruiter
    )


@pytest.fixture
def published_job(db, recruiter, company):
    job = Job.objects.create(
        recruiter=recruiter, company=company,
        title='Backend Engineer', description='Build great APIs.',
        experience_level='junior', job_type='full_time',
        work_mode='remote', location='Bangalore',
        status=Job.Status.PUBLISHED,
    )
    return job


def auth(client, user):
    resp = client.post('/api/v1/auth/login/', {'email': user.email, 'password': 'Pass1234!'}, format='json')
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {resp.data['data']['tokens']['access']}")
    return client


# ══════════════════════════════════════════════════════════════════════════════
# Company tests
# ══════════════════════════════════════════════════════════════════════════════

@pytest.mark.django_db
class TestCompany:
    def test_public_can_list_companies(self, api, company):
        r = api.get('/api/v1/jobs/companies/')
        assert r.status_code == http_status.HTTP_200_OK
        assert r.data['success'] is True
        assert len(r.data['data']) >= 1

    def test_recruiter_can_create_company(self, api, recruiter):
        auth(api, recruiter)
        r = api.post('/api/v1/jobs/companies/', {
            'name': 'NewCo', 'company_type': 'startup', 'industry': 'FinTech'
        }, format='json')
        assert r.status_code == http_status.HTTP_201_CREATED
        assert r.data['data']['name'] == 'NewCo'

    def test_seeker_cannot_create_company(self, api, seeker):
        auth(api, seeker)
        r = api.post('/api/v1/jobs/companies/', {'name': 'Hack'}, format='json')
        assert r.status_code == http_status.HTTP_403_FORBIDDEN


# ══════════════════════════════════════════════════════════════════════════════
# Job CRUD tests (Recruiter)
# ══════════════════════════════════════════════════════════════════════════════

@pytest.mark.django_db
class TestRecruiterJobCRUD:
    def test_create_job(self, api, recruiter, company):
        auth(api, recruiter)
        r = api.post('/api/v1/jobs/recruiter/jobs/', {
            'company': str(company.id),
            'title': 'Frontend Dev',
            'description': 'Build UIs.',
            'job_type': 'full_time',
            'work_mode': 'remote',
            'experience_level': 'junior',
            'required_skill_names': ['React', 'TypeScript'],
        }, format='json')
        assert r.status_code == http_status.HTTP_201_CREATED
        assert r.data['data']['title'] == 'Frontend Dev'

    def test_list_own_jobs(self, api, recruiter, published_job):
        auth(api, recruiter)
        r = api.get('/api/v1/jobs/recruiter/jobs/')
        assert r.status_code == http_status.HTTP_200_OK
        assert r.data['count'] >= 1

    def test_recruiter_cannot_see_other_recruiter_jobs(self, api, company):
        other = User.objects.create_user(email='other@r.com', password='Pass1234!', role=User.Role.RECRUITER)
        auth(api, other)
        r = api.get('/api/v1/jobs/recruiter/jobs/')
        assert r.status_code == http_status.HTTP_200_OK
        assert r.data['count'] == 0

    def test_publish_job(self, api, recruiter, company):
        auth(api, recruiter)
        cr = api.post('/api/v1/jobs/recruiter/jobs/', {
            'company': str(company.id), 'title': 'QA', 'description': 'Test things.',
            'job_type': 'contract', 'work_mode': 'onsite', 'experience_level': 'mid',
        }, format='json')
        job_id = cr.data['data']['id']
        pr = api.post(f'/api/v1/jobs/recruiter/jobs/{job_id}/publish/')
        assert pr.status_code == http_status.HTTP_200_OK
        assert pr.data['data']['status'] == 'published'

    def test_close_job(self, api, recruiter, published_job):
        auth(api, recruiter)
        r = api.post(f'/api/v1/jobs/recruiter/jobs/{published_job.id}/close/')
        assert r.status_code == http_status.HTTP_200_OK
        assert r.data['data']['status'] == 'closed'

    def test_delete_job(self, api, recruiter, published_job):
        auth(api, recruiter)
        r = api.delete(f'/api/v1/jobs/recruiter/jobs/{published_job.id}/')
        assert r.status_code == http_status.HTTP_204_NO_CONTENT

    def test_recruiter_stats(self, api, recruiter, published_job):
        auth(api, recruiter)
        r = api.get('/api/v1/jobs/recruiter/stats/')
        assert r.status_code == http_status.HTTP_200_OK
        assert 'total_jobs' in r.data['data']


# ══════════════════════════════════════════════════════════════════════════════
# Public Job Discovery tests
# ══════════════════════════════════════════════════════════════════════════════

@pytest.mark.django_db
class TestPublicJobDiscovery:
    def test_public_job_list(self, api, published_job):
        r = api.get('/api/v1/jobs/')
        assert r.status_code == http_status.HTTP_200_OK
        assert r.data['count'] >= 1

    def test_job_detail(self, api, published_job):
        r = api.get(f'/api/v1/jobs/{published_job.id}/')
        assert r.status_code == http_status.HTTP_200_OK
        assert r.data['data']['title'] == 'Backend Engineer'

    def test_draft_job_not_visible_publicly(self, api, recruiter, company):
        Job.objects.create(
            recruiter=recruiter, company=company,
            title='Hidden', description='x', status=Job.Status.DRAFT
        )
        r = api.get('/api/v1/jobs/?search=Hidden')
        assert r.data['count'] == 0

    def test_latest_jobs(self, api, published_job):
        r = api.get('/api/v1/jobs/latest/')
        assert r.status_code == http_status.HTTP_200_OK

    def test_startup_jobs(self, api, published_job):
        r = api.get('/api/v1/jobs/startups/')
        assert r.status_code == http_status.HTTP_200_OK

    def test_mnc_jobs(self, api):
        r = api.get('/api/v1/jobs/mncs/')
        assert r.status_code == http_status.HTTP_200_OK


# ══════════════════════════════════════════════════════════════════════════════
# Search & Filter tests
# ══════════════════════════════════════════════════════════════════════════════

@pytest.mark.django_db
class TestSearchAndFilter:
    def test_search_by_title(self, api, published_job):
        r = api.get('/api/v1/jobs/?search=Backend')
        assert r.data['count'] >= 1

    def test_search_by_company(self, api, published_job):
        r = api.get('/api/v1/jobs/?search=AcmeCorp')
        assert r.data['count'] >= 1

    def test_filter_by_work_mode(self, api, published_job):
        r = api.get('/api/v1/jobs/?work_mode=remote')
        assert r.data['count'] >= 1

    def test_filter_by_experience_level(self, api, published_job):
        r = api.get('/api/v1/jobs/?experience_level=junior')
        assert r.data['count'] >= 1

    def test_filter_no_match(self, api, published_job):
        r = api.get('/api/v1/jobs/?experience_level=lead')
        assert r.data['count'] == 0

    def test_filter_by_skills(self, api, recruiter, company):
        skill = Skill.objects.create(name='Django', slug='django')
        job   = Job.objects.create(
            recruiter=recruiter, company=company,
            title='Django Dev', description='Build APIs.',
            status=Job.Status.PUBLISHED, experience_level='mid',
            job_type='full_time', work_mode='remote',
        )
        job.skills_required.add(skill)
        r = api.get('/api/v1/jobs/?skills=Django')
        assert r.data['count'] >= 1

    def test_low_competition_filter(self, api, published_job):
        r = api.get('/api/v1/jobs/?low_competition=true')
        assert r.status_code == http_status.HTTP_200_OK


# ══════════════════════════════════════════════════════════════════════════════
# Swipe System tests
# ══════════════════════════════════════════════════════════════════════════════

@pytest.mark.django_db
class TestSwipeSystem:
    def test_swipe_right_saves_job(self, api, seeker, published_job):
        auth(api, seeker)
        r = api.post('/api/v1/jobs/swipe/', {
            'job_id': str(published_job.id), 'direction': 'right', 'save': True
        }, format='json')
        assert r.status_code == http_status.HTTP_200_OK
        assert r.data['data']['saved'] is True
        assert SwipeHistory.objects.filter(job_seeker=seeker, job=published_job, direction='right').exists()
        assert SavedJob.objects.filter(job_seeker=seeker, job=published_job).exists()

    def test_swipe_right_and_apply(self, api, seeker, published_job):
        auth(api, seeker)
        r = api.post('/api/v1/jobs/swipe/', {
            'job_id': str(published_job.id), 'direction': 'right', 'apply': True, 'save': False
        }, format='json')
        assert r.data['data']['applied'] is True
        assert JobApplication.objects.filter(job_seeker=seeker, job=published_job).exists()

    def test_swipe_left_skips_job(self, api, seeker, published_job):
        auth(api, seeker)
        r = api.post('/api/v1/jobs/swipe/', {
            'job_id': str(published_job.id), 'direction': 'left', 'save': False
        }, format='json')
        assert r.status_code == http_status.HTTP_200_OK
        assert SwipeHistory.objects.filter(job_seeker=seeker, job=published_job, direction='left').exists()
        assert not SavedJob.objects.filter(job_seeker=seeker, job=published_job).exists()

    def test_swipe_history_endpoint(self, api, seeker, published_job):
        SwipeHistory.objects.create(job_seeker=seeker, job=published_job, direction='right')
        auth(api, seeker)
        r = api.get('/api/v1/jobs/swipe/history/')
        assert r.status_code == http_status.HTTP_200_OK
        assert len(r.data['data']) >= 1

    def test_recruiter_cannot_swipe(self, api, recruiter, published_job):
        auth(api, recruiter)
        r = api.post('/api/v1/jobs/swipe/', {
            'job_id': str(published_job.id), 'direction': 'right'
        }, format='json')
        assert r.status_code == http_status.HTTP_403_FORBIDDEN

    def test_saved_jobs_endpoint(self, api, seeker, published_job):
        SavedJob.objects.create(job_seeker=seeker, job=published_job)
        auth(api, seeker)
        r = api.get('/api/v1/jobs/saved/')
        assert r.status_code == http_status.HTTP_200_OK
        assert len(r.data['data']) >= 1

    def test_unsave_job(self, api, seeker, published_job):
        SavedJob.objects.create(job_seeker=seeker, job=published_job)
        auth(api, seeker)
        r = api.delete(f'/api/v1/jobs/saved/{published_job.id}/')
        assert r.status_code == http_status.HTTP_204_NO_CONTENT

    def test_apply_to_job(self, api, seeker, published_job):
        auth(api, seeker)
        r = api.post(f'/api/v1/jobs/{published_job.id}/apply/', {}, format='json')
        assert r.status_code == http_status.HTTP_201_CREATED

    def test_duplicate_application_rejected(self, api, seeker, published_job):
        JobApplication.objects.create(job_seeker=seeker, job=published_job)
        auth(api, seeker)
        r = api.post(f'/api/v1/jobs/{published_job.id}/apply/', {}, format='json')
        assert r.status_code == http_status.HTTP_400_BAD_REQUEST

    def test_seeker_stats(self, api, seeker, published_job):
        SwipeHistory.objects.create(job_seeker=seeker, job=published_job, direction='right')
        SavedJob.objects.create(job_seeker=seeker, job=published_job)
        auth(api, seeker)
        r = api.get('/api/v1/jobs/seeker/stats/')
        assert r.status_code == http_status.HTTP_200_OK
        assert r.data['data']['swipe_count'] >= 1

    def test_my_applications(self, api, seeker, published_job):
        JobApplication.objects.create(job_seeker=seeker, job=published_job)
        auth(api, seeker)
        r = api.get('/api/v1/jobs/applications/')
        assert r.status_code == http_status.HTTP_200_OK
        assert len(r.data['data']) >= 1


# ══════════════════════════════════════════════════════════════════════════════
# Feed & Recommendation tests
# ══════════════════════════════════════════════════════════════════════════════

@pytest.mark.django_db
class TestFeedAndRecommendations:
    def test_job_feed_excludes_swiped(self, api, seeker, published_job):
        SwipeHistory.objects.create(job_seeker=seeker, job=published_job, direction='left')
        auth(api, seeker)
        r = api.get('/api/v1/jobs/feed/')
        assert r.status_code == http_status.HTTP_200_OK
        ids = [j['id'] for j in r.data['data']]
        assert str(published_job.id) not in ids

    def test_recommended_jobs(self, api, seeker, published_job):
        auth(api, seeker)
        r = api.get('/api/v1/jobs/recommended/')
        assert r.status_code == http_status.HTTP_200_OK


# ══════════════════════════════════════════════════════════════════════════════
# Recruitment workflow & Applicant Profile (Milestone 3.1)
# ══════════════════════════════════════════════════════════════════════════════

@pytest.mark.django_db
class TestRecruitmentWorkflow:
    def _application(self, seeker, published_job):
        return JobApplication.objects.create(job_seeker=seeker, job=published_job)

    def test_full_pipeline_progression(self, api, recruiter, seeker, published_job):
        app = self._application(seeker, published_job)
        auth(api, recruiter)
        pipeline = ['reviewed', 'shortlisted', 'interview_scheduled', 'interview_completed', 'offered', 'accepted']
        for new_status in pipeline:
            r = api.patch(
                f'/api/v1/jobs/recruiter/jobs/{published_job.id}/applicants/{app.id}/',
                {'status': new_status}, format='json'
            )
            assert r.status_code == http_status.HTTP_200_OK
            assert r.data['data']['status'] == new_status

        app.refresh_from_db()
        assert len(app.status_history) == len(pipeline)
        assert app.status_history[-1]['status'] == 'accepted'

    def test_status_change_records_note(self, api, recruiter, seeker, published_job):
        app = self._application(seeker, published_job)
        auth(api, recruiter)
        r = api.patch(
            f'/api/v1/jobs/recruiter/jobs/{published_job.id}/applicants/{app.id}/',
            {'status': 'rejected', 'note': 'Not enough backend experience'}, format='json'
        )
        assert r.status_code == http_status.HTTP_200_OK
        app.refresh_from_db()
        assert app.status_history[-1]['note'] == 'Not enough backend experience'

    def test_invalid_status_rejected(self, api, recruiter, seeker, published_job):
        app = self._application(seeker, published_job)
        auth(api, recruiter)
        r = api.patch(
            f'/api/v1/jobs/recruiter/jobs/{published_job.id}/applicants/{app.id}/',
            {'status': 'not_a_real_status'}, format='json'
        )
        assert r.status_code == http_status.HTTP_400_BAD_REQUEST

    def test_other_recruiter_cannot_update_status(self, api, seeker, published_job):
        app = self._application(seeker, published_job)
        other_recruiter = User.objects.create_user(
            email='other@test.com', password='Pass1234!', role=User.Role.RECRUITER
        )
        auth(api, other_recruiter)
        r = api.patch(
            f'/api/v1/jobs/recruiter/jobs/{published_job.id}/applicants/{app.id}/',
            {'status': 'shortlisted'}, format='json'
        )
        assert r.status_code == http_status.HTTP_404_NOT_FOUND

    def test_seeker_cannot_update_status(self, api, seeker, published_job):
        app = self._application(seeker, published_job)
        auth(api, seeker)
        r = api.patch(
            f'/api/v1/jobs/recruiter/jobs/{published_job.id}/applicants/{app.id}/',
            {'status': 'shortlisted'}, format='json'
        )
        assert r.status_code == http_status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
class TestApplicantProfile:
    def _application(self, seeker, published_job):
        return JobApplication.objects.create(job_seeker=seeker, job=published_job)

    def test_applicant_profile_without_resume(self, api, recruiter, seeker, published_job):
        app = self._application(seeker, published_job)
        auth(api, recruiter)
        r = api.get(f'/api/v1/jobs/recruiter/jobs/{published_job.id}/applicants/{app.id}/profile/')
        assert r.status_code == http_status.HTTP_200_OK
        data = r.data['data']
        assert data['personal']['email'] == seeker.email
        assert data['resume'] is None
        assert data['ats'] is None
        assert data['application']['status'] == 'pending'

    def test_applicant_profile_with_resume_includes_ats_and_sections(self, api, recruiter, seeker, published_job):
        from apps.resumes.models import Resume
        published_job.skills_required.set([])
        app = self._application(seeker, published_job)
        Resume.objects.create(
            user=seeker, file='resumes/x/y.pdf', original_filename='r.pdf', file_type='pdf',
            raw_text='Experienced Python Django developer.',
            parsed_skills=['Python', 'Django'],
            parsed_technologies=['Python', 'Django'],
            parsed_education=['B.Tech Computer Science'],
            parsed_experience=['Software Engineer, 2 years'],
            parsed_projects=[{'title': 'SwipeX', 'technologies': ['Django'], 'description': 'Job platform.'}],
            parsed_certifications=['AWS Certified'],
            has_github_link=True, has_linkedin_link=True,
            parsed_github_url='https://github.com/testuser',
            parsed_linkedin_url='https://linkedin.com/in/testuser',
            parse_status=Resume.ParseStatus.SUCCESS,
        )
        auth(api, recruiter)
        r = api.get(f'/api/v1/jobs/recruiter/jobs/{published_job.id}/applicants/{app.id}/profile/')
        assert r.status_code == http_status.HTTP_200_OK
        data = r.data['data']
        assert data['resume'] is not None
        assert data['ats'] is not None
        assert 'Python' in data['skills']
        assert len(data['projects']) == 1
        assert data['projects'][0]['title'] == 'SwipeX'
        assert data['personal']['github'] == 'https://github.com/testuser'
        assert data['personal']['linkedin'] == 'https://linkedin.com/in/testuser'

    def test_applicant_profile_forbidden_for_other_recruiter(self, api, seeker, published_job):
        app = self._application(seeker, published_job)
        other_recruiter = User.objects.create_user(
            email='other2@test.com', password='Pass1234!', role=User.Role.RECRUITER
        )
        auth(api, other_recruiter)
        r = api.get(f'/api/v1/jobs/recruiter/jobs/{published_job.id}/applicants/{app.id}/profile/')
        assert r.status_code == http_status.HTTP_404_NOT_FOUND


@pytest.mark.django_db
class TestRecruiterDashboardStats:
    def test_dashboard_pipeline_breakdown(self, api, recruiter, published_job):
        seekers = [
            User.objects.create_user(email=f's{i}@test.com', password='Pass1234!', role=User.Role.JOB_SEEKER)
            for i in range(5)
        ]
        statuses = ['pending', 'shortlisted', 'interview_scheduled', 'offered', 'rejected']
        for seeker, st in zip(seekers, statuses):
            JobApplication.objects.create(job_seeker=seeker, job=published_job, status=st)

        auth(api, recruiter)
        r = api.get('/api/v1/jobs/recruiter/stats/')
        assert r.status_code == http_status.HTTP_200_OK
        data = r.data['data']
        assert data['total_applicants'] == 5
        assert data['new_applications'] == 1
        assert data['shortlisted'] == 1
        assert data['interviews'] == 1
        assert data['offers'] == 1
        assert data['rejected'] == 1
        assert 'average_ats_score' in data

    def test_dashboard_average_ats_score_computed(self, api, recruiter, published_job):
        from apps.resumes.models import Resume
        seeker = User.objects.create_user(email='withresume@test.com', password='Pass1234!', role=User.Role.JOB_SEEKER)
        JobApplication.objects.create(job_seeker=seeker, job=published_job)
        Resume.objects.create(
            user=seeker, file='resumes/x/y.pdf', original_filename='r.pdf', file_type='pdf',
            raw_text='Python Django developer', parsed_skills=['Python'], parsed_technologies=['Python'],
            parse_status=Resume.ParseStatus.SUCCESS,
        )
        auth(api, recruiter)
        r = api.get('/api/v1/jobs/recruiter/stats/')
        assert r.data['data']['average_ats_score'] is not None
