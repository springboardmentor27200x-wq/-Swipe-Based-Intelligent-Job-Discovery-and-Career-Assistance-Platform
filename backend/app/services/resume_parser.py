import re
import io
from pypdf import PdfReader
from docx import Document
try:
    from pdfminer.high_level import extract_text as pdfminer_extract_text
except ImportError:
    pdfminer_extract_text = None

# Tech Stack taxonomy for skill detection
COMMON_SKILLS = [
    "Python", "JavaScript", "TypeScript", "React", "Next.js", "Vue.js", "Angular",
    "Node.js", "Express", "FastAPI", "Django", "Flask", "Java", "Spring Boot",
    "C++", "C#", ".NET", "Go", "Golang", "Rust", "PHP", "Laravel", "Ruby", "Rails",
    "SQL", "PostgreSQL", "MySQL", "SQLite", "MongoDB", "Redis", "Elasticsearch",
    "GraphQL", "REST APIs", "gRPC", "Docker", "Kubernetes", "AWS", "GCP", "Azure",
    "CI/CD", "DevOps", "Git", "GitHub", "Linux", "TailwindCSS", "CSS", "HTML",
    "Redux", "Zustand", "Jest", "Cypress", "PyTest", "Machine Learning", "PyTorch",
    "TensorFlow", "scikit-learn", "NLP", "Pandas", "NumPy", "State Management",
    "MERN", "Swift", "Figma", "VS Code", "PowerBI", "Snowflake", "IoT", "Cybersecurity",
    "UI/UX", "CAD", "QGIS", "AI"
]

def extract_text_from_pdf(file_bytes: bytes) -> str:
    text = ""
    # Try pypdf first
    try:
        reader = PdfReader(io.BytesIO(file_bytes))
        for page in reader.pages:
            extracted = page.extract_text()
            if extracted:
                text += extracted + "\n"
        text = text.strip()
    except Exception as e:
        print(f"pypdf extraction warning: {e}")

    # Fallback to pdfminer if pypdf extracted empty or very short text
    if not text or len(text.strip()) < 30:
        if pdfminer_extract_text:
            try:
                mined_text = pdfminer_extract_text(io.BytesIO(file_bytes))
                if mined_text and len(mined_text.strip()) > len(text):
                    text = mined_text.strip()
            except Exception as e:
                print(f"pdfminer extraction warning: {e}")

    return text

def extract_text_from_docx(file_bytes: bytes) -> str:
    try:
        doc = Document(io.BytesIO(file_bytes))
        text = "\n".join([paragraph.text for paragraph in doc.paragraphs])
        return text.strip()
    except Exception as e:
        print(f"Error extracting DOCX text: {e}")
        return ""

def extract_text_from_file(filename: str, file_bytes: bytes) -> str:
    filename_lower = filename.lower()
    if filename_lower.endswith(".pdf"):
        return extract_text_from_pdf(file_bytes)
    elif filename_lower.endswith(".docx") or filename_lower.endswith(".doc"):
        return extract_text_from_docx(file_bytes)
    else:
        # Fallback raw text decoding
        try:
            return file_bytes.decode("utf-8", errors="ignore")
        except Exception:
            return ""

def extract_skills_from_text(text: str) -> list[str]:
    if not text:
        return []
    
    extracted = set()
    text_lower = text.lower()

    for skill in COMMON_SKILLS:
        pattern = r'\b' + re.escape(skill.lower()) + r'\b'
        if re.search(pattern, text_lower):
            extracted.add(skill)

    return sorted(list(extracted))

def validate_is_resume(text: str) -> tuple[bool, str]:
    """
    Validates if the extracted text resembles a candidate resume.
    Returns (is_valid: bool, reason_message: str).
    """
    if not text or len(text.strip()) == 0:
        return False, "Unable to extract text from this PDF file. Please ensure it contains selectable text."

    words = re.findall(r'\w+', text)
    if len(words) < 5:
        return False, "This document contains too little text to analyze. Please upload your complete resume."

    text_lower = text.lower()

    # 1. Contact info indicators
    has_email = bool(re.search(r'[\w\.-]+@[\w\.-]+\.\w+', text))
    has_phone = bool(re.search(r'\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}', text))

    # 2. Key resume section headers & keywords
    resume_headers = [
        "experience", "work", "employment", "education", "skills",
        "projects", "summary", "profile", "qualifications", "certifications",
        "academic", "career", "background", "objective", "internship", "portfolio",
        "curriculum", "vitae", "resume", "student", "intern", "bachelor", "master",
        "college", "university", "institute", "school"
    ]
    has_header = any(h in text_lower for h in resume_headers)

    # 3. Career / Tech domain terms
    domain_terms = [
        "engineer", "developer", "designer", "manager", "analyst", "student",
        "university", "bachelor", "master", "degree", "college", "school", "tech",
        "software", "data", "web", "fullstack", "frontend", "backend", "intern"
    ]
    has_domain = any(t in text_lower for t in domain_terms)

    # 4. Extracted tech skills check
    extracted_skills = extract_skills_from_text(text)
    has_skills = len(extracted_skills) > 0

    # Decision rule: Pass if text is substantial (> 20 words) or contains any resume indicator
    if len(words) >= 20 or (has_email or has_phone or has_header or has_domain or has_skills):
        return True, "Valid resume format"

    return False, "This document doesn't look like a valid resume. Please upload a document containing work experience, education, or skills."
