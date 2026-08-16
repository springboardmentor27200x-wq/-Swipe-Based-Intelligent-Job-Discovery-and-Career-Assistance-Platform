def test_signup_jobseeker(client):
    payload = {
        "full_name": "Test Candidate",
        "email": "candidate@example.com",
        "password": "Password123!",
        "role": "job_seeker"
    }
    response = client.post("/api/auth/signup", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert "access_token" in data
    assert data["user"]["email"] == "candidate@example.com"


def test_login_success(client):
    # First sign up
    client.post("/api/auth/signup", json={
        "full_name": "Test Recruiter",
        "email": "recruiter@example.com",
        "password": "Password123!",
        "role": "recruiter"
    })

    # Then login
    login_resp = client.post("/api/auth/login", json={
        "email": "recruiter@example.com",
        "password": "Password123!"
    })
    assert login_resp.status_code == 200
    assert "access_token" in login_resp.json()


def test_invalid_login(client):
    response = client.post("/api/auth/login", json={
        "email": "nonexistent@example.com",
        "password": "wrongpassword"
    })
    assert response.status_code == 401
