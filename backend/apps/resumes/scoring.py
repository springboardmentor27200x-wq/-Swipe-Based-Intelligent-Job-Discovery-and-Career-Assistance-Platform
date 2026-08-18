"""
SwipeX ATS Scoring Engine — Milestone 3

Computes a 0-100 ATS-style compatibility score between a parsed Resume and a
Job posting, broken down into four weighted factors:

    Skill Match        — 40%
    Keyword Match       — 25%
    Experience Match    — 20%
    Education Match      — 15%

Also produces:
    - matched_skills / missing_skills (resume vs job.skills_required)
    - missing_keywords (important terms in the JD not found in the resume)
    - suggestions (actionable resume-improvement tips)
"""

import re
from datetime import datetime

WEIGHTS = {
    'skill': 0.40,
    'keyword': 0.25,
    'experience': 0.20,
    'education': 0.15,
}

# Generic stopwords excluded when mining "important keywords" from a JD
STOPWORDS = {
    'the', 'and', 'for', 'with', 'you', 'are', 'our', 'a', 'an', 'to', 'of', 'in',
    'on', 'at', 'is', 'as', 'be', 'will', 'we', 'this', 'that', 'or', 'your',
    'have', 'has', 'from', 'by', 'it', 'their', 'who', 'can', 'should', 'must',
    'about', 'into', 'across', 'other', 'such', 'they', 'them', 'us', 'job',
    'role', 'work', 'team', 'strong', 'experience', 'years', 'looking',
}

EXPERIENCE_LEVEL_YEARS = {
    'fresher': (0, 0.5),
    'junior':  (1, 3),
    'mid':     (3, 6),
    'senior':  (6, 10),
    'lead':    (10, 100),
}

EDUCATION_KEYWORDS = [
    'bachelor', 'b.tech', 'btech', 'b.e', 'be ', 'master', 'm.tech', 'mtech',
    'msc', 'm.sc', 'bsc', 'b.sc', 'phd', 'ph.d', 'mba', 'degree', 'university',
    'college', 'institute of technology', 'diploma',
]


def _normalize(s: str) -> str:
    return re.sub(r'\s+', ' ', (s or '')).strip().lower()


def _skill_match(resume_skills, job_skill_names):
    """Returns (score_0_100, matched, missing)."""
    if not job_skill_names:
        return 100.0, [], []

    resume_set_lower = {s.lower() for s in resume_skills}
    matched, missing = [], []
    for job_skill in job_skill_names:
        if job_skill.lower() in resume_set_lower:
            matched.append(job_skill)
        else:
            # allow partial contains match (e.g. "React" matches "React.js")
            if any(job_skill.lower() in rs or rs in job_skill.lower() for rs in resume_set_lower):
                matched.append(job_skill)
            else:
                missing.append(job_skill)

    score = (len(matched) / len(job_skill_names)) * 100.0
    return round(score, 1), matched, missing


def _keyword_match(resume_text, job_description, job_requirements):
    """
    Extracts significant keywords from the job description/requirements and
    checks how many appear in the resume text. Returns (score, missing_keywords).
    """
    jd_text = f"{job_description or ''} {job_requirements or ''}"
    words = re.findall(r"[A-Za-z][A-Za-z+.#/-]{2,}", jd_text)
    freq = {}
    for w in words:
        wl = w.lower()
        if wl in STOPWORDS or len(wl) < 3:
            continue
        freq[wl] = freq.get(wl, 0) + 1

    # Take the most frequent, distinctive terms as "important keywords"
    important = sorted(freq.items(), key=lambda kv: -kv[1])[:20]
    keywords = [w for w, _ in important]

    if not keywords:
        return 100.0, []

    resume_lower = _normalize(resume_text)
    present = [kw for kw in keywords if kw in resume_lower]
    missing = [kw for kw in keywords if kw not in resume_lower]

    score = (len(present) / len(keywords)) * 100.0
    return round(score, 1), missing[:10]


def _experience_match(resume_years, job_experience_level):
    lo, hi = EXPERIENCE_LEVEL_YEARS.get(job_experience_level, (0, 100))
    if lo <= resume_years <= hi:
        return 100.0
    if resume_years < lo:
        gap = lo - resume_years
        return max(0.0, 100.0 - gap * 25)
    # overqualified — still a reasonably strong match
    gap = resume_years - hi
    return max(50.0, 100.0 - gap * 5)


def _education_match(parsed_education):
    if not parsed_education:
        return 40.0  # no education section detected — partial credit, not zero
    text = _normalize(' '.join(parsed_education))
    if any(kw in text for kw in EDUCATION_KEYWORDS):
        return 100.0
    return 60.0  # education section exists but no recognizable qualification keyword


def compute_ats_score(resume, job) -> dict:
    """
    Compute the full ATS breakdown between a Resume instance and a Job instance.
    Returns a dict ready to populate the ATSScore model / API response.
    """
    job_skill_names = list(job.skills_required.values_list('name', flat=True))
    resume_skills = resume.all_skills

    skill_score, matched_skills, missing_skills = _skill_match(resume_skills, job_skill_names)
    keyword_score, missing_keywords = _keyword_match(resume.raw_text, job.description, job.requirements)
    experience_score = _experience_match(resume.estimated_years_experience, job.experience_level)
    education_score = _education_match(resume.parsed_education)

    overall = (
        skill_score * WEIGHTS['skill'] +
        keyword_score * WEIGHTS['keyword'] +
        experience_score * WEIGHTS['experience'] +
        education_score * WEIGHTS['education']
    )
    overall = round(min(overall, 100.0), 1)

    suggestions = _build_suggestions(
        resume=resume,
        missing_skills=missing_skills,
        missing_keywords=missing_keywords,
        job_skill_names=job_skill_names,
    )

    return {
        'overall_score': overall,
        'skill_match': skill_score,
        'experience_match': experience_score,
        'keyword_match': keyword_score,
        'education_match': education_score,
        'matched_skills': matched_skills,
        'missing_skills': missing_skills,
        'missing_keywords': missing_keywords,
        'suggestions': suggestions,
    }


def _build_suggestions(resume, missing_skills, missing_keywords, job_skill_names):
    """
    Suggestions are generated purely from what the parser actually found on
    THIS resume — never a static checklist. Ordering prioritizes the most
    actionable, resume-completeness items first so they can't be silently
    crowded out by a long tail of missing-keyword suggestions.
    """
    suggestions = []

    # 1) Missing skills — most actionable, so surface first
    for skill in missing_skills[:4]:
        suggestions.append(f"Add {skill} to your resume if you have experience with it")

    # 2) Resume completeness — only flagged when genuinely absent from parsing
    if not resume.parsed_projects:
        suggestions.append("Include a Projects section demonstrating hands-on work with your key skills")

    if not resume.parsed_certifications:
        suggestions.append("Consider adding relevant certifications to strengthen your profile")

    if not resume.has_github_link:
        suggestions.append("Add your GitHub profile link so recruiters can see your code")

    if not resume.has_linkedin_link:
        suggestions.append("Add your LinkedIn profile link for professional visibility")

    if len(resume.raw_text or '') < 400:
        suggestions.append("Your resume looks quite short — add more detail on responsibilities and impact")

    # 3) Missing keywords the JD emphasizes but resume doesn't mention
    notable_missing_kw = [kw for kw in missing_keywords if kw not in {s.lower() for s in missing_skills}][:3]
    for kw in notable_missing_kw:
        suggestions.append(f"Mention '{kw}' explicitly — it's emphasized in the job description")

    if not suggestions:
        suggestions.append("Great match! Your resume already aligns well with this job's requirements")

    return suggestions[:10]
