import os
import sys

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

def test_milestone5_messaging():
    print("=== Testing Milestone 5 Job Seeker -> Recruiter Messaging & AI Chat Engine ===")

    # 1. Health check
    res = client.get("/health")
    assert res.status_code == 200, f"Health check failed: {res.text}"
    print("[OK] Backend health check passed")

    # 2. Register / Login Candidate
    candidate_email = "candidate_m5@swipex.io"
    password = "Password123!"
    reg_cand = client.post("/auth/register", json={
        "email": candidate_email,
        "password": password,
        "role": "job_seeker",
        "full_name": "Messaging Candidate"
    })
    cand_login = client.post("/auth/login", json={"email": candidate_email, "password": password})
    assert cand_login.status_code == 200, f"Candidate login failed: {cand_login.text}"
    cand_token = cand_login.json()["access_token"]
    cand_headers = {"Authorization": f"Bearer {cand_token}"}
    print(f"[OK] Candidate logged in: {candidate_email}")

    # 3. Register / Login Recruiter
    recruiter_email = "recruiter_m5@swipex.io"
    reg_rec = client.post("/auth/register", json={
        "email": recruiter_email,
        "password": password,
        "role": "recruiter",
        "full_name": "Messaging Recruiter"
    })
    rec_login = client.post("/auth/login", json={"email": recruiter_email, "password": password})
    assert rec_login.status_code == 200, f"Recruiter login failed: {rec_login.text}"
    rec_token = rec_login.json()["access_token"]
    rec_headers = {"Authorization": f"Bearer {rec_token}"}
    print(f"[OK] Recruiter logged in: {recruiter_email}")

    # 4. Recruiter creates company & posts job
    comp_res = client.post("/companies", headers=rec_headers, json={
        "name": "ChatTech Inc",
        "type": "startup",
        "location": "San Francisco, CA"
    })
    comp_id = comp_res.json()["id"]

    job_res = client.post("/jobs", headers=rec_headers, json={
        "company_id": comp_id,
        "title": "Lead MERN Chat Engineer",
        "job_type": "full_time",
        "salary_min": 120000,
        "salary_max": 160000,
        "skills_required": ["React", "Node.js", "WebSockets", "MongoDB"]
    })
    job_id = job_res.json()["id"]
    print(f"[OK] Job posted by recruiter: Lead MERN Chat Engineer (ID: {job_id})")

    # 5. Candidate swipes right on job
    swipe_res = client.post("/swipes", headers=cand_headers, json={
        "job_id": job_id,
        "direction": "right"
    })
    assert swipe_res.status_code == 201, f"Swipe failed: {swipe_res.text}"
    print("[OK] Candidate swiped right / applied to job")

    # 6. Candidate initializes conversation
    conv_res = client.post("/conversations", headers=cand_headers, json={
        "job_id": job_id
    })
    assert conv_res.status_code == 200, f"Conversation create failed: {conv_res.text}"
    conv_data = conv_res.json()
    conv_id = conv_data["id"]
    print(f"[OK] Conversation thread created successfully (ID: {conv_id})")

    # 7. Candidate sends first message
    msg1_res = client.post(f"/conversations/{conv_id}/messages", headers=cand_headers, json={
        "content": "Hi! I submitted my application for the Lead MERN Chat Engineer role. Excited to connect!"
    })
    assert msg1_res.status_code == 200, f"Send message 1 failed: {msg1_res.text}"
    print("[OK] Candidate sent first message")

    # 8. Recruiter gets inbox conversations & reads thread
    rec_convs = client.get("/conversations", headers=rec_headers).json()
    assert len(rec_convs) > 0, "Recruiter inbox is empty"
    print(f"[OK] Recruiter inbox retrieved ({len(rec_convs)} active thread)")

    # 9. Recruiter replies with AI smart reply
    msg2_res = client.post(f"/conversations/{conv_id}/messages", headers=rec_headers, json={
        "content": "Hi! We reviewed your profile and would love to schedule a 15-minute screening call this week."
    })
    assert msg2_res.status_code == 200, f"Send message 2 failed: {msg2_res.text}"
    print("[OK] Recruiter sent reply message")

    # 10. Fetch full thread message history & check read status
    history_res = client.get(f"/conversations/{conv_id}/messages", headers=cand_headers).json()
    assert len(history_res) == 2, f"Expected 2 messages, got {len(history_res)}"
    print(f"[OK] Message history verified: {len(history_res)} messages in thread")

    # 11. Test AI Assist endpoints (Polish Message & Smart Replies)
    ai_replies = client.post(f"/conversations/{conv_id}/ai-assist?mode=smart_replies", headers=rec_headers).json()
    assert "smart_replies" in ai_replies, "AI Smart Replies failed"
    print(f"[OK] AI Smart Replies generated: {ai_replies['smart_replies'][0]}")

    ai_polish = client.post(f"/conversations/{conv_id}/ai-assist?mode=polish_message&draft_content=when+interview", headers=cand_headers).json()
    assert "polished_message" in ai_polish, "AI Polish failed"
    print(f"[OK] AI Polish Message generated: '{ai_polish['polished_message'][:40]}...'")

    print("\n=== ALL MILESTONE 5 BACKEND TESTS PASSED 100%! ===")

if __name__ == "__main__":
    test_milestone5_messaging()

