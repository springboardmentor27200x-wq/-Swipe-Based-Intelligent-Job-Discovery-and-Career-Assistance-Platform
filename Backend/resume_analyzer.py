import fitz
import re


# =========================================================
# COMMON SKILLS
# =========================================================

COMMON_SKILLS = [

    "python",
    "java",
    "c",
    "c++",
    "c#",

    "sql",
    "mysql",
    "postgresql",
    "oracle",

    "html",
    "css",
    "javascript",
    "typescript",

    "react",
    "angular",
    "vue",

    "fastapi",
    "django",
    "flask",

    "spring",
    "spring boot",

    "node",
    "node.js",
    "express",

    "rest",
    "rest api",

    "docker",
    "kubernetes",

    "git",
    "github",
    "gitlab",

    "machine learning",
    "deep learning",
    "artificial intelligence",
    "ai",

    "aws",
    "azure",
    "gcp",
    "google cloud",

    "mongodb",

    "data structures",
    "algorithms",

    "oops",
    "object oriented programming",

    "microservices",

    "jenkins",
    "linux"
]


# =========================================================
# EXTRACT TEXT
# =========================================================

def extract_text(pdf_path):

    text = ""

    try:

        doc = fitz.open(pdf_path)

        for page in doc:

            text += page.get_text()

        doc.close()

    except Exception as error:

        print(
            "PDF extraction error:",
            error
        )

        return ""

    return text.lower()


# =========================================================
# EXTRACT SKILLS
# =========================================================

def extract_skills(text):

    found = []

    if not text:

        return found

    text = text.lower()

    for skill in COMMON_SKILLS:

        pattern = (
            r"(?<!\w)"
            + re.escape(skill)
            + r"(?!\w)"
        )

        if re.search(pattern, text):

            found.append(skill)

    return found


# =========================================================
# ATS SCORE
# =========================================================

def ats_score(skills):

    if not skills:

        return 0

    score = int(
        (
            len(skills)
            /
            len(COMMON_SKILLS)
        )
        * 100
    )

    return min(score, 100)


# =========================================================
# RESUME - JOB MATCH
# =========================================================

def match_resume(
    job_skills,
    resume_skills
):

    matched = []
    missing = []

    if not job_skills:

        return {
            "match": 0,
            "matched": [],
            "missing": []
        }


    resume_skills = [

        skill.lower()

        for skill in resume_skills

    ]


    for skill in job_skills:

        skill = skill.lower()

        if skill in resume_skills:

            matched.append(skill)

        else:

            missing.append(skill)


    percentage = int(

        (
            len(matched)
            /
            len(job_skills)
        )
        * 100

    )


    return {

        "match": percentage,

        "matched": matched,

        "missing": missing

    }


# =========================================================
# SUGGESTIONS
# =========================================================

def generate_suggestions(
    missing,
    resume_skills=None,
    score=0
):

    suggestions = []

    resume_skills = resume_skills or []


    # ==========================================
    # ATS SUGGESTION
    # ==========================================

    if score < 60:

        suggestions.append(

            "Your ATS score is low. Add relevant "
            "technical skills and keywords from "
            "the jobs you are targeting."

        )

    elif score < 80:

        suggestions.append(

            "Add more relevant technical skills "
            "from your projects, internships, "
            "certifications, or coursework."

        )

    else:

        suggestions.append(

            "Your ATS score is good. Keep your "
            "technical skills clear and relevant "
            "to the target job."

        )


    # ==========================================
    # MISSING SKILLS
    # ==========================================

    if missing:

        suggestions.append(

            "Consider adding or learning these "
            "skills: "
            + ", ".join(missing)

        )


    # ==========================================
    # PROJECT SUGGESTION
    # ==========================================

    suggestions.append(

        "Mention the technologies used in your "
        "projects and briefly describe what you implemented."

    )


    # ==========================================
    # ACHIEVEMENT SUGGESTION
    # ==========================================

    suggestions.append(

        "Add measurable achievements where possible, "
        "such as performance improvements, accuracy, "
        "or project outcomes."

    )


    return suggestions