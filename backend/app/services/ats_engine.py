from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import re

def compute_vector_similarity(resume_text: str, job_text: str) -> float:
    """Computes TF-IDF Cosine Similarity between resume text and job description."""
    if not resume_text or not job_text:
        return 0.5 # Default baseline match
    
    try:
        vectorizer = TfidfVectorizer(stop_words='english')
        tfidf_matrix = vectorizer.fit_transform([resume_text, job_text])
        sim_score = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
        return float(sim_score)
    except Exception as e:
        print(f"Error computing vector similarity: {e}")
        return 0.5

def analyze_ats_match(resume_text: str, resume_skills: list[str], job_title: str, job_description: str, job_skills: list[str]) -> dict:
    """
    Computes ATS match score %, matched keywords, missing keywords, and 80% threshold check.
    """
    # 1. Required skills match vs resume text / parsed skills
    job_skills_list = job_skills or []
    if not job_skills_list:
        # Fallback extract words from job title
        job_skills_list = [w for w in re.findall(r'\w+', job_title) if len(w) > 3]

    resume_text_lower = (resume_text or "").lower()
    resume_skills_lower = set([s.lower() for s in (resume_skills or [])])

    matched_keywords = []
    missing_keywords = []

    for skill in job_skills_list:
        skill_lower = skill.lower()
        pattern = r'\b' + re.escape(skill_lower) + r'\b'
        if skill_lower in resume_skills_lower or re.search(pattern, resume_text_lower):
            matched_keywords.append(skill)
        else:
            missing_keywords.append(skill)

    # Keyword coverage percentage (0.0 to 1.0)
    total_skills = len(job_skills_list)
    keyword_score = (len(matched_keywords) / total_skills) if total_skills > 0 else 0.85

    # 2. Vector Cosine Similarity (0.0 to 1.0)
    combined_job_text = f"{job_title} {job_description or ''} {' '.join(job_skills_list)}"
    vector_sim = compute_vector_similarity(resume_text, combined_job_text)

    # 3. Combine scores: 60% Keyword Coverage + 40% Vector Similarity
    raw_score = (keyword_score * 0.60) + (min(vector_sim * 1.8, 1.0) * 0.40)
    final_score = int(round(raw_score * 100))

    # Clamp between 55% and 98% for realistic ATS display
    final_score = max(55, min(98, final_score))
    
    match_rating = "Strong Match" if final_score >= 80 else "Moderate Match" if final_score >= 65 else "Low Match"
    is_high_match = final_score >= 80

    return {
        "ats_score": final_score,
        "match_rating": match_rating,
        "is_high_match": is_high_match,
        "matched_keywords": matched_keywords,
        "missing_keywords": missing_keywords,
    }
