import PyPDF2

COMMON_SKILLS = [
    "python",
    "django",
    "react",
    "javascript",
    "sql",
    "machine learning",
    "tensorflow",
    "pandas",
    "numpy",
    "git",
    "rest api",
    "postgresql"
]


def extract_resume_text(pdf_path):
    text = ""

    with open(pdf_path, "rb") as file:
        reader = PyPDF2.PdfReader(file)

        for page in reader.pages:
            page_text = page.extract_text()

            if page_text:
                text += page_text + " "

    return text.lower()


def extract_skills(text):
    text = text.lower()

    found = []

    for skill in COMMON_SKILLS:
        if skill in text:
            found.append(skill)

    return found


def calculate_ats_score(resume_text, job_text):

    resume_skills = set(extract_skills(resume_text))
    job_skills = set(extract_skills(job_text))

    print("RESUME SKILLS:", resume_skills)
    print("JOB SKILLS:", job_skills)

    if len(job_skills) == 0:
        return {
            "score": 0,
            "matched_skills": [],
            "missing_skills": [],
        }

    matched = resume_skills.intersection(job_skills)

    missing = job_skills - resume_skills

    score = int((len(matched) / len(job_skills)) * 100)

    return {
        "score": score,
        "matched_skills": list(matched),
        "missing_skills": list(missing),
    }


def generate_suggestions(result):

    suggestions = []

    if result["score"] < 50:
        suggestions.append(
            "Add more job-relevant technical skills to your resume."
        )

    if result["missing_skills"]:
        suggestions.append(
            "Include these skills: " +
            ", ".join(result["missing_skills"])
        )

    if result["score"] >= 80:
        suggestions.append(
            "Your resume is highly compatible with this job."
        )

    return suggestions