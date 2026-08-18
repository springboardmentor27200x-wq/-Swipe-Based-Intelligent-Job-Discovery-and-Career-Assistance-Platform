# SwipeX — Milestone 4
Swipe-based Intelligent Job Discovery & Career Assistance Platform
Fully functional working MVP · Presentation-ready demo data included

Milestone 4 adds **Smart Notifications, Application Tracking, Dashboard
Analytics, Skill Gap Analysis, and an enhanced (weighted, explainable)
Recommendation Engine** on top of the Milestone 1/2/3 platform. See
**[RUN_PROJECT.md](RUN_PROJECT.md)** for full setup instructions and
**[DEMO_ACCOUNTS.md](DEMO_ACCOUNTS.md)** for login credentials. See also
**[DATABASE_SCHEMA.md](DATABASE_SCHEMA.md)** for the full data model and
**[SCREENSHOTS.md](SCREENSHOTS.md)** for the presentation screenshot index.
Ready to go live? See **[DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)** for the
full Render (backend) + Vercel (frontend) deployment walkthrough.

---

## MILESTONE 4 — WHAT'S NEW

| Feature | Where |
|---|---|
| Notification bell + unread badge + dropdown | Navbar (all pages) |
| Full notification history page (filter unread, mark read/all-read, delete) | `/notifications` |
| Instant notifications: new application → recruiter, high-ATS applicant → recruiter, status change → seeker | Automatic (Django signals) |
| Batch notifications: new job, high-match, low-competition, resume reminder, saved-job reminder, job-expiration reminder | `python manage.py generate_notifications` |
| Application status pipeline visual timeline | My Applications → "View status timeline" |
| Application Tracking dashboard cards + charts (over time, status distribution) | My Applications page |
| Job Seeker Dashboard analytics — resume score, avg match %, interviews, skill coverage, match-score trend chart, application status donut, recent activity, top recommendations with explanations | Dashboard (job seeker) |
| Recruiter Dashboard analytics — hiring funnel, applications-per-job, application trend, candidate skill distribution, most popular jobs | Dashboard (recruiter) |
| Skill Gap Analysis — matched/missing skills, priority skills, learning suggestions, progress bars | `/skill-gap` and `/skill-gap?job=<id>` from any Job Details page |
| Skill Gap history (saved snapshots) | `POST /api/v1/skill-gap/` then `GET /api/v1/skill-gap/history/` |
| Enhanced recommendation engine — adds job-type preference, remote-preference strength, and recent-swipe-activity weighting on top of the existing M2/M3 factors | `apps/jobs/services.py` |
| Recommendation explanation — "Matched because Python, React · 92% ATS Score · Missing Docker, AWS" | Recommendations feed + dashboard + `/api/v1/recommendations/history/` |
| Reusable analytics REST APIs | `/dashboard/seeker/`, `/dashboard/recruiter/`, `/analytics/`, `/application-history/`, `/skill-gap/`, `/recommendations/history/`, `/notifications/` |

**New backend apps:**
- `apps/notifications/` — `Notification` model, signal-driven + batch notification creation, REST API, admin, full test suite.
- `apps/analytics/` — skill-gap engine, seeker/recruiter dashboard aggregation, application-history aggregation, `SkillGapSnapshot` history model, REST API, admin, full test suite.

**Existing apps extended (not rewritten):**
- `apps/jobs/models.py` — added `Recommendation.explanation` (JSONField), migration only, no existing fields touched.
- `apps/jobs/services.py` — `compute_recommendation_score` gained 3 additional optional weighting factors (each only applies extra points when the relevant profile data exists, so M2/M3-only accounts are scored exactly as before); new `build_recommendation_explanation()` helper.
- `apps/jobs/serializers.py` — `RecommendationSerializer` now also returns `explanation`.

**No dependencies added.** Charts are hand-built, dependency-free SVG components (`frontend/src/components/charts/`) to avoid adding new frontend packages; notifications/analytics reuse the existing Django/DRF stack.

**Tests:** 113/113 passing (95 original Milestone 1–3 tests untouched and green, +18 new Milestone 4 tests: 10 notifications, 8 analytics).

---

## MILESTONE 4.1 — BUG FIXES

Three functional issues found after Milestone 4 was demoed against real
seeded data, traced end-to-end (DB → service → API → frontend) and fixed at
the root cause rather than patched over.

### 1. "Applications Over Time" chart looked empty
**Root cause:** the backend aggregation was already correct — with only a
few applications, most land on the same calendar day, so the API correctly
returned a single `{date, count}` bucket. The bug was in `LineChart.jsx`:
a one-point line has no line segment to draw, so it rendered as a barely
visible 1.4-radius dot.
**Fix:**
- `LineChart.jsx` now explicitly handles the single-point case (labelled
  dot + baseline reference) instead of silently failing.
- Both "Applications Over Time" panels (Job Seeker → My Applications, and
  Recruiter Dashboard) now use `BarChart`, which already handled sparse
  data correctly elsewhere in the app (Hiring Funnel, Applications per Job).
- Added backend tests asserting multiple same-day applications aggregate
  into one correctly-counted bucket.

### 2. Recruiter analytics charts
Same root cause and fix as #1, applied to `RecruiterDashboard`'s
"Applications Over Time" panel. While tracing this, testing also surfaced a
second, related bug: **`applications_per_job`/`most_popular_jobs` read from
the cached `Job.applicant_count` field**, which is only incremented inside
the `apply_to_job` view and can drift from the real count. Fixed by
computing a live `Count('applications', distinct=True)` annotation in
`apps/analytics/services.py::recruiter_dashboard_data` instead — always
correct, no cache to go stale.

### 3. Missing "Startup Hiring Alert" notifications
Milestone 4's notification requirements list five distinct alert types;
only four were being generated. Added:
- `Notification.NotificationType.STARTUP_HIRING` (migration
  `0002_alter_notification_type`).
- `notify_startup_hiring()` in `apps/notifications/services.py`.
- `_notify_startup_hiring()` in the `generate_notifications` management
  command — queries jobs via the **existing** `Company.company_type` field
  (`startup` / `new_startup`, no fake data), matched against seeker profile
  score, deduplicated like every other batch notification type.
- Frontend icon (🚀) in `NotificationItem.jsx`.
- Two new tests: fires for a startup job matching the seeker's profile,
  does not fire for an MNC job.

**Tests after 4.1:** 117/117 passing (113 from Milestone 4 + 4 new: 2
notifications, 2 analytics).

---

## MILESTONE 4.3 — APPLICATIONS OVER TIME REMOVED (FINAL DEPLOYMENT DECISION)

The "Applications Over Time" chart (Job Seeker Applications dashboard and
Recruiter dashboard) was rendering as a solid meaningless block despite
multiple targeted fixes and passing backend tests proving the underlying
data aggregation was correct in isolation. Under a deployment deadline, the
call was made to **remove it entirely rather than keep debugging a single
chart** — accuracy and stability over a nice-to-have visualization.

**Removed:**
- Frontend: the chart panel on both `AppliedJobsPage.jsx` (seeker) and
  `RecruiterDashboard.jsx` (recruiter), including the now-unused `BarChart`
  import and timeline data mapping on both pages.
- Backend: the `applications_over_time` field (`application_history_data`)
  and `application_trend` field (`recruiter_dashboard_data`) in
  `apps/analytics/services.py` — dead code that existed only to feed the
  removed chart. No API consumer references these fields anymore (verified
  by a full-project search before removal).

**Layout fix:** `Status Distribution` (seeker) now spans the full card width
at a larger size instead of sharing a half-width grid cell with the removed
chart. `Hiring Funnel` (recruiter) is now a full-width card on its own row;
`Applications per Job` and `Candidate Skill Distribution` keep their
existing two-column layout unchanged. No other UI was redesigned.

**Verified unaffected:** application creation, recruiter status updates
(tested live: seeker's `interviews`/`under_review` counts updated instantly
after a real recruiter status change, with the status-change notification
firing correctly), status timeline, status distribution, application
counts, and all 5 notification types (new job, startup hiring, high-match,
low-competition, resume reminder) — all confirmed against real seeded
data, not fakes.

**Tests after 4.3:** 118/118 passing (119 from 4.2, minus 3 tests tied to
the removed chart, plus 2 new tests confirming clean removal and that
everything else — cards, status distribution, live applications-per-job
count — still works correctly).

---

## MILESTONE 4.2 — PRODUCTION READY

Final pre-submission pass: one more real bug found and fixed, plus the
project is now fully configured for Render (backend) + Vercel (frontend)
deployment. See **[DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)** for the
complete step-by-step deployment walkthrough.

**Bug fix — duplicate resume-reminder notifications:** `generate_notifications`
is meant to run periodically (e.g. via a scheduled cron job in production —
see DEPLOYMENT_GUIDE.md §10). The resume-improvement reminder had no dedup
check, unlike every other notification type, so a seeker without a resume
would get a fresh duplicate notification on every single run. Fixed using
the same `recently_notified()` pattern already used elsewhere (7-day dedup
window). Also re-verified the "Applications Over Time" chart against
**multiple distinct dates** (not just same-day), confirming the backend
correctly buckets applications per real date — the chart did not need to be
removed.

**Production configuration:**
- `CSRF_TRUSTED_ORIGINS`, HTTPS redirect, secure cookies, and HSTS — all
  gated behind `DEBUG=False` so local development is unaffected.
- Render's dynamic `*.onrender.com` hostname auto-detected for `ALLOWED_HOSTS`.
- PostgreSQL connection pooling (`conn_max_age`) and optional SSL
  (`DATABASE_SSL_REQUIRE`) for external DB connections.
- Verified with real commands, not just code review: `manage.py check --deploy`
  clean, `collectstatic` succeeds, and **gunicorn actually boots in
  production mode** with the health check returning `200`.
- Full **119-test suite re-run against a real local PostgreSQL 16 instance**
  (matching the CI database engine) — all passing, confirming no
  SQLite-vs-Postgres behavioural differences.

**Docker:**
- Fixed a real gap: the frontend Dockerfile had no SPA-fallback nginx
  config, so refreshing a deep link like `/jobs/123` would 404. Added
  `frontend/nginx.conf` + wired it into the Dockerfile.
- Fixed `docker-compose.yml`: the bind-mounted backend volume would wipe
  the image's baked-in static files at container start; `collectstatic`
  now also runs on container startup for local iteration.
- Added `.dockerignore` for both services.
- *(Docker itself was not available in the environment this was prepared
  in — Dockerfiles/compose were validated by manual review and YAML
  parsing, not an actual `docker compose build`. Please run that yourself
  once — see DEPLOYMENT_GUIDE.md §11.)*

**CI/CD:** `.github/workflows/ci.yml` — backend checks + tests against a
real Postgres service container, frontend build, and a Docker image build
validation job. No secrets required for CI itself.

**Render:** `render.yaml` Blueprint provisions the backend web service +
PostgreSQL together; auto-generates `SECRET_KEY`; health check wired to the
existing `/api/v1/health/` endpoint.

**Vercel:** `frontend/vercel.json` adds SPA rewrites so client-side routes
work on refresh; API URL is read from `VITE_API_BASE_URL` (already
env-var-driven — zero hardcoded URLs found anywhere in the codebase).

**Security:** searched the entire project for hardcoded secrets, API keys,
passwords, and `localhost`/`127.0.0.1` references outside of documented dev
defaults — none found. Added a consolidated root `.gitignore`.

**Tests after 4.2:** 119/119 passing (117 from 4.1 + 2 more: multi-date
chart aggregation, resume-reminder dedup-on-repeat).

---

## MILESTONE 3 — WHAT'S NEW

| Feature | Where |
|---|---|
| Resume upload (PDF/DOCX, up to 10MB) | Profile page → Resume section |
| Resume parsing (name, skills, education, experience, projects, certifications) | Automatic on upload |
| Multiple resumes + "primary" resume selection | Profile page |
| ATS Score (0–100%) per job | Job Details page + job cards |
| Resume–Job Compatibility label (Excellent / Good / Fair / Poor) | Job Details page |
| Missing Skill & Missing Keyword detection | Job Details page |
| Resume optimization suggestions | Job Details page |
| Recommendation engine enhanced with resume skills | Recommended feed (`reasons` now include "Resume matches: …") |

**New backend app:** `apps/resumes/` — models, rule-based parser (`parsing.py`),
ATS scoring engine (`scoring.py`), serializers, views, admin, and a full test suite.

**New dependencies:** `pdfplumber`, `python-docx` (both pure-Python, no external
downloads or GPU/ML models required — see "Why rule-based parsing?" in
RUN_PROJECT.md).

---

## MILESTONE 3.1 — REFINEMENTS

A follow-up pass that hardens the resume parser and turns the resume feature
into a full recruiter decision-making workflow:

| Feature | What changed |
|---|---|
| Job cards | Now show **one** primary score — ATS Match % + compatibility badge (Excellent/Good/Fair/Poor). The separate "Match %" badge was removed from cards; detailed skill/experience/education/keyword breakdown stays on the Job Details page. |
| AI-enhanced recommendation engine | Adds a **semantic similarity** factor (resume text ↔ job description) on top of the existing rule-based scoring — not a replacement. Tries sentence-transformers → spaCy → TF-IDF (scikit-learn, offline) → word-overlap, in that order, so it works in any environment. See `apps/jobs/semantic.py`. |
| Resume parser — Projects section | Fixed two real bugs: an ambiguous `"Technologies:"` line inside a project entry was being misread as a new Skills-section header (swallowing everything after it), and numbered project lists were being merged into a single blob. Projects are now parsed as structured `{title, technologies, description}` entries, and also handle resumes where PDF extraction strips all bullet characters (common — see "Title \| Link tech1, tech2" format support). |
| Resume suggestions | Fully dynamic — a resume with real projects/GitHub/LinkedIn will never be told to add what it already has. Reordered so profile-completeness suggestions can't be crowded out by a long tail of missing-keyword suggestions. |
| Recruiter Applicant Profile | New full profile view per applicant: personal details, education, experience, projects, skills, certifications, resume preview/download, ATS score & breakdown, matched/missing skills, suggestions, and full status history. |
| Recruitment workflow | `JobApplication` status now models the full pipeline: **Applied → Resume Reviewed → Shortlisted → Interview Scheduled → Interview Completed → Offered → Accepted/Rejected**, with every change recorded in an audit-trail `status_history`. |
| Recruiter dashboard | Adds New Applications, Shortlisted, Interviews, Offers, Rejected, and Average ATS Score alongside the existing job stats. |

## MILESTONE 3.2 — GITHUB/LINKEDIN DETECTION & FULL SCORE CONSISTENCY

| Feature | What changed |
|---|---|
| GitHub / LinkedIn detection | Fixed: many resumes render "GitHub"/"LinkedIn" as plain clickable text with the real URL only present as an **embedded hyperlink** (a PDF link annotation or DOCX hyperlink relationship) — not anywhere in the visible text layer, so the old regex-over-text approach found nothing. The parser now also reads `page.hyperlinks` (PDF) and hyperlink relationships (DOCX) and matches them against `github.com`/`linkedin.com`, falling back to that whenever the printed text doesn't contain a URL. Both URLs are stored (`parsed_github_url`, `parsed_linkedin_url`) and shown as clickable links on the Resume Details page. |
| Score consistency | The Job Details page no longer shows a separate "Match %" badge — every surface (Discover cards, Job Details, Applicant Profile, Recruiter view) now shows exactly one score: **ATS Score** + compatibility badge (Excellent/Good/Fair/Poor). The detailed Skill/Keyword/Experience/Education breakdown remains on Job Details and Applicant Profile. |
## QUICK START (Windows — VS Code PowerShell)

Open VS Code in the `SwipeX_Milestone3` folder, then open two PowerShell terminals.
For a step-by-step guide (macOS/Linux too), see **[RUN_PROJECT.md](RUN_PROJECT.md)**.

### Terminal 1 — Backend

```powershell
cd SwipeX_Milestone3\backend

# 1. Create virtual environment
python -m venv venv
venv\Scripts\activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Copy environment file
copy .env.example .env

# 4. Run database migrations
python manage.py migrate

# 5. Seed demo data (30 jobs, 6 companies, 5 job seekers, 3 recruiters)
python manage.py seed_data

# 6. Create admin superuser
python manage.py shell -c "from apps.users.models import User; User.objects.create_superuser(email='admin@swipex.demo', password='Admin@1234') if not User.objects.filter(email='admin@swipex.demo').exists() else print('exists')"

# 7. Start the backend server
python manage.py runserver
```

Backend:   http://127.0.0.1:8000
Admin:     http://127.0.0.1:8000/admin/
API:       http://127.0.0.1:8000/api/v1/

### Terminal 2 — Frontend

```powershell
cd SwipeX_Milestone3\frontend

# 1. Install dependencies
npm install

# 2. Copy environment file
copy .env.example .env

# 3. Start the development server
npm run dev
```

Frontend:  http://localhost:3000

---

## DEMO ACCOUNTS

All accounts use password: **Demo@1234**

Full list with skills, resumes, and what to demo per account →
**[DEMO_ACCOUNTS.md](DEMO_ACCOUNTS.md)**

Quick reference:

| Role | Email |
|------|-------|
| Admin | admin@swipex.demo |
| Job Seeker (Full Stack) | pratyusha@swipex.demo |
| Job Seeker (ML) | pratyusha.ml@swipex.demo |
| Job Seeker (Frontend) | pratyusha.frontend@swipex.demo |
| Job Seeker (DevOps) | pratyusha.devops@swipex.demo |
| Job Seeker (Fresher) | pratyusha.fresher@swipex.demo |
| Recruiter | recruiter1@swipex.demo |

---

## DEMO DATA SUMMARY

| Entity | Count |
|--------|-------|
| Published Jobs | 30 |
| Companies | 6 |
| Skills | 52 |
| Job Seekers | 5 |
| Recruiters | 3 |

### Per job seeker account (pratyusha@swipex.demo)
| Metric | Count |
|--------|-------|
| Jobs in Discover Feed | ~22 (enough to demo swipe, search, filters) |
| Saved Jobs | 3 |
| Applications | 2 |
| Recommendations | 28+ |

---

## SEED DATA COMMANDS

```powershell
# Add demo data (safe to run multiple times)
python manage.py seed_data

# Clear everything and start fresh
python manage.py seed_data --clear
```

---

## RESETTING FOR PRESENTATION

If you want a completely clean state before presenting:

```powershell
cd SwipeX_Milestone3\backend
venv\Scripts\activate

# Delete database and start fresh
del db.sqlite3
python manage.py migrate
python manage.py seed_data
python manage.py shell -c "from apps.users.models import User; User.objects.create_superuser(email='admin@swipex.demo', password='Admin@1234')"
python manage.py runserver
```

---

## FEATURES TO DEMONSTRATE

### As Job Seeker (pratyusha@swipex.demo)
1. **Dashboard** — See stats: saved jobs, applications, swipe count, recommendations
2. **Discover Feed** — 22+ jobs in swipe mode
3. **Swipe Right** — Saves job + shows ♥ Saved toast; dashboard count updates live
4. **Swipe Left** — Skips job; dashboard swipe count updates live
5. **Apply button** — Creates application; Applications count updates live
6. **Search** — Type "Backend", "Python", "TechNova" in the search bar
7. **Filters** — Work mode, experience level, company type, salary range, skills
8. **Saved Jobs** — View bookmarked jobs; Unsave returns job to Discover feed
9. **My Applications** — View applied jobs with status badges
10. **Recommendations** — AI-ranked feed based on skills and preferences (now resume-aware — see reasons like "Resume matches: …")
11. **Resume Upload** — Profile page → upload a PDF/DOCX resume; watch it parse into skills/education/experience/projects/certifications
12. **ATS Score** — Open any job → "Resume Compatibility" panel shows ATS score, factor breakdown, matched/missing skills, and suggestions
13. **Notifications** — Bell icon in navbar shows unread badge; click for dropdown, "View all" for full history page
14. **Application Tracking** — My Applications page shows dashboard cards (Total Applied/Under Review/Interviews/Rejected/Offers) + charts; expand any application for its status timeline
15. **Dashboard Analytics** — Dashboard → Career Analytics section: resume score, avg match %, match-score trend chart, application status donut, skill gap summary, recent activity, top recommendations with explanations
16. **Skill Gap Analysis** — From any job's detail page click "🧩 Skill Gap" → matched/missing skills, priority skills with learning suggestions, save to history

### As Recruiter (recruiter1@swipex.demo)
1. **Dashboard** — See total jobs, active jobs, applicants, drafts
2. **Company Profile** — Create/edit company details
3. **Post a Job** — Full form: title, skills, salary, work mode, deadline
4. **Manage Jobs** — Publish, close, edit, delete jobs
5. **View Applicants** — See who applied, update their status inline
6. **Notifications** — New applications and high-ATS candidates trigger instant notifications
7. **Hiring Analytics** — Dashboard → Hiring Analytics section: hiring funnel, applications per job, application trend, candidate skill distribution, most popular jobs

---

## WHAT WAS FIXED IN THIS RELEASE

### Fix 1 — Auto-recommendations on registration
New job seeker accounts now automatically get recommendations generated immediately on registration. No longer requires seed data or manual trigger.

### Fix 2 — Unsave restores job to Discover feed
When a job seeker clicks "Unsave", the job is removed from Saved Jobs AND the SwipeHistory record is deleted, so the job reappears in the Discover feed. Confirmation message shown.

### Fix 3 — Dashboard stats synchronise in real-time
Every swipe, save, unsave, and apply action fires a `swipex:stats-refresh` browser event. Dashboard stat cards listen for this event and immediately re-fetch from the API. Stats stay in sync without requiring a page reload.

### Fix 4 — Regenerated demo data (30 jobs, controlled counts)
- 30 published jobs across 6 companies (vs 20 before)
- Each seeker: ~22 jobs in Discover, 3 saved, 2 applied
- Jobs span all experience levels, work modes, company types — enough to demonstrate every filter

### Fix 5 — All seeker accounts use Pratyusha name variants
Five accounts covering different skill profiles (Full Stack, ML, Frontend, DevOps, Fresher) — all named Pratyusha Satpathy variants. Each has a complete profile with skills, location, experience, and working recommendations.

### Fix 6 — Search and filters verified with 30-job dataset
All 24 filter/search combinations tested and confirmed working.

---

## API REFERENCE

### Authentication
```
POST /api/v1/auth/register/          Register new user
POST /api/v1/auth/login/             Login → JWT tokens
POST /api/v1/auth/logout/            Logout
POST /api/v1/auth/token/refresh/     Refresh access token
```

### Job Seeker
```
GET  /api/v1/jobs/                   Public job list (search + filters)
GET  /api/v1/jobs/<id>/              Job detail
GET  /api/v1/jobs/feed/              Personalised feed (excludes swiped jobs)
GET  /api/v1/jobs/recommended/       Top recommendations
GET  /api/v1/jobs/latest/            Jobs posted last 7 days
GET  /api/v1/jobs/startups/          Startup jobs
GET  /api/v1/jobs/mncs/              MNC jobs
POST /api/v1/jobs/swipe/             Swipe {job_id, direction, save, apply}
GET  /api/v1/jobs/swipe/history/     Swipe history
GET  /api/v1/jobs/saved/             Saved jobs
DEL  /api/v1/jobs/saved/<id>/        Unsave (restores to feed)
POST /api/v1/jobs/<id>/apply/        Apply to job
GET  /api/v1/jobs/applications/      My applications
GET  /api/v1/jobs/seeker/stats/      Dashboard stats
```

### Resumes (Milestone 3)
```
POST /api/v1/resumes/upload/            Upload resume (multipart, PDF/DOCX) — becomes primary
GET  /api/v1/resumes/                   List my resumes
GET  /api/v1/resumes/primary/           Get my primary resume
GET  /api/v1/resumes/<id>/              Resume detail (incl. parsed fields)
DEL  /api/v1/resumes/<id>/              Delete a resume
POST /api/v1/resumes/<id>/set-primary/  Mark a resume as primary
POST /api/v1/resumes/<id>/reparse/      Re-run parsing (e.g. after a failure)
GET  /api/v1/resumes/match/<job_id>/    ATS score, compatibility, missing skills, suggestions for a job
```

### Recruiter
```
GET  /api/v1/jobs/companies/mine/              My companies
POST /api/v1/jobs/companies/                   Create company
PATCH /api/v1/jobs/companies/<id>/             Edit company
GET/POST /api/v1/jobs/recruiter/jobs/          List / create jobs
GET/PATCH/DELETE /api/v1/jobs/recruiter/jobs/<id>/  Job detail/edit/delete
POST /api/v1/jobs/recruiter/jobs/<id>/publish/ Publish job
POST /api/v1/jobs/recruiter/jobs/<id>/close/   Close job
GET  /api/v1/jobs/recruiter/jobs/<id>/applicants/    Applicants
PATCH /api/v1/jobs/recruiter/jobs/<j>/applicants/<a>/ Update status
GET  /api/v1/jobs/recruiter/stats/             Dashboard stats
```

---

## API REFERENCE — MILESTONE 4

### Notifications
```
GET   /api/v1/notifications/                 List my notifications (?unread=true, ?type=, ?limit=)
POST  /api/v1/notifications/create/          Create a manual/system notification for myself
GET   /api/v1/notifications/unread-count/    Unread badge count
PATCH /api/v1/notifications/<id>/read/       Mark one as read
POST  /api/v1/notifications/mark-all-read/   Mark all as read
DEL   /api/v1/notifications/<id>/            Delete a notification
```
Batch/periodic notifications (new job, high-match, low-competition, resume
reminder, saved-job reminder, job-expiration reminder) are generated via:
```powershell
python manage.py generate_notifications           # look-back 24h (default)
python manage.py generate_notifications --hours 72
```

### Dashboards & Analytics
```
GET  /api/v1/dashboard/seeker/            Job seeker dashboard (resume score, avg match %, applications,
                                           saved jobs, interviews, skill gap, top recommendations, charts)
GET  /api/v1/dashboard/recruiter/         Recruiter dashboard (jobs posted, applications, shortlisted,
                                           hiring funnel, most popular jobs, avg ATS score, skill distribution)
GET  /api/v1/analytics/                   Role-aware alias — returns seeker or recruiter dashboard automatically
GET  /api/v1/application-history/         Application tracking dashboard cards + charts + full history
GET  /api/v1/skill-gap/?job_id=<uuid>     Skill gap vs a specific job (omit job_id for overall profile gap)
POST /api/v1/skill-gap/                   Compute AND save a skill-gap snapshot to history
GET  /api/v1/skill-gap/history/           My saved skill-gap analysis snapshots
GET  /api/v1/recommendations/history/     Recommendation history with explanations
```

---



```powershell
cd SwipeX_Milestone3\backend
venv\Scripts\activate
pytest -v
# Expected: 118/118 tests passed
#   95 from Milestones 1–3 (auth, jobs, resumes/ATS, recruitment workflow,
#      applicant profile, semantic engine, hyperlink detection)
#   18 from Milestone 4 (10 notifications, 8 analytics/skill-gap/dashboards)
#   4 from Milestone 4.1 bug fixes (2 notifications — startup hiring alert,
#      2 analytics — same-day chart aggregation)
#   2 from Milestone 4.2 bug fixes (multi-date chart aggregation,
#      resume-reminder dedup-on-repeat)
#   -1 net from Milestone 4.3 (Applications Over Time chart removed:
#      -3 obsolete tests, +2 new tests confirming clean removal)
```

---

## DOCKER (optional)

```powershell
cd SwipeX_Milestone3
docker compose up --build
```

---

## TECH STACK

| Layer | Technology |
|-------|-----------|
| Backend | Python 3.11, Django 4.2, Django REST Framework |
| Auth | JWT (djangorestframework-simplejwt), OAuth2 scaffolding |
| Database | SQLite (dev) / PostgreSQL (prod via DATABASE_URL) |
| Frontend | React 18, Vite, React Router v6 |
| Styling | Tailwind CSS |
| Swipe UI | Custom mouse/touch drag with SAVE/SKIP overlays |
| Resume Parsing | pdfplumber (PDF), python-docx (DOCX) — rule-based, no ML downloads required |
| ATS Scoring | Deterministic weighted engine (skills / keywords / experience / education) |
| Testing | Pytest, pytest-django |
| DevOps | Docker, Docker Compose |
