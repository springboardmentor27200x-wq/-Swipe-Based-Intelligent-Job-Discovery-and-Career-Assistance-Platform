# 🚀 SwipeX

## Swipe-Based Intelligent Job Discovery & Career Assistance Platform

> SwipeX is a full-stack career assistance platform designed to make job discovery more personalized, interactive, and data-driven.

### 🌐 Live Demo

**[🚀 Visit SwipeX](https://swipe-x-swipe-based-intelligent-job.vercel.app/)**

---

## 📌 About the Project

Finding the right job can be challenging due to the large number of job listings and the difficulty of identifying opportunities that match a candidate's skills and career goals.

**SwipeX** aims to simplify this process by combining an intuitive swipe-based job discovery experience with personalized recommendations, resume analysis, application tracking, and recruiter tools.

The platform provides separate experiences for **Job Seekers** and **Recruiters**, creating an integrated ecosystem for discovering and managing career opportunities.

---

## ✨ Features

### 👩‍💻 Job Seeker

- 🔄 Swipe-based job discovery
- 🎯 Personalized job recommendations
- 📊 Job seeker dashboard
- 📄 Resume ATS analysis
- 📈 Resume performance tracking
- 🔔 Instant job notifications
- 🚀 Startup hiring alerts
- 🎯 High-match job alerts
- 📋 Application tracking
- 💡 Career and resume insights

### 🏢 Recruiter

- 📝 Create and publish job openings
- 👥 Manage hiring opportunities
- 🎯 Skill-based candidate matching
- 📊 Recruiter dashboard
- 📋 Manage posted jobs

---

## 🧠 Intelligent Career Assistance

SwipeX goes beyond traditional job listings by providing tools that help candidates throughout their job search.

The platform includes:

- Resume analysis
- ATS-oriented resume scoring
- Job recommendations
- Skill-based matching
- Application tracking
- Resume performance insights
- Career-oriented analytics

---

## 🛠️ Tech Stack

### Frontend

- React.js
- JavaScript
- Vite
- Tailwind CSS

### Backend

- Python
- FastAPI
- SQLAlchemy
- Pydantic

### Database

- PostgreSQL
- SQLite

### AI / Data

- Natural Language Processing
- Resume Analysis
- Job Recommendation
- Skill Matching

### Tools & Deployment

- Git
- GitHub
- VS Code
- Vercel
- Render

---

## 🏗️ Project Architecture

```text
                    ┌─────────────────────┐
                    │       SwipeX        │
                    │    Web Platform     │
                    └──────────┬──────────┘
                               │
                ┌──────────────┴──────────────┐
                │                             │
        ┌───────▼────────┐          ┌────────▼────────┐
        │    Frontend    │          │     Backend     │
        │ React + Vite   │◄────────►│     FastAPI     │
        │ Tailwind CSS   │   API    │     Python      │
        └────────────────┘          └────────┬────────┘
                                             │
                                    ┌────────▼────────┐
                                    │    Database     │
                                    │   PostgreSQL    │
                                    └─────────────────┘
