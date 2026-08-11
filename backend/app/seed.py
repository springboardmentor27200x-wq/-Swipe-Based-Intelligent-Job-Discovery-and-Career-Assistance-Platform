import json
import logging
from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.company import Company
from app.models.job import Job
from app.models.notification import Notification
from app.auth.utils import get_password_hash

logger = logging.getLogger(__name__)

def seed_database(db: Session) -> None:
    # 1. Seed Users if not present
    existing_seeker = db.query(User).filter(User.email == "jobseeker@swipex.com").first()
    if not existing_seeker:
        seeker = User(
            email="jobseeker@swipex.com",
            full_name="Alex Johnson",
            hashed_password=get_password_hash("demo123"),
            role="job_seeker",
            title="Junior Software Developer",
            location="Bangalore",
            bio="Passionate full stack developer with experience building modern web apps. Quick learner, looking for opportunities in active startups or tech leaders.",
            skills=json.dumps(["Python", "React", "PostgreSQL", "Docker", "Machine Learning", "FastAPI", "JavaScript"]),
            experience_years=2,
            education="B.Tech in Computer Science, VTU University",
            linkedin_url="https://linkedin.com/in/alexjohnson-demo",
            github_url="https://github.com/alexjohnson-demo",
            portfolio_url="https://alexjohnson.dev"
        )
        db.add(seeker)
        
        recruiter = User(
            email="recruiter@swipex.com",
            full_name="Sarah Williams",
            hashed_password=get_password_hash("demo123"),
            role="recruiter",
            title="Senior Talent Acquisition Manager",
            location="Mumbai"
        )
        db.add(recruiter)

        admin = User(
            email="admin@swipex.com",
            full_name="Platform Admin",
            hashed_password=get_password_hash("demo123"),
            role="admin",
            title="System Administrator",
            location="Delhi"
        )
        db.add(admin)
        db.commit()
        logger.info("Demo users seeded successfully.")
    
    # 2. Seed Companies if not present
    existing_company = db.query(Company).filter(Company.name == "TechCorp Solutions").first()
    if not existing_company:
        companies_data = [
            {
                "name": "TechCorp Solutions",
                "logo_url": "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=60",
                "description": "Leading global provider of software services and IT infrastructure management Solutions for Fortune 500 enterprises.",
                "company_type": "mnc",
                "industry": "IT Services",
                "size": "500+",
                "location": "Bangalore",
                "website": "https://techcorp.example.com",
                "founded_year": 2004,
                "rating": 4.2
            },
            {
                "name": "InnovateLab AI",
                "logo_url": "https://images.unsplash.com/photo-1549923746-c502d488b3ea?w=100&auto=format&fit=crop&q=60",
                "description": "Creating state of the art generative AI tools and intelligent recommendation products for business automation.",
                "company_type": "startup",
                "industry": "Artificial Intelligence",
                "size": "11-50",
                "location": "Mumbai",
                "website": "https://innovatelab.example.com",
                "founded_year": 2021,
                "rating": 4.6
            },
            {
                "name": "ByteForge Labs",
                "logo_url": "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=100&auto=format&fit=crop&q=60",
                "description": "Fast growing developer-first SaaS platform building low-latency API architectures and tools.",
                "company_type": "new_startup",
                "industry": "SaaS",
                "size": "1-10",
                "location": "Remote",
                "website": "https://byteforge.example.com",
                "founded_year": 2025,
                "rating": 4.8
            },
            {
                "name": "GlobalSoft Inc",
                "logo_url": "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=100&auto=format&fit=crop&q=60",
                "description": "Multi-national enterprise software conglomerate offering cloud database hosting and ERP frameworks globally.",
                "company_type": "mnc",
                "industry": "Enterprise Software",
                "size": "500+",
                "location": "Hyderabad",
                "website": "https://globalsoft.example.com",
                "founded_year": 1998,
                "rating": 3.9
            },
            {
                "name": "CloudNine Systems",
                "logo_url": "https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=100&auto=format&fit=crop&q=60",
                "description": "Providing next-generation serverless cloud infrastructure management and monitoring solutions.",
                "company_type": "startup",
                "industry": "Cloud Computing",
                "size": "51-200",
                "location": "Pune",
                "website": "https://cloudnine.example.com",
                "founded_year": 2018,
                "rating": 4.1
            }
        ]

        for company_dict in companies_data:
            c = Company(**company_dict)
            db.add(c)
        db.commit()
        logger.info("Companies seeded successfully.")

    # Get seed companies
    companies = db.query(Company).all()
    recruiter_user = db.query(User).filter(User.role == "recruiter").first()
    recruiter_id = recruiter_user.id if recruiter_user else 1

    # 3. Seed Jobs if not present
    existing_job = db.query(Job).first()
    if not existing_job:
        job_templates = [
            {
                "title": "Software Engineer (Python/FastAPI)",
                "company_idx": 1, # InnovateLab
                "description": "We are seeking a talented Backend Engineer to design and build scalable REST APIs with FastAPI and Python. You will construct high-performance backend pipelines and collaborate with data scientists to package ML workflows.",
                "skills_required": ["Python", "FastAPI", "PostgreSQL", "Docker", "REST API"],
                "requirements": ["1+ years of experience in Python backends", "Experience with FastAPI/Django", "Solid knowledge of SQL database scaling", "Basic knowledge of Docker"],
                "job_type": "full_time",
                "experience_level": "junior",
                "min_salary": 60000,
                "max_salary": 95000,
                "location": "Mumbai",
                "is_remote": False,
                "benefits": ["Flexible Working Hours", "Medical Insurance", "Performance Bonus"],
                "applicant_count": 8,
            },
            {
                "title": "React Frontend Developer",
                "company_idx": 0, # TechCorp
                "description": "Join our frontend engineering team to build sleek, interactive, and beautiful user interfaces for our key enterprise client dashboards. Experience with state management is highly valued.",
                "skills_required": ["React", "JavaScript", "CSS", "Tailwind", "Redux", "TypeScript"],
                "requirements": ["Proficient with React hooks and modern JS features", "Solid responsive layout design using Tailwind CSS", "Familiarity with Redux Toolkit", "Good communications"],
                "job_type": "full_time",
                "experience_level": "junior",
                "min_salary": 50000,
                "max_salary": 80000,
                "location": "Bangalore",
                "is_remote": False,
                "benefits": ["Learning & Development budget", "Gym membership reimbursement"],
                "applicant_count": 22,
            },
            {
                "title": "Senior Machine Learning Engineer",
                "company_idx": 1, # InnovateLab
                "description": "Looking for an expert to engineer training workflows, optimize LLM inference pipelines, and implement production-grade recommenders. You will scale our neural network infrastructure.",
                "skills_required": ["Machine Learning", "Python", "Deep Learning", "PyTorch", "TensorFlow", "scikit-learn"],
                "requirements": ["5+ years of production experience in ML pipelines", "Expertise in PyTorch or TensorFlow", "Experience scaling recommendation algorithms in cloud environments", "MS or PhD in Computer Science preferred"],
                "job_type": "full_time",
                "experience_level": "senior",
                "min_salary": 160000,
                "max_salary": 240000,
                "location": "Mumbai",
                "is_remote": False,
                "benefits": ["Stock Options / Equity", "Annual retreats", "Relocation assistance"],
                "applicant_count": 55,
            },
            {
                "title": "Full Stack Engineer (Remote)",
                "company_idx": 2, # ByteForge Labs
                "description": "We are a high-speed, fast-growing SaaS startup building APIs for developers. We need a generalist full stack engineer who can move quickly from database schemas to sleek UI experiences.",
                "skills_required": ["Python", "React", "TypeScript", "PostgreSQL", "FastAPI", "Tailwind", "Redis"],
                "requirements": ["Strong programming generalist background", "Capable of writing both backend services and React frontend code", "Experience with databases and caching layers like Redis", "Self-starter capable of remote work autonomy"],
                "job_type": "remote",
                "experience_level": "mid",
                "min_salary": 90000,
                "max_salary": 140000,
                "location": "Remote",
                "is_remote": True,
                "benefits": ["Remote work allowance", "Work-from-home gear budget", "Flexible time off"],
                "applicant_count": 14,
            },
            {
                "title": "DevOps Engineer (Cloud Infrastructure)",
                "company_idx": 4, # CloudNine Systems
                "description": "Manage, monitor, and configure our high-availability cloud cluster. You will automate deployment pipelines, implement observability dashboards, and secure container infrastructures.",
                "skills_required": ["AWS", "Docker", "Kubernetes", "Terraform", "Jenkins", "linux"],
                "requirements": ["3+ years of experience managing production infrastructure in AWS", "Proficient with Docker and Kubernetes cluster management", "In-depth understanding of Infrastructure as Code (Terraform)", "CI/CD pipeline construction experience"],
                "job_type": "full_time",
                "experience_level": "mid",
                "min_salary": 110000,
                "max_salary": 170000,
                "location": "Pune",
                "is_remote": False,
                "benefits": ["AWS Certifications reimbursement", "Health and Wellness coverage"],
                "applicant_count": 6,
            },
            {
                "title": "UI/UX Designer",
                "company_idx": 2, # ByteForge Labs
                "description": "Design user flows, wireframes, high-fidelity mockups, and interaction animations for our new web and mobile application dashboard. Collaborate closely with engineering to realize layouts.",
                "skills_required": ["figma", "css", "html", "user experience", "UI design"],
                "requirements": ["Proven portfolio of digital product designs in Figma", "Strong understanding of typography, alignment, and color theories", "Basic understanding of HTML/CSS to coordinate designs", "User research experience"],
                "job_type": "remote",
                "experience_level": "junior",
                "min_salary": 45000,
                "max_salary": 70000,
                "location": "Remote",
                "is_remote": True,
                "benefits": ["Figma Professional license", "Creative assets allowance"],
                "applicant_count": 35,
            },
            {
                "title": "Intern Software Engineer (Frontend)",
                "company_idx": 0, # TechCorp
                "description": "We are seeking proactive final-year students or recent graduates for a 6-month intensive frontend internship. You will learn react development, responsive design, and work on client projects.",
                "skills_required": ["React", "JavaScript", "HTML", "CSS", "git"],
                "requirements": ["Basic programming knowledge in JavaScript/React", "Familiarity with HTML5, CSS3, and responsive grids", "Strong enthusiasm to learn and pick up new tools", "Available full-time for 6 months"],
                "job_type": "internship",
                "experience_level": "fresher",
                "min_salary": 20000,
                "max_salary": 25000,
                "location": "Bangalore",
                "is_remote": False,
                "benefits": ["Certificate of Internship", "Full-time job offer opportunity", "Daily snacks & beverages"],
                "applicant_count": 87,
            },
            {
                "title": "Database Administrator",
                "company_idx": 3, # GlobalSoft Inc
                "description": "Maintain, configure, tune, and backup high-volume transactional databases. You will monitor query executions, partition tables, and prevent downtime on core databases.",
                "skills_required": ["sql", "PostgreSQL", "mysql", "linux", "database design"],
                "requirements": ["4+ years of DBA experience", "Proficiency in query optimization, execution analysis, and index tuning", "Understanding of database replication, clustering, and failover", "Scripting skills in Bash or Python"],
                "job_type": "full_time",
                "experience_level": "mid",
                "min_salary": 100000,
                "max_salary": 150000,
                "location": "Hyderabad",
                "is_remote": False,
                "benefits": ["Retirement package matching", "Onsite dining", "Transit pass support"],
                "applicant_count": 12,
            }
        ]

        # Generate additional realistic jobs to reach 50
        titles_and_skills = [
            ("Python Developer", ["Python", "Django", "SQL", "git"], "mid", 85000, 130000, 15, "Bangalore", False, 0),
            ("Mobile Dev (Flutter)", ["flutter", "dart", "REST API", "git"], "junior", 45000, 75000, 9, "Pune", False, 4),
            ("Data Analyst", ["Python", "SQL", "pandas", "numpy", "tableau"], "junior", 50000, 85000, 24, "Mumbai", False, 1),
            ("DevOps Architect", ["AWS", "Docker", "Kubernetes", "Terraform", "gcp", "azure"], "lead", 190000, 270000, 4, "Remote", True, 2),
            ("Frontend Engineer", ["React", "JavaScript", "Tailwind", "TypeScript"], "junior", 55000, 90000, 18, "Bangalore", False, 0),
            ("Java Spring Boot Developer", ["java", "springboot", "mysql", "REST API", "git"], "mid", 80000, 125000, 11, "Hyderabad", False, 3),
            ("Cybersecurity Analyst", ["security", "linux", "networking", "python"], "mid", 95000, 150000, 7, "Bangalore", False, 0),
            ("QA Automation Engineer", ["python", "selenium", "jest", "git"], "junior", 45000, 75000, 16, "Chennai", False, 3),
            ("Machine Learning Researcher", ["Machine Learning", "Deep Learning", "pytorch", "python", "nlp"], "senior", 150000, 230000, 42, "Mumbai", False, 1),
            ("Cloud Architect", ["azure", "AWS", "Docker", "Kubernetes", "terraform"], "senior", 180000, 260000, 5, "Bangalore", False, 0),
            ("Mobile Developer (iOS)", ["swift", "git", "REST API"], "mid", 80000, 130000, 19, "Hyderabad", False, 3),
            ("Product Manager", ["agile", "scrum", "jira"], "mid", 110000, 160000, 13, "Pune", False, 4),
            ("System Admin", ["linux", "bash", "networking", "security"], "junior", 40000, 65000, 8, "Chennai", False, 0),
            ("Node.js Developer", ["nodejs", "express", "PostgreSQL", "redis", "git"], "junior", 50000, 80000, 21, "Remote", True, 2),
            ("Angular Developer", ["angular", "typescript", "css", "git"], "mid", 70000, 110000, 10, "Mumbai", False, 1),
            ("Systems Engineer", ["c++", "linux", "git"], "junior", 60000, 95000, 12, "Bangalore", False, 0),
            ("Data Engineer", ["Python", "SQL", "spark", "airflow", "PostgreSQL"], "mid", 100000, 150000, 23, "Pune", False, 4),
            ("Android Developer", ["kotlin", "java", "git", "REST API"], "junior", 48000, 75000, 15, "Hyderabad", False, 3),
            ("Scrum Master", ["agile", "scrum", "jira"], "mid", 95000, 140000, 6, "Bangalore", False, 0),
            ("Technical Writer", ["git", "html", "css"], "junior", 35000, 55000, 8, "Remote", True, 2),
            ("Solidity Smart Contract Dev", ["ethereum", "solidity", "security", "javascript"], "mid", 120000, 190000, 31, "Remote", True, 2),
            ("Salesforce Consultant", ["salesforce", "sql"], "mid", 90000, 140000, 12, "Bangalore", False, 0),
            ("Network Engineer", ["networking", "security", "linux"], "junior", 45000, 70000, 9, "Hyderabad", False, 3),
            ("Next.js Developer", ["next.js", "React", "typescript", "tailwind"], "junior", 60000, 95000, 27, "Remote", True, 2),
            ("SRE Specialist", ["linux", "AWS", "kubernetes", "python", "prometheus"], "senior", 160000, 240000, 8, "Pune", False, 4),
            ("UI Developer", ["html", "css", "javascript", "tailwind"], "fresher", 30000, 45000, 45, "Mumbai", False, 1),
            ("Golang Developer", ["go", "docker", "PostgreSQL", "git"], "mid", 100000, 160000, 17, "Bangalore", False, 0),
            ("NLP Engineer", ["python", "nlp", "Machine Learning", "pytorch"], "mid", 110000, 170000, 14, "Mumbai", False, 1),
            ("PHP Laravel Dev", ["php", "laravel", "mysql", "javascript"], "junior", 40000, 65000, 11, "Pune", False, 4),
            ("Kubernetes Administrator", ["Kubernetes", "docker", "linux", "terraform"], "mid", 110000, 165000, 9, "Remote", True, 4),
            ("Business Analyst", ["excel", "sql", "tableau"], "junior", 50000, 80000, 26, "Bangalore", False, 0),
            ("Solutions Architect", ["AWS", "cloud", "docker", "terraform", "security"], "lead", 200000, 300000, 5, "Mumbai", False, 1),
            ("Django Backend Dev", ["python", "django", "postgresql", "docker"], "junior", 55000, 85000, 19, "Hyderabad", False, 3),
            ("React Native Developer", ["reactnative", "React", "javascript", "typescript"], "mid", 80000, 120000, 14, "Remote", True, 2),
            ("Vue.js Developer", ["vue", "javascript", "css", "git"], "junior", 45000, 70000, 8, "Chennai", False, 0),
            ("Database Engineer (NoSQL)", ["mongodb", "redis", "cassandra", "nosql"], "mid", 95000, 145000, 11, "Pune", False, 4),
            ("Machine Learning Ops (MLOps)", ["python", "docker", "kubernetes", "Machine Learning", "aws"], "senior", 140000, 210000, 13, "Bangalore", False, 0),
            ("API Gateway Specialist", ["REST API", "graphql", "docker", "linux"], "mid", 90000, 135000, 6, "Remote", True, 2),
            ("RPA Developer (UiPath)", ["c#", "sql"], "junior", 45000, 75000, 12, "Hyderabad", False, 3),
            ("Information Security Officer", ["security", "linux"], "senior", 130000, 190000, 4, "Bangalore", False, 0),
            ("Ruby on Rails Developer", ["ruby", "rails", "postgresql", "javascript"], "mid", 90000, 140000, 10, "Remote", True, 2),
            ("Data Scientist (Fresher)", ["python", "sql", "Machine Learning", "pandas"], "fresher", 40000, 60000, 64, "Delhi", False, 1)
        ]

        # Combine all templates
        full_list = []
        for temp in job_templates:
            comp = companies[temp["company_idx"]]
            full_list.append(Job(
                title=temp["title"],
                company_id=comp.id,
                description=temp["description"],
                requirements=json.dumps(temp["requirements"]),
                skills_required=json.dumps(temp["skills_required"]),
                job_type=temp["job_type"],
                experience_level=temp["experience_level"],
                min_salary=temp["min_salary"],
                max_salary=temp["max_salary"],
                location=temp["location"],
                is_remote=temp["is_remote"],
                posted_by=recruiter_id,
                applicant_count=temp["applicant_count"],
                competition_level="low" if temp["applicant_count"] < 20 else ("medium" if temp["applicant_count"] < 50 else "high"),
                tags=json.dumps(temp["skills_required"][:3]),
                benefits=json.dumps(temp["benefits"])
            ))

        for item in titles_and_skills:
            title, skills, exp_lvl, min_s, max_s, apps, loc, is_r, comp_idx = item
            comp = companies[comp_idx]
            
            # Simple text generator
            desc = f"We are looking for a skilled {title} to join {comp.name} in our {loc} office. You will work on designing, developing, and releasing key features to improve our production codebase."
            reqs = [
                f"Proven knowledge in {skills[0]} and {skills[1] if len(skills) > 1 else 'development tools'}",
                "Familiarity with standard Git workflows and version control",
                "Ability to participate in code reviews and write clean documentation",
                "Good communication and team participation skills"
            ]
            benefits = ["Flexible schedule", "Learning budget", "Annual bonus pool"]
            
            full_list.append(Job(
                title=title,
                company_id=comp.id,
                description=desc,
                requirements=json.dumps(reqs),
                skills_required=json.dumps(skills),
                job_type="remote" if is_r else "full_time",
                experience_level=exp_lvl,
                min_salary=min_s,
                max_salary=max_s,
                location=loc,
                is_remote=is_r,
                posted_by=recruiter_id,
                applicant_count=apps,
                competition_level="low" if apps < 20 else ("medium" if apps < 50 else "high"),
                tags=json.dumps(skills[:3]),
                benefits=json.dumps(benefits)
            ))

        for j in full_list:
            # Shift posted date back slightly to simulate realistic timeline
            # Subtract index * 3 hours
            db.add(j)
        db.commit()
        logger.info("50 Demo jobs seeded successfully.")

    # 4. Seed Notifications for user seeker
    seeker_user = db.query(User).filter(User.email == "jobseeker@swipex.com").first()
    if seeker_user:
        existing_notif = db.query(Notification).filter(Notification.user_id == seeker_user.id).first()
        if not existing_notif:
            job_match = db.query(Job).filter(Job.title.like("%Python%")).first()
            job_id = job_match.id if job_match else None
            
            notifications = [
                Notification(
                    user_id=seeker_user.id,
                    title="🔥 Outstanding Job Match Found!",
                    message="We found a new job 'Software Engineer (Python/FastAPI)' at InnovateLab AI that matches 95% of your skills. Swipe now!",
                    type="match",
                    job_id=job_id,
                    is_read=False
                ),
                Notification(
                    user_id=seeker_user.id,
                    title="💼 Application Update",
                    message="Your application for 'React Frontend Developer' at TechCorp Solutions has been viewed by the recruiter.",
                    type="application",
                    is_read=False
                ),
                Notification(
                    user_id=seeker_user.id,
                    title="⚡ Low Competition Alert",
                    message="The job 'DevOps Engineer' at CloudNine Systems currently has less than 10 applicants. Apply early to increase your chance!",
                    type="alert",
                    is_read=False
                ),
                Notification(
                    user_id=seeker_user.id,
                    title="🚀 Welcome to SwipeX!",
                    message="Start your career discovery journey today. Upload your resume in the 'Resume' section to calculate your ATS match score.",
                    type="system",
                    is_read=True
                )
            ]
            for n in notifications:
                db.add(n)
            db.commit()
            logger.info("Demo notifications seeded successfully.")
