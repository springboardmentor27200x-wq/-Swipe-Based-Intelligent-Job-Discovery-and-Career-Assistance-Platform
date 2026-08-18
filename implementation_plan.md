# SwipeX - Milestone 1 Implementation Plan (Updated)

This plan details the foundation of the SwipeX platform, which includes setting up the FastAPI backend with PostgreSQL, a **Create React App** frontend with Tailwind CSS, establishing the core authentication flow (Register, Login, Refresh, Logout, `/me`), and setting up database models.

---

## Technical Stack Selection
- **Backend:** FastAPI (Python) - offers high performance, automatic OpenAPI documentation, clean dependency injection, and easy JWT integration.
- **ORM:** SQLAlchemy.
- **Frontend:** **Create React App (CRA)** using Webpack/npm (without Vite) + Tailwind CSS + React Router DOM + Axios.
- **Database:** PostgreSQL.

---

## PostgreSQL Manual Setup & Verification Guide
To run PostgreSQL locally and show your mentor that the database is set up and updating manually:

### 1. What to Download
- **PostgreSQL Database Server:** Download the interactive installer for Windows from the official website: [PostgreSQL Downloads for Windows](https://www.postgresql.org/download/windows/).
- **pgAdmin 4 (GUI Client):** This is automatically included in the PostgreSQL installer. It provides a web-based graphical user interface to manually view, edit, and query your database tables.

### 2. Installation Steps
1. Run the downloaded installer.
2. Choose your installation directory.
3. Select components: Make sure **PostgreSQL Server**, **pgAdmin 4**, and **Command Line Tools** are checked.
4. Set a password for the database superuser (`postgres`). **Remember this password!** You will need it for the `.env` configuration.
5. Keep the default port (`5432`).
6. Finish the installation.

### 3. Accessing & Showing PostgreSQL Manually (For your mentor)
- **Option A: pgAdmin 4 (Visual GUI)**
  1. Open **pgAdmin 4** from your Windows Start Menu.
  2. Enter the superuser password you set during installation.
  3. Expand **Servers** -> **PostgreSQL [Version]** -> **Databases**.
  4. Right-click **Databases** -> **Create** -> **Database...** and name it `swipex`.
  5. Once the backend migrations run, expand **swipex** -> **Schemas** -> **public** -> **Tables** to see your tables (`users`, `job_seeker_profiles`, etc.).
  6. Right-click any table and select **View/Edit Data** -> **All Rows** to show the populated rows directly.

- **Option B: psql (Command Line)**
  1. Open PowerShell or Command Prompt.
  2. Connect to PostgreSQL using:
     ```bash
     psql -U postgres
     ```
  3. List databases using: `\l`
  4. Connect to SwipeX database: `\c swipex`
  5. List all tables: `\dt`
  6. Query users: `SELECT * FROM users;`

---

## Proposed Changes

### Backend Component (`/backend`)

We will create a structured Python application under `d:/Personal Documets/Desktop/SwipeX/backend`:

```
backend/
 ├── app/
 │    ├── __init__.py
 │    ├── main.py (FastAPI entrypoint, health check, CORS)
 │    ├── config.py (Settings and Env validation via pydantic-settings)
 │    ├── database.py (SQLAlchemy engine & session management)
 │    ├── models.py (SQLAlchemy Database models: User, JobSeekerProfile, RecruiterProfile, RefreshToken)
 │    ├── schemas.py (Pydantic models for validation)
 │    ├── crud.py (Database operations)
 │    ├── auth.py (Hashing, JWT generation/verification)
 │    └── routers/
 │         ├── __init__.py
 │         └── auth.py (Auth endpoints: register, login, refresh, logout, me)
 ├── requirements.txt (Dependencies: fastapi, uvicorn, sqlalchemy, psycopg2-binary, passlib, bcrypt, pyjwt, pydantic-settings)
 └── .env.example (Template for environment variables)
```

#### Database Schema Details (SQLAlchemy Models)
1. **User**: UUID PK, email (unique index), password_hash, role (Enum: job_seeker, recruiter, admin), is_active, is_verified, created_at, updated_at.
2. **JobSeekerProfile**: UUID PK, user_id (FK to User.id, unique), full_name, phone, location, created_at, updated_at.
3. **RecruiterProfile**: UUID PK, user_id (FK to User.id, unique), full_name, company_name, company_website, created_at, updated_at.
4. **RefreshToken**: UUID PK, user_id (FK to User.id), token (unique, hashed/plain), expires_at, revoked (boolean), created_at.

---

### Frontend Component (`/frontend`)

We will create a React app using Create React App (CRA) in `d:/Personal Documets/Desktop/SwipeX/frontend`:

```
frontend/
 ├── src/
 │    ├── components/
 │    │    ├── AuthForm.js (Reusable login/register form)
 │    │    └── ProtectedRoute.js (Enforces authenticated access)
 │    ├── context/
 │    │    └── AuthContext.js (Authentication state and API actions)
 │    ├── pages/
 │    │    ├── Login.js (Login screen with premium glassmorphism design)
 │    │    ├── Register.js (Register screen with role selector)
 │    │    └── Dashboard.js (Role-based redirect target / placeholder homepage)
 │    ├── services/
 │    │    └── api.js (Axios instance configured with base URL, headers, and interceptors for auto-refresh)
 │    ├── routes/
 │    │    └── AppRoutes.js (Route mapping)
 │    ├── App.js (Global providers and wrapper)
 │    ├── index.css (Tailwind & custom design base)
 │    └── index.js
 ├── package.json
 ├── tailwind.config.js
 └── postcss.config.js
```

---

## Verification Plan

### Automated Verification
We will run a script or test suite to verify the API endpoints:
- Spin up the backend server locally using Uvicorn.
- Query `/api/health` and verify the `200 OK` status.
- Perform automated curl requests to verify:
  1. Registration (Job Seeker / Recruiter) -> check DB records and profile association.
  2. Login -> obtain Access and Refresh tokens.
  3. Get Current User (`/api/auth/me`) -> verify valid access token works.
  4. Token Refresh (`/api/auth/refresh`) -> use refresh token to fetch new access token.
  5. Logout (`/api/auth/logout`) -> blacklist/revoke token and confirm subsequent requests fail.

### Manual Verification
- Launch the frontend application using `npm start`.
- Test signup, login, session persistence, and logout flow.
- Open pgAdmin 4 and show the populated tables in the `swipex` database to verify data persistence manually.

---

## Recent Fixes
### Notification System Fixes
- **Backend Server Availability**: Ensured the FastAPI backend server is properly started and running on port 8000 (`uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload`) so the frontend can connect and authenticate without errors.
- **Frontend Notification Typo**: Fixed an API endpoint typo in `NotificationCenter.jsx` where it was incorrectly requesting `/api/notitfications` instead of `/api/notifications`. This caused a 404 error and prevented the notification center from loading initial unread notification history. Wait, and the websocket real-time connection works properly on `/api/notifications/ws`.
- **Notification Routing**: When a user sends a message, the system creates a notification for the recipient (e.g. recruiter), not the sender, which is the expected behavior.
