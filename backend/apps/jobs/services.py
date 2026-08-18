"""
SwipeX Recommendation Engine
Milestone 2 (Rule-Based): skill overlap from swipe/save history, location,
work-mode, experience level, freshness.
Milestone 3 (Extended): the skill-overlap factor now also blends in the job
seeker's parsed Resume skills — the existing swipe/save history proxy is kept
and improved rather than replaced, and a dedicated Resume-match bonus factor
is added on top.
Milestone 3.1 (AI-Enhanced): a Semantic Similarity factor is layered on top
of the rule-based score, comparing the seeker's resume text against the job
description using sentence embeddings (sentence-transformers/spaCy when
available, with an automatic offline TF-IDF fallback — see semantic.py).
The rule-based engine is never replaced, only extended.
"""

from django.db.models import Q
from .models import Job, Recommendation, SwipeHistory, SavedJob
from .semantic import semantic_similarity


def _get_resume(job_seeker):
    """Milestone 3: the job seeker's primary parsed Resume instance, if any."""
    try:
        from apps.resumes.services import get_primary_resume
        return get_primary_resume(job_seeker)
    except Exception:
        # Resumes app not migrated / no resume yet — recommendation engine
        # keeps working exactly as it did in Milestone 2.
        return None


def _get_resume_skills(job_seeker) -> set:
    """Milestone 3: skills parsed from the job seeker's primary resume, if any."""
    resume = _get_resume(job_seeker)
    return set(resume.all_skills) if resume else set()


def compute_recommendation_score(job_seeker, job) -> tuple[float, list[str]]:
    """
    Rule-based + AI matching score (0.0–1.0) between a job seeker and a job.

    Factors (Milestone 2, unchanged):
      1. Skill overlap (swipe/save history proxy) → 0–40 pts
      2. Location preference                        → 0–20 pts
      3. Work-mode preference                        → 0–15 pts
      4. Experience level match                      → 0–15 pts
      5. Freshness bonus                              → 0–10 pts

    Milestone 3 addition:
      6. Resume skill match                          → 0–20 pts (extra factor;
         total possible points rescale to 120 when a resume is present, so
         M2-only users are scored on an identical 0-100 basis as before).

    Milestone 3.1 addition (AI-enhanced):
      7. Semantic similarity                          → 0–20 pts (extra factor;
         cosine similarity between the seeker's resume text and the job
         description/requirements, via sentence-transformers/spaCy/TF-IDF —
         see semantic.py. Only added when a resume is present; total possible
         points rescale to 140 in that case, keeping the base 100-point scale
         intact for seekers without a resume).

    Milestone 4 additions (weighted scoring, enhanced recommendation engine):
      8. Job-type / education preference alignment    → 0–10 pts (extra factor)
      9. Remote-preference strength                    → 0–10 pts (extra factor;
         distinct from the existing work-mode match — this rewards an explicit
         open_to_remote=True seeker more when the job is remote, on top of #3)
     10. Recent-activity engagement bonus               → 0–5 pts (extra factor;
         seekers who have swiped/saved/applied recently get a small boost on
         jobs that overlap with their recent swipe activity, since an active
         seeker's recent behaviour is the freshest preference signal we have)
    """
    score = 0.0
    reasons = []
    max_points = 100.0

    profile = getattr(job_seeker, 'profile', None)
    # job seeker skills — we'll derive from saved/applied jobs' required skills
    # since we don't yet have an explicit skill list on UserProfile in M1.

    # ── 1. Skill overlap ──────────────────────────────────────────────────────
    job_skills = set(job.skills_required.values_list('name', flat=True))
    if job_skills:
        # Proxy: skills from jobs the seeker previously swiped right on / saved
        seeker_skill_jobs = Job.objects.filter(
            Q(saved_by__job_seeker=job_seeker) | Q(swipes__job_seeker=job_seeker, swipes__direction='right')
        ).distinct()
        seeker_skills = set()
        for sj in seeker_skill_jobs:
            seeker_skills.update(sj.skills_required.values_list('name', flat=True))

        # Milestone 3: blend resume skills straight into the same proxy pool so
        # a fresh account with an uploaded resume still gets meaningful matches.
        resume_skills = _get_resume_skills(job_seeker)
        seeker_skills |= resume_skills

        overlap = job_skills & seeker_skills
        ratio   = len(overlap) / len(job_skills) if job_skills else 0
        pts     = ratio * 40
        score  += pts
        if overlap:
            reasons.append(f"Matching skills: {', '.join(list(overlap)[:3])}")

    # ── 2. Location preference ────────────────────────────────────────────────
    if profile and profile.preferred_locations:
        pref_locs = [l.lower() for l in profile.preferred_locations]
        job_loc   = (job.location or '').lower()
        if any(loc in job_loc or job_loc in loc for loc in pref_locs):
            score += 20
            reasons.append(f"Matches preferred location: {job.location}")
        elif job.work_mode == 'remote':
            score += 10
            reasons.append("Remote position")

    elif job.work_mode == 'remote':
        score += 10
        reasons.append("Remote position")

    # ── 3. Work-mode preference ───────────────────────────────────────────────
    if profile and profile.open_to_remote and job.work_mode == 'remote':
        score += 15
        if "Remote position" not in reasons:
            reasons.append("Open to remote")
    elif profile and not profile.open_to_remote and job.work_mode == 'onsite':
        score += 10
        reasons.append("On-site preference match")

    # ── 4. Experience level ───────────────────────────────────────────────────
    if profile:
        yoe = profile.years_of_experience
        level = job.experience_level
        match = (
            (level == 'fresher' and yoe == 0) or
            (level == 'junior'  and 1 <= yoe <= 3) or
            (level == 'mid'     and 3 <= yoe <= 6) or
            (level == 'senior'  and 6 <= yoe <= 10) or
            (level == 'lead'    and yoe >= 10)
        )
        if match:
            score += 15
            reasons.append(f"Experience level match ({level})")

    # ── 5. Freshness bonus ────────────────────────────────────────────────────
    from django.utils import timezone
    from datetime import timedelta
    if job.published_at:
        days_old = (timezone.now() - job.published_at).days
        if days_old <= 1:
            score += 10
            reasons.append("Posted today")
        elif days_old <= 7:
            score += 5
            reasons.append("Posted this week")

    # ── 6. Resume skill match (Milestone 3) ───────────────────────────────────
    resume_skills = _get_resume_skills(job_seeker)
    if resume_skills and job_skills:
        max_points += 20.0
        resume_overlap = job_skills & resume_skills
        resume_ratio = len(resume_overlap) / len(job_skills) if job_skills else 0
        resume_pts = resume_ratio * 20
        score += resume_pts
        if resume_overlap:
            reasons.append(f"Resume matches: {', '.join(list(resume_overlap)[:3])}")

    # ── 7. Semantic similarity (Milestone 3.1 — AI-enhanced) ──────────────────
    resume = _get_resume(job_seeker)
    if resume and resume.raw_text:
        job_text = ' '.join(filter(None, [job.title, job.description, job.requirements]))
        similarity = semantic_similarity(resume.raw_text, job_text)
        max_points += 20.0
        semantic_pts = similarity * 20
        score += semantic_pts
        if similarity >= 0.5:
            reasons.append("Strong semantic match with job description")
        elif similarity >= 0.3:
            reasons.append("Good semantic match with job description")

    # ── 8. Job-type preference (Milestone 4) ──────────────────────────────────
    if profile and profile.preferred_job_types:
        max_points += 10.0
        if job.job_type in profile.preferred_job_types:
            score += 10
            reasons.append(f"Matches preferred job type ({job.get_job_type_display()})")

    # ── 9. Remote-preference strength (Milestone 4) ────────────────────────────
    max_points += 10.0
    if profile and profile.open_to_remote and job.work_mode in ('remote', 'hybrid'):
        remote_pts = 10 if job.work_mode == 'remote' else 6
        score += remote_pts
        reasons.append("Aligned with your remote-work preference")

    # ── 10. Recent-activity engagement bonus (Milestone 4) ─────────────────────
    max_points += 5.0
    recent_cutoff = timezone.now() - timedelta(days=14)
    recent_swiped_right_skills = set()
    for sw in SwipeHistory.objects.filter(
        job_seeker=job_seeker, direction='right', swiped_at__gte=recent_cutoff
    ).select_related('job').prefetch_related('job__skills_required')[:25]:
        recent_swiped_right_skills.update(sw.job.skills_required.values_list('name', flat=True))
    if recent_swiped_right_skills and job_skills & recent_swiped_right_skills:
        score += 5
        reasons.append("Similar to jobs you've recently shown interest in")

    return min(score / max_points, 1.0), reasons


def build_recommendation_explanation(job_seeker, job) -> dict:
    """
    Milestone 4 — human-readable explanation for a single recommendation, e.g.

        {
          "matched": ["Python", "React", "NLP"],
          "missing": ["Docker", "AWS"],
          "ats_score": 92,
          "summary": "Matched because Python, React, NLP · 92% ATS Score · Missing Docker, AWS"
        }
    """
    job_skills = set(job.skills_required.values_list('name', flat=True))
    resume = _get_resume(job_seeker)
    resume_skills = set(resume.all_skills) if resume else set()

    matched = sorted(job_skills & resume_skills)
    missing = sorted(job_skills - resume_skills)

    ats_score = None
    if resume:
        try:
            from apps.resumes.services import get_or_compute_ats
            ats_score = round(get_or_compute_ats(resume, job).overall_score)
        except Exception:
            ats_score = None

    summary_parts = []
    if matched:
        summary_parts.append(f"Matched because {', '.join(matched[:4])}")
    if ats_score is not None:
        summary_parts.append(f"{ats_score}% ATS Score")
    if missing:
        summary_parts.append(f"Missing {', '.join(missing[:4])}")
    summary = ' · '.join(summary_parts) if summary_parts else 'Based on your profile and swipe activity'

    return {
        'matched': matched,
        'missing': missing,
        'ats_score': ats_score,
        'summary': summary,
    }


def generate_recommendations_for_user(job_seeker, limit=50):
    """
    Generate / refresh Recommendation rows for a job seeker.
    Only considers published jobs not yet swiped.
    """
    already_swiped = SwipeHistory.objects.filter(job_seeker=job_seeker).values_list('job_id', flat=True)

    jobs = Job.objects.filter(
        status=Job.Status.PUBLISHED
    ).exclude(
        id__in=already_swiped
    ).select_related('company').prefetch_related('skills_required')[:limit * 2]

    created = []
    for job in jobs:
        sc, reasons = compute_recommendation_score(job_seeker, job)
        explanation = build_recommendation_explanation(job_seeker, job)
        rec, _ = Recommendation.objects.update_or_create(
            job_seeker=job_seeker, job=job,
            defaults={'score': sc, 'reasons': reasons, 'explanation': explanation}
        )
        created.append(rec)

    created.sort(key=lambda r: r.score, reverse=True)
    return created[:limit]


def get_job_feed(job_seeker, filters=None, search=None):
    """
    Returns an ordered queryset for the job seeker's feed.
    Priority: recommended jobs first, then latest, then rest.
    Applies optional filters and search.
    """
    already_swiped = SwipeHistory.objects.filter(job_seeker=job_seeker).values_list('job_id', flat=True)
    qs = Job.objects.filter(status=Job.Status.PUBLISHED).exclude(id__in=already_swiped)
    qs = _apply_filters(qs, filters)
    qs = _apply_search(qs, search)
    return qs.select_related('company').prefetch_related('skills_required').order_by('-published_at')


def _apply_filters(qs, filters):
    if not filters:
        return qs

    if filters.get('job_type'):
        qs = qs.filter(job_type=filters['job_type'])
    if filters.get('work_mode'):
        qs = qs.filter(work_mode=filters['work_mode'])
    if filters.get('experience_level'):
        qs = qs.filter(experience_level=filters['experience_level'])
    if filters.get('location'):
        qs = qs.filter(location__icontains=filters['location'])
    if filters.get('company_type'):
        qs = qs.filter(company__company_type=filters['company_type'])
    if filters.get('salary_min'):
        qs = qs.filter(salary_max__gte=filters['salary_min'])
    if filters.get('salary_max'):
        qs = qs.filter(salary_min__lte=filters['salary_max'])
    if filters.get('skills'):
        skill_list = [s.strip() for s in filters['skills'].split(',') if s.strip()]
        qs = qs.filter(skills_required__name__in=skill_list).distinct()
    if filters.get('fresher_friendly'):
        qs = qs.filter(is_fresher_friendly=True)
    if filters.get('low_competition'):
        qs = qs.filter(competition_level='low')
    if filters.get('recently_posted'):
        from django.utils import timezone
        from datetime import timedelta
        cutoff = timezone.now() - timedelta(days=7)
        qs = qs.filter(published_at__gte=cutoff)
    return qs


def _apply_search(qs, search):
    if not search:
        return qs
    return qs.filter(
        Q(title__icontains=search) |
        Q(company__name__icontains=search) |
        Q(skills_required__name__icontains=search)
    ).distinct()
