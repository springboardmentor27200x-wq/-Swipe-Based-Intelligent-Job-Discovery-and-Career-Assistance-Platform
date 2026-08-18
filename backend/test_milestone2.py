import sys
import os

# Dynamically add venv site-packages & backend paths to sys.path for IDE linter resolution
backend_dir = os.path.dirname(os.path.abspath(__file__))
venv_site_packages = os.path.abspath(os.path.join(backend_dir, "..", "venv", "Lib", "site-packages"))
if os.path.exists(venv_site_packages) and venv_site_packages not in sys.path:
    sys.path.insert(0, venv_site_packages)
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from fastapi.testclient import TestClient  # type: ignore
from app.main import app
from app.database import SessionLocal
from app import models, auth

client = TestClient(app)

def run_tests():
    print("--- Running Milestone 2 Backend Verification ---")
    
    # 1. Health check
    res = client.get("/api/health")
    assert res.status_code == 200, f"Health check failed: {res.text}"
    print("[OK] Health check passed")

    # 2. Get companies
    res = client.get("/api/companies")
    assert res.status_code == 200, f"Get companies failed: {res.text}"
    companies = res.json()
    assert len(companies) > 0, "No companies found in database"
    print(f"[OK] Companies API returned {len(companies)} companies")

    # 3. Get all jobs
    res = client.get("/api/jobs")
    assert res.status_code == 200, f"Get jobs failed: {res.text}"
    jobs = res.json()
    assert len(jobs) > 0, "No jobs found in database"
    print(f"[OK] Jobs API returned {len(jobs)} jobs")

    # 4. Create test job seeker user
    test_seeker_email = "seeker_m2@swipex.com"
    db = SessionLocal()
    existing_seeker = db.query(models.User).filter(models.User.email == test_seeker_email).first()
    if not existing_seeker:
        reg_res = client.post("/api/auth/register", json={
            "email": test_seeker_email,
            "password": "Password123!",
            "role": "job_seeker",
            "full_name": "Test Seeker M2",
            "location": "San Francisco, CA"
        })
        assert reg_res.status_code == 201, f"Register seeker failed: {reg_res.text}"
    db.close()

    # Login test seeker
    login_res = client.post("/api/auth/login", json={
        "email": test_seeker_email,
        "password": "Password123!"
    })
    assert login_res.status_code == 200, f"Login seeker failed: {login_res.text}"
    token_data = login_res.json()
    access_token = token_data["access_token"]
    headers = {"Authorization": f"Bearer {access_token}"}
    print("[OK] Job Seeker registered and authenticated successfully")

    # 5. Fetch recommendations for job seeker
    rec_res = client.get("/api/recommendations", headers=headers)
    assert rec_res.status_code == 200, f"Get recommendations failed: {rec_res.text}"
    recs = rec_res.json()
    initial_rec_count = len(recs)
    print(f"[OK] Initial recommendations returned {initial_rec_count} unswiped jobs")
    assert initial_rec_count > 0, "Expected at least 1 job in recommendation feed"

    # 6. Record a swipe (swipe left on first job)
    first_job_id = recs[0]["id"]
    swipe_res = client.post("/api/swipes", headers=headers, json={
        "job_id": first_job_id,
        "direction": "left"
    })
    assert swipe_res.status_code == 201, f"Record swipe failed: {swipe_res.text}"
    print(f"[OK] Recorded 'left' swipe on job {first_job_id}")

    # 7. Check feed exclusion
    rec_res_after = client.get("/api/recommendations", headers=headers)
    assert rec_res_after.status_code == 200
    recs_after = rec_res_after.json()
    swiped_ids = [j["id"] for j in recs_after]
    assert first_job_id not in swiped_ids, "Swiped job was NOT excluded from recommendation feed!"
    assert len(recs_after) == initial_rec_count - 1
    print("[OK] Feed exclusion verified: swiped job successfully excluded from recommendation feed")

    # 8. Test filtering on recommendations (e.g., remote=true)
    filtered_res = client.get("/api/recommendations?remote=true", headers=headers)
    assert filtered_res.status_code == 200
    filtered_jobs = filtered_res.json()
    print(f"[OK] Smart filtering query (remote=true) returned {len(filtered_jobs)} matching jobs")

    print("\nALL MILESTONE 2 BACKEND VERIFICATION TESTS PASSED SUCCESSFULLY!")


if __name__ == "__main__":
    run_tests()
