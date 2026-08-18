import os
import sys
import io

# Dynamically add venv site-packages & backend paths to sys.path for IDE linter resolution
backend_dir = os.path.dirname(os.path.abspath(__file__))
venv_site_packages = os.path.abspath(os.path.join(backend_dir, "..", "venv", "Lib", "site-packages"))
if os.path.exists(venv_site_packages) and venv_site_packages not in sys.path:
    sys.path.insert(0, venv_site_packages)
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from fastapi.testclient import TestClient  # type: ignore
from app.main import app

client = TestClient(app, base_url="http://test/api")

def test_milestone3_workflow():
    print("=== Testing Milestone 3 AI Resume & ATS Workflow ===")
    
    # 1. Health check
    res = client.get("/health")
    assert res.status_code == 200, f"Health check failed: {res.text}"
    print("[OK] Backend health check passed")

    # 2. Register candidate user
    email = "candidate_m3@swipex.io"
    password = "Password123!"
    
    reg_res = client.post("/auth/register", json={
        "email": email,
        "password": password,
        "role": "job_seeker",
        "full_name": "AI Resume Test Candidate"
    })
    
    if reg_res.status_code == 201 or reg_res.status_code == 409:
        login_res = client.post("/auth/login", json={"email": email, "password": password})
        assert login_res.status_code == 200, f"Login failed: {login_res.text}"
        tokens = login_res.json()
    else:
        assert False, f"Unexpected register status: {reg_res.text}"

    access_token = tokens["access_token"]

    headers = {"Authorization": f"Bearer {access_token}"}
    print(f"[OK] Candidate logged in successfully: {email}")

    # 3. Create dummy resume PDF file in memory
    sample_resume_content = """
    Jane Candidate - Senior Fullstack Engineer
    Email: jane@example.com | Phone: 555-0199 | Location: San Francisco, CA
    
    SUMMARY:
    Passionate software engineer with 5 years of experience building web applications using React, TypeScript, Python, FastAPI, and PostgreSQL. Experienced with State Management, REST APIs, Git, and Docker.
    
    SKILLS:
    - Frontend: React, TypeScript, Next.js, State Management, HTML, CSS, TailwindCSS
    - Backend: Python, FastAPI, Django, REST APIs, Node.js, SQL, PostgreSQL
    - Tools: Docker, Git, GitHub, Linux, CI/CD
    
    EXPERIENCE:
    Senior Software Engineer | Tech Corp (2022 - Present)
    - Architected scalable React frontend with TypeScript and FastAPI microservices.
    - Improved page load performance by 40% and optimized SQL queries on PostgreSQL.
    """

    # 4. Upload resume
    files = {
        'file': ('sample_resume.txt', io.BytesIO(sample_resume_content.encode('utf-8')), 'text/plain')
    }

    upload_res = client.post("/resumes/upload", headers=headers, files=files)
    assert upload_res.status_code == 200, f"Resume upload failed: {upload_res.text}"
    resume_data = upload_res.json()
    print("[OK] Resume uploaded successfully!")
    print(f"     Filename: {resume_data['filename']}")
    print(f"     Extracted Skills ({len(resume_data['parsed_skills'])}): {resume_data['parsed_skills']}")

    # 5. Fetch resume details (/api/resumes/me)
    me_res = client.get("/resumes/me", headers=headers)
    assert me_res.status_code == 200, f"Get my resume failed: {me_res.text}"
    print("[OK] /api/resumes/me verified")

    # 6. Fetch jobs to analyze against
    jobs_res = client.get("/jobs")
    assert jobs_res.status_code == 200
    jobs = jobs_res.json()
    assert len(jobs) > 0, "No jobs found for analysis"
    target_job = jobs[0]
    print(f"[OK] Target Job selected for ATS analysis: {target_job['title']} (ID: {target_job['id']})")

    # 7. Analyze resume for target job (/api/resumes/analyze/{job_id})
    analyze_res = client.post(f"/resumes/analyze/{target_job['id']}", headers=headers)
    assert analyze_res.status_code == 200, f"ATS Analysis failed: {analyze_res.text}"
    ats_data = analyze_res.json()
    print("[OK] ATS Analysis completed successfully!")
    print(f"     ATS Score: {ats_data['ats_score']}% ({ats_data['match_rating']})")
    print(f"     Is High Match (>=80%): {ats_data['is_high_match']}")
    print(f"     Matched Keywords: {ats_data['matched_keywords']}")
    print(f"     Missing Keywords: {ats_data['missing_keywords']}")
    print(f"     AI Suggestions ({len(ats_data['suggestions'])}):")
    for idx, sug in enumerate(ats_data['suggestions'], 1):
        print(f"       {idx}. {sug}")

    # 8. Check AI recommendation feed (/api/recommendations)
    recs_res = client.get("/recommendations", headers=headers)
    assert recs_res.status_code == 200, f"Recommendations failed: {recs_res.text}"
    recs = recs_res.json()
    assert len(recs) > 0
    print("[OK] AI Job Recommendation Feed verified!")
    print(f"     First Recommended Job: {recs[0]['title']} - AI Match: {recs[0].get('ai_match_score')}%")

    print("\n=== ALL MILESTONE 3 BACKEND TESTS PASSED 100%! ===\n")

if __name__ == "__main__":
    test_milestone3_workflow()
