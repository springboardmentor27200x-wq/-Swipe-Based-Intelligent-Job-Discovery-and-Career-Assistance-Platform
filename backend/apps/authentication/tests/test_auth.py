"""Tests for SwipeX authentication endpoints — Milestone 1."""

import pytest
from rest_framework.test import APIClient
from rest_framework import status

from apps.users.models import User


@pytest.fixture
def api_client():
    return APIClient()


@pytest.mark.django_db
class TestRegistration:
    def test_register_job_seeker_success(self, api_client):
        response = api_client.post('/api/v1/auth/register/', {
            'email': 'seeker@example.com',
            'password': 'StrongPass123!',
            'password_confirm': 'StrongPass123!',
            'first_name': 'Jane',
            'last_name': 'Doe',
            'role': 'job_seeker',
        }, format='json')

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['success'] is True
        assert response.data['data']['user']['role'] == 'job_seeker'
        assert 'access' in response.data['data']['tokens']
        assert User.objects.filter(email='seeker@example.com').exists()

    def test_register_recruiter_requires_company_name(self, api_client):
        response = api_client.post('/api/v1/auth/register/', {
            'email': 'recruiter@example.com',
            'password': 'StrongPass123!',
            'password_confirm': 'StrongPass123!',
            'role': 'recruiter',
        }, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_cannot_self_register_as_admin(self, api_client):
        response = api_client.post('/api/v1/auth/register/', {
            'email': 'wannabe-admin@example.com',
            'password': 'StrongPass123!',
            'password_confirm': 'StrongPass123!',
            'role': 'admin',
        }, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_password_mismatch_rejected(self, api_client):
        response = api_client.post('/api/v1/auth/register/', {
            'email': 'mismatch@example.com',
            'password': 'StrongPass123!',
            'password_confirm': 'Different123!',
            'role': 'job_seeker',
        }, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_duplicate_email_rejected(self, api_client):
        User.objects.create_user(email='dup@example.com', password='pass12345')
        response = api_client.post('/api/v1/auth/register/', {
            'email': 'dup@example.com',
            'password': 'StrongPass123!',
            'password_confirm': 'StrongPass123!',
            'role': 'job_seeker',
        }, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
class TestLogin:
    def setup_method(self):
        pass

    def _create_user(self):
        return User.objects.create_user(
            email='login@example.com', password='StrongPass123!', role=User.Role.JOB_SEEKER
        )

    def test_login_success(self, api_client):
        self._create_user()
        response = api_client.post('/api/v1/auth/login/', {
            'email': 'login@example.com', 'password': 'StrongPass123!'
        }, format='json')
        assert response.status_code == status.HTTP_200_OK
        assert 'access' in response.data['data']['tokens']

    def test_login_wrong_password(self, api_client):
        self._create_user()
        response = api_client.post('/api/v1/auth/login/', {
            'email': 'login@example.com', 'password': 'WrongPassword'
        }, format='json')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_login_nonexistent_user(self, api_client):
        response = api_client.post('/api/v1/auth/login/', {
            'email': 'ghost@example.com', 'password': 'whatever123'
        }, format='json')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
class TestAuthenticatedAccess:
    def _authed_client(self, role=User.Role.JOB_SEEKER):
        user = User.objects.create_user(email=f'{role}@example.com', password='StrongPass123!', role=role)
        client = APIClient()
        login = client.post('/api/v1/auth/login/', {
            'email': user.email, 'password': 'StrongPass123!'
        }, format='json')
        access = login.data['data']['tokens']['access']
        client.credentials(HTTP_AUTHORIZATION=f'Bearer {access}')
        return client, user

    def test_me_endpoint_requires_auth(self, api_client):
        response = api_client.get('/api/v1/users/me/')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_me_endpoint_returns_user(self):
        client, user = self._authed_client()
        response = client.get('/api/v1/users/me/')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['data']['email'] == user.email

    def test_job_seeker_profile_forbidden_for_recruiter(self):
        client, _ = self._authed_client(role=User.Role.RECRUITER)
        response = client.get('/api/v1/users/profile/')
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_recruiter_profile_forbidden_for_job_seeker(self):
        client, _ = self._authed_client(role=User.Role.JOB_SEEKER)
        response = client.get('/api/v1/users/recruiter-profile/')
        assert response.status_code == status.HTTP_403_FORBIDDEN
