"""
Seed SwipeX database with presentation-ready demo data.
Usage:  python manage.py seed_data
        python manage.py seed_data --clear
"""

from django.core.management.base import BaseCommand
from django.utils import timezone
from django.utils.text import slugify
from datetime import timedelta, date
import random

from apps.users.models import User, UserProfile
from apps.jobs.models import (
    Company, Skill, Job,
    JobApplication, SwipeHistory, SavedJob, Recommendation,
)

SKILLS_DATA = [
    "Python","Django","FastAPI","JavaScript","TypeScript","React","Vue.js",
    "Node.js","PostgreSQL","MySQL","MongoDB","Redis","Docker","Kubernetes",
    "AWS","Azure","GCP","Git","Linux","Machine Learning","Data Science",
    "TensorFlow","PyTorch","SQL","GraphQL","REST API","CI/CD","Java",
    "Spring Boot","Go","Flutter","React Native","Swift","Kotlin","Android",
    "iOS","Figma","UI/UX","Tailwind CSS","Next.js","DevOps","Terraform",
    "Ansible","ElasticSearch","Kafka","Rust","Cybersecurity","NumPy",
    "Pandas","Scikit-learn","Spring","Jenkins",
]

COMPANIES_DATA = [
    {
        "name": "TechNova Solutions",
        "company_type": "startup",
        "industry": "Software & Technology",
        "description": "Building next-generation developer tools and cloud-native applications. We ship fast, learn faster, and value craftspeople.",
        "headquarters": "Bangalore, Karnataka",
        "company_size": "51-200",
        "founded_year": 2019,
        "website": "https://technova.example.com",
    },
    {
        "name": "InfraCore Systems",
        "company_type": "mnc",
        "industry": "Infrastructure & Cloud",
        "description": "Global leader in cloud infrastructure solutions serving Fortune 500 companies across 40+ countries.",
        "headquarters": "Hyderabad, Telangana",
        "company_size": "1000+",
        "founded_year": 2008,
        "website": "https://infracore.example.com",
    },
    {
        "name": "DataPulse Analytics",
        "company_type": "startup",
        "industry": "Data & Analytics",
        "description": "Transforming raw data into actionable business intelligence using AI and machine learning.",
        "headquarters": "Pune, Maharashtra",
        "company_size": "11-50",
        "founded_year": 2021,
        "website": "https://datapulse.example.com",
    },
    {
        "name": "PixelCraft Studios",
        "company_type": "new_startup",
        "industry": "Design & Creative Tech",
        "description": "A passionate founding team building intuitive design tools for the next generation of creators.",
        "headquarters": "Mumbai, Maharashtra",
        "company_size": "1-10",
        "founded_year": 2023,
        "website": "https://pixelcraft.example.com",
    },
    {
        "name": "SwiftScale Fintech",
        "company_type": "startup",
        "industry": "Financial Technology",
        "description": "Reimagining personal finance and payments for emerging markets through mobile-first solutions.",
        "headquarters": "Chennai, Tamil Nadu",
        "company_size": "51-200",
        "founded_year": 2020,
        "website": "https://swiftscale.example.com",
    },
    {
        "name": "GlobalTech MNC",
        "company_type": "mnc",
        "industry": "Enterprise Software",
        "description": "One of the world's largest enterprise software companies with operations in 60 countries.",
        "headquarters": "Bangalore, Karnataka",
        "company_size": "1000+",
        "founded_year": 2001,
        "website": "https://globaltech.example.com",
    },
]

JOBS_DATA = [
    # TechNova (idx 0)
    {"title":"Senior Backend Engineer","description":"Design and build scalable APIs, mentor junior engineers, and own key technical architecture decisions.\n\nWork closely with product and DevOps teams to ship high-quality software at scale.","requirements":"5+ years backend development\nExpert Python and Django\nPostgreSQL and Redis\nDistributed systems knowledge","benefits":"Competitive salary + ESOPs\nFlexible working hours\nFamily health insurance\nAnnual learning budget ₹50,000","skills":["Python","Django","PostgreSQL","Redis","Docker"],"salary_min":1800000,"salary_max":2800000,"job_type":"full_time","work_mode":"remote","experience_level":"senior","location":"Bangalore / Remote","openings":2,"is_fresher_friendly":False,"company_idx":0},
    {"title":"React Frontend Developer","description":"Build beautiful, performant web interfaces. Own frontend architecture and collaborate with designers and backend engineers.","requirements":"3+ years React experience\nTypeScript proficiency\nState management (Redux/Zustand)\nStrong CSS skills","benefits":"Remote-first with quarterly meetups\nHome office budget ₹30,000\nFlexible hours","skills":["React","TypeScript","JavaScript","Tailwind CSS","Git"],"salary_min":1200000,"salary_max":2000000,"job_type":"full_time","work_mode":"hybrid","experience_level":"mid","location":"Bangalore","openings":3,"is_fresher_friendly":False,"company_idx":0},
    {"title":"Junior Python Developer","description":"Great opportunity for freshers to grow Python skills in a mentorship-driven environment. Work on real backend features and learn from senior engineers.","requirements":"Python basics\nREST API concepts\nWillingness to learn\nGit knowledge","benefits":"Mentorship programme\nLearning budget\nFlexible hours\nHealth insurance","skills":["Python","Django","SQL","Git","REST API"],"salary_min":500000,"salary_max":900000,"job_type":"full_time","work_mode":"hybrid","experience_level":"fresher","location":"Bangalore","openings":5,"is_fresher_friendly":True,"company_idx":0},
    {"title":"Frontend Intern — React","description":"6-month paid internship. Work on real production features and get mentored by senior engineers. Top performers receive pre-placement offers.","requirements":"React basics\nHTML/CSS proficiency\nJavaScript fundamentals\nGit basics","benefits":"₹20,000/month\nMentorship\nLaptop provided","skills":["React","JavaScript","Tailwind CSS","Git"],"salary_min":240000,"salary_max":300000,"job_type":"internship","work_mode":"remote","experience_level":"fresher","location":"Remote","openings":3,"is_fresher_friendly":True,"company_idx":0},
    {"title":"Technical Product Manager","description":"Lead the product roadmap for our developer platform. Define, build, and ship features that delight developers globally.","requirements":"3+ years product management\nEngineering background preferred\nData-driven mindset","benefits":"Leadership opportunity\nStrategic impact\nStock options","skills":["REST API","SQL","Git","JavaScript"],"salary_min":2000000,"salary_max":3200000,"job_type":"full_time","work_mode":"hybrid","experience_level":"senior","location":"Bangalore","openings":1,"is_fresher_friendly":False,"company_idx":0},
    {"title":"Full Stack Engineer — Django + React","description":"Build end-to-end features across our platform stack. Work on backend APIs, frontend interfaces, and everything in between.","requirements":"Django and React experience\nTypeScript knowledge\nPostgreSQL proficiency\n2+ years experience","benefits":"Remote-first\nGreat package\nModern tech stack","skills":["Django","React","Python","TypeScript","PostgreSQL"],"salary_min":1000000,"salary_max":1700000,"job_type":"full_time","work_mode":"remote","experience_level":"junior","location":"Remote","openings":2,"is_fresher_friendly":False,"company_idx":0},
    # InfraCore (idx 1)
    {"title":"Cloud Infrastructure Engineer","description":"Own our cloud infrastructure across AWS and GCP. Design secure, cost-optimised infrastructure supporting global operations.","requirements":"Strong AWS/GCP experience\nTerraform and IaC expertise\nKubernetes and Docker\n5+ years experience","benefits":"Industry-leading compensation\nRelocation assistance\nMedical coverage","skills":["AWS","Kubernetes","Docker","Terraform","Linux"],"salary_min":2000000,"salary_max":3500000,"job_type":"full_time","work_mode":"onsite","experience_level":"senior","location":"Hyderabad","openings":1,"is_fresher_friendly":False,"company_idx":1},
    {"title":"DevOps Engineer","description":"Build and scale CI/CD pipelines and deployment infrastructure. Work on automation, monitoring, and high availability.","requirements":"3-5 years DevOps experience\nCI/CD pipelines\nContainer orchestration\nPrometheus/Grafana","benefits":"Performance bonuses\nLearning budget\nHybrid work model","skills":["Docker","Kubernetes","CI/CD","Linux","AWS","Git"],"salary_min":1400000,"salary_max":2200000,"job_type":"full_time","work_mode":"hybrid","experience_level":"mid","location":"Hyderabad","openings":2,"is_fresher_friendly":False,"company_idx":1},
    {"title":"Site Reliability Engineer","description":"Keep our services running at 99.99% uptime. Work on observability, incident response, and automation for resilient systems.","requirements":"SRE background\nOn-call experience\nPython or Go\nMonitoring tools\n4+ years","benefits":"On-call compensation\nIndustry-competitive CTC","skills":["Linux","Python","Kubernetes","AWS","Go"],"salary_min":1800000,"salary_max":2800000,"job_type":"full_time","work_mode":"remote","experience_level":"senior","location":"Remote","openings":2,"is_fresher_friendly":False,"company_idx":1},
    {"title":"Database Administrator","description":"Manage and optimise PostgreSQL and MySQL clusters. Ensure high availability, performance tuning, and backup strategies.","requirements":"PostgreSQL and MySQL expertise\nPerformance tuning\n4+ years experience","benefits":"Stability and growth\nAnnual bonus\nCertifications funded","skills":["PostgreSQL","MySQL","SQL","Linux","Docker"],"salary_min":1200000,"salary_max":1800000,"job_type":"full_time","work_mode":"onsite","experience_level":"senior","location":"Hyderabad","openings":1,"is_fresher_friendly":False,"company_idx":1},
    {"title":"Cybersecurity Analyst","description":"Protect infrastructure and customer data. Perform security audits, penetration testing, and implement security best practices.","requirements":"Security certifications (CEH/CISSP)\nPenetration testing\nSIEM tools\n3+ years","benefits":"Certification support\nConference attendance","skills":["Linux","Python","AWS","Git","Cybersecurity"],"salary_min":1500000,"salary_max":2500000,"job_type":"full_time","work_mode":"hybrid","experience_level":"mid","location":"Hyderabad","openings":1,"is_fresher_friendly":False,"company_idx":1},
    # DataPulse (idx 2)
    {"title":"Data Scientist","description":"Apply ML and statistical modelling to solve real business problems. Build predictive models that drive product decisions and work with large-scale datasets.","requirements":"Strong Python for data science\nML frameworks\nSQL proficiency\nStatistical modelling","benefits":"Cutting-edge ML infra\nConference budget\nPublications encouraged","skills":["Python","Machine Learning","TensorFlow","SQL","Data Science"],"salary_min":1600000,"salary_max":2600000,"job_type":"full_time","work_mode":"remote","experience_level":"mid","location":"Pune / Remote","openings":2,"is_fresher_friendly":False,"company_idx":2},
    {"title":"ML Engineer","description":"Build and deploy ML pipelines at scale. Bridge data science and engineering — ensure models are production-ready and continuously improved.","requirements":"ML pipeline experience\nPython expertise\nMLOps tools\n2-4 years experience","benefits":"Equity participation\nFlexible schedule\nConference passes","skills":["Python","Machine Learning","PyTorch","Docker","AWS"],"salary_min":1400000,"salary_max":2400000,"job_type":"full_time","work_mode":"remote","experience_level":"junior","location":"Remote","openings":2,"is_fresher_friendly":False,"company_idx":2},
    {"title":"Data Analyst Intern","description":"6-month internship for final-year students passionate about data. Work on real datasets and create dashboards alongside our data team.","requirements":"Python or R basics\nSQL knowledge\nEagerness to learn","benefits":"₹25,000/month\nLaptop provided\nPPO for top performers","skills":["Python","SQL","Data Science","NumPy","Pandas"],"salary_min":300000,"salary_max":360000,"job_type":"internship","work_mode":"hybrid","experience_level":"fresher","location":"Pune","openings":4,"is_fresher_friendly":True,"company_idx":2},
    {"title":"Data Engineer","description":"Design and maintain data pipelines processing terabytes of event data daily. Build robust ETL workflows and optimise query performance.","requirements":"Python and SQL\nApache Spark or Kafka\nData warehouse knowledge\n3+ years","benefits":"Remote-first\nCompetitive CTC\nHealth benefits","skills":["Python","SQL","Kafka","AWS","PostgreSQL"],"salary_min":1400000,"salary_max":2200000,"job_type":"full_time","work_mode":"remote","experience_level":"mid","location":"Pune / Remote","openings":2,"is_fresher_friendly":False,"company_idx":2},
    # PixelCraft (idx 3)
    {"title":"UI/UX Designer","description":"Design delightful experiences for our creative tools platform. Own the entire design process from user research to pixel-perfect specs.","requirements":"Strong Figma skills\nProduct design portfolio\nUser research experience\n2+ years","benefits":"Creative freedom\nLatest design tools\nFlexible hours","skills":["Figma","UI/UX","JavaScript","React"],"salary_min":900000,"salary_max":1500000,"job_type":"full_time","work_mode":"hybrid","experience_level":"junior","location":"Mumbai","openings":1,"is_fresher_friendly":True,"company_idx":3},
    {"title":"Full Stack Developer","description":"Be a founding engineer at PixelCraft. Build features end-to-end, from backend APIs to polished frontend interfaces. Shape the product from day one.","requirements":"React + Node.js experience\nFull stack mindset\nSelf-motivated\n1-3 years","benefits":"Founding team equity\nFlat hierarchy\nMeaningful work","skills":["React","Node.js","JavaScript","MongoDB","Git"],"salary_min":800000,"salary_max":1400000,"job_type":"full_time","work_mode":"onsite","experience_level":"junior","location":"Mumbai","openings":2,"is_fresher_friendly":True,"company_idx":3},
    {"title":"iOS Developer","description":"Build and maintain our iOS application for the Indian creative market. Work on new features and App Store publishing workflows.","requirements":"Swift expertise\nXcode proficiency\nUIKit and SwiftUI\n2+ years","benefits":"MacBook Pro provided\nFlexible remote\nCompetitive salary","skills":["Swift","iOS","Git","REST API"],"salary_min":1000000,"salary_max":1800000,"job_type":"full_time","work_mode":"hybrid","experience_level":"junior","location":"Mumbai","openings":1,"is_fresher_friendly":True,"company_idx":3},
    # SwiftScale (idx 4)
    {"title":"Backend Engineer — Payments","description":"Build payment infrastructure processing millions of transactions daily. Work on core APIs, fraud detection, and regulatory compliance.","requirements":"Payment systems preferred\nStrong Python or Java\nDatabase design\nSecurity mindset\n3+ years","benefits":"Fintech equity\nPerformance bonuses\nHealth + wellness","skills":["Python","PostgreSQL","Redis","REST API","Docker"],"salary_min":1500000,"salary_max":2500000,"job_type":"full_time","work_mode":"hybrid","experience_level":"mid","location":"Chennai","openings":3,"is_fresher_friendly":False,"company_idx":4},
    {"title":"Mobile Developer — React Native","description":"Build our cross-platform mobile app used by 2M+ customers. Own key features and improve performance.","requirements":"React Native proficiency\nJavaScript/TypeScript\niOS and Android deployment","benefits":"Competitive CTC\nRemote-friendly\nHealth insurance","skills":["React Native","JavaScript","TypeScript","Android","iOS"],"salary_min":1200000,"salary_max":2000000,"job_type":"full_time","work_mode":"remote","experience_level":"mid","location":"Chennai / Remote","openings":2,"is_fresher_friendly":False,"company_idx":4},
    {"title":"Android Developer","description":"Build our flagship Android application. Own feature development and performance improvements.","requirements":"Kotlin expertise\nAndroid SDK\nJetpack Compose\nMVVM architecture\n2+ years","benefits":"Latest Android devices\nConference budget\nHealth insurance","skills":["Kotlin","Android","Java","Git","REST API"],"salary_min":1000000,"salary_max":1800000,"job_type":"full_time","work_mode":"hybrid","experience_level":"junior","location":"Chennai","openings":2,"is_fresher_friendly":True,"company_idx":4},
    {"title":"GraphQL API Developer","description":"Design and implement our GraphQL API layer powering web and mobile clients. Define schema, resolvers, and optimise complex query performance.","requirements":"GraphQL proficiency\nNode.js or Python\nDatabase design","benefits":"Remote-first\nEquipment allowance\nHealth insurance","skills":["GraphQL","Node.js","JavaScript","PostgreSQL","Docker"],"salary_min":1400000,"salary_max":2200000,"job_type":"full_time","work_mode":"remote","experience_level":"mid","location":"Remote","openings":1,"is_fresher_friendly":False,"company_idx":4},
    # GlobalTech MNC (idx 5)
    {"title":"Software Development Engineer II","description":"Work on large-scale distributed systems, contribute to open-source, and collaborate with top engineers globally.","requirements":"4+ years software development\nJava or Python expertise\nDistributed systems knowledge","benefits":"World-class benefits\nRelocation support\nGlobal mobility","skills":["Java","Python","AWS","Docker","SQL"],"salary_min":2200000,"salary_max":3800000,"job_type":"full_time","work_mode":"hybrid","experience_level":"mid","location":"Bangalore","openings":5,"is_fresher_friendly":False,"company_idx":5},
    {"title":"Cloud Solutions Architect","description":"Design enterprise cloud architectures for Fortune 500 clients. Lead technical presales and guide customers through cloud transformation.","requirements":"Cloud certifications (AWS/Azure/GCP)\n7+ years IT experience\nEnterprise customer experience","benefits":"Premium compensation\nGlobal travel\nPrestigious clients","skills":["AWS","Azure","GCP","Terraform","Kubernetes"],"salary_min":3000000,"salary_max":5000000,"job_type":"full_time","work_mode":"hybrid","experience_level":"lead","location":"Bangalore / Mumbai","openings":2,"is_fresher_friendly":False,"company_idx":5},
    {"title":"Associate Software Engineer","description":"Start your career at a global MNC with a structured 6-month onboarding programme, dedicated mentors, and rotations across product teams.","requirements":"CS degree or equivalent\nAny programming language\nProblem-solving aptitude\nTeam player","benefits":"Structured career path\nGlobal opportunities\nFull relocation support","skills":["Python","Java","SQL","Git"],"salary_min":700000,"salary_max":1000000,"job_type":"full_time","work_mode":"onsite","experience_level":"fresher","location":"Bangalore","openings":20,"is_fresher_friendly":True,"company_idx":5},
    {"title":"DevOps Lead","description":"Lead a team of 5 DevOps engineers. Drive automation, cost optimisation, and infrastructure best practices at global scale.","requirements":"8+ years DevOps/SRE experience\nTeam leadership\nEnterprise cloud","benefits":"Leadership role\nExcellent package\nGlobal exposure","skills":["Kubernetes","AWS","Terraform","CI/CD","Linux","Docker"],"salary_min":3500000,"salary_max":5500000,"job_type":"full_time","work_mode":"hybrid","experience_level":"lead","location":"Hyderabad","openings":1,"is_fresher_friendly":False,"company_idx":5},
    {"title":"Data Science Intern","description":"6-month internship at a global enterprise software company. Work on ML projects with real business impact alongside experienced data scientists.","requirements":"Python proficiency\nML basics\nSQL knowledge\nFinal year or recent graduate","benefits":"₹30,000/month\nMentorship programme\nFull-time offer potential","skills":["Python","Machine Learning","SQL","Pandas","Scikit-learn"],"salary_min":360000,"salary_max":420000,"job_type":"internship","work_mode":"hybrid","experience_level":"fresher","location":"Bangalore","openings":6,"is_fresher_friendly":True,"company_idx":5},
    {"title":"Next.js Full Stack Engineer","description":"Build modern full-stack web applications using Next.js and TypeScript. Work on high-traffic consumer products used by millions daily.","requirements":"Next.js and React proficiency\nTypeScript\nNode.js backend skills\nDatabase experience\n2-4 years","benefits":"Remote-first\nGreat package\nModern tech stack","skills":["Next.js","React","TypeScript","Node.js","PostgreSQL"],"salary_min":1600000,"salary_max":2600000,"job_type":"full_time","work_mode":"remote","experience_level":"mid","location":"Remote","openings":3,"is_fresher_friendly":False,"company_idx":5},
    {"title":"Spring Boot Backend Developer","description":"Build and maintain Java microservices using Spring Boot. Work on our enterprise API platform serving 10M+ requests daily.","requirements":"Java and Spring Boot expertise\nMicroservices experience\nREST API design\nPostgreSQL or MySQL\n3+ years","benefits":"Competitive CTC\nCertification support\nHybrid work","skills":["Java","Spring Boot","PostgreSQL","Docker","REST API"],"salary_min":1300000,"salary_max":2100000,"job_type":"full_time","work_mode":"hybrid","experience_level":"mid","location":"Bangalore","openings":4,"is_fresher_friendly":False,"company_idx":5},
    {"title":"Jenkins CI/CD Engineer","description":"Design, build, and maintain CI/CD pipelines using Jenkins and GitHub Actions. Automate testing, building, and deployment workflows.","requirements":"Jenkins expertise\nGitHub Actions experience\nScripting (Bash/Python)\nDocker and Kubernetes\n2+ years","benefits":"Stable role\nGrowth opportunities\nHealth benefits","skills":["Jenkins","CI/CD","Docker","Python","Linux","Git"],"salary_min":1100000,"salary_max":1800000,"job_type":"full_time","work_mode":"hybrid","experience_level":"junior","location":"Hyderabad","openings":2,"is_fresher_friendly":False,"company_idx":5},
]


class Command(BaseCommand):
    help = 'Seed the database with presentation-ready SwipeX demo data'

    def add_arguments(self, parser):
        parser.add_argument('--clear', action='store_true', help='Clear existing data before seeding')

    def handle(self, *args, **options):
        if options['clear']:
            self.stdout.write('  Clearing existing seed data...')
            Recommendation.objects.all().delete()
            SwipeHistory.objects.all().delete()
            SavedJob.objects.all().delete()
            JobApplication.objects.all().delete()
            Job.objects.all().delete()
            Company.objects.all().delete()
            Skill.objects.all().delete()
            User.objects.filter(email__endswith='@swipex.demo').delete()
            self.stdout.write('  ✓ Cleared\n')

        self.stdout.write(self.style.SUCCESS('\nSeeding SwipeX demo data...\n'))

        # ── Skills ────────────────────────────────────────────────────────────
        self.stdout.write('  Creating skills...')
        skills = {}
        for name in SKILLS_DATA:
            skill, _ = Skill.objects.get_or_create(slug=slugify(name), defaults={'name': name})
            skills[name] = skill
        self.stdout.write(f'  ✓ {len(skills)} skills\n')

        # ── Recruiters ────────────────────────────────────────────────────────
        self.stdout.write('  Creating recruiters...')
        recruiters = []
        recruiter_specs = [
            ('recruiter1@swipex.demo', 'Arjun',  'Sharma'),
            ('recruiter2@swipex.demo', 'Priya',  'Nair'),
            ('recruiter3@swipex.demo', 'Kiran',  'Reddy'),
        ]
        for email, first, last in recruiter_specs:
            user, created = User.objects.get_or_create(email=email, defaults={
                'first_name': first, 'last_name': last,
                'role': User.Role.RECRUITER,
                'is_email_verified': True, 'is_active': True, 'is_profile_complete': True,
            })
            if created:
                user.set_password('Demo@1234')
                user.save()
            recruiters.append(user)
        self.stdout.write(f'  ✓ {len(recruiters)} recruiters\n')

        # ── Companies ─────────────────────────────────────────────────────────
        self.stdout.write('  Creating companies...')
        companies = []
        company_recruiter_map = [0, 1, 2, 2, 2, 1]
        for i, data in enumerate(COMPANIES_DATA):
            recruiter = recruiters[company_recruiter_map[i]]
            company, _ = Company.objects.get_or_create(
                name=data['name'],
                defaults={**data, 'recruiter': recruiter, 'is_verified': True}
            )
            companies.append(company)
        self.stdout.write(f'  ✓ {len(companies)} companies\n')

        # ── Jobs ──────────────────────────────────────────────────────────────
        self.stdout.write(f'  Creating {len(JOBS_DATA)} jobs (all published)...')
        jobs = []
        now = timezone.now()
        for i, jdata in enumerate(JOBS_DATA):
            company   = companies[jdata['company_idx']]
            recruiter = company.recruiter
            skill_names = jdata.pop('skills')
            co_idx      = jdata.pop('company_idx')
            days_ago = i % 12   # spread over last 12 days for freshness variety
            job, created = Job.objects.get_or_create(
                title=jdata['title'], company=company,
                defaults={
                    **jdata, 'recruiter': recruiter,
                    'status': Job.Status.PUBLISHED,
                    'published_at': now - timedelta(days=days_ago),
                    'deadline': date.today() + timedelta(days=30 + i),
                }
            )
            if created:
                for sname in skill_names:
                    if sname in skills:
                        job.skills_required.add(skills[sname])
            jdata['skills'] = skill_names
            jdata['company_idx'] = co_idx
            jobs.append(job)
        self.stdout.write(f'  ✓ {Job.objects.filter(status="published").count()} jobs published\n')

        # ── Job Seekers — all Pratyusha name variants ─────────────────────────
        self.stdout.write('  Creating job seeker accounts (Pratyusha variants)...')
        seeker_specs = [
            # (email, first, last, yoe, location, pref_locs, open_remote, skills, headline)
            (
                'pratyusha@swipex.demo',
                'Pratyusha', 'Satpathy',
                2, 'Bangalore', ['Bangalore', 'Remote'], True,
                ['Python','Django','React','PostgreSQL','Docker','REST API','Git'],
                'Full Stack Developer — Python & React',
            ),
            (
                'pratyusha.ml@swipex.demo',
                'Pratyusha S.', 'Data',
                1, 'Pune', ['Pune', 'Remote'], True,
                ['Python','Machine Learning','TensorFlow','SQL','Data Science','NumPy','Pandas'],
                'ML Engineer & Data Science Enthusiast',
            ),
            (
                'pratyusha.frontend@swipex.demo',
                'Pratyusha S.', 'Frontend',
                3, 'Mumbai', ['Mumbai', 'Bangalore', 'Remote'], True,
                ['React','TypeScript','JavaScript','Next.js','Tailwind CSS','Git','Figma'],
                'Senior Frontend Developer — React & TypeScript',
            ),
            (
                'pratyusha.devops@swipex.demo',
                'Pratyusha S.', 'DevOps',
                4, 'Hyderabad', ['Hyderabad', 'Remote'], False,
                ['Docker','Kubernetes','AWS','CI/CD','Linux','Terraform','Git'],
                'DevOps Engineer — Cloud & Kubernetes',
            ),
            (
                'pratyusha.fresher@swipex.demo',
                'Pratyusha S.', 'Fresher',
                0, 'Bangalore', ['Bangalore', 'Hyderabad', 'Remote'], True,
                ['Python','SQL','Git','REST API','Java'],
                'Computer Science Graduate — Seeking First Role',
            ),
        ]

        seekers = []
        for (email, first, last, yoe, location, pref_locs, open_remote, s_skills, headline) in seeker_specs:
            user, created = User.objects.get_or_create(email=email, defaults={
                'first_name': first, 'last_name': last,
                'role': User.Role.JOB_SEEKER,
                'is_email_verified': True, 'is_active': True, 'is_profile_complete': True,
            })
            if created:
                user.set_password('Demo@1234')
                user.save()
                UserProfile.objects.get_or_create(user=user, defaults={
                    'headline': headline,
                    'location': location,
                    'years_of_experience': yoe,
                    'open_to_remote': open_remote,
                    'preferred_locations': pref_locs,
                    'bio': f'{headline}. Passionate about clean code and great user experiences.',
                })
            seekers.append((user, s_skills))
        self.stdout.write(f'  ✓ {len(seekers)} job seekers\n')

        # ── Controlled interactions (presentation-ready counts) ───────────────
        # Per seeker:  4 right-swipes (2-3 saved, 2 applied), 4 left-swipes
        # Leaves 22+ jobs available in Discover feed
        self.stdout.write('  Creating presentation-ready demo interactions...')
        for seeker, s_skills in seekers:
            def relevance(job):
                jnames = set(job.skills_required.values_list('name', flat=True))
                return len(set(s_skills) & jnames)

            sorted_jobs = sorted(jobs, key=relevance, reverse=True)
            right_jobs  = sorted_jobs[:4]   # most relevant → right swipe
            left_jobs   = sorted_jobs[-4:]  # least relevant → left swipe

            # Left swipes (skip)
            for job in left_jobs:
                if job not in right_jobs:
                    SwipeHistory.objects.get_or_create(
                        job_seeker=seeker, job=job,
                        defaults={'direction': 'left'}
                    )

            # Right swipes (save + apply first 2)
            for idx, job in enumerate(right_jobs):
                SwipeHistory.objects.get_or_create(
                    job_seeker=seeker, job=job,
                    defaults={'direction': 'right'}
                )
                # Save all 4 right-swiped jobs (keep 2-4 in saved)
                if idx < 3:
                    SavedJob.objects.get_or_create(job_seeker=seeker, job=job)

                # Apply to first 2 only (keep 2 applications per seeker)
                if idx < 2:
                    app, app_created = JobApplication.objects.get_or_create(
                        job_seeker=seeker, job=job,
                        defaults={'status': random.choice(['pending', 'reviewed', 'shortlisted'])}
                    )
                    if app_created:
                        cnt = JobApplication.objects.filter(job=job).count()
                        job.applicant_count = cnt
                        job.update_competition()
                        job.save(update_fields=['applicant_count', 'competition_level'])

        self.stdout.write('  ✓ Interactions created\n')

        # ── Generate recommendations for ALL seekers ───────────────────────────
        self.stdout.write('  Generating recommendations...')
        from apps.jobs.services import generate_recommendations_for_user
        for seeker, _ in seekers:
            generate_recommendations_for_user(seeker)
        self.stdout.write('  ✓ Recommendations generated\n')

        # ── Summary ───────────────────────────────────────────────────────────
        total_jobs   = Job.objects.filter(status='published').count()
        primary      = User.objects.get(email='pratyusha@swipex.demo')
        swiped_count = SwipeHistory.objects.filter(job_seeker=primary).count()
        feed_count   = total_jobs - swiped_count

        self.stdout.write(self.style.SUCCESS('✅ Seed data complete!\n'))
        self.stdout.write('─────────────────────────────────────────')
        self.stdout.write('DEMO ACCOUNTS  (password: Demo@1234)')
        self.stdout.write('─────────────────────────────────────────')
        self.stdout.write('Recruiters:')
        for email, first, last in recruiter_specs:
            self.stdout.write(f'  {email}')
        self.stdout.write('\nJob Seekers (all Pratyusha variants):')
        for (email, first, last, yoe, location, *_) in seeker_specs:
            self.stdout.write(f'  {email}  ({yoe} yr, {location})')
        self.stdout.write('\nAdmin:')
        self.stdout.write('  admin@swipex.demo  (password: Admin@1234)')
        self.stdout.write('─────────────────────────────────────────')
        self.stdout.write(f'Companies:       {Company.objects.count()}')
        self.stdout.write(f'Published Jobs:  {total_jobs}')
        self.stdout.write(f'Skills:          {Skill.objects.count()}')
        self.stdout.write(f'Swipes:          {SwipeHistory.objects.count()}')
        self.stdout.write(f'Saved Jobs:      {SavedJob.objects.count()}')
        self.stdout.write(f'Applications:    {JobApplication.objects.count()}')
        self.stdout.write(f'Recommendations: {Recommendation.objects.count()}')
        self.stdout.write('─────────────────────────────────────────')
        self.stdout.write(f'pratyusha@swipex.demo Discover Feed: {feed_count} jobs available')
        self.stdout.write(f'pratyusha@swipex.demo Saved Jobs:    {SavedJob.objects.filter(job_seeker=primary).count()}')
        self.stdout.write(f'pratyusha@swipex.demo Applications:  {JobApplication.objects.filter(job_seeker=primary).count()}')
        self.stdout.write('─────────────────────────────────────────\n')
