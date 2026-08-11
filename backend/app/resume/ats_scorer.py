import os
import re
import json
import logging
from typing import List, Dict, Tuple, Any

try:
    import pdfplumber
except ImportError:
    pdfplumber = None

try:
    import docx
except ImportError:
    docx = None

from app.models.job import Job

logger = logging.getLogger(__name__)

SKILLS_DATABASE = [
    "python", "javascript", "typescript", "react", "angular", "vue", "nodejs", "django", "fastapi", "flask", 
    "springboot", "java", "kotlin", "swift", "dart", "flutter", "reactnative", "aws", "azure", "gcp", 
    "docker", "kubernetes", "terraform", "jenkins", "github actions", "postgresql", "mysql", "mongodb", 
    "redis", "elasticsearch", "graphql", "rest api", "microservices", "machine learning", "deep learning", 
    "pytorch", "tensorflow", "scikit-learn", "pandas", "numpy", "nlp", "computer vision", "sql", "nosql", 
    "git", "agile", "scrum", "jira", "figma", "html", "css", "tailwind", "sass", "bootstrap", "c++", "c#", 
    "go", "ruby", "rails", "php", "laravel", "rust", "scala", "haskell", "graphql", "apollo", "redux", 
    "next.js", "nuxt.js", "nest.js", "express", "koa", "flask", "django rest framework", "drf", "celery", 
    "rabbitmq", "kafka", "sqlite", "mariadb", "cassandra", "dynamodb", "firebase", "supabase", "prisma", 
    "sequelize", "hibernate", "maven", "gradle", "npm", "yarn", "vite", "webpack", "babel", "eslint", 
    "prettier", "jest", "cypress", "selenium", "playwright", "mocha", "chai", "pytest", "unittest", 
    "jenkins", "gitlab ci", "circleci", "heroku", "netlify", "vercel", "digitalocean", "cloudflare", 
    "nginx", "apache", "linux", "bash", "powershell", "git", "github", "gitlab", "bitbucket", "vscode", 
    "postman", "swagger", "openapis", "auth0", "oauth", "jwt", "saml", "sso", "restful", "grpc", "websockets", 
    "socket.io", "serverless", "lambda", "s3", "ec2", "rds", "dynamodb", "cloudfront", "route53", "iam", 
    "vpc", "ecs", "eks", "fargate", "cloudformation", "ansible", "puppet", "chef", "vagrant", "prometheous", 
    "grafana", "elk", "logstash", "kibana", "sentry", "datadog", "newrelic", "jira", "confluence", "trello", 
    "slack", "zoom", "teams", "skype", "figma", "sketch", "adobe xd", "photoshop", "illustrator", "premiere", 
    "after effects", "lightroom", "invision", "zeplin", "canva", "webflow", "shopify", "wordpress", 
    "magento", "drupal", "joomla", "wix", "squarespace", "salesforce", "sap", "oracle", "powerbi", 
    "tableau", "looker", "excel", "word", "powerpoint", "outlook", "scrum", "agile", "kanban", "safe", 
    "prince2", "pmp", "itil", "cobit", "togaf", "six sigma", "lean", "devops", "secops", "gitops", 
    "mlops", "data science", "data analysis", "data engineering", "big data", "hadoop", "spark", "hive", 
    "pig", "flume", "sqoop", "airflow", "luigi", "presto", "snowflake", "redshift", "bigquery", "databricks", 
    "dbt", "fivetran", "stitch", "tableau", "power bi", "looker", "superset", "metabase", "plotly", 
    "bokeh", "matplotlib", "seaborn", "scipy", "statsmodels", "sympy", "keras", "spacy", "nltk", 
    "gensim", "opencv", "pillow", "scikit-image", "tesseract", "weka", "rapidminer", "knime", "orange", 
    "r", "rstudio", "shiny", "tidyverse", "ggplot2", "dplyr", "tidyr", "purrr", "readr", "stringr", 
    "forcats", "lubridate", "h2o", "xgboost", "lightgbm", "catboost", "statsmodels", "sas", "spss", 
    "matlab", "octave", "julia", "scala", "spark", "pyspark", "sparklyr", "kafka", "flink", "storm", 
    "samza", "beam", "nifi", "streamsets", "talend", "pentaho", "informatica", "ab initio", "datastage", 
    "ssis", "ssas", "ssrs", "d3.js", "three.js", "chart.js", "highcharts", "amcharts", "leaflet", 
    "mapbox", "google maps", "openlayers", "arcgis", "qgis", "geopandas", "shapely", "fiona", "rasterio"
]

class ATSScorer:
    def extract_text(self, file_path: str) -> str:
        _, ext = os.path.splitext(file_path.lower())
        if ext == ".pdf":
            return self.extract_text_from_pdf(file_path)
        elif ext in [".docx", ".doc"]:
            return self.extract_text_from_docx(file_path)
        else:
            raise ValueError(f"Unsupported file type: {ext}")

    def extract_text_from_pdf(self, file_path: str) -> str:
        text = ""
        if pdfplumber is None:
            # Fallback if pdfplumber is not installed
            logger.warning("pdfplumber is not installed, returning empty string.")
            return text
        try:
            with pdfplumber.open(file_path) as pdf:
                for page in pdf.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n"
        except Exception as e:
            logger.error(f"Error reading PDF {file_path}: {e}")
        return text

    def extract_text_from_docx(self, file_path: str) -> str:
        text = ""
        if docx is None:
            # Fallback if docx is not installed
            logger.warning("python-docx is not installed, returning empty string.")
            return text
        try:
            doc = docx.Document(file_path)
            for para in doc.paragraphs:
                text += para.text + "\n"
        except Exception as e:
            logger.error(f"Error reading DOCX {file_path}: {e}")
        return text

    def extract_skills(self, text: str) -> List[str]:
        if not text:
            return []
        found_skills = []
        # Normalise and tokenize text slightly
        text_lower = f" {text.lower()} "
        # Replace non-alphanumeric/non-dash characters with space to make matching cleaner
        text_clean = re.sub(r'[^a-z0-9\-\.\s\+#]', ' ', text_lower)
        
        for skill in SKILLS_DATABASE:
            # Match word boundary
            pattern = r'\b' + re.escape(skill) + r'\b'
            if re.search(pattern, text_clean):
                found_skills.append(skill)
        return list(set(found_skills))

    def calculate_ats_score(self, resume_text: str, job: Job, openai_api_key: str = "") -> Dict[str, Any]:
        # Parse job requirements and description
        job_skills = []
        if job.skills_required:
            try:
                job_skills = json.loads(job.skills_required)
            except Exception:
                job_skills = [s.strip().lower() for s in job.skills_required.split(",")]
        
        # Lowercase job skills for case-insensitive matching
        job_skills_lower = [s.lower() for s in job_skills]
        
        # Extract skills from resume
        resume_skills = self.extract_skills(resume_text)
        resume_skills_lower = [s.lower() for s in resume_skills]

        # Intersect
        matched_skills = [s for s in job_skills if s.lower() in resume_skills_lower]
        missing_skills = [s for s in job_skills if s.lower() not in resume_skills_lower]

        # Keywords in job requirements and description
        # We extract key nouns/verbs from the description for keyword analysis
        job_words = re.findall(r'\b[a-z]{3,}\b', job.description.lower())
        resume_words = set(re.findall(r'\b[a-z]{3,}\b', resume_text.lower()))
        
        # Highlighted keywords that are typical in resume filtering
        action_keywords = ["manage", "develop", "implement", "create", "lead", "design", "deliver", "achieve",
                           "optimize", "collaborate", "solve", "coordinate", "build", "scale", "integrate",
                           "cloud", "agile", "scrum", "infrastructure", "security", "database", "analytics"]
        
        matched_keywords = [w for w in action_keywords if w in resume_words and w in job_words]
        missing_keywords = [w for w in action_keywords if w in job_words and w not in resume_words]

        # Calculate a simulated score
        # Weighting: 60% skills, 20% experience, 20% keywords
        skills_score = (len(matched_skills) / len(job_skills) * 100) if job_skills else 100
        
        # Experience match: check if user mentions years of experience that matches job
        # (This is rule-based: look for numbers near "year" or "yr" in resume text)
        exp_score = 100
        experience_matches = re.findall(r'(\d+)\s*(?:\+)?\s*(?:year|yr)', resume_text.lower())
        if experience_matches:
            extracted_exp = max([int(x) for x in experience_matches])
            # Say job requires mid level: check experience_level
            # (In job: fresher, junior, mid, senior, lead)
            req_exp = 0
            if job.experience_level == "junior":
                req_exp = 1
            elif job.experience_level == "mid":
                req_exp = 3
            elif job.experience_level == "senior":
                req_exp = 5
            elif job.experience_level == "lead":
                req_exp = 8
            
            if extracted_exp < req_exp:
                exp_score = (extracted_exp / req_exp) * 100
        
        keyword_score = (len(matched_keywords) / len(action_keywords) * 100) if action_keywords else 100
        
        total_score = round(0.6 * skills_score + 0.2 * exp_score + 0.2 * keyword_score, 1)
        total_score = min(max(total_score, 15.0), 100.0) # bound it nicely

        # Check sections found in resume
        sections = {
            "education": bool(re.search(r'\b(education|university|college|degree|btech|mtech|bsc|msc|phd|academic)\b', resume_text.lower())),
            "experience": bool(re.search(r'\b(experience|employment|work history|career|professional experience|internship|worked)\b', resume_text.lower())),
            "skills": bool(re.search(r'\b(skills|technical skills|expertise|technologies|proficiencies)\b', resume_text.lower())),
            "projects": bool(re.search(r'\b(projects|academic projects|personal projects|key projects)\b', resume_text.lower())),
        }

        # Generate suggestions
        suggestions = self.generate_suggestions(missing_skills, missing_keywords, total_score, sections)

        # If openai key is available, we could call it (optional - let's write a fall back logic)
        # But we will use the local scorer by default as it is super fast and robust
        if openai_api_key:
            try:
                # We can call OpenAI to generate richer suggestions if they are configured
                # For this setup, we'll keep the local logic as the solid foundation, and we can supplement it.
                pass
            except Exception as e:
                logger.error(f"Failed to use OpenAI for suggestions: {e}")

        return {
            "score": total_score,
            "matched_skills": matched_skills,
            "missing_skills": missing_skills,
            "matched_keywords": matched_keywords,
            "missing_keywords": missing_keywords,
            "suggestions": suggestions,
            "sections_found": sections
        }

    def generate_suggestions(self, missing_skills: List[str], missing_keywords: List[str], score: float, sections: Dict[str, bool]) -> List[str]:
        suggestions = []
        
        # Section checks
        for sec, found in sections.items():
            if not found:
                suggestions.append(f"Add a dedicated '{sec.upper()}' section to your resume. It is currently missing or not recognized by the ATS.")

        # Skills suggestions
        if missing_skills:
            skills_to_add = missing_skills[:4]
            suggestions.append(f"Add these critical skills matching the job description to your profile/resume: {', '.join(skills_to_add)}")

        # Keyword suggestions
        if missing_keywords:
            keywords_to_add = missing_keywords[:4]
            suggestions.append(f"Incorporate action keywords like: {', '.join(keywords_to_add)} inside your job description bullet points.")

        # General ATS tips
        if score < 50:
            suggestions.append("Format check: Ensure your resume is a single-column layout. Multi-column resumes can confuse ATS scanners.")
            suggestions.append("Quantify your achievements: Use metrics (e.g., 'Increased efficiency by 20%') instead of just listing tasks.")
        elif score < 75:
            suggestions.append("Optimize section headings: Use standard terms like 'Work Experience' and 'Education' rather than creative ones.")
            suggestions.append("Customize resume: Tailor your summary section to match this job title and industry directly.")
        else:
            suggestions.append("Great job! Your resume is highly compatible. Double-check for minor spelling errors and formatting before applying.")

        return suggestions
