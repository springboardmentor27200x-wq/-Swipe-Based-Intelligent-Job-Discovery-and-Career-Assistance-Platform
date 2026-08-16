import os
import hashlib
import json
from typing import List
from dotenv import load_dotenv

load_dotenv()
_MODEL_NAME = "llama-3.3-70b-versatile"
_cache = {}  # resume+job hash -> suggestions list


def _get_client():
    api_key = os.getenv("GROQ_API_KEY") or os.getenv("OPENAI_API_KEY")
    if not api_key:
        return None
    try:
        from openai import OpenAI
        return OpenAI(api_key=api_key, base_url="https://api.groq.com/openai/v1")
    except Exception as e:
        print(f"[GROQ INIT ERROR] {e}")
        return None


def _cache_key(resume_text: str, job_description: str) -> str:
    return hashlib.sha256((resume_text + "||" + job_description).encode("utf-8")).hexdigest()


def generate_ai_suggestions(
    resume_text: str,
    job_description: str,
    missing_skills: List[str],
    missing_keywords: List[str],
    score: int,
) -> List[str]:
    key = _cache_key(resume_text, job_description)
    if key in _cache:
        return _cache[key]

    prompt = f"""You are a resume coach. A candidate's resume scored {score}/100
against a job description (ATS Match Score).

Missing skills: {', '.join(missing_skills) if missing_skills else 'none'}
Missing keywords from the job posting: {', '.join(missing_keywords) if missing_keywords else 'none'}

Resume:
---
{resume_text}
---

Job description:
---
{job_description}
---

Give 3 to 5 concrete, specific suggestions to improve this resume for
this exact job, referencing real details from both texts. Respond ONLY
with a JSON array of strings -- no markdown fences, no preamble."""

    suggestions = []
    client = _get_client()
    if client:
        try:
            response = client.chat.completions.create(
                model=_MODEL_NAME,
                messages=[{"role": "user", "content": prompt}],
            )
            raw = response.choices[0].message.content.strip().replace("```json", "").replace("```", "").strip()
            parsed = json.loads(raw)
            if isinstance(parsed, list):
                suggestions = parsed
        except Exception as e:
            print(f"[GROQ ERROR] {e}")

    # Fallback to template logic if Groq API key is missing or fails
    if not suggestions:
        if missing_skills:
            suggestions.append(f"Add these required skills if you have them: {', '.join(missing_skills[:5])}.")
        if missing_keywords:
            suggestions.append(f"Mirror these terms from the job description: {', '.join(missing_keywords[:5])}.")
        if not suggestions:
            suggestions.append("Add quantifiable achievements and role-specific terminology to strengthen your match.")

    _cache[key] = suggestions
    return suggestions