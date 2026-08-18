import uuid
from app.database import SessionLocal, engine
from app import models, auth

def seed():
    models.Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        print("Checking existing seed data...")
        # Check if recruiter user exists or create one
        recruiter_email = "recruiter@swipex.com"
        recruiter = db.query(models.User).filter(models.User.email == recruiter_email).first()
        if not recruiter:
            pwd_hash = auth.hash_password("Recruiter123!")
            recruiter = models.User(
                email=recruiter_email,
                password_hash=pwd_hash,
                role=models.UserRole.recruiter,
                is_active=True,
                is_verified=True
            )
            db.add(recruiter)
            db.flush()
            
            profile = models.RecruiterProfile(
                user_id=recruiter.id,
                full_name="Alex Vance",
                company_name="SwipeX Tech Network",
                company_website="https://swipex.dev"
            )
            db.add(profile)
            db.commit()
            print(f"Created seed recruiter: {recruiter_email}")
        else:
            print(f"Recruiter already exists: {recruiter_email}")

        # Check if default candidate user exists or create one
        candidate_email = "candidate@swipex.com"
        candidate = db.query(models.User).filter(models.User.email == candidate_email).first()
        if not candidate:
            pwd_hash = auth.hash_password("Candidate123!")
            candidate = models.User(
                email=candidate_email,
                password_hash=pwd_hash,
                role=models.UserRole.job_seeker,
                is_active=True,
                is_verified=True
            )
            db.add(candidate)
            db.flush()
            
            profile = models.JobSeekerProfile(
                user_id=candidate.id,
                full_name="Sarah Connor",
                phone="555-0199",
                location="San Francisco, CA"
            )
            db.add(profile)
            db.commit()
            print(f"Created seed candidate: {candidate_email}")
        else:
            print(f"Candidate already exists: {candidate_email}")

        # Seed Companies
        companies_data = [
            {
                "name": "Google",
                "type": models.CompanyType.mnc,
                "website": "https://google.com",
                "location": "Mountain View, CA",
                "description": "Global technology giant organizing the world's information and making it universally accessible."
            },
            {
                "name": "Stripe",
                "type": models.CompanyType.mnc,
                "website": "https://stripe.com",
                "location": "San Francisco, CA",
                "description": "Financial infrastructure platform for businesses across the internet."
            },
            {
                "name": "Supabase",
                "type": models.CompanyType.startup,
                "website": "https://supabase.com",
                "location": "Remote",
                "description": "The Open Source Firebase alternative powering modern database applications."
            },
            {
                "name": "Vercel",
                "type": models.CompanyType.startup,
                "website": "https://vercel.com",
                "location": "San Francisco, CA",
                "description": "Frontend cloud platform for fast, modern web applications."
            },
            {
                "name": "Nova AI",
                "type": models.CompanyType.newly_founded,
                "website": "https://nova-ai.io",
                "location": "Austin, TX",
                "description": "Early stage stealth AI startup innovating agentic developer tooling."
            },
            {
                "name": "Pulse Health",
                "type": models.CompanyType.newly_founded,
                "website": "https://pulsehealth.co",
                "location": "Boston, MA",
                "description": "Next-gen remote telemetry monitoring platform for clinical trials."
            }
        ]

        company_map = {}
        for cdata in companies_data:
            existing = db.query(models.Company).filter(models.Company.name == cdata["name"]).first()
            if not existing:
                comp = models.Company(**cdata)
                db.add(comp)
                db.flush()
                company_map[cdata["name"]] = comp
                print(f"Added company: {cdata['name']}")
            else:
                company_map[cdata["name"]] = existing

        db.commit()

        # Seed Jobs
        jobs_data = [
            {
                "company_name": "Google",
                "title": "Senior Frontend Engineer - React & Web Components",
                "description": "Join our Core UX team building world-class user experiences across Google Cloud Console. Looking for deep experience with React, TypeScript, and state management.",
                "job_type": models.JobType.full_time,
                "salary_min": 160000,
                "salary_max": 210000,
                "location": "Mountain View, CA",
                "experience_level": models.ExperienceLevel.five_plus_years,
                "skills_required": ["React", "TypeScript", "JavaScript", "HTML/CSS", "Redux"]
            },
            {
                "company_name": "Google",
                "title": "Software Engineering Intern - Cloud Backend",
                "description": "Summer 2027 internship working on distributed databases, gRPC APIs, and high throughput Python microservices.",
                "job_type": models.JobType.internship,
                "salary_min": 90000,
                "salary_max": 110000,
                "location": "Sunnyvale, CA",
                "experience_level": models.ExperienceLevel.fresher,
                "skills_required": ["Python", "C++", "Algorithms", "Distributed Systems"]
            },
            {
                "company_name": "Stripe",
                "title": "Staff Backend Engineer - Billing Infrastructure",
                "description": "Build high-reliability financial transaction engines handling millions of API calls daily. Requires experience in Python/Go, PostgreSQL, and event-driven architecture.",
                "job_type": models.JobType.remote,
                "salary_min": 180000,
                "salary_max": 240000,
                "location": "Remote",
                "experience_level": models.ExperienceLevel.five_plus_years,
                "skills_required": ["Python", "PostgreSQL", "Go", "Docker", "Microservices"]
            },
            {
                "company_name": "Supabase",
                "title": "Fullstack Developer - PostgreSQL & Realtime APIs",
                "description": "Empower developers worldwide. Help us build real-time client SDKs, Elixir backend services, and React dashboard features.",
                "job_type": models.JobType.remote,
                "salary_min": 130000,
                "salary_max": 170000,
                "location": "Remote",
                "experience_level": models.ExperienceLevel.three_five_years,
                "skills_required": ["React", "TypeScript", "PostgreSQL", "Node.js", "TailwindCSS"]
            },
            {
                "company_name": "Vercel",
                "title": "Frontend Engineer - Next.js Core Platform",
                "description": "Help craft the future of the web. Work on Next.js runtime performance, edge rendering, and developer experience.",
                "job_type": models.JobType.full_time,
                "salary_min": 140000,
                "salary_max": 185000,
                "location": "San Francisco, CA",
                "experience_level": models.ExperienceLevel.one_three_years,
                "skills_required": ["Next.js", "React", "TypeScript", "Node.js", "Vite"]
            },
            {
                "company_name": "Nova AI",
                "title": "Junior AI Applications Developer",
                "description": "Great opportunity for freshers! Work alongside AI researchers to deploy LLM pipelines, FastAPI backends, and responsive React interfaces.",
                "job_type": models.JobType.full_time,
                "salary_min": 95000,
                "salary_max": 125000,
                "location": "Austin, TX",
                "experience_level": models.ExperienceLevel.fresher,
                "skills_required": ["Python", "FastAPI", "React", "OpenAI", "PyTorch"]
            },
            {
                "company_name": "Pulse Health",
                "title": "React Native Mobile Engineer Intern",
                "description": "Looking for a passionate mobile developer intern to craft cross-platform iOS & Android health metric interfaces.",
                "job_type": models.JobType.internship,
                "salary_min": 60000,
                "salary_max": 80000,
                "location": "Remote",
                "experience_level": models.ExperienceLevel.fresher,
                "skills_required": ["React Native", "JavaScript", "Mobile UI", "REST APIs"]
            }
        ]

        for jdata in jobs_data:
            comp_name = jdata.pop("company_name")
            company = company_map.get(comp_name)
            if company:
                existing = db.query(models.Job).filter(
                    models.Job.company_id == company.id,
                    models.Job.title == jdata["title"]
                ).first()
                if not existing:
                    job = models.Job(
                        **jdata,
                        company_id=company.id,
                        recruiter_id=recruiter.id,
                        is_active=True
                    )
                    db.add(job)
                    print(f"Added job: {jdata['title']} at {comp_name}")

        db.commit()
        print("Database seeding completed successfully!")

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed()
