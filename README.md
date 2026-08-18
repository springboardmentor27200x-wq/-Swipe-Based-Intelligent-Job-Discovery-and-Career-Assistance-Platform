# SwipeX 🚀 — AI-Powered Swipe Job Matching & Career Assistant Platform

SwipeX is a modern, AI-driven job-matching web application that revolutionizes recruitment with a Tinder-style swipe deck for job seekers and recruiters, combined with an advanced **AI Resume Parsing & ATS Engine**, **AI Cover Letter Generator**, and **AI Interview Preparation Suite**.

---

## 🌟 Key Features & Milestones

### 📱 Milestone 1 & 2: Core Platform & Interactive Swipe Deck
- **Interactive Swipe Deck**: Smooth drag-and-drop pointer navigation, button controls, and keyboard arrow navigation (`← Left` to skip, `→ Right` to apply/save).
- **Company Classification**: Categorizes companies into **MNC Enterprise**, **Fast-Growing Startup**, and **Newly Founded Startup**.
- **Real-Time Job Filtering**: Filter jobs by remote work status, company type, minimum salary, tech stack skills, location, and experience level.
- **Swipe Persistence & Reset**: Prevents duplicate job viewing; swiped jobs are excluded from recommendations with an instant **Clear Swipes & Restart** capability.

### 🤖 Milestone 3: AI Resume Analysis, ATS Engine & Career Assistant
- **Dual-Engine PDF/DOCX Parser**: Uses `pdfminer.six` and `pypdf` to extract text and detect candidate skills across multi-column resume layouts.
- **TF-IDF ATS Compatibility Scoring**: Computes mathematical cosine similarity vectors between candidate resumes and job requirements (`ats_score`, `matched_keywords`, `missing_keywords`).
- **AI Job Feed Re-Ranking**: Dynamically sorts candidate job discovery feeds so roles with the highest AI match score appear first.
- **📝 AI One-Click Cover Letter Generator**: Generates customized 3-paragraph application cover letters tailored to target job descriptions with a 1-click **Copy to Clipboard** feature.
- **🎤 AI Mock Interview Preparation**: Generates 5 tailored technical, behavioral, and system design interview questions complete with **Answer Hints**.
- **Google Gemini 2.0 Integration**: Uses `gemini-2.0-flash` for LLM intelligence with an offline **Local Intelligent NLP Fallback Engine**.

---

## 🛠️ Technology Stack

| Component | Technologies |
| :--- | :--- |
| **Frontend** | React 18, TailwindCSS, Lucide Icons, Axios |
| **Backend Framework** | FastAPI (Python 3.10+), Uvicorn |
| **Database** | PostgreSQL, SQLAlchemy ORM, Alembic |
| **AI & NLP Engine** | Google Gemini API (`gemini-2.0-flash`), Scikit-Learn (`TfidfVectorizer`, Cosine Similarity), PyPDF, PDFMiner.six, Python-Docx |
| **Authentication** | OAuth2 with Password Hashing (Bcrypt) & JWT Tokens |

---

## 📊 System Architecture & Data Flow

```mermaid
flowchart TD
    subgraph FRONTEND["React Frontend (Port 3000)"]
        UI1[Swipe Deck UI]
        UI2[AI Resume ATS Modal]
        UI3[AI Cover Letter Modal]
        UI4[AI Mock Interview Prep Modal]
    end

    subgraph BACKEND["FastAPI Backend (Port 8000)"]
        API1["POST /api/resumes/upload"]
        API2["POST /api/resumes/analyze/{job_id}"]
        API3["POST /api/resumes/cover-letter/{job_id}"]
        API4["POST /api/resumes/interview-prep/{job_id}"]
        
        ENGINE1[Resume Parser: pypdf + pdfminer]
        ENGINE2[ATS Similarity: scikit-learn TF-IDF]
        ENGINE3[LLM Advisor: Google Gemini 2.0 Flash]
    end

    subgraph DB["PostgreSQL Database"]
        TABLES[(users, companies, jobs, swipes, resumes)]
    end

    FRONTEND <--> BACKEND
    BACKEND <--> DB
    ENGINE1 --> ENGINE2 --> ENGINE3
```

---

## 🔌 API Endpoints Summary

### Authentication (`/api/auth`)
- `POST /api/auth/register` — Candidate / Recruiter registration
- `POST /api/auth/login` — Authentication & JWT token issuance
- `GET /api/auth/me` — Current authenticated user profile

### Companies & Jobs (`/api/companies`, `/api/jobs`)
- `GET /api/companies` — List all companies with filter params
- `POST /api/companies` — Create new company profile
- `GET /api/jobs` — Retrieve filtered jobs list
- `POST /api/jobs` — Post a new job opportunity
- `GET /api/jobs/recommendations/discover` — AI re-ranked candidate swipe feed

### Swipes (`/api/swipes`)
- `POST /api/swipes` — Record candidate swipe action (`left` / `right`)
- `DELETE /api/swipes` — Reset swipe history and restart candidate feed

### AI Resume & Career Suite (`/api/resumes`)
- `POST /api/resumes/upload` — Upload PDF/DOCX resume & parse skills
- `GET /api/resumes/me` — Get candidate's parsed resume text & skills
- `POST /api/resumes/analyze/{job_id}` — Run ATS compatibility match & AI suggestions
- `POST /api/resumes/cover-letter/{job_id}` — Generate AI one-click cover letter
- `POST /api/resumes/interview-prep/{job_id}` — Generate 5 mock interview questions with hints

---

## ⚡ Getting Started & Local Setup

### 1. Prerequisites
- **Python 3.10+**
- **Node.js 18+ & npm**
- **PostgreSQL** running locally on port `5432`

---

### 2. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Create & activate virtual environment
python -m venv venv
.\venv\Scripts\activate  # On Windows

# Install Python dependencies
pip install -r requirements.txt

# Configure environment variables (.env)
DATABASE_URL=postgresql://postgres:123456@localhost:5432/swipex
SECRET_KEY=supersecretjwtkeyforhashingtokensswipex2026
GEMINI_API_KEY=your_gemini_api_key_here  # Optional for Cloud LLM

# Run database migrations / start server
uvicorn app.main:app --reload --port 8000
```
Backend server will start at `http://127.0.0.1:8000`.

---

### 3. Frontend Setup
```bash
# Navigate to frontend directory
cd frontend

# Install Node modules
npm install

# Start React dev server
npm start
```
Frontend Web App will open at `http://localhost:3000`.

---

### 4. Running Backend Verification Tests
```bash
cd backend
python test_milestone3.py
```

---

## 📄 License
Distributed under the MIT License. See `LICENSE` for more information.
