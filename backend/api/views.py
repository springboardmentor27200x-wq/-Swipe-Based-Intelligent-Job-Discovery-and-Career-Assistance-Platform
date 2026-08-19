from rest_framework import status, generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate, get_user_model
from django.db.models import Q
from django.utils import timezone
import random
import re
import uuid

from .models import Profile, Job, Match, Notification
from .serializers import (
    UserSerializer, UserRegisterSerializer, ProfileSerializer, 
    JobSerializer, MatchSerializer, NotificationSerializer
)

User = get_user_model()

class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = UserRegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            refresh = RefreshToken.for_user(user)
            
            return Response({
                'accessToken': str(refresh.access_token),
                'refreshToken': str(refresh),
                'user': UserSerializer(user).data
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        password = request.data.get('password', '')
        
        if not email or not password:
            return Response({'message': 'Email and password are required'}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'message': 'Invalid email or password'}, status=status.HTTP_401_UNAUTHORIZED)
            
        if not user.check_password(password):
            return Response({'message': 'Invalid email or password'}, status=status.HTTP_401_UNAUTHORIZED)
            
        if not user.is_active:
            return Response({'message': 'Account is disabled'}, status=status.HTTP_403_FORBIDDEN)
            
        refresh = RefreshToken.for_user(user)
        return Response({
            'accessToken': str(refresh.access_token),
            'refreshToken': str(refresh),
            'user': UserSerializer(user).data
        }, status=status.HTTP_200_OK)


class LogoutView(APIView):
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        return Response({
            'success': True,
            'message': 'Logged out successfully'
        }, status=status.HTTP_200_OK)


class OAuthPlaceholderView(APIView):
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        provider = request.data.get('provider', 'google')
        role = request.data.get('role', 'job_seeker')
        
        email = f"demo.{provider.lower()}@swipex.io"
        user, created = User.objects.get_or_create(
            email=email,
            defaults={'role': role}
        )
        if created:
            user.set_password(f"oauth-pass-{uuid.uuid4().hex[:8]}")
            user.save()
            
        refresh = RefreshToken.for_user(user)
        return Response({
            'accessToken': str(refresh.access_token),
            'refreshToken': str(refresh),
            'user': UserSerializer(user).data
        }, status=status.HTTP_200_OK)


def detect_domain_from_text(text, skills=None):
    clean = (text or '').lower()
    combined_skills = [s.lower() for s in (skills or [])]
    combined_str = clean + " " + " ".join(combined_skills)

    ai_keywords = ["ai", "machine learning", "deep learning", "pytorch", "tensorflow", "nlp", "llm", "langchain", "transformers", "fastapi", "computer vision", "vector db", "scikit-learn", "genai", "prompt engineering"]
    frontend_keywords = ["react", "vue", "angular", "next.js", "tailwind", "typescript", "javascript", "html", "css", "redux", "zustand", "ui/ux", "frontend", "web performance"]
    backend_keywords = ["django", "node.js", "express", "spring", "flask", "postgresql", "sql", "redis", "mongodb", "system design", "microservices", "rest api", "graphql", "backend"]
    devops_keywords = ["docker", "kubernetes", "k8s", "aws", "gcp", "azure", "terraform", "ci/cd", "devops", "prometheus", "grafana", "linux", "cloud"]

    ai_score = sum(1 for kw in ai_keywords if kw in combined_str)
    fe_score = sum(1 for kw in frontend_keywords if kw in combined_str)
    be_score = sum(1 for kw in backend_keywords if kw in combined_str)
    do_score = sum(1 for kw in devops_keywords if kw in combined_str)

    scores = [
        ("ai_ml", "AI & Machine Learning", ai_score),
        ("frontend", "Frontend Engineering", fe_score),
        ("backend", "Backend Architecture", be_score),
        ("devops", "DevOps & Cloud Infrastructure", do_score),
    ]
    scores.sort(key=lambda x: x[2], reverse=True)

    if scores[0][2] > 0:
        return scores[0][0], scores[0][1]
    return "ai_ml", "AI & Machine Learning"


def calculate_ai_recommendation(job_data, profile):
    seeker_skills = set(s.lower() for s in (profile.skills or []))
    seeker_text = f"{profile.title or ''} {profile.bio or ''} {profile.resume_text or ''} {profile.resume_name or ''}".lower()
    
    required = [s.lower() for s in (job_data.get('requiredSkills') or job_data.get('required_skills') or [])]
    
    if not required:
        return 78, "Matches your engineering profile and general career interest."
        
    matched_names = []
    for req in required:
        if req in seeker_skills or req in seeker_text or any(s in req for s in seeker_skills):
            matched_names.append(req.capitalize())
            
    ratio = len(matched_names) / len(required) if required else 0.5
    score = int(45 + (ratio * 45))
    
    job_title = (job_data.get('title') or '').lower()
    title_words = [w for w in job_title.split() if len(w) > 3]
    if any(tw in seeker_text for tw in title_words):
        score += 8
        
    score = min(98, max(50, score))
    
    if matched_names:
        reason = f"Matches {len(matched_names)} core skills ({', '.join(matched_names[:3])}) from your profile & resume."
    else:
        reason = f"Recommended based on your interest in {job_data.get('title')} roles."
        
    return score, reason


def parse_resume_ats(text, user_profile_skills=None):
    if user_profile_skills is None:
        user_profile_skills = []
    
    clean_text = (text or '').replace('\x00', '').replace('\u0000', '')
    text_lower = clean_text.lower()
    
    display_map = {
        # Programming Languages (strictly specific terms)
        "python": "Python", "javascript": "JavaScript", "typescript": "TypeScript",
        "c++": "C++", "cpp": "C++", "c#": "C#", "csharp": "C#", "c-sharp": "C#",
        "golang": "Go", "go language": "Go", "go programming": "Go",
        "rust": "Rust", "ruby": "Ruby", "php": "PHP", "swift": "Swift", "kotlin": "Kotlin",
        "r language": "R", "r programming": "R", "scala": "Scala", "dart": "Dart",
        "sql": "SQL", "bash": "Bash", "shell script": "Shell", "powershell": "PowerShell",

        # Frontend & UI
        "react": "React", "reactjs": "React", "react.js": "React", "next.js": "Next.js", "nextjs": "Next.js",
        "vue": "Vue.js", "vuejs": "Vue.js", "vue.js": "Vue.js", "angular": "Angular", "angularjs": "Angular",
        "svelte": "Svelte", "redux": "Redux", "zustand": "Zustand", "tailwind": "Tailwind CSS",
        "tailwind css": "Tailwind CSS", "tailwindcss": "Tailwind CSS", "bootstrap": "Bootstrap",
        "html5": "HTML5", "css3": "CSS3", "sass": "Sass", "scss": "Sass",
        "vite": "Vite", "webpack": "Webpack", "figma": "Figma", "ui/ux": "UI/UX Architecture",

        # Backend & Frameworks
        "node.js": "Node.js", "nodejs": "Node.js", "express.js": "Express.js", "expressjs": "Express.js",
        "django": "Django", "flask": "Flask", "fastapi": "FastAPI", "fast api": "FastAPI",
        "spring boot": "Spring Boot", "springboot": "Spring Boot", "laravel": "Laravel",
        "ruby on rails": "Ruby on Rails", "rails": "Ruby on Rails", "asp.net": "ASP.NET", ".net core": ".NET",
        "graphql": "GraphQL", "rest api": "REST API", "restful api": "REST API", "restful": "REST API",
        "microservices": "Microservices", "system design": "System Design", "grpc": "gRPC", "websockets": "WebSockets",
        "kafka": "Kafka", "rabbitmq": "RabbitMQ", "celery": "Celery",

        # Databases & Caching
        "postgresql": "PostgreSQL", "postgres": "PostgreSQL", "mysql": "MySQL", "mongodb": "MongoDB",
        "mongo": "MongoDB", "redis": "Redis", "dynamodb": "DynamoDB", "sqlite": "SQLite",
        "oracle database": "Oracle", "elasticsearch": "Elasticsearch", "cassandra": "Cassandra",
        "supabase": "Supabase", "firebase": "Firebase",

        # Cloud & DevOps
        "docker": "Docker", "kubernetes": "Kubernetes", "k8s": "Kubernetes", "aws": "AWS",
        "amazon web services": "AWS", "gcp": "Google Cloud", "google cloud": "Google Cloud", "azure": "Azure",
        "devops": "DevOps", "ci/cd": "CI/CD", "cicd": "CI/CD", "terraform": "Terraform", "ansible": "Ansible",
        "linux": "Linux", "jenkins": "Jenkins", "github actions": "GitHub Actions", "prometheus": "Prometheus",
        "grafana": "Grafana", "nginx": "Nginx",

        # Version Control & Practices
        "git": "Git", "github": "GitHub", "gitlab": "GitLab", "jira": "JIRA", "agile": "Agile",
        "scrum": "Scrum", "unit testing": "Unit Testing", "jest": "Jest", "cypress": "Cypress",
        "selenium": "Selenium", "pytest": "PyTest", "data structures": "Data Structures",
        "algorithms": "Algorithms",

        # AI / Machine Learning / Data Science
        "machine learning": "Machine Learning", "deep learning": "Deep Learning",
        "generative ai": "Generative AI", "genai": "Generative AI", "gen ai": "Generative AI",
        "artificial intelligence": "AI / ML", "ai/ml": "AI / ML", "ai / ml": "AI / ML",
        "pytorch": "PyTorch", "tensorflow": "TensorFlow", "opencv": "OpenCV", "cv2": "OpenCV",
        "scikit-learn": "Scikit-Learn", "sklearn": "Scikit-Learn", "keras": "Keras",
        "nlp": "NLP", "natural language processing": "NLP",
        "pandas": "Pandas", "numpy": "NumPy", "prompt engineering": "Prompt Engineering",
        "data science": "Data Science", "computer vision": "Computer Vision", "llms": "LLMs", "llm": "LLMs",
        "langchain": "LangChain", "hugging face": "Hugging Face", "huggingface": "Hugging Face",
        "transformers": "Hugging Face", "rag": "RAG", "vector database": "Vector Databases",
        "vector databases": "Vector Databases", "vector db": "Vector Databases", "chromadb": "Vector Databases",
        "pinecone": "Vector Databases", "faiss": "Vector Databases", "fine-tuning": "Fine-Tuning",
        "mlops": "MLOps", "neural networks": "Neural Networks",
        "llamaindex": "LangChain", "langgraph": "LangChain", "matplotlib": "Pandas", "seaborn": "Pandas",

        # Mobile
        "react native": "React Native", "flutter": "Flutter", "ios development": "iOS", "android development": "Android"
    }

    matched_skills = set()
    # Scan raw text for known tech keywords
    for kw, disp in display_map.items():
        if kw in ["c#", "c++"]:
            if kw in text_lower:
                matched_skills.add(disp)
        elif len(kw) <= 4:
            if re.search(r'\b' + re.escape(kw) + r'\b', clean_text, re.IGNORECASE):
                matched_skills.add(disp)
        elif kw in text_lower:
            matched_skills.add(disp)
            
    # Also parse explicit skill/tech/project sections
    section_matches = re.finditer(r'(?:skills|technologies|expertise|technical skills|tools|proficiencies|tech stack|libraries|frameworks|projects|project|experience with|proficient in)[\s:]+([^\n\r]+)', clean_text, re.IGNORECASE)
    for sm in section_matches:
        raw_line = sm.group(1)
        tokens = [t.strip() for t in re.split(r'[,|•/;\n]', raw_line) if t.strip()]
        for token in tokens:
            t_lower = token.lower()
            if t_lower in display_map:
                matched_skills.add(display_map[t_lower])

    header_words = [
        "experience", "work history", "education", "skills", "projects", "summary", "profile", "contact",
        "responsibilities", "achieved", "developed", "managed", "university", "degree", "bachelor", "master", "certifications"
    ]
    header_count = sum(1 for hw in header_words if hw in text_lower)
    
    extracted_skills = list(matched_skills)
    combined_skills = list(set(extracted_skills + user_profile_skills))
    
    trimmed = clean_text.strip()
    is_gibberish = len(trimmed) > 0 and len(extracted_skills) == 0 and header_count == 0
    is_empty = len(trimmed) == 0 and len(combined_skills) == 0
    
    target_domain, domain_name = detect_domain_from_text(clean_text, combined_skills)

    domain_target_skills = {
        "ai_ml": ["PyTorch", "TensorFlow", "FastAPI", "Python", "LangChain", "Vector Databases", "Docker", "Machine Learning"],
        "frontend": ["React", "TypeScript", "Next.js", "Tailwind CSS", "Redux", "REST API", "HTML", "CSS"],
        "backend": ["Python", "Django", "PostgreSQL", "Redis", "Docker", "System Design", "Microservices", "REST API"],
        "devops": ["Kubernetes", "Docker", "AWS", "CI/CD", "Terraform", "Linux", "GCP", "Git"]
    }
    target_skills = domain_target_skills.get(target_domain, domain_target_skills["ai_ml"])
    
    if is_gibberish:
        ats_score = 18
        is_below_80 = True
        suggestions = [
            "Your uploaded resume contains no recognizable technical skills or standard section headers.",
            "Upload a standard text PDF or DOCX resume containing real tech keywords (e.g., Python, PyTorch, React, SQL, Docker) to calculate an accurate ATS score.",
            "Ensure your resume file includes clear headings like 'Work Experience', 'Skills', and 'Education'."
        ]
    elif is_empty:
        ats_score = 25
        is_below_80 = True
        suggestions = [
            "Upload a PDF or DOCX resume in My Profile to trigger automated skill extraction.",
            "Add explicit tech skills (e.g., Python, PyTorch, React, SQL) in your profile settings.",
            "A complete resume increases your ATS compatibility score above 80%."
        ]
    else:
        num_skills = len(combined_skills)
        if num_skills >= 5:
            ats_score = min(98, 88 + num_skills * 2)
        elif num_skills >= 3:
            ats_score = 84 + num_skills * 2
        elif num_skills >= 1:
            ats_score = 78 + num_skills * 2
        else:
            ats_score = 65 + min(15, header_count * 4)

        is_below_80 = ats_score < 80
        
        if is_below_80:
            missing = [s for s in target_skills if s.lower() not in [cs.lower() for cs in combined_skills]]
            suggestions = [
                f"Include high-demand {domain_name} skills like {', '.join(missing[:3]) if missing else 'Docker or Cloud'} explicitly in your resume.",
                "Incorporate quantifiable achievement metrics in your work experience bullets (e.g., 'Improved model throughput by 35%').",
                f"Ensure your resume headline clearly matches target role titles in {domain_name}.",
                "Keep your resume formatted with standard single-column text to maximize ATS parser accuracy."
            ]
        else:
            suggestions = [
                f"Your resume passes standard ATS screening filters with high compatibility for {domain_name} roles!",
                "Consider highlighting recent project accomplishments and cloud certifications to stay top-tier.",
                "Keep swiping right on target roles to further train the recommendation engine."
            ]

    missing_skills = [sk for sk in target_skills if sk.lower() not in [s.lower() for s in combined_skills]]
    summary = f"Your ATS score is currently {ats_score}% for {domain_name}." if is_below_80 else f"Strong {ats_score}% ATS score in {domain_name}."
    
    return combined_skills, ats_score, is_gibberish, missing_skills, suggestions, summary, target_domain, domain_name


class ResumeUploadView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        if request.user.role != 'job_seeker':
            return Response({'message': 'Only job seekers can upload resumes'}, status=status.HTTP_403_FORBIDDEN)
            
        try:
            profile = request.user.profile
        except Profile.DoesNotExist:
            profile = Profile.objects.create(user=request.user)
            
        clear_resume = request.data.get('clearResume', False)
        resume_name = (request.data.get('resumeName', '') or '').replace('\x00', '').replace('\u0000', '')
        resume_text = (request.data.get('resumeText', '') or '').replace('\x00', '').replace('\u0000', '')
        resume_url = request.data.get('resumeUrl', f"https://swipex.io/resumes/{resume_name}") if resume_name else ''
        
        if clear_resume or resume_name == '':
            profile.resume_name = ''
            profile.resume_text = ''
            profile.resume_url = ''
            profile.skills = []
            profile.save()
            return Response({
                'success': True,
                'message': 'Resume record removed from database.',
                'profile': ProfileSerializer(profile).data,
                'extractedSkills': [],
                'atsScore': 25,
                'isGibberish': False
            }, status=status.HTTP_200_OK)

        profile.resume_name = resume_name
        profile.resume_text = resume_text
        profile.resume_url = resume_url
        
        extracted_skills, ats_score, is_gibberish, missing_skills, suggestions, summary, target_domain, domain_name = parse_resume_ats(
            resume_text, []
        )
        profile.skills = extracted_skills
        profile.target_domain = target_domain
        profile.save()
        
        return Response({
            'success': True,
            'message': 'Resume uploaded and parsed successfully.',
            'profile': ProfileSerializer(profile).data,
            'extractedSkills': extracted_skills,
            'atsScore': ats_score,
            'isGibberish': is_gibberish,
            'missingSkills': missing_skills,
            'improvementSuggestions': suggestions,
            'summary': summary,
            'targetDomain': target_domain,
            'domainName': domain_name
        }, status=status.HTTP_200_OK)


class ATSRecommendationsView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        if request.user.role != 'job_seeker':
            return Response({'message': 'Only job seekers can view ATS recommendations'}, status=status.HTTP_403_FORBIDDEN)
            
        resume_text = ''
        profile_skills = []
        try:
            profile = getattr(request.user, 'profile', None)
            if profile:
                resume_text = getattr(profile, 'resume_text', '') or ''
                profile_skills = getattr(profile, 'skills', []) or []
        except Exception:
            pass
            
        extracted_skills, ats_score, is_gibberish, missing_skills, suggestions, summary, target_domain, domain_name = parse_resume_ats(
            resume_text, profile_skills
        )
        
        top_matches = []
        try:
            jobs = Job.objects.filter(is_active=True)[:5]
            for j in jobs:
                required = [s.lower() for s in (j.required_skills or [])]
                user_set = set(s.lower() for s in extracted_skills)
                matched = [r for r in required if r in user_set]
                missing = [r for r in required if r not in user_set]
                score = 20 if (is_gibberish or len(user_set) == 0) else min(98, max(20, int(25 + (len(matched)/(len(required) or 1)) * 70)))
                
                top_matches.append({
                    'id': str(j.id),
                    'title': j.title,
                    'companyName': j.company_name,
                    'matchScore': score,
                    'matchingKeywords': [m.capitalize() for m in matched],
                    'missingKeywords': [m.capitalize() for m in missing]
                })
        except Exception:
            pass
            
        return Response({
            'atsScore': ats_score,
            'isBelow80': ats_score < 80,
            'isGibberish': is_gibberish,
            'missingSkills': missing_skills[:5],
            'matchedKeywords': extracted_skills,
            'improvementSuggestions': suggestions,
            'summary': summary,
            'extractedSkills': extracted_skills,
            'targetDomain': target_domain,
            'domainName': domain_name,
            'topJobMatches': top_matches
        })


class SeekerAnalyticsView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        if request.user.role != 'job_seeker':
            return Response({'message': 'Only job seekers can view seeker analytics'}, status=status.HTTP_403_FORBIDDEN)
            
        resume_text = ''
        profile_skills = []
        try:
            profile = getattr(request.user, 'profile', None)
            if profile:
                resume_text = getattr(profile, 'resume_text', '') or ''
                profile_skills = getattr(profile, 'skills', []) or []
        except Exception:
            pass
            
        extracted_skills, ats_score, is_gibberish, missing_skills, suggestions, summary, target_domain, domain_name = parse_resume_ats(
            resume_text, profile_skills
        )
        active_skills_lower = set(s.lower() for s in extracted_skills)
        
        domain_skill_catalog = {
            "ai_ml": [
                {"skill": "PyTorch", "marketDemand": 95, "potentialScoreBoost": 8},
                {"skill": "LLMs & GenAI", "marketDemand": 96, "potentialScoreBoost": 9},
                {"skill": "LangChain / RAG", "marketDemand": 93, "potentialScoreBoost": 8},
                {"skill": "Vector Databases", "marketDemand": 90, "potentialScoreBoost": 7},
                {"skill": "FastAPI / Python", "marketDemand": 89, "potentialScoreBoost": 6},
                {"skill": "MLOps / Docker", "marketDemand": 86, "potentialScoreBoost": 6}
            ],
            "frontend": [
                {"skill": "React & Next.js", "marketDemand": 96, "potentialScoreBoost": 9},
                {"skill": "TypeScript", "marketDemand": 94, "potentialScoreBoost": 8},
                {"skill": "Tailwind CSS", "marketDemand": 90, "potentialScoreBoost": 6},
                {"skill": "State Mgmt (Zustand/Redux)", "marketDemand": 88, "potentialScoreBoost": 6},
                {"skill": "Web Performance & Core Vitals", "marketDemand": 87, "potentialScoreBoost": 7},
                {"skill": "UI / Component Architecture", "marketDemand": 85, "potentialScoreBoost": 6}
            ],
            "backend": [
                {"skill": "Distributed System Design", "marketDemand": 96, "potentialScoreBoost": 9},
                {"skill": "PostgreSQL & Query Optimization", "marketDemand": 93, "potentialScoreBoost": 8},
                {"skill": "Redis Caching", "marketDemand": 90, "potentialScoreBoost": 7},
                {"skill": "Microservices Architecture", "marketDemand": 92, "potentialScoreBoost": 8},
                {"skill": "REST & GraphQL APIs", "marketDemand": 88, "potentialScoreBoost": 6},
                {"skill": "Docker & Containerization", "marketDemand": 86, "potentialScoreBoost": 6}
            ],
            "devops": [
                {"skill": "Kubernetes & Orchestration", "marketDemand": 97, "potentialScoreBoost": 9},
                {"skill": "Docker Containerization", "marketDemand": 95, "potentialScoreBoost": 8},
                {"skill": "Terraform & IaC", "marketDemand": 92, "potentialScoreBoost": 8},
                {"skill": "AWS / Cloud Infrastructure", "marketDemand": 94, "potentialScoreBoost": 8},
                {"skill": "CI/CD Pipeline Automation", "marketDemand": 91, "potentialScoreBoost": 7},
                {"skill": "Prometheus / Grafana Observability", "marketDemand": 85, "potentialScoreBoost": 6}
            ]
        }
        
        catalog = domain_skill_catalog.get(target_domain, domain_skill_catalog["ai_ml"])
        skill_gaps = []
        for item in catalog:
            is_possessed = (
                item["skill"].lower() in active_skills_lower or
                any(s in item["skill"].lower() for s in active_skills_lower) or
                any(item["skill"].lower() in s for s in active_skills_lower)
            )
            skill_gaps.append({
                "skill": item["skill"],
                "marketDemand": item["marketDemand"],
                "potentialScoreBoost": item["potentialScoreBoost"],
                "isPossessed": is_possessed
            })
            
        breakdown = [
            {"category": "Keyword & Skill Density", "score": min(98, ats_score + 2), "benchmark": 85, "weight": "35%"},
            {"category": "Section Structure & Headers", "score": 20 if is_gibberish else 95, "benchmark": 88, "weight": "25%"},
            {"category": f"{domain_name} Alignment", "score": min(98, ats_score + 1), "benchmark": 82, "weight": "25%"},
            {"category": "Measurable Impact & Metrics", "score": 15 if is_gibberish else 90, "benchmark": 80, "weight": "15%"}
        ]
        
        category_distribution = [
            {"name": domain_name, "value": 55, "avgMatch": min(98, ats_score)},
            {"name": "Full-Stack & Systems", "value": 25, "avgMatch": 88},
            {"name": "Cloud & Dev Infrastructure", "value": 20, "avgMatch": 84}
        ]
        
        tier = "Entry Ready"
        if ats_score >= 90:
            tier = "Elite Talent"
        elif ats_score >= 82:
            tier = "Top Tier"
        elif ats_score >= 70:
            tier = "Competitive"
            
        return Response({
            'atsScore': ats_score,
            'targetDomain': target_domain,
            'domainName': domain_name,
            'scoreBreakdown': breakdown,
            'skillGaps': skill_gaps,
            'categoryMatchDistribution': category_distribution,
            'marketReadinessTier': tier
        })


class NotificationListView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        user = request.user
        notifs_data = []
        unread_count = 0
        try:
            notifs = Notification.objects.filter(user=user).order_by('-created_at')
            serializer = NotificationSerializer(notifs, many=True)
            notifs_data = serializer.data
            unread_count = notifs.filter(is_read=False).count()
        except Exception:
            notifs_data = []
            unread_count = 0
            
        return Response({
            'notifications': notifs_data,
            'unreadCount': unread_count
        })


class NotificationMarkReadView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, id):
        try:
            notif = Notification.objects.filter(id=id, user=request.user).first()
            if notif:
                notif.is_read = True
                notif.save()
            return Response({'success': True})
        except Exception:
            return Response({'success': True})


class NotificationReadAllView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        Notification.objects.filter(user=request.user).update(is_read=True)
        return Response({'success': True, 'message': 'All notifications marked as read.'})


class SeekerApplicationsView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        if request.user.role != 'job_seeker':
            return Response({'message': 'Only job seekers can view applications'}, status=status.HTTP_403_FORBIDDEN)
            
        try:
            profile = request.user.profile
        except Profile.DoesNotExist:
            profile = Profile.objects.create(user=request.user)
            
        extracted_skills, ats_score, is_gibberish, _, _, _, _, _ = parse_resume_ats(
            profile.resume_text or '', profile.skills or []
        )
        user_skills_set = set(s.lower() for s in extracted_skills)
        
        right_swipes = Match.objects.filter(
            seeker=request.user, 
            status__in=['swiped_right', 'matched', 'saved_pending', 'applied', 'shortlisted', 'interview_scheduled', 'selected', 'rejected']
        ).select_related('job')
        
        result = []
        for s in right_swipes:
            j = s.job
            required = [sk.lower() for sk in (j.required_skills or [])]
            matched = [r.capitalize() for r in required if r in user_skills_set]
            missing = [r.capitalize() for r in required if r not in user_skills_set]
            
            match_score = 20 if (is_gibberish or len(user_skills_set) == 0) else min(98, max(20, int(20 + (len(matched)/(len(required) or 1)) * 72)))
            
            result.append({
                'id': str(s.id),
                'jobId': str(j.id),
                'job': JobSerializer(j).data,
                'title': j.title,
                'companyName': j.company_name,
                'location': j.location,
                'salaryRange': j.salary_range,
                'requiredSkills': j.required_skills,
                'matchScore': match_score,
                'matchingKeywords': matched,
                'missingKeywords': missing,
                'status': s.status,
                'coverNote': s.cover_note,
                'recruiterFeedback': s.recruiter_feedback,
                'interviewDate': s.interview_date,
                'interviewType': s.interview_type,
                'appliedAt': s.applied_at.isoformat() if s.applied_at else None,
                'savedAt': s.created_at.isoformat()
            })
            
        return Response(result)


class SeekerApplyView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        if request.user.role != 'job_seeker':
            return Response({'message': 'Only job seekers can apply'}, status=status.HTTP_403_FORBIDDEN)
            
        job_id = request.data.get('jobId')
        cover_note = request.data.get('coverNote', '')
        
        if not job_id:
            return Response({'message': 'jobId is required'}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            job = Job.objects.get(id=job_id)
        except Job.DoesNotExist:
            return Response({'message': 'Job not found'}, status=status.HTTP_404_NOT_FOUND)
            
        match, created = Match.objects.get_or_create(
            seeker=request.user,
            job=job,
            defaults={
                'status': 'applied',
                'cover_note': cover_note,
                'applied_at': timezone.now()
            }
        )
        if not created:
            match.status = 'applied'
            match.cover_note = cover_note
            match.applied_at = timezone.now()
            match.save()
            
        job.applicant_count += 1
        job.save()
        
        return Response({
            'success': True,
            'message': 'Application submitted successfully.',
            'application': MatchSerializer(match).data
        })


class SeekerWithdrawView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, id):
        try:
            match = Match.objects.get(id=id, seeker=request.user)
            match.delete()
            return Response({'success': True, 'message': 'Application withdrawn successfully.'})
        except Match.DoesNotExist:
            return Response({'message': 'Application not found'}, status=status.HTTP_404_NOT_FOUND)


class RecruiterApplicantsView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        user = request.user
        if user.role not in ['recruiter', 'admin']:
            return Response({'message': 'Access forbidden'}, status=status.HTTP_403_FORBIDDEN)
            
        if user.role == 'recruiter':
            recruiter_jobs = Job.objects.filter(recruiter=user)
            swipes = Match.objects.filter(job__in=recruiter_jobs).exclude(status__in=['swiped_left', 'saved_pending']).select_related('seeker__profile', 'job')
        else:
            swipes = Match.objects.exclude(status__in=['swiped_left', 'saved_pending']).select_related('seeker__profile', 'job')
            
        result = []
        for s in swipes:
            seeker_profile = s.seeker.profile
            extracted_skills, ats_score, _, _, _, _, _, _ = parse_resume_ats(
                seeker_profile.resume_text or '', seeker_profile.skills or []
            )
            result.append({
                'id': str(s.id),
                'jobId': str(s.job.id),
                'jobTitle': s.job.title,
                'candidateName': seeker_profile.full_name or s.seeker.email.split('@')[0],
                'candidateEmail': s.seeker.email,
                'candidateTitle': seeker_profile.title or 'Software Engineer',
                'candidateAvatar': seeker_profile.avatar_url or '',
                'skills': seeker_profile.skills or [],
                'resumeUrl': seeker_profile.resume_url or '',
                'resumeName': seeker_profile.resume_name or '',
                'matchScore': ats_score,
                'status': s.status,
                'appliedAt': s.applied_at.isoformat() if s.applied_at else s.created_at.isoformat(),
                'coverNote': s.cover_note or '',
                'recruiterFeedback': s.recruiter_feedback or '',
                'interviewDate': s.interview_date or '',
                'interviewType': s.interview_type or ''
            })
            
        return Response(result)


class RecruiterApplicationStatusView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, id):
        if request.user.role not in ['recruiter', 'admin']:
            return Response({'message': 'Access forbidden'}, status=status.HTTP_403_FORBIDDEN)
            
        status_val = request.data.get('status')
        feedback = request.data.get('feedback', '')
        interview_date = request.data.get('interviewDate', '')
        interview_type = request.data.get('interviewType', '')
        
        try:
            match = Match.objects.get(id=id)
        except Match.DoesNotExist:
            return Response({'message': 'Application not found'}, status=status.HTTP_404_NOT_FOUND)
            
        match.status = status_val
        if feedback:
            match.recruiter_feedback = feedback
        if interview_date:
            match.interview_date = interview_date
        if interview_type:
            match.interview_type = interview_type
        match.save()
        
        # Send a notification to candidate
        Notification.objects.create(
            user=match.seeker,
            type='application_status',
            title=f"Application Update: {status_val.replace('_', ' ').title()}",
            message=f"{match.job.company_name} updated your application status for {match.job.title} to {status_val.replace('_', ' ')}.",
            link='/applications',
            badge=status_val.replace('_', ' ').upper()
        )
        
        return Response({
            'success': True,
            'message': f'Candidate status updated to {status_val}.',
            'application': MatchSerializer(match).data
        })


class RecruiterAnalyticsView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        if request.user.role not in ['recruiter', 'admin']:
            return Response({'message': 'Access forbidden'}, status=status.HTTP_403_FORBIDDEN)
            
        user = request.user
        if user.role == 'recruiter':
            recruiter_jobs = Job.objects.filter(recruiter=user)
        else:
            recruiter_jobs = Job.objects.all()
            
        relevant_swipes = Match.objects.filter(job__in=recruiter_jobs)
        total_applicants = relevant_swipes.exclude(status__in=['swiped_left', 'saved_pending']).count()
        total_shortlisted = relevant_swipes.filter(status__in=['shortlisted', 'interview_scheduled', 'selected']).count()
        total_interviews = relevant_swipes.filter(status__in=['interview_scheduled', 'selected']).count()
        total_hired = relevant_swipes.filter(status='selected').count()
        total_matches = relevant_swipes.filter(status='matched').count()
        
        funnel = [
            {"stage": "Job Views & Impressions", "count": max(80, recruiter_jobs.count() * 45), "percentage": 100},
            {"stage": "Candidate Right Swipes", "count": max(25, total_applicants * 2), "percentage": 65},
            {"stage": "Applications Submitted", "count": max(12, total_applicants), "percentage": 40},
            {"stage": "Shortlisted for Review", "count": max(5, total_shortlisted), "percentage": 22},
            {"stage": "Interviews Scheduled", "count": max(3, total_interviews), "percentage": 12},
            {"stage": "Offers Extended / Hires", "count": max(1, total_hired), "percentage": 5}
        ]
        
        skill_distribution = [
            {"skill": "React", "jobCount": 6, "avgMatchScore": 89},
            {"skill": "TypeScript", "jobCount": 5, "avgMatchScore": 88},
            {"skill": "Python", "jobCount": 4, "avgMatchScore": 85},
            {"skill": "Docker", "jobCount": 3, "avgMatchScore": 78},
            {"skill": "Generative AI", "jobCount": 3, "avgMatchScore": 91},
            {"skill": "PostgreSQL", "jobCount": 4, "avgMatchScore": 83}
        ]
        
        match_distribution = [
            {"range": "90% - 100%", "candidates": 8},
            {"range": "80% - 89%", "candidates": 14},
            {"range": "70% - 79%", "candidates": 9},
            {"range": "< 70%", "candidates": 4}
        ]
        
        timeline = [
            {"month": "Jan", "applications": 18, "interviews": 5, "hires": 2},
            {"month": "Feb", "applications": 24, "interviews": 8, "hires": 3},
            {"month": "Mar", "applications": 32, "interviews": 11, "hires": 4},
            {"month": "Apr", "applications": 29, "interviews": 9, "hires": 3},
            {"month": "May", "applications": 38, "interviews": 14, "hires": 5},
            {"month": "Jun", "applications": 45, "interviews": 16, "hires": 6}
        ]
        
        return Response({
            'totalJobs': recruiter_jobs.count(),
            'totalApplicants': total_applicants or 8,
            'totalMatches': total_matches or 3,
            'funnelMetrics': funnel,
            'skillDemandDistribution': skill_distribution,
            'matchScoreDistribution': match_distribution,
            'hiringTrendTimeline': timeline
        })


class ProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        try:
            profile = request.user.profile
        except Profile.DoesNotExist:
            profile = Profile.objects.create(user=request.user)
        serializer = ProfileSerializer(profile)
        return Response(serializer.data)
        
    def put(self, request):
        try:
            profile = request.user.profile
        except Profile.DoesNotExist:
            profile = Profile.objects.create(user=request.user)
            
        serializer = ProfileSerializer(profile, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


def auto_seed_jobs():
    if Job.objects.count() > 0:
        return
        
    recruiter_1, _ = User.objects.get_or_create(
        email='sarah.hr@google.com',
        defaults={'role': 'recruiter', 'is_staff': False}
    )
    if _:
        recruiter_1.set_password('recruiter123')
        recruiter_1.save()
        recruiter_1.profile.company_name = 'Google LLC'
        recruiter_1.profile.save()
        
    recruiter_2, _ = User.objects.get_or_create(
        email='tech-recruiter@netflix.com',
        defaults={'role': 'recruiter', 'is_staff': False}
    )
    if _:
        recruiter_2.set_password('recruiter123')
        recruiter_2.save()
        recruiter_2.profile.company_name = 'Netflix'
        recruiter_2.profile.save()

    seed_data = [
        {
            "recruiter": recruiter_1,
            "title": "Generative AI Application Engineer",
            "company_name": "Google LLC",
            "company_logo": "https://images.unsplash.com/photo-1572021335469-31706a17aaef?auto=format&fit=crop&q=80&w=200",
            "description": "Architect high-performance LLM agentic pipelines and generative UI surfaces with PyTorch, LangChain, and React.",
            "salary_range": "$175,000 - $225,000",
            "salary_min": 175000,
            "salary_max": 225000,
            "location": "Mountain View, CA (Hybrid)",
            "required_skills": ["Python", "PyTorch", "React", "TypeScript", "Docker"],
            "organization_type": "mnc",
            "job_type": "full_time",
            "experience_level": "senior",
            "is_fresher_friendly": False,
            "applicant_count": 18,
            "competition_level": "high"
        },
        {
            "recruiter": recruiter_2,
            "title": "Full-Stack Platform Architect",
            "company_name": "Netflix",
            "company_logo": "https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?auto=format&fit=crop&q=80&w=200",
            "description": "Scale global microservices and low-latency edge rendering engines for hundreds of millions of concurrent viewers.",
            "salary_range": "$190,000 - $250,000",
            "salary_min": 190000,
            "salary_max": 250000,
            "location": "Los Gatos, CA / Remote",
            "required_skills": ["React", "TypeScript", "Node.js", "GraphQL", "AWS"],
            "organization_type": "mnc",
            "job_type": "remote",
            "experience_level": "senior",
            "is_fresher_friendly": False,
            "applicant_count": 24,
            "competition_level": "high"
        },
        {
            "recruiter": recruiter_1,
            "title": "Associate AI Research Intern",
            "company_name": "DeepMind Frontiers",
            "company_logo": "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=200",
            "description": "Exciting internship opportunity for graduates and students to train neural network representations with Python and PyTorch.",
            "salary_range": "$90,000 - $115,000",
            "salary_min": 90000,
            "salary_max": 115000,
            "location": "San Francisco, CA",
            "required_skills": ["Python", "PyTorch", "Data Structures", "Algorithms"],
            "organization_type": "startup",
            "job_type": "internship",
            "experience_level": "fresher",
            "is_fresher_friendly": True,
            "applicant_count": 4,
            "competition_level": "low"
        },
        {
            "recruiter": recruiter_2,
            "title": "Junior Frontend Developer",
            "company_name": "Vercel Labs",
            "company_logo": "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=200",
            "description": "Build high-speed interactive dashboard UI components and open-source UI libraries with React, TypeScript, and Tailwind CSS.",
            "salary_range": "$110,000 - $140,000",
            "salary_min": 110000,
            "salary_max": 140000,
            "location": "Remote",
            "required_skills": ["React", "TypeScript", "Tailwind CSS", "HTML", "CSS"],
            "organization_type": "startup",
            "job_type": "remote",
            "experience_level": "junior",
            "is_fresher_friendly": True,
            "applicant_count": 7,
            "competition_level": "medium"
        }
    ]

    for j_data in seed_data:
        Job.objects.create(**j_data)


class JobListView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        auto_seed_jobs()
        
        jobs = Job.objects.filter(is_active=True).order_by('-created_at')
        
        # Parse query params
        min_salary = request.query_params.get('minSalary')
        max_salary = request.query_params.get('maxSalary')
        location = request.query_params.get('location')
        skills = request.query_params.get('skills')
        search = request.query_params.get('search')
        organization_type = request.query_params.get('organizationType')
        job_type = request.query_params.get('jobType')
        experience_level = request.query_params.get('experienceLevel')
        is_fresher_friendly = request.query_params.get('isFresherFriendly')
        
        if min_salary and min_salary.isdigit():
            jobs = jobs.filter(salary_max__gte=int(min_salary))
        if max_salary and max_salary.isdigit():
            jobs = jobs.filter(salary_min__lte=int(max_salary))
        if location and location != 'all':
            jobs = jobs.filter(location__icontains=location)
        if organization_type and organization_type != 'all':
            jobs = jobs.filter(organization_type=organization_type)
        if job_type and job_type != 'all':
            jobs = jobs.filter(job_type=job_type)
        if experience_level and experience_level != 'all':
            jobs = jobs.filter(experience_level=experience_level)
        if is_fresher_friendly in ['true', 'True', True]:
            jobs = jobs.filter(is_fresher_friendly=True)
            
        if search:
            jobs = jobs.filter(
                Q(title__icontains=search) | 
                Q(company_name__icontains=search) | 
                Q(description__icontains=search)
            )
            
        serializer = JobSerializer(jobs, many=True)
        job_list = serializer.data
        
        # Augment with AI recommendations if job seeker
        if request.user.role == 'job_seeker':
            try:
                profile = getattr(request.user, 'profile', None)
                if profile:
                    for j in job_list:
                        score, reason = calculate_ai_recommendation(j, profile)
                        j['matchScore'] = score
                        j['aiRecommendationReason'] = reason
            except Exception:
                pass
                
        return Response(job_list)
            
    def post(self, request):
        if request.user.role not in ['recruiter', 'admin']:
            return Response({'message': 'Only recruiters can post jobs'}, status=status.HTTP_403_FORBIDDEN)
            
        serializer = JobSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(recruiter=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class SwipeActionView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        if request.user.role != 'job_seeker':
            return Response({'message': 'Only job seekers can swipe'}, status=status.HTTP_403_FORBIDDEN)
            
        job_id = request.data.get('jobId')
        direction = request.data.get('direction')
        
        if not job_id or direction not in ['left', 'right']:
            return Response({'message': "Valid jobId and direction ('left' or 'right') required"}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            job = Job.objects.get(id=job_id)
        except Job.DoesNotExist:
            return Response({'message': 'Target job listing not found'}, status=status.HTTP_404_NOT_FOUND)
            
        if Match.objects.filter(seeker=request.user, job=job).exists():
            return Response({'message': 'You have already swiped on this job listing'}, status=status.HTTP_409_CONFLICT)
            
        is_right = direction == 'right'
        status_val = 'matched' if (is_right and random.random() < 0.75) else ('swiped_right' if is_right else 'swiped_left')
        
        match = Match.objects.create(
            seeker=request.user,
            job=job,
            status=status_val
        )
        
        if is_right:
            job.applicant_count += 1
            if job.applicant_count > 15:
                job.competition_level = 'high'
            elif job.applicant_count > 5:
                job.competition_level = 'medium'
            job.save()
            
            if status_val == 'matched':
                Notification.objects.create(
                    user=request.user,
                    type='mutual_match',
                    title=f"Mutual Match with {job.company_name}!",
                    message=f"Congratulations! You and {job.company_name} mutually matched for {job.title}.",
                    link='/applications',
                    badge='Match'
                )
            
        return Response({
            'swipe': {
                'id': str(match.id),
                'seekerId': str(request.user.id),
                'jobId': str(job.id),
                'direction': direction,
                'status': status_val,
                'created_at': match.created_at.isoformat()
            },
            'matched': status_val == 'matched',
            'matchDetails': {
                'jobTitle': job.title,
                'companyName': job.company_name,
                'contactEmail': 'careers@' + job.company_name.lower().replace(' ', '') + '.com'
            } if status_val == 'matched' else None
        }, status=status.HTTP_201_CREATED)


class ResetDeckView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        if request.user.role != 'job_seeker':
            return Response({'message': 'Only job seekers can reset swipe decks'}, status=status.HTTP_403_FORBIDDEN)
            
        Match.objects.filter(seeker=request.user).delete()
        return Response({
            'success': True,
            'message': 'Swipe history cleared. Job cards refreshed.'
        })


class MatchListView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        user = request.user
        if user.role == 'job_seeker':
            matches = Match.objects.filter(seeker=user, status='matched')
        else:
            recruiter_jobs = Job.objects.filter(recruiter=user)
            matches = Match.objects.filter(job__in=recruiter_jobs, status='matched')
            
        serializer = MatchSerializer(matches, many=True)
        return Response(serializer.data)
