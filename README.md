# SwipeX — Module 1: User Authentication & Role-Based Access

This package contains a complete, working implementation of Module 1 from the
SwipeX proposal: JWT authentication, Google OAuth2 login, secure sessions,
and role-based access control (Job Seeker / Recruiter / Admin), with a
FastAPI + PostgreSQL backend and a React (Vite + Tailwind) frontend.

Follow the steps below in order. Budget about 3-4 hours spread over a couple
of evenings before Friday — most of the time is account setup, not coding,
since the code is already written for you.

---

## 0. What you need installed on your laptop

- Python 3.10+ (`python3 --version`)
- Node.js 18+ and npm (`node --version`)
- A free Neon.tech account (hosted PostgreSQL)
- (Optional but recommended) A Google Cloud account for Google login

---

## 1. Create your free PostgreSQL database on Neon

1. Go to https://neon.tech and sign up (free tier is enough).
2. Create a new project, e.g. name it `swipex`.
3. Once created, open **Connection Details** on the project dashboard.
4. Copy the connection string. It looks like:
   `postgresql://alex:AbCd1234@ep-cool-bird-123456.ap-southeast-1.aws.neon.tech/swipex?sslmode=require`
5. Keep this tab open — you'll paste this into `backend/.env` in step 3.

---

## 2. (Optional) Set up Google OAuth2 login

If you want the "Continue with Google" button to actually work for Friday's
demo, do this. If you're short on time, skip it — email/password signup and
login work completely on their own, and you can add Google later.

1. Go to https://console.cloud.google.com/ and create a new project.
2. Go to **APIs & Services → OAuth consent screen**, choose "External", fill
   in an app name and your email, and save.
3. Go to **APIs & Services → Credentials → Create Credentials → OAuth client ID**.
4. Application type: **Web application**.
5. Under **Authorized redirect URIs**, add exactly:
   `http://localhost:8000/api/auth/google/callback`
6. Click Create. Copy the **Client ID** and **Client Secret**.

---

## 3. Set up the backend (FastAPI)

```bash
cd backend
python3 -m venv venv

# Activate the virtual environment
source venv/bin/activate        # Mac/Linux
venv\Scripts\activate           # Windows

pip install -r requirements.txt
```

Now create your real environment file:

```bash
cp .env.example .env
```

Open `.env` in a text editor and fill in:

- `DATABASE_URL` → the Neon connection string from step 1
- `SECRET_KEY` → run `openssl rand -hex 32` (or any long random string) and paste the result
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` → from step 2 (leave blank if skipping Google login)

Start the backend:

```bash
uvicorn app.main:app --reload --port 8000
```

You should see Uvicorn running on `http://127.0.0.1:8000`. The `users`
table is created automatically in your Neon database the first time this
runs (via `Base.metadata.create_all`).

**Verify it works:** open http://localhost:8000/docs in your browser. You
should see the interactive FastAPI Swagger UI listing `/api/auth/signup`,
`/api/auth/login`, `/api/auth/me`, and the Google routes. Try `/api/auth/signup`
directly from this page to confirm a row appears in your Neon table (Neon
dashboard → Tables → users).

---

## 4. Set up the frontend (React)

Open a **second terminal** (keep the backend running in the first one):

```bash
cd frontend
npm install
cp .env.example .env
```

`frontend/.env` just needs:

```
VITE_API_URL=http://localhost:8000
```

Start the frontend:

```bash
npm run dev
```

Open the URL it prints (usually http://localhost:5173). You should land on
the SwipeX login page.

---

## 5. Test the full flow before your demo

1. Go to `/signup`, choose **Job Seeker**, fill the form, submit.
   → You should be redirected to `/dashboard` showing your name, email, and role.
2. Click **Log out**, then log back in from `/login` with the same email/password.
3. Sign up a second account as **Recruiter** and confirm the dashboard shows
   "Recruiter" as the role — this proves role-based access is working.
4. If you configured Google OAuth: click "Continue with Google" from the
   login page and confirm it creates/logs in an account automatically.
5. Try visiting `/dashboard` in an incognito window (no login) — you should
   be redirected to `/login`, proving the protected route works.

If all five checks pass, Module 1 is complete and demo-ready.

---

## 6. What to say in your demo

- "This is JWT-based authentication — when you log in, the backend issues a
  signed token the frontend stores and attaches to every request."
- "Signup lets you choose a role — Job Seeker or Recruiter — and the
  dashboard and future modules will restrict access based on that role."
- "Admin accounts are intentionally not selectable from public signup, for
  security — they'd be created directly by an existing admin."
- "The database is hosted on Neon, a serverless Postgres provider, so there's
  no local database setup required for anyone reviewing the code."
- "Google login is handled through OAuth2 using Authlib, following the same
  flow as 'Sign in with Google' on any production app."

---

## Project structure

```
swipex-module1/
├── backend/
│   ├── app/
│   │   ├── main.py            # FastAPI app, CORS, middleware, startup
│   │   ├── config.py          # Loads .env settings
│   │   ├── database.py        # SQLAlchemy engine/session (Postgres)
│   │   ├── models.py          # User model + Role/Provider enums
│   │   ├── schemas.py         # Pydantic request/response models
│   │   ├── security.py        # Password hashing + JWT create/verify
│   │   ├── dependencies.py    # get_current_user, require_role()
│   │   └── routers/
│   │       └── auth.py        # /signup /login /me /google/* endpoints
│   ├── requirements.txt
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── main.jsx
    │   ├── App.jsx             # Route definitions
    │   ├── api/axios.js        # API client with JWT interceptor
    │   ├── context/AuthContext.jsx   # Global auth state
    │   ├── components/
    │   │   ├── ProtectedRoute.jsx
    │   │   └── AuthLayout.jsx  # Shared split-screen auth UI shell
    │   └── pages/
    │       ├── Login.jsx
    │       ├── Signup.jsx
    │       ├── Dashboard.jsx
    │       └── OAuthSuccess.jsx
    ├── package.json
    ├── tailwind.config.js
    └── .env.example
```

**File count:** 8 backend Python files (+2 empty `__init__.py`) and 11
frontend files, plus config files — 24 files total, all included here.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `password authentication failed` on backend startup | Double-check you copied the *entire* Neon connection string, including `?sslmode=require` |
| CORS error in browser console | Make sure `FRONTEND_URL` in backend `.env` matches the URL Vite prints exactly (including port) |
| `/api/auth/me` returns 401 right after login | Token likely didn't save — check browser DevTools → Application → Local Storage for `swipex_token` |
| Google login redirects to an error page | Confirm the redirect URI in Google Cloud Console matches `.env`'s `GOOGLE_REDIRECT_URI` exactly, with no trailing slash |
| `ModuleNotFoundError` when running uvicorn | You forgot to activate the virtual environment (`source venv/bin/activate`) before `pip install` |
