# DEPLOYMENT_GUIDE.md — SwipeX

Beginner-friendly, end-to-end guide to get SwipeX live on the internet:
**Render** (Django backend + PostgreSQL) + **Vercel** (React frontend).

Everything in the codebase is already configured for this. You only need
to perform the account-level steps below — no further code changes should
be required.

---

## 0. What's already done for you

- `render.yaml` — Render Blueprint that provisions the backend web service
  and a PostgreSQL database together.
- `frontend/vercel.json` — SPA routing so deep links (e.g. `/jobs/123`)
  don't 404 on refresh.
- `backend/swipex/settings.py` — reads every secret/URL from environment
  variables; production security (HTTPS redirect, secure cookies, HSTS) is
  automatically enabled when `DEBUG=False`.
- `.github/workflows/ci.yml` — runs backend tests (against real PostgreSQL)
  and a frontend build on every push/PR.
- `backend/Dockerfile`, `frontend/Dockerfile`, `docker-compose.yml` — for
  local full-stack testing; Render/Vercel don't require Docker at all.

---

## 1. GitHub Repository Setup

```bash
cd SwipeX_Milestone4_Final
git init
git add .
git commit -m "SwipeX — production ready"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```

**MANUAL ACTION REQUIRED:** create the empty GitHub repository first at
github.com (New repository → don't initialize with a README), then run the
commands above with your actual repo URL.

---

## 2. Deploy the Backend + PostgreSQL on Render

### Option A — Blueprint (recommended, uses `render.yaml`)
1. Go to [dashboard.render.com](https://dashboard.render.com) → **New +** → **Blueprint**.
2. Connect your GitHub account and select your SwipeX repository.
3. Render detects `render.yaml` and shows two resources: `swipex-db`
   (PostgreSQL) and `swipex-backend` (web service). Click **Apply**.
4. Render provisions the database, links `DATABASE_URL` automatically, and
   generates a random `SECRET_KEY` automatically (see `render.yaml`).
5. Wait for the first deploy to finish (~3-5 min). Note the backend URL,
   e.g. `https://swipex-backend.onrender.com`.

### Option B — Manual (no render.yaml)
1. **New +** → **PostgreSQL** → name it `swipex-db` → note the **Internal
   Database URL** once created.
2. **New +** → **Web Service** → connect your repo.
   - **Root Directory:** `backend`
   - **Runtime:** Python 3
   - **Build Command:** `pip install -r requirements.txt && python manage.py collectstatic --noinput`
   - **Start Command:** `python manage.py migrate && gunicorn swipex.wsgi:application --bind 0.0.0.0:$PORT`
   - **Health Check Path:** `/api/v1/health/`
3. Add the environment variables from the table in §7 below.

**MANUAL ACTION REQUIRED:** you must have (or create) a Render account and
click through the steps above — Render's dashboard cannot be automated
from outside your account.

---

## 3. Deploy the Frontend on Vercel

1. Go to [vercel.com](https://vercel.com/new) → **Add New** → **Project**.
2. Import the same GitHub repository.
3. **Root Directory:** click "Edit" and set it to `frontend`.
4. Framework Preset: Vercel should auto-detect **Vite**.
5. Before deploying, add the environment variable (see §7):
   ```
   VITE_API_BASE_URL = https://swipex-backend.onrender.com/api/v1
   ```
   (use your actual Render backend URL from step 2, with `/api/v1` appended)
6. Click **Deploy**. Note the resulting URL, e.g. `https://swipex.vercel.app`.

**MANUAL ACTION REQUIRED:** Vercel account + clicking Deploy.

---

## 4. Connect Them: Update Backend CORS/CSRF

Now that you have your real Vercel URL, go back to Render → your
`swipex-backend` service → **Environment**, and set:

```
CORS_ALLOWED_ORIGINS = https://swipex.vercel.app
CSRF_TRUSTED_ORIGINS = https://swipex.vercel.app
FRONTEND_URL          = https://swipex.vercel.app
```

Save — Render redeploys automatically. Without this step, the frontend can
load but every API request will fail with a CORS error in the browser
console.

If you later add a custom domain to either side, add it to both lists
(comma-separated, no spaces needed around commas).

---

## 5. Run Migrations & Create a Superuser

Migrations already run automatically on every deploy (it's part of the
Render **Start Command**). To create an admin login:

1. Render dashboard → `swipex-backend` → **Shell** tab (top right).
2. Run:
   ```bash
   python manage.py createsuperuser
   ```
3. Follow the prompts. You can now log in at
   `https://swipex-backend.onrender.com/admin/`.

Want the same demo data used throughout development? Also run:
```bash
python manage.py seed_data
python manage.py generate_notifications --hours 999999
```

---

## 6. GitHub Actions CI

Already configured at `.github/workflows/ci.yml` — it runs automatically on
every push/PR to `main`. It does **not** deploy anything (Render and
Vercel deploy from their own GitHub integrations independently); it only
blocks merges when tests or the build fail. No secrets need to be added to
GitHub for CI itself — it uses a disposable test database and a placeholder
API URL.

---

## 7. Environment Variables Reference

| Variable | Platform | Secret/Public | Value / What to enter |
|---|---|---|---|
| `SECRET_KEY` | Render | **Secret** | Auto-generated by `render.yaml`, or generate your own 50+ char random string |
| `DEBUG` | Render | Public | `False` |
| `ALLOWED_HOSTS` | Render | Public | `.onrender.com` (already set by `render.yaml`) |
| `DATABASE_URL` | Render | **Secret** | Auto-filled from the linked `swipex-db` database |
| `DATABASE_SSL_REQUIRE` | Render | Public | Leave unset/`False` (Render's internal DB URL doesn't need SSL) |
| `CORS_ALLOWED_ORIGINS` | Render | Public | Your Vercel URL, e.g. `https://swipex.vercel.app` |
| `CSRF_TRUSTED_ORIGINS` | Render | Public | Same as above |
| `FRONTEND_URL` | Render | Public | Same as above (used in password-reset/verification email links) |
| `VITE_API_BASE_URL` | Vercel | Public | Your Render backend URL + `/api/v1`, e.g. `https://swipex-backend.onrender.com/api/v1` |

Everything else in `backend/.env.example` (email/OAuth settings) is
optional — the app works fully without them; email falls back to console
logging and OAuth login buttons simply won't be configured.

---

## 8. Verifying the Deployed Application

1. Open your Render backend health check directly:
   `https://swipex-backend.onrender.com/api/v1/health/` → should return
   `{"success": true, "data": {"status": "healthy", ...}}`.
2. Open your Vercel frontend URL → you should see the SwipeX login page.
3. Register a new account (or use seeded demo credentials if you ran
   `seed_data`) and confirm login works.
4. Open browser DevTools → Network tab → confirm API calls go to your
   Render URL and return `200`, not CORS errors.
5. Test a deep link directly, e.g. `https://swipex.vercel.app/jobs` — it
   should load correctly on a hard refresh, not 404 (this confirms the SPA
   rewrite in `vercel.json` is working).

---

## 9. Common Deployment Errors & Fixes

| Symptom | Cause | Fix |
|---|---|---|
| Frontend loads but every request fails with a CORS error | `CORS_ALLOWED_ORIGINS` on Render doesn't include your Vercel URL | Update the env var (§4), redeploy |
| `400 Bad Request` on every backend request | Vercel URL not in `ALLOWED_HOSTS`, or Render's dynamic hostname changed | `ALLOWED_HOSTS=.onrender.com` already handles the backend's own domain; if using a custom domain, add it explicitly |
| Login works but `/admin/` shows a CSRF error | `CSRF_TRUSTED_ORIGINS` missing your Vercel/custom domain | Update the env var (§4) |
| Refreshing `/jobs/123` on Vercel shows a 404 | `vercel.json` rewrites weren't picked up (Root Directory misconfigured) | Confirm Vercel project **Root Directory** is set to `frontend` |
| Backend deploy fails during build | Missing/incompatible dependency, or Python version mismatch | Check Render build logs; `PYTHON_VERSION` is pinned to `3.12.0` in `render.yaml` |
| Backend deploy succeeds but every request 500s | Migrations didn't run, or `SECRET_KEY`/`DATABASE_URL` missing | Check Render → Logs; re-check the env var table above |
| Notifications never appear for any user | `generate_notifications` management command isn't scheduled | It's not automatic — see §10 below |
| Static files (Django admin CSS) look broken | `collectstatic` didn't run, or WhiteNoise misconfigured | Confirm the Render Build Command includes `collectstatic --noinput` (already set) |
| Local `docker compose up` backend can't reach Postgres | `db` service not healthy yet | `docker compose logs db` — wait for the healthcheck, or `docker compose up --build` |

---

## 10. Keeping Notifications Fresh in Production

`generate_notifications` is a management command, not a background job — it
must be triggered periodically for new-job/startup-hiring/high-match/
low-competition alerts to appear (instant notifications like "new
application received" and "status changed" fire automatically via signals
and need no scheduling).

**Simplest option — Render Cron Job** (a separate free/low-cost resource
type in Render, distinct from the web service):
1. Render dashboard → **New +** → **Cron Job**.
2. Same repo, **Root Directory:** `backend`.
3. **Command:** `python manage.py generate_notifications`
4. **Schedule:** e.g. `0 */6 * * *` (every 6 hours).
5. Give it the same `DATABASE_URL` env var as the web service (Render lets
   you reference the same database).

This is optional for a submission/demo — you can also just run it manually
from the Render Shell tab (§5) whenever you want fresh notifications.

---

## 11. Local Docker Testing (optional, not required for deployment)

```bash
cd SwipeX_Milestone4_Final
docker compose up --build
```
- Backend: http://localhost:8000
- Frontend: http://localhost:3000
- Postgres: localhost:5432 (user `swipex_user` / password `swipex_pass`, local only)

This spins up all three services together and is useful for a final
sanity check before pushing to GitHub. It is **not** required by Render or
Vercel — both platforms build directly from source without Docker.

> **Note:** Docker could not be executed in the environment this project
> was prepared in (no `docker` binary available), so the Dockerfiles and
> `docker-compose.yml` were validated by careful manual review and YAML
> syntax checking, not by an actual `docker compose build` run. Please run
> the command above yourself once before relying on it, and open an issue
> if anything doesn't build cleanly.

---

## 12. Final Deployment Order (quick reference)

1. Download final ZIP, extract it.
2. Create a GitHub repository and push the project (§1).
3. Configure GitHub Secrets — **not required**, CI uses no secrets.
4. Deploy PostgreSQL + Backend on Render via Blueprint (§2).
5. Copy the Render backend URL.
6. Set `VITE_API_BASE_URL` in Vercel to that URL + `/api/v1` (§3).
7. Deploy the frontend on Vercel (§3).
8. Update Render's `CORS_ALLOWED_ORIGINS` / `CSRF_TRUSTED_ORIGINS` /
   `FRONTEND_URL` with the real Vercel URL (§4).
9. Run migrations (automatic) and create a superuser if needed (§5).
10. Verify the deployed app end-to-end (§8).
