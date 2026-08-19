# 🚀 SwipeX

> **AI-Powered Swipe-Based Job Discovery & Career Assistance Platform**

SwipeX is a full-stack, AI-powered recruitment and career assistance platform designed to make job discovery **faster, smarter, and more personalized**.

Instead of relying only on traditional job searching, SwipeX combines a **Tinder-style swipe interface**, **AI-powered resume analysis**, **ATS scoring**, **personalized job recommendations**, **application tracking**, and **career analytics** into one platform.

---

## 🌐 Live Demo

🚀 **[Visit SwipeX](https://internship-project-blue.vercel.app/login)**

Explore the complete SwipeX platform with swipe-based job discovery, AI resume analysis, ATS scoring, personalized recommendations, application tracking, and analytics.

---

## 🎯 Overview

Traditional job portals often present users with thousands of job listings without considering their individual skills, experience, resume quality, or career goals.

**SwipeX addresses this problem by combining intelligent job matching with a simple and interactive user experience.**

The platform enables candidates to:

* 🔄 Discover jobs using a swipe-based interface
* 📄 Upload and analyze resumes
* 🎯 Calculate ATS compatibility scores
* 🤖 Receive AI-powered resume improvement suggestions
* 🧠 Get personalized job recommendations
* 🔎 Search and filter jobs
* 📊 Track applications using a Kanban board
* 📈 Monitor job-search analytics
* 🧩 Identify skill gaps
* 🔔 Receive smart notifications

SwipeX also provides dedicated functionality for **Job Seekers, Recruiters, and Administrators** through role-based access control.

---

# ✨ Key Features

## 🔐 1. Authentication & Role-Based Access

SwipeX provides secure authentication using **JWT-based authorization**.

The platform supports three primary roles:

* 👤 **Job Seeker**
* 💼 **Recruiter**
* 🛡️ **Admin**

Each role receives access to functionality specific to its responsibilities.

---

## 🔄 2. Swipe-Based Job Discovery

SwipeX provides an intuitive card-based job discovery experience.

Users can:

* ➡️ Swipe right to show interest
* ⬅️ Swipe left to skip
* 🖱️ Drag job cards
* ⌨️ Use keyboard controls
* ❤️ Save interesting opportunities
* 📄 View complete job details

User swipe interactions can also be used by the recommendation engine to improve future job suggestions.

---

## 📄 3. AI Resume Analyzer

Users can upload their resumes and receive automated analysis.

The resume processing pipeline includes:

```text
Resume Upload
      ↓
Text Extraction
      ↓
Skill & Keyword Identification
      ↓
Job Description Comparison
      ↓
ATS Compatibility Analysis
      ↓
Skill Gap Detection
      ↓
AI-Powered Suggestions
```

The system generates an **ATS compatibility score from 0–100%** and provides suggestions to improve resume-job compatibility.

---

## 🎯 4. Personalized Job Recommendations

SwipeX uses a combination of **TF-IDF-based similarity analysis** and AI-powered processing to recommend relevant jobs.

Recommendations can consider:

* Resume content
* Skills
* Technologies
* Job title
* Experience
* Job description
* User preferences
* Previous swipe interactions

This helps users discover opportunities that are more relevant to their profiles.

---

## 🔎 5. Smart Job Search & Filtering

Users can search and filter job opportunities using multiple criteria.

Supported filtering can include:

* Job title
* Skills
* Location
* Experience level
* Employment type
* Salary
* Company
* Work mode
* Job freshness

This allows users to quickly narrow down relevant opportunities.

---

## 📊 6. Application Tracking

SwipeX provides a Kanban-style application tracking system.

Example workflow:

```text
Applied
   ↓
Screening
   ↓
Interview
   ↓
Selected
```

Applications can also move to:

```text
Rejected
```

This gives candidates a centralized view of their recruitment progress.

---

## 📈 7. Analytics Dashboard

The analytics dashboard provides insights into the user's job-search activity.

It can display:

* Total applications
* Application status
* Job matches
* Resume performance
* Skills
* Skill gaps
* Application trends
* Recommendation activity

Charts and visualizations make it easier to understand career progress and identify areas for improvement.

---

## 🔔 8. Smart Notifications

SwipeX provides in-app notifications for important events, including:

* New relevant jobs
* Application status updates
* Recruiter actions
* Resume analysis results
* Recommendation updates

---

# 🧠 AI & Recommendation Architecture

SwipeX combines traditional machine learning techniques with AI capabilities.

```text
                  ┌─────────────────┐
                  │   User Resume   │
                  └────────┬────────┘
                           ↓
                  ┌─────────────────┐
                  │ Text Extraction │
                  └────────┬────────┘
                           ↓
                  ┌─────────────────┐
                  │ Skill Extraction│
                  └────────┬────────┘
                           ↓
                  ┌─────────────────┐
                  │  TF-IDF Engine  │
                  └────────┬────────┘
                           ↓
                ┌──────────────────────┐
                │ Job Similarity & ATS │
                │      Analysis        │
                └──────────┬───────────┘
                           ↓
                  ┌─────────────────┐
                  │   AI Engine     │
                  │    OpenAI       │
                  └────────┬────────┘
                           ↓
                  ┌─────────────────┐
                  │ Recommendations │
                  └─────────────────┘
```

---

# 🏗️ System Architecture

```text
                         ┌───────────────────┐
                         │       User        │
                         └─────────┬─────────┘
                                   │
                                   ↓
                         ┌───────────────────┐
                         │  React Frontend   │
                         │ Tailwind + Redux  │
                         └─────────┬─────────┘
                                   │
                              REST APIs
                                   │
                                   ↓
                         ┌───────────────────┐
                         │  FastAPI Backend  │
                         └─────────┬─────────┘
                                   │
             ┌─────────────────────┼─────────────────────┐
             ↓                     ↓                     ↓
      ┌──────────────┐      ┌──────────────┐      ┌──────────────┐
      │ Auth & RBAC  │      │ Job Services │      │  AI Services │
      └──────────────┘      └──────────────┘      └──────────────┘
             │                     │                     │
             └─────────────────────┼─────────────────────┘
                                   ↓
                         ┌───────────────────┐
                         │ SQLAlchemy ORM    │
                         └─────────┬─────────┘
                                   ↓
                         ┌───────────────────┐
                         │ SQLite / Postgres │
                         └───────────────────┘
```

---

# 📁 Project Structure

```text
SwipeX/
│
├── backend/
│   ├── app/
│   │   ├── auth/
│   │   │   └── JWT authentication & RBAC
│   │   │
│   │   ├── jobs/
│   │   │   └── Job listings, search & filtering
│   │   │
│   │   ├── swipe/
│   │   │   └── Swipe interaction tracking
│   │   │
│   │   ├── resume/
│   │   │   └── Resume upload & ATS analysis
│   │   │
│   │   ├── recommendations/
│   │   │   └── Personalized recommendation engine
│   │   │
│   │   ├── notifications/
│   │   │   └── Smart notification system
│   │   │
│   │   └── analytics/
│   │       └── Dashboard analytics
│   │
│   ├── seed.py
│   ├── run.py
│   ├── requirements.txt
│   └── Dockerfile
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── store/
│   │   └── services/
│   │
│   ├── package.json
│   └── Dockerfile
│
├── docker-compose.yml
├── .env.example
└── README.md
```

---

# 🚀 Getting Started

## Prerequisites

Install the following before running SwipeX locally:

* Python 3.11+
* Node.js 18+
* npm
* Git
* Docker *(optional)*

---

## 1. Clone the Repository

```bash
git clone <repo-url>
cd INFOSYS-PROJECT
```

Create the environment file:

```bash
cp .env.example .env
```

Configure the required environment variables.

If AI-powered features are enabled, add your OpenAI API key:

```env
OPENAI_API_KEY=your_api_key
```

---

# ⚙️ Backend Setup

Navigate to the backend:

```bash
cd backend
```

Create a virtual environment:

```bash
python -m venv venv
```

### Windows

```bash
venv\Scripts\activate
```

### Linux / macOS

```bash
source venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Start the backend:

```bash
python run.py
```

Backend:

```text
http://localhost:8000
```

Swagger API documentation:

```text
http://localhost:8000/docs
```

---

# 💻 Frontend Setup

Open a new terminal:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Frontend:

```text
http://localhost:3000
```

---

# 🎭 Demo Accounts

| Role          | Email                  | Password  |
| ------------- | ---------------------- | --------- |
| 👤 Job Seeker | `jobseeker@swipex.com` | `demo123` |
| 💼 Recruiter  | `recruiter@swipex.com` | `demo123` |
| 🛡️ Admin     | `admin@swipex.com`     | `demo123` |

> ⚠️ These credentials are intended for development and demonstration purposes.

---

# 🐳 Docker Deployment

SwipeX can also be started using Docker Compose.

Start all services:

```bash
docker-compose up -d
```

View logs:

```bash
docker-compose logs -f
```

Stop services:

```bash
docker-compose down
```

Services:

| Service  | URL                          |
| -------- | ---------------------------- |
| Frontend | `http://localhost:3000`      |
| Backend  | `http://localhost:8000`      |
| API Docs | `http://localhost:8000/docs` |

---

# ☁️ Production Deployment

SwipeX is designed to support a modern cloud deployment architecture.

```text
                    ┌──────────────────┐
                    │      User        │
                    └────────┬─────────┘
                             ↓
                    ┌──────────────────┐
                    │ React Frontend   │
                    │ Cloud Deployment │
                    └────────┬─────────┘
                             │
                          REST API
                             ↓
                    ┌──────────────────┐
                    │ FastAPI Backend  │
                    │ Cloud Deployment │
                    └────────┬─────────┘
                             ↓
                    ┌──────────────────┐
                    │   PostgreSQL     │
                    │  Production DB   │
                    └──────────────────┘
```

The production environment uses separate frontend, backend, and database services for better scalability and maintainability.

---

# 📋 Module Status

| #  | Module                                 | Status     |
| -- | -------------------------------------- | ---------- |
| 1  | User Authentication & RBAC             | ✅ Complete |
| 2  | User Profiles & Resume Management      | ✅ Complete |
| 3  | Swipe-Based Job Discovery              | ✅ Complete |
| 4  | Smart Job Search & Filtering           | ✅ Complete |
| 5  | Job Freshness & Competition Indicators | ✅ Complete |
| 6  | AI Resume Analyzer & ATS Scoring       | ✅ Complete |
| 7  | Personalized Recommendations           | ✅ Complete |
| 8  | Smart Notifications                    | ✅ Complete |
| 9  | Application Tracking System            | ✅ Complete |
| 10 | Dashboard & Analytics                  | ✅ Complete |
| 11 | Docker Deployment                      | ✅ Complete |

---

# 🔑 API Reference

Interactive API documentation is available through FastAPI Swagger UI:

```text
http://localhost:8000/docs
```

### Authentication

```http
POST /api/auth/register
POST /api/auth/login
```

### Jobs

```http
GET /api/jobs/feed
```

### Swipe

```http
POST /api/swipe/
```

### Resume

```http
POST /api/resume/upload
POST /api/resume/analyze
```

### Recommendations

```http
GET /api/recommendations/
```

### Analytics

```http
GET /api/analytics/overview
```

---

# 🛠️ Technology Stack

| Layer                 | Technologies                                                   |
| --------------------- | -------------------------------------------------------------- |
| **Frontend**          | React 18, Tailwind CSS, Framer Motion, Redux Toolkit, Recharts |
| **Backend**           | FastAPI, Python 3.11, SQLAlchemy, Pydantic                     |
| **AI / NLP**          | Scikit-learn, TF-IDF, OpenAI GPT, spaCy                        |
| **Resume Processing** | pdfplumber                                                     |
| **Authentication**    | JWT, bcrypt, Role-Based Access Control                         |
| **Database**          | SQLite (Development), PostgreSQL (Production)                  |
| **API**               | REST API                                                       |
| **DevOps**            | Docker, Docker Compose                                         |
| **Version Control**   | Git, GitHub                                                    |

---

# 🔄 Application Workflow

```text
                   User Registration
                          ↓
                    Create Profile
                          ↓
                    Upload Resume
                          ↓
                  Resume Analysis
                          ↓
             ATS Score + Skill Analysis
                          ↓
              Personalized Recommendations
                          ↓
                  Search / Swipe Jobs
                          ↓
                     Apply for Job
                          ↓
                 Track Application
                          ↓
                  View Analytics
```

---

# 🎯 Project Objectives

SwipeX aims to improve the recruitment experience by:

* Reducing the time required to discover suitable jobs
* Providing personalized job recommendations
* Helping candidates understand resume compatibility
* Improving ATS readiness
* Identifying missing or relevant skills
* Simplifying application management
* Providing actionable career insights
* Creating a modern and engaging job-search experience

---

# 🌟 What Makes SwipeX Different?

Traditional job portals primarily depend on search, filters, and keyword matching.

SwipeX combines multiple technologies into a unified career assistance platform:

```text
Swipe-Based Discovery
          +
Resume Intelligence
          +
ATS Scoring
          +
TF-IDF Similarity
          +
AI-Powered Suggestions
          +
Personalized Recommendations
          +
Application Tracking
          +
Career Analytics
```

This makes SwipeX more than a job listing platform — it acts as an **AI-assisted career discovery and management system**.

---

# 🔮 Future Enhancements

Planned or potential future improvements include:

* 🎤 AI-powered interview simulator
* 🤖 AI career assistant
* 📧 Automated email/job alerts
* 🧩 Personalized learning recommendations
* 📱 Progressive Web App (PWA)
* 🧠 Semantic job matching using embeddings
* 📊 Advanced recruiter-side candidate ranking
* 🔗 Integration with external job platforms
* ☁️ Scalable cloud-native infrastructure
* 📈 Advanced recruitment analytics

---

# 👥 Project Information

### Project Name

**SwipeX — AI-Powered Swipe-Based Job Discovery & Career Assistance Platform**

### Developed For

**Infosys Project**

### Core Technologies

`React` · `FastAPI` · `Python` · `SQLAlchemy` · `PostgreSQL` · `Scikit-learn` · `OpenAI` · `Tailwind CSS` · `Docker`

---

# 📄 License

This project is licensed under the **MIT License**.

---

⭐ **If you find SwipeX interesting, consider giving the repository a star!**
