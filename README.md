# SwipeX 🚀

> **AI-Powered Swipe-Based Job Discovery & Career Assistance Platform**

[![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=flat-square&logo=react)](https://reactjs.org)
[![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=flat-square&logo=python)](https://python.org)
[![Tailwind](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com)

---

## 🎯 Overview

SwipeX is a full-stack, AI-powered job discovery platform combining:
- **Tinder-style swipe interface** for intuitive job exploration
- **AI Resume Analyzer** with ATS scoring (0-100%)
- **Personalized Recommendations** using TF-IDF + OpenAI
- **Real-time Application Tracking** with Kanban board
- **Analytics Dashboard** with charts and skill gap analysis
- **Role-based access** for Job Seekers, Recruiters, and Admins

---

## 🏗️ Architecture

```
SwipeX/
├── backend/          # FastAPI + SQLAlchemy + SQLite/PostgreSQL
│   ├── app/
│   │   ├── auth/            # JWT auth + role management
│   │   ├── jobs/            # Job listings + filtering
│   │   ├── swipe/           # Swipe interaction tracking
│   │   ├── resume/          # Upload + ATS scoring
│   │   ├── recommendations/ # AI recommendation engine
│   │   ├── notifications/   # Alert system
│   │   └── analytics/       # Dashboard data
│   └── seed.py      # 50 jobs + 3 users + 5 companies
├── frontend/         # React 18 + Tailwind + Framer Motion
│   └── src/
│       ├── pages/   # 11 pages (Swipe, Jobs, Resume, Dashboard...)
│       ├── components/  # Reusable UI components
│       └── store/   # Redux Toolkit state management
└── docker-compose.yml
```

---

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- Git

### 1. Clone & Setup

```bash
git clone <repo-url>
cd INFOSYS-PROJECT
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY
```

### 2. Start Backend

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run server (auto-seeds DB on first run)
python run.py
```

Backend runs at: http://localhost:8000
API Docs: http://localhost:8000/docs

### 3. Start Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

Frontend runs at: http://localhost:3000

---

## 🎭 Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Job Seeker | jobseeker@swipex.com | demo123 |
| Recruiter | recruiter@swipex.com | demo123 |
| Admin | admin@swipex.com | demo123 |

---

## 🐳 Docker Deployment

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

Services:
- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- API Docs: http://localhost:8000/docs

---

## 📋 Modules

| # | Module | Status |
|---|--------|--------|
| 1 | User Auth & Role-Based Access | ✅ JWT + bcrypt |
| 2 | User Profiles & Resume Management | ✅ Upload + multi-version |
| 3 | Swipe-Based Job Discovery | ✅ Drag + keyboard |
| 4 | Smart Job Search & Filtering | ✅ 8+ filter dimensions |
| 5 | Real-Time Freshness & Competition | ✅ Live indicators |
| 6 | AI Resume Analyzer & ATS Scoring | ✅ TF-IDF + OpenAI |
| 7 | Personalized Recommendations | ✅ ML-powered engine |
| 8 | Smart Notifications & Alerts | ✅ In-app alerts |
| 9 | Application Tracking System | ✅ Kanban board |
| 10 | Dashboard & Analytics | ✅ Charts + insights |
| 11 | Deployment | ✅ Docker Compose |

---

## 🔑 API Reference

Full interactive API docs at: `http://localhost:8000/docs`

Key endpoints:
- `POST /api/auth/register` — Create account
- `POST /api/auth/login` — Get JWT token
- `GET /api/jobs/feed` — Swipe feed (paginated)
- `POST /api/swipe/` — Record swipe action
- `POST /api/resume/upload` — Upload resume
- `POST /api/resume/analyze` — Get ATS score
- `GET /api/recommendations/` — Personalized jobs
- `GET /api/analytics/overview` — Dashboard data

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Tailwind CSS, Framer Motion, Redux Toolkit, Recharts |
| Backend | FastAPI, SQLAlchemy, Pydantic v2, Python-Jose |
| AI/NLP | scikit-learn (TF-IDF), OpenAI GPT, pdfplumber, spaCy |
| Auth | JWT + bcrypt + Role-based access control |
| DB | SQLite (dev) / PostgreSQL (prod) |
| DevOps | Docker, Docker Compose |

---

## 📄 License

MIT License — Built for Infosys Project, 2024
