def get_auth_headers(client, email="seeker@example.com"):
    client.post("/api/auth/signup", json={
        "full_name": "Job Seeker Test",
        "email": email,
        "password": "Password123!",
        "role": "job_seeker"
    })
    login_resp = client.post("/api/auth/login", json={
        "email": email,
        "password": "Password123!"
    })
    token = login_resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_get_jobseeker_profile(client):
    headers = get_auth_headers(client)
    response = client.get("/api/jobseeker/profile", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "seeker@example.com"


def test_discover_jobs(client):
    headers = get_auth_headers(client, email="seeker2@example.com")
    response = client.get("/api/jobseeker/jobs/discover", headers=headers)
    assert response.status_code == 200
    assert isinstance(response.json(), list)
