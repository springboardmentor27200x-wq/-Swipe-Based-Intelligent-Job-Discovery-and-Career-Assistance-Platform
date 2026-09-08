# JobMatch-AI (SwipeX) — Milestone 4 Deployment Guide

This covers everything added for Milestone 4: notifications, application
tracking, analytics/charts, resume performance ranking, and full
deployment (Docker → GitHub → Render + Vercel + AWS/managed Postgres).

---

## 0. Before anything else: update your database

Milestones 1–3 already created your `users` and `jobs` tables. New
Milestone 4 tables (`applications`, `saved_jobs`, `notifications`,
`resume_score_history`) are created automatically the first time you
start the app — SQLAlchemy's `create_all()` handles brand-new tables.

What it **won't** do is add new columns to tables that already exist.
So the very first time you run this update against your existing
database (local or deployed), run the migration once:

```bash
cd backend
python -m scripts.migrate
```

It's safe to re-run — every statement uses `IF NOT EXISTS`.

---

## 1. Run locally with Docker (satisfies the "Docker" requirement)

```bash
cd backend
docker compose up --build
```

This starts:
- the FastAPI backend on **http://localhost:8000**
- a Postgres 16 database (auto-created, migration auto-runs on boot)

No local Python/venv/Postgres install needed — this is the fastest way
to prove the whole stack works end-to-end before deploying anywhere.

To run just the backend container against your own existing Postgres
instead of the bundled one:

```bash
docker build -t jobmatch-ai-backend .
docker run -p 8000:8000 \
  -e DATABASE_URL="postgresql://postgres:Postgres%40123@host.docker.internal:5432/jobmatch_ai" \
  -e SECRET_KEY="jobmatch_secret_key" \
  jobmatch-ai-backend
```

---

## 2. Push to GitHub — same repo, same branch

The project is maintained in a single GitHub repository containing the
backend, frontend, Docker configuration, and deployment configuration.

The current development branch is:

```text
Nidrashri-V
---

## 3. Backend on Railway

The production backend is deployed on Railway.

**Production backend URL:**

https://swipex-backend-production.up.railway.app

The backend is a FastAPI application using PostgreSQL and SQLAlchemy.

### Current production setup

- **Backend:** FastAPI
- **Hosting:** Railway
- **Database:** PostgreSQL on Neon
- **ORM:** SQLAlchemy
- **Python:** 3.11
- **Frontend:** Vercel
- **Frontend → Backend:** HTTPS API requests

### Railway deployment

The backend can be deployed from the project root using the Railway CLI:

```bash
railway login
railway link
railway up

---

## 4. Frontend on Vercel

The `frontend` folder contains the fully static frontend (HTML/CSS/JS)
— no build step is required.

### Current production setup

- **Hosting:** Vercel
- **Root Directory:** `frontend`
- **Framework Preset:** Other
- **Build Command:** None
- **Production URL:** https://swipex-ai.vercel.app
- **Backend API:** https://swipex-backend-production.up.railway.app

### Vercel deployment

1. Import the GitHub repository into Vercel.
2. Set **Root Directory** to `frontend`.
3. Set **Framework Preset** to **Other**.
4. Leave the build command empty.
5. Deploy the project.

The project uses `vercel.json` to route pretty URLs such as
`/dashboard`, `/profile`, and `/jobs-page` to their corresponding
HTML pages.

### Backend connection

The frontend API configuration is stored in:

`frontend/js/config.js`

The production API base URL is:

https://swipex-backend-production.up.railway.app

Frontend JavaScript files use this Railway backend for API requests.

For production CORS, configure the backend's `ALLOWED_ORIGINS`
environment variable with the Vercel frontend URL rather than relying
on a wildcard configuration.
---

## 5. Database on AWS (alternative to Neon PostgreSQL)

The current production database is PostgreSQL hosted on Neon.
AWS RDS is an alternative if AWS-hosted PostgreSQL is required.

If you'd rather use AWS RDS:

1. Create a **PostgreSQL** RDS instance.
2. Note the RDS endpoint and create a database named `jobmatch_ai`.
3. Set `DATABASE_URL` in the Railway backend environment to the RDS
   connection string:

`postgresql://<username>:<password>@<rds-endpoint>:5432/jobmatch_ai`

4. Run the migration once against the new database:

```bash
python -m scripts.migrate

## 6. CI/CD — GitHub Actions

The repository includes a GitHub Actions workflow at:

`.github/workflows/ci-cd.yml`

The workflow is named **SwipeX CI**.

### Current workflow

The workflow runs for pushes and pull requests targeting the
`main` branch.

It performs the following checks:

1. Checks out the repository.
2. Sets up Python 3.11.
3. Installs the dependencies from `requirements.txt`.
4. Compiles the Python application files to detect syntax errors.
5. Builds the Docker image to verify that the backend can be containerized.

### Important

This workflow currently performs **CI validation only**. It does not
trigger Railway or Vercel deployments.

Production deployment is handled separately:

- **Frontend:** Vercel
- **Backend:** Railway
- **Database:** Neon PostgreSQL

The active development branch for this project is:

`Nidrashri-V`
## 7. Cross-platform / mobile handling

This is a responsive web app, not separate native Android/iOS builds.
What's included for Milestone 4's "different OS handling":
- `manifest.json` + Apple meta tags so the site can be **added to the
  home screen** on both Android (Chrome) and iOS (Safari) and opens in
  standalone/full-screen mode like an app.
- The existing CSS is already responsive across breakpoints.

If a true native app is required later, the cleanest path is wrapping
this same frontend in Capacitor or React Native WebView — worth
flagging to your mentor as a possible Milestone 5 item rather than
something to force into this deployment.

---

## 8. What's new for the reviewer / demo

- **Notifications** — bell icon (top-right, any logged-in page):
  instant new-job alerts, >80% match alerts, low-competition alerts,
  application status-change alerts.
- **`/track`** — new page: full application status pipeline
  (applied → shortlisted → rejected/selected) + resume score trend chart.
- **Dashboard** — resume performance ranking (percentile vs. all
  users), recommendation insights, resume score trend chart.
- **Recruiter `/applications`** — hiring trend chart (last 14 days) +
  top skills in demand, backed by real database rows instead of
  browser localStorage.

---

## 9. Your GitHub profile link

Add it to the top of your repo's main `README.md` so reviewers can find
your other work, e.g.:

```md
**Author:** Nidrashri V — [github.com/your-username](https://github.com/your-username)
```
