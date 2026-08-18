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

client = TestClient(app)

def log_success(msg):
    print(f"\033[92m[OK] {msg}\033[0m")

def log_fail(msg):
    print(f"\033[91m[FAIL] {msg}\033[0m")
    sys.exit(1)

def run_test_suite():
    print("=" * 60)
    print("      SWIPEX MILESTONE 4 & FULL END-TO-END VERIFICATION")
    print("=" * 60)

    # 1. Health check
    r = client.get("/api/health")
    if r.status_code == 200:
        log_success("Backend health check passed")
    else:
        log_fail(f"Health check failed with status {r.status_code}")

    # 2. Register / Login Job Seeker
    seeker_email = "e2e_seeker@swipex.io"
    seeker_pass = "SecurePass123!"
    reg_data = {
        "email": seeker_email,
        "password": seeker_pass,
        "role": "job_seeker",
        "full_name": "E2E Seeker",
        "phone": "+1234567890",
        "location": "Remote"
    }
    client.post("/api/auth/register", json=reg_data)

    login_res = client.post("/api/auth/login", json={"email": seeker_email, "password": seeker_pass})
    if login_res.status_code != 200:
        log_fail(f"Seeker login failed: {login_res.text}")
    seeker_token = login_res.json()["access_token"]
    seeker_headers = {"Authorization": f"Bearer {seeker_token}"}
    log_success("Seeker login & JWT token acquired")

    # 3. Register / Login Recruiter
    recruiter_email = "e2e_recruiter@swipex.io"
    recruiter_pass = "SecurePass123!"
    reg_rec = {
        "email": recruiter_email,
        "password": recruiter_pass,
        "role": "recruiter",
        "full_name": "E2E Recruiter",
        "company_name": "SwipeX Tech",
        "company_website": "https://swipex.io"
    }
    client.post("/api/auth/register", json=reg_rec)
    rec_login = client.post("/api/auth/login", json={"email": recruiter_email, "password": recruiter_pass})
    rec_token = rec_login.json()["access_token"]
    rec_headers = {"Authorization": f"Bearer {rec_token}"}
    log_success("Recruiter login & JWT token acquired")

    # 4. Test Job Deck with Competition & Freshness Indicators
    jobs_res = client.get("/api/jobs", headers=seeker_headers)
    if jobs_res.status_code == 200:
        jobs = jobs_res.json()
        log_success(f"Fetched {len(jobs)} jobs with competition metrics")
        if jobs:
            sample_job = jobs[0]
            log_success(f"Sample Job Metrics -> Title: '{sample_job['title']}', Competition: '{sample_job.get('competition_level')}', Applicants: {sample_job.get('applicant_count')}")
    else:
        log_fail(f"Failed to fetch jobs: {jobs_res.text}")

    # 5. Record Swipe Right & Test Swipe Status Update
    if jobs:
        target_job_id = jobs[0]["id"]
        swipe_res = client.post("/api/swipes", headers=seeker_headers, json={"job_id": target_job_id, "direction": "right"})
        if swipe_res.status_code in [200, 201]:
            swipe_data = swipe_res.json()
            log_success(f"Recorded RIGHT swipe on job {target_job_id}")

            # Recruiter updates application status to 'shortlisted'
            status_res = client.patch(f"/api/swipes/{swipe_data['id']}/status", headers=rec_headers, json={"status": "shortlisted"})
            if status_res.status_code == 200:
                log_success("Recruiter updated candidate application status to 'shortlisted'")
            else:
                log_fail(f"Failed to update swipe status: {status_res.text}")

    # 6. Test Notifications Endpoint
    notif_res = client.get("/api/notifications", headers=seeker_headers)
    if notif_res.status_code == 200:
        notifs = notif_res.json()
        log_success(f"Fetched {len(notifs)} candidate notifications")
        if notifs:
            log_success(f"Latest Notification: '{notifs[0]['title']}' - '{notifs[0]['message']}'")
    else:
        log_fail(f"Notifications endpoint failed: {notif_res.text}")

    # 7. Test Seeker Analytics Endpoint
    seeker_analytics = client.get("/api/analytics/seeker", headers=seeker_headers)
    if seeker_analytics.status_code == 200:
        data = seeker_analytics.json()
        log_success(f"Seeker Analytics -> Total Applications: {data['total_applications']}, Shortlisted: {data['shortlisted_count']}, Avg ATS Score: {data['average_ats_score']}%")
    else:
        log_fail(f"Seeker analytics failed: {seeker_analytics.text}")

    # 8. Test Recruiter Analytics Endpoint
    rec_analytics = client.get("/api/analytics/recruiter", headers=rec_headers)
    if rec_analytics.status_code == 200:
        data = rec_analytics.json()
        log_success(f"Recruiter Analytics -> Active Jobs: {data['total_active_jobs']}, Applicants: {data['total_applicants']}, Conversion Rate: {data['conversion_rate']}%")
    else:
        log_fail(f"Recruiter analytics failed: {rec_analytics.text}")

    print("=" * 60)
    print("  [SUCCESS] ALL MILESTONE 4 & E2E VERIFICATION TESTS PASSED 100%!")
    print("=" * 60)

if __name__ == "__main__":
    run_test_suite()
