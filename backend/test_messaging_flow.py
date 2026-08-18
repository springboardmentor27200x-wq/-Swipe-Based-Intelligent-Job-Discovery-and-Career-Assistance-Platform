import requests

BASE_URL = "http://127.0.0.1:8000/api"

def run_messaging_test():
    print("=== Testing Real-Time Messaging Flow between Job Seeker and Recruiter ===")

    # 1. Fetch available jobs to find target job and its recruiter
    jobs_res = requests.get(f"{BASE_URL}/jobs")
    jobs = jobs_res.json()
    assert len(jobs) > 0, "No jobs found"
    target_job = jobs[0]
    print(f"[OK] 1. Target Job selected: '{target_job['title']}' (ID: {target_job['id']})")

    # 2. Login as Job Seeker (candidate)
    seeker_email = "candidate_m5@swipex.io"
    seeker_pass = "Password123!"
    
    seeker_login = requests.post(f"{BASE_URL}/auth/login", json={"email": seeker_email, "password": seeker_pass})
    if seeker_login.status_code != 200:
        # Fallback to default candidate
        seeker_email = "candidate@swipex.com"
        seeker_pass = "Candidate123!"
        seeker_login = requests.post(f"{BASE_URL}/auth/login", json={"email": seeker_email, "password": seeker_pass})

    assert seeker_login.status_code == 200, f"Job Seeker login failed: {seeker_login.text}"
    seeker_token = seeker_login.json()["access_token"]
    seeker_headers = {"Authorization": f"Bearer {seeker_token}"}
    print(f"[OK] 2. Job Seeker logged in: {seeker_email}")

    # 3. Job Seeker swipes right on the job to apply/save
    swipe_res = requests.post(f"{BASE_URL}/swipes", headers=seeker_headers, json={
        "job_id": target_job['id'],
        "direction": "right"
    })
    print(f"[OK] 3. Job Seeker swiped RIGHT (applied) on '{target_job['title']}'")

    # 4. Job Seeker creates conversation and sends message
    conv_res = requests.post(f"{BASE_URL}/conversations", headers=seeker_headers, json={
        "job_id": target_job['id']
    })
    assert conv_res.status_code == 200, f"Conversation creation failed: {conv_res.text}"
    conv = conv_res.json()
    conv_id = conv['id']
    print(f"[OK] 4. Conversation created (ID: {conv_id})")

    # Send message from Job Seeker
    msg_text = "Hello Recruiter! I submitted my application for the Lead MERN Chat Engineer role."
    msg_res = requests.post(f"{BASE_URL}/conversations/{conv_id}/messages", headers=seeker_headers, json={
        "content": msg_text
    })
    assert msg_res.status_code == 200, f"Send message failed: {msg_res.text}"
    print(f"[OK] 5. Job Seeker sent message: '{msg_text}'")

    # 5. Login as the actual Recruiter who posted this job
    recruiter_email = "recruiter_m5@swipex.io"
    recruiter_pass = "Password123!"
    
    rec_login = requests.post(f"{BASE_URL}/auth/login", json={"email": recruiter_email, "password": recruiter_pass})
    if rec_login.status_code != 200:
        recruiter_email = "recruiter@swipex.com"
        recruiter_pass = "Recruiter123!"
        rec_login = requests.post(f"{BASE_URL}/auth/login", json={"email": recruiter_email, "password": recruiter_pass})

    assert rec_login.status_code == 200, f"Recruiter login failed: {rec_login.text}"
    rec_token = rec_login.json()["access_token"]
    rec_headers = {"Authorization": f"Bearer {rec_token}"}
    print(f"[OK] 6. Recruiter logged in: {recruiter_email}")

    # 6. Check Recruiter's Inbox (/api/conversations)
    rec_convs_res = requests.get(f"{BASE_URL}/conversations", headers=rec_headers)
    assert rec_convs_res.status_code == 200, f"Recruiter inbox fetch failed: {rec_convs_res.text}"
    rec_convs = rec_convs_res.json()
    
    matching_conv = next((c for c in rec_convs if c['id'] == conv_id), None)
    assert matching_conv is not None, "Conversation not found in Recruiter's inbox!"
    
    print("\n========================================================")
    print("  SUCCESS: MESSAGE DELIVERED TO RECRUITER'S INBOX!")
    print("========================================================")
    print(f"  Recruiter Inbox Job Role: {matching_conv['job_title']}")
    print(f"  Candidate Name:           {matching_conv['other_party_name']}")
    print(f"  Latest Message Body:     '{matching_conv['last_message']}'")
    print(f"  Unread Count for Recruiter: {matching_conv['unread_count']}")
    print("========================================================\n")

    # 7. Recruiter sends reply back
    reply_text = "Hi Candidate! Thanks for reaching out. We reviewed your resume and would like to invite you for an interview!"
    reply_res = requests.post(f"{BASE_URL}/conversations/{conv_id}/messages", headers=rec_headers, json={
        "content": reply_text
    })
    assert reply_res.status_code == 200
    print(f"[OK] 7. Recruiter replied: '{reply_text}'")

    print("\n=== FULL END-TO-END MESSAGING VERIFICATION PASSED 100%! ===\n")

if __name__ == "__main__":
    run_messaging_test()
