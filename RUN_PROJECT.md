# RUN_PROJECT.md — SwipeX Milestone 3

This guide walks through setting up and running SwipeX end-to-end, including
the new Milestone 3 Resume Intelligence features (upload, parsing, ATS
scoring, compatibility, and the resume-aware recommendation engine).

Works on Windows, macOS, and Linux — commands are given for both
PowerShell and bash/zsh where they differ.

---

## 1. Prerequisites

| Tool | Version |
|---|---|
| Python | 3.10+ (tested on 3.12) |
| Node.js | 18+ (tested on 22) |
| npm | 9+ |

No database server is required for local/demo use — SQLite is used by
default. PostgreSQL is supported via `DATABASE_URL` for production (see
`docker-compose.yml`).

---

## 2. Backend Setup

### 2.1 Create and activate a virtual environment

```powershell
# Windows PowerShell
cd SwipeX_Milestone3\backend
python -m venv venv
venv\Scripts\activate
```

```bash
# macOS / Linux
cd SwipeX_Milestone3/backend
python3 -m venv venv
source venv/bin/activate
```

### 2.2 Install dependencies

```bash
pip install -r requirements.txt
```

This installs Django, DRF, JWT auth, and the Milestone 3 resume-parsing
libraries: `pdfplumber` (PDF text extraction) and `python-docx` (DOCX text
extraction). Both are pure-Python / no external model downloads, so this
step works fully offline once the packages are cached.

### 2.3 Configure environment

```bash
cp .env.example .env      # macOS/Linux
copy .env.example .env    # Windows
```

The defaults work out of the box with SQLite — no edits needed for local
demo use.

### 2.4 Run migrations

```bash
python manage.py migrate
```

This creates all tables, including the new Milestone 3 tables:
`swipex_resumes` (uploaded resumes + parsed fields) and
`swipex_ats_scores` (cached ATS score per resume↔job pair).

### 2.5 Seed demo data

```bash
python manage.py seed_data
```

Creates demo companies, jobs, skills, recruiters, and job-seeker accounts
(see `DEMO_ACCOUNTS.md`). Safe to re-run. Use `--clear` to wipe and
reseed from scratch.

### 2.6 Create an admin superuser (optional — one is already seeded)

```bash
python manage.py shell -c "from apps.users.models import User; User.objects.create_superuser(email='admin@swipex.demo', password='Admin@1234') if not User.objects.filter(email='admin@swipex.demo').exists() else print('exists')"
```

### 2.7 Start the backend

```bash
python manage.py runserver
```

- API base: `http://127.0.0.1:8000/api/v1/`
- Admin: `http://127.0.0.1:8000/admin/` (Milestone 3 adds `Resume` and
  `ATSScore` to the admin site under **Resumes**)

---

## 3. Frontend Setup

Open a second terminal.

```bash
cd SwipeX_Milestone3/frontend
npm install
cp .env.example .env      # macOS/Linux — copy .env.example .env on Windows
npm run dev
```

Frontend: `http://localhost:3000`

To produce a production build:

```bash
npm run build
```

Output goes to `frontend/dist/`.

---

## 4. Logging In

Use any account from `DEMO_ACCOUNTS.md`. Password for every account is
**Demo@1234** (admin is **Admin@1234**).

Job seekers land on their dashboard; recruiters land on the recruiter
dashboard. Switch accounts any time via Logout → Login.

---

## 5. How to Upload a Resume

1. Log in as a **Job Seeker** (e.g. `pratyusha@swipex.demo`).
2. Go to **Profile** (top navigation).
3. Scroll to the **Resume** card.
4. Click **Upload resume** and choose a `.pdf` or `.docx` file (max 10MB).
5. The resume uploads, is parsed automatically, and becomes your **primary**
   resume (used for ATS scoring and recommendations). Parsed details —
   detected skills, education, experience, projects, certifications,
   GitHub/LinkedIn links — are viewable by expanding **"View parsed
   details"**.
6. You can upload multiple resumes; only one is ever "primary" at a time.
   Use **Set primary** to switch, or **Delete** to remove one. If parsing
   fails (e.g. a scanned/image-only PDF with no extractable text), use
   **Retry parse** after fixing the file.

No resume yet? Every job's **Resume Compatibility** panel will show a
prompt linking back to Profile until one is uploaded.

---

## 6. How the ATS Score Is Calculated

For every job, SwipeX computes a transparent, rule-based ATS
(Applicant Tracking System) style score out of 100, combining four
weighted factors:

| Factor | Weight | What it measures |
|---|---|---|
| **Skill Match** | 40% | Overlap between your resume's detected skills/technologies and the job's required skills |
| **Keyword Match** | 25% | How many meaningful keywords from the job description/requirements appear in your resume text |
| **Experience Match** | 20% | Your estimated years of experience (from resume dates, or your profile) vs. the job's experience level band |
| **Education Match** | 15% | Whether an education section was detected in your resume |

The weighted sum becomes the **ATS Score**, and maps to a compatibility
label:

| Score | Label |
|---|---|
| 85–100% | Excellent |
| 70–84% | Good |
| 50–69% | Fair |
| 0–49% | Poor |

The same computation also produces:
- **Matched skills** — skills you have that the job wants
- **Missing skills** — skills the job wants that weren't found in your resume
- **Missing keywords** — other role-specific terms from the job posting not found in your resume
- **Resume optimization suggestions** — short, actionable tips (e.g. "Add Docker to your resume", "Add your GitHub link", "Include Django project experience")

This appears on the **Job Details** page under **Resume Compatibility**,
and as compact `ATS %` badges on job cards / the swipe feed.

**Why rule-based instead of an LLM/ML model?** It keeps the scoring fully
deterministic, explainable (every point is traceable to a specific
overlap), fast (no network calls or GPU), and installable without
downloading any external model weights — appropriate for an ATS-style
engine where transparency matters as much as accuracy.

---

## 7. How the Recommendation Engine Works

The existing Milestone 2 recommendation engine (skills overlap, saved
jobs, swipe history, profile preferences, recency) is **extended, not
replaced**. When you have a primary resume, its detected skills are
merged into the "seeker skills" signal used for skill-overlap scoring,
and a resume-specific bonus is added on top of the original 100-point
scale (so existing scoring behavior for seekers without a resume is
unchanged). Recommendation `reasons` will show entries like
**"Resume matches: Python, Docker"** when your resume contributed to the
score.

To test it:
1. Upload a resume with skills that match some jobs but not others.
2. Visit **Recommended** — jobs matching your resume skills should rank
   higher, and their `reasons` list should mention the resume match.

---

## 8. Testing Every Milestone 3 Feature

### Backend automated tests

```bash
cd SwipeX_Milestone3/backend
pytest -v
# Expected: 118 passed (95 from Milestones 1-3 + 18 from Milestone 4 +
#            4 from Milestone 4.1 + 2 from Milestone 4.2 +
#            net -1 from Milestone 4.3 chart removal)
```

### Manual verification checklist

| Feature | How to verify |
|---|---|
| Resume upload (PDF) | Profile → upload a `.pdf` → status becomes "success", skills/education/etc. appear |
| Resume upload (DOCX) | Same, with a `.docx` file |
| Resume rejected file types | Try uploading a `.txt` or `.png` → clear inline error, no crash |
| Resume management | Upload 2 resumes → only one shows "Primary" badge; "Set primary" swaps it; "Delete" removes one |
| Parsing accuracy | Use a resume with clear `SKILLS`, `EDUCATION`, `EXPERIENCE`, `PROJECTS`, `CERTIFICATIONS` headers → each section populates correctly |
| ATS score on job list | Open Discover/Recommended feed as a seeker with a resume → `ATS %` badge appears on cards |
| ATS score on job detail | Open any job → "Resume Compatibility" panel shows score ring, factor bars, matched/missing skills, suggestions |
| No resume state | New seeker account with no resume → Job Details shows an upload prompt instead of a score |
| Missing skills | Upload a resume missing 2–3 skills a job requires → they appear under "Missing skills" and generate "Add X" suggestions |
| Recommendation engine | Compare `Recommended` feed reasons before and after uploading a resume with distinctive skills |
| Reparse | Force a parse failure (e.g. a resume with an unreadable/blank PDF) → status shows "failed" with an error, "Retry parse" works after replacing the file |
| Projects parsing | Upload a resume with a "Projects" section (any common header variant, bulleted or not) → Profile shows structured entries with title/technologies/description |
| Dynamic suggestions | Resume with real projects + GitHub + LinkedIn → those items are absent from "Resume optimization suggestions" |
| Semantic recommendation factor | Upload a resume whose text closely matches a job description → check `Recommended` feed reasons for "semantic match" |
| Job card single score | Discover/Recommended feed → each card shows exactly one score (ATS % + Excellent/Good/Fair/Poor badge), no separate "Match %" |
| Applicant Profile | As a recruiter, open Applicants → click an applicant → full profile with personal details, education, experience, projects, skills, certifications, resume preview/download, ATS breakdown |
| Recruitment workflow | From the Applicant Profile, advance status through Applied → Resume Reviewed → Shortlisted → Interview Scheduled → Interview Completed → Offered → Accepted (or Reject) → each change appears in Status History |
| Recruiter dashboard | Recruiter dashboard shows New Applications / Shortlisted / Interviews / Offers / Rejected / Avg. ATS Score, updating as you change applicant statuses |

### API smoke test (curl)

```bash
# 1. Login
curl -X POST http://127.0.0.1:8000/api/v1/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email":"pratyusha@swipex.demo","password":"Demo@1234"}'
# copy data.tokens.access from the response

# 2. Upload a resume
curl -X POST http://127.0.0.1:8000/api/v1/resumes/upload/ \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -F "file=@/path/to/resume.pdf"

# 3. Check ATS match for a job
curl http://127.0.0.1:8000/api/v1/resumes/match/<job_id>/ \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

---

## 8.1 Testing Milestone 4 Features (Notifications, Analytics, Skill Gap)

### Backend automated tests

```bash
cd SwipeX_Milestone3/backend
pytest apps/notifications apps/analytics -v
# Expected: 18 passed
```

### Manual verification checklist

| Feature | How to verify |
|---|---|
| Notification bell | Log in → bell icon in navbar shows an unread badge count |
| Notification dropdown | Click the bell → see recent notifications, click one to mark it read and navigate |
| Notification history page | Click "View all notifications" → `/notifications` shows full list, filter by Unread, "Mark all read" |
| Instant: new application | As a recruiter, have a seeker apply to your job → a "New application received" notification appears for you |
| Instant: status change | As a recruiter, change an applicant's status to Shortlisted → seeker gets a "Shortlisted" notification |
| Batch notifications | Run `python manage.py generate_notifications --hours 999999` against seeded data → new job / high-match / low-competition / resume-reminder notifications are created |
| Job Seeker Dashboard analytics | Dashboard (seeker) → Career Analytics section shows Resume Score, Avg. Match, Interviews, Skill Coverage cards + Match Score Trend line chart + Application Status donut chart |
| Recruiter Dashboard analytics | Dashboard (recruiter) → Hiring Analytics section shows Hiring Funnel bar chart, Applications Over Time line chart, Applications per Job, Candidate Skill Distribution |
| Application Tracking | My Applications page → dashboard cards (Total Applied / Under Review / Interviews / Rejected / Offers) + charts, click "View status timeline" on any application to see the 7-stage pipeline |
| Skill Gap Analysis | From a Job Details page click "🧩 Skill Gap", or visit `/skill-gap` → matched/missing skills, priority skills with learning suggestions, progress bar |
| Skill Gap history | On the Skill Gap page click "Save this analysis to history" → `GET /api/v1/skill-gap/history/` returns the saved snapshot |
| Recommendation explanation | Recommended feed / dashboard "Top Recommended Jobs" → each card shows a one-line explanation like "Matched because Python, React · 92% ATS Score · Missing Docker" |

### API smoke test (curl)

```bash
# 1. Login (reuse token from earlier steps)

# 2. Seeker dashboard analytics
curl http://127.0.0.1:8000/api/v1/dashboard/seeker/ \
  -H "Authorization: Bearer <ACCESS_TOKEN>"

# 3. Skill gap for a specific job
curl "http://127.0.0.1:8000/api/v1/skill-gap/?job_id=<JOB_ID>" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"

# 4. Notifications
curl http://127.0.0.1:8000/api/v1/notifications/ \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

---

## 9. Resetting for a Fresh Demo

```bash
cd SwipeX_Milestone3/backend
rm db.sqlite3            # del db.sqlite3 on Windows
rm -rf media/resumes      # rmdir /s media\resumes on Windows — clears uploaded resumes
python manage.py migrate
python manage.py seed_data
python manage.py generate_notifications --hours 999999   # optional: pre-populate demo notifications
python manage.py runserver
```

---

## 10. Troubleshooting

| Symptom | Fix |
|---|---|
| "No extractable text found in PDF" | The PDF is likely scanned/image-only with no text layer. Use a text-based PDF, or re-export the resume as DOCX/PDF from a word processor. |
| Resume upload 401/403 | You're not logged in as a Job Seeker — resumes are job-seeker only. |
| ATS score missing on job cards | You need a **primary** resume with `parse_status: success`. Check Profile → Resume. |
| `pip install` fails on pdfplumber/python-docx | Ensure you're inside the activated virtual environment and have internet access to PyPI on first install. |
| Frontend can't reach backend | Confirm backend is running on port 8000 and `frontend/.env` points to the right API base URL. |
