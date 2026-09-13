# PROJECT REPORT

# SWIPEX: INTELLIGENT JOB DISCOVERY AND CAREER PLATFORM

<br><br><br>

### Done by
### SEETHA LAKSHMI R

<br><br>

---

## ABSTRACT

The SwipeX platform is a modern, full-stack web application designed to help job seekers and corporate recruiters connect in a fast, transparent, and organized manner. The platform transforms the traditional, time-consuming job search process into an intuitive, gesture-based experience where candidates can evaluate job openings by swiping left to pass or swiping right to save or apply immediately.

To ensure relevant matches, SwipeX features an automated Applicant Tracking System (ATS) Resume Intelligence engine that parses uploaded resumes, extracts technical skills across various domains, calculates a compatibility percentage, and provides actionable suggestions to bridge skill gaps.

Additionally, SwipeX introduces a bidirectional mutual matching mechanism, ensuring direct connections and interview scheduling occur only when both the job seeker and the recruiter express mutual interest. The platform includes a transparent 5-stage application tracker, role-specific low-competition opportunity alerts, and a recruiter pipeline management dashboard.

---

## INTRODUCTION

Searching for relevant employment opportunities in the tech sector has become increasingly challenging. Conventional job portals often require candidates to spend 30 to 40 minutes filling out repetitive forms for each application, resulting in candidate fatigue and high drop-off rates. On the other hand, recruiters are overwhelmed by hundreds of unranked resumes, creating pipeline clutter and prolonged hiring cycles where candidates are left without feedback.

SwipeX addresses these challenges by simplifying and modernizing the recruitment workflow. Inspired by intuitive mobile interactions, the platform allows candidates to rapidly explore opportunities using a dynamic card deck.

With integrated resume evaluation, candidates receive immediate feedback on their compatibility score and missing keywords before submitting an application. Recruiters receive pre-evaluated candidate profiles with clear match metrics, enabling quick shortlisting, interview scheduling, and offer extensions. SwipeX delivers an accessible, efficient, and transparent career matching environment for both job seekers and hiring teams.

---

## TOOLS AND TECHNOLOGIES

### Programming Languages:
* Python
* TypeScript
* JavaScript

### Other Technologies:
* HTML5 & CSS3 - Standard web layout and structure
* Tailwind CSS - Responsive styling and modern UI components
* SQLite - Structured storage for users, profiles, jobs, swipes, and notifications

---

## METHODOLOGY

### 1. User Authentication & Role Management
The platform provides secure registration and login functionality for two distinct roles: Job Seekers and Recruiters. User sessions are maintained through token-based authentication, ensuring each user's data and preferences remain secure and isolated.

### 2. Interactive Swipe Deck
Job openings are presented as interactive cards containing essential information: company name, verified status, salary range, experience level, location, and required technical tags.
* Swipe Left (Pass): Skips the current role without delay and optimizes future recommendations.
* Swipe Right (Action): Opens a choice dialog giving the user two options:
  * Save for Later (Pending): Bookmarks the job in the candidate's queue for future review.
  * Apply Now (Immediate): Submits the candidate's verified profile, resume, and optional cover note directly to the recruiter.

### 3. Multi-Dimensional Opportunity Filters
Candidates can tailor their job feed using smart filters:
* Company Type: Toggle between Multinational Corporations (MNCs) and Startups.
* Experience Level: Filter for entry-level and Fresher-Friendly roles.
* Work Mode: Switch between Remote, Hybrid, and On-Site opportunities.
* Salary Slider: Set a minimum base annual compensation.

### 4. ATS Resume Intelligence & Skill Gap Engine
When a candidate uploads a resume (text, PDF, or document):
* The system extracts hard skills and categorizes them into technical domains (e.g., Frontend, Backend, AI/ML).
* A compatibility score (0-100%) is calculated against active job requirements.
* The system displays verified matching keywords (✓) alongside missing keywords (!), accompanied by specific suggestions to improve compatibility.

### 5. Bidirectional Mutual Matching System
A mutual match is established through a two-step handshake:
1. The candidate applies for an active job opening.
2. The recruiter reviews the candidate's profile and match score in the Review Pipeline and clicks "Accept & Mutual Match".
3. Both parties immediately receive celebratory notifications, and the candidate moves into the interview stage.

### 6. Recruiter Pipeline Management
Recruiters have access to an applicant dashboard to:
* Review candidate profiles, resumes, and ATS scores.
* Display dynamic initial avatar badges for candidates without photos.
* Move candidates through stages: Schedule Technical Interview (with date and round type), Extend Offer, or Conclude.
* Concluded candidates automatically vanish from the active pipeline and are moved to an archive.

### 7. Application Tracker & Smart Notifications
* 5-Stage Progression Stepper: Candidates track application milestones: Applied -> Reviewed -> Interview Scheduled -> Mutual Match -> Offer Extended.

---

## INSTALLATION AND PREREQUISITES

### Prerequisites:
* Node.js (v18 or higher)
* Python (3.8 or higher)
* Git

### Required Libraries:
Install frontend and backend dependencies using:
```bash
npm install
```

For the Python backend services:
```bash
pip install -r requirements.txt
```

### Running the Project Locally:
1. Clone the repository from GitHub:
   ```bash
   git clone https://github.com/Seetha-Lakshmi26/swipex-career-platform.git
   ```
2. Navigate into the project folder:
   ```bash
   cd "swipex milestone 4 final completed"
   ```
3. Start the application:
   ```bash
   npm run dev
   ```
4. Open the application in your browser:
   ```
   http://localhost:3000/
   ```

---

## IMPLEMENTATION

The SwipeX system consists of four primary modules:

### 1. Authentication Module
Handles secure user registration, login, and role-based access control. Users select whether they are creating a Job Seeker or Recruiter profile. Passwords and sessions are validated securely, ensuring data privacy and correct dashboard routing.

### 2. Job Discovery & Swipe Deck Module
Presents job postings in a responsive card format. It captures drag and button inputs, tracks swiped positions, and triggers the 1-click choice modal for saving or submitting applications without redundant form-filling.

### 3. ATS Resume Intelligence Module
Parses uploaded resumes, extracts technical proficiencies, calculates transparent compatibility scores against specific job requirements, and generates personalized recommendations to bridge identified skill gaps.

### 4. Recruiter Management & Mutual Match Module
Provides recruiters with full visibility into their active job postings and applicant pools. It enables recruiters to inspect applicant credentials, confirm mutual matches, record interview dates, extend job offers, and archive rejected applications to maintain clean candidate pipelines.

---

## ERROR DETECTION AND CORRECTIONS

### Session and Token Expiration Errors
* Issue: When the server was restarted, old session tokens stored in the browser triggered authorization errors.
* Correction: Improved token verification to handle development session continuity smoothly and added response interceptors to refresh sessions automatically.

### Mutual Match Counter Synchronization
* Issue: When an application advanced to the interview or offer stage, the top match counter fell back to zero.
* Correction: Updated the matching query logic to include all active connection stages (matched, interview_scheduled, and selected), ensuring counts reflect real-time progress.

### Candidate Avatar Display in Recruiter Dashboard
* Issue: Candidates without an uploaded profile photo were showing a default generic stock image in the recruiter's applicant review list.
* Correction: Integrated a dynamic avatar component that generates an uppercase initial letter badge (e.g., "S" for Seetha Lakshmi R) when no photo is provided, matching the candidate's own navigation profile view.

### Pipeline Clutter and Rejected Candidate Views
* Issue: Rejected candidates remained visible in the active applicant queue, creating visual clutter.
* Correction: Implemented automated filtering so concluded applicants immediately vanish from the active queue and are routed to a dedicated archive tab.

---

## FINAL OUTPUT

The SwipeX platform successfully performs the following:
* User registration and login with role-based routing (Job Seeker & Recruiter).
* Gesture-based swipe discovery (left to skip, right to save or apply).
* Automated resume ingestion, skill extraction, and ATS compatibility scoring.
* Bidirectional mutual matching with reciprocal real-time notifications.
* Recruiter applicant pipeline with interview scheduling and offer extensions.
* Automatic archiving of concluded candidates.
* Dynamic candidate initial avatar badges.
* 5-stage candidate application tracking stepper.
* Role-specific low-competition job opportunity alerts.
* Fully containerized with Docker and deployed live on Render Cloud.

### Live Project Links:
* Live Deployed Application: https://swipex-career-platform.onrender.com
* Project GitHub Repository: https://github.com/Seetha-Lakshmi26/swipex-career-platform
* Mentor Collaboration Branch: seetha-lakshmi-r

---

## CONCLUSION

The SwipeX platform provides an efficient, transparent, and engaging solution to modern recruitment challenges. By combining the speed of gesture-driven discovery with the intelligence of automated ATS resume evaluation and mutual consent matching, the platform minimizes application fatigue for job seekers while eliminating pipeline clutter for recruiters.

The modular architecture, built using React, Python, and Express, ensures reliable performance across devices. In the future, the platform can be expanded with features such as real-time in-app messaging, automated interview reminders via email, and native mobile applications for iOS and Android.
