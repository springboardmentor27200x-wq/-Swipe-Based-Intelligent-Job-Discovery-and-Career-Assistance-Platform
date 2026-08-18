# DEMO_ACCOUNTS.md — SwipeX Milestone 4

All accounts are created by `python manage.py seed_data`. Password is the
same for every seeded account: **Demo@1234** (admin uses **Admin@1234**).

Run `python manage.py generate_notifications --hours 999999` after seeding
to pre-populate every account's notification bell for a live Milestone 4 demo.

---

## Admin

| Email | Password | Notes |
|---|---|---|
| `admin@swipex.demo` | `Admin@1234` | Django admin at `/admin/` — includes **Resumes** (Milestone 3) and **Notifications** / **Analytics** (Milestone 4) sections |

---

## Job Seekers

Five accounts, all "Pratyusha Satpathy" variants with different skill
profiles and experience levels — useful for demonstrating how ATS scores
and recommendations change per profile.

| Email | Profile | Skills | Location | Experience |
|---|---|---|---|---|
| `pratyusha@swipex.demo` | Full Stack Developer | Python, Django, React, Docker | Bangalore | 2 yrs |
| `pratyusha.ml@swipex.demo` | ML Engineer | Python, ML, TensorFlow, Pandas | Pune | 1 yr |
| `pratyusha.frontend@swipex.demo` | Frontend Developer | React, TypeScript, Next.js | Mumbai | 3 yrs |
| `pratyusha.devops@swipex.demo` | DevOps Engineer | Docker, Kubernetes, AWS, Terraform | Hyderabad | 4 yrs |
| `pratyusha.fresher@swipex.demo` | CS Graduate | Python, SQL, Git, Java | Bangalore | 0 yrs |

**None of these accounts have a resume pre-loaded** — this is intentional,
so you can demonstrate the full Milestone 3 upload → parse → ATS score
flow live. Use `pratyusha@swipex.demo` for the main walkthrough:

1. Log in → Profile → upload a resume (PDF or DOCX).
2. Visit Discover / Recommended → note the `ATS %` badges on job cards.
3. Open any job → **Resume Compatibility** panel: score, matched/missing
   skills, suggestions.
4. Revisit **Recommended** → reasons now include resume-based matches.

Each seeded job seeker also has, from Milestone 2:
- ~22 jobs in their Discover feed
- 3 saved jobs
- 2 applications
- 28+ pre-computed recommendations

---

## Recruiters

| Email | Company / companies |
|---|---|
| `recruiter1@swipex.demo` | TechNova Solutions |
| `recruiter2@swipex.demo` | InfraCore Systems, GlobalTech MNC |
| `recruiter3@swipex.demo` | DataPulse, PixelCraft, SwiftScale |

Recruiter accounts are unaffected by Milestone 3 — they continue to post
jobs, manage applicants, and view their dashboard exactly as in Milestone 2.
(Resume upload/ATS scoring is a job-seeker-only feature.)

---

## Sample Resumes for Testing

Milestone 3 doesn't ship pre-generated resume files (real resumes aren't
demo data), but any resume PDF/DOCX works. For a quick test file, a plain
text resume with clear section headers parses best:

```
Your Name
your.email@example.com | +91 98765 43210
github.com/yourhandle | linkedin.com/in/yourhandle

SKILLS
Python, Django, React, PostgreSQL, Git, REST API, Docker

EDUCATION
B.Tech Computer Science, Example University, 2020–2024

EXPERIENCE
Software Engineer Intern, Example Corp, 2023–2024
Built REST APIs using Django and integrated with a React frontend.

PROJECTS
SwipeX — a swipe-based job discovery platform built with Django and React

CERTIFICATIONS
AWS Certified Cloud Practitioner
```

Save as `.docx` (e.g. from Word/Google Docs) or export as a text-based
`.pdf` (not a scanned image) and upload via Profile → Resume.
