"""
SwipeX Analytics Services — Milestone 4

Skill Gap Analysis engine + Dashboard aggregation helpers. Everything here
reads from existing Milestone 1-3 models (Job, JobApplication, Recommendation,
Resume, ATSScore) — no Milestone 2/3 behaviour is modified.
"""

from collections import Counter
from datetime import timedelta

from django.utils import timezone


# A small curated map of learning-resource suggestions for common skills.
# Falls back to a generic suggestion for anything not in this table.
LEARNING_SUGGESTIONS = {
    'python':      'Build 2-3 small projects in Python and practice on HackerRank/LeetCode.',
    'javascript':  'Work through a modern JS course (ES6+) and build an interactive project.',
    'react':       'Build a multi-page app with React Router, hooks, and a public API.',
    'django':      'Build a REST API with Django REST Framework and deploy it.',
    'docker':      'Containerize one of your existing projects and deploy it with Docker Compose.',
    'aws':         'Complete AWS Cloud Practitioner fundamentals and deploy a small app on EC2/S3.',
    'sql':         'Practice writing joins/aggregations on a sample database (e.g. Kaggle datasets).',
    'kubernetes':  'Learn core k8s concepts (pods, deployments, services) via a local minikube cluster.',
    'node.js':     'Build a small REST API with Express/Node and connect it to a database.',
    'typescript':  'Convert an existing JS project to TypeScript to learn its type system.',
    'machine learning': 'Complete a hands-on ML course and build an end-to-end model + demo.',
    'git':         'Practice branching, merging, and resolving conflicts in a personal repo.',
    'rest api':    'Design and document a REST API for a small project using OpenAPI/Swagger.',
    'graphql':     'Build a small GraphQL API and consume it from a frontend client.',
    'ci/cd':       'Set up a GitHub Actions pipeline that runs tests and deploys automatically.',
    'html':        'Practice semantic HTML + accessible markup on a portfolio site.',
    'css':         'Learn Flexbox/Grid deeply and rebuild a design from a reference screenshot.',
    'tailwind':    'Rebuild a small UI kit using Tailwind CSS utility classes.',
    'testing':     'Add unit + integration tests to an existing project (pytest/Jest).',
}

GENERIC_SUGGESTION = 'Look for a short course, official docs, or a small project to build hands-on experience.'


def _suggestion_for(skill_name: str) -> str:
    return LEARNING_SUGGESTIONS.get(skill_name.strip().lower(), GENERIC_SUGGESTION)


def _get_resume(job_seeker):
    try:
        from apps.resumes.services import get_primary_resume
        return get_primary_resume(job_seeker)
    except Exception:
        return None


def compute_skill_gap(job_seeker, job=None):
    """
    Compare the job seeker's resume skills against either a specific Job's
    required skills, or (when job is None) the union of skills required by
    their current top-20 recommended jobs — a proxy for "target role".

    Returns a dict: matched_skills, missing_skills, priority_skills,
    learning_suggestions, match_percentage.
    """
    resume = _get_resume(job_seeker)
    resume_skills = set(resume.all_skills) if resume else set()

    if job is not None:
        required_skill_names = list(job.skills_required.values_list('name', flat=True))
        preferred_skill_names = list(job.skills_preferred.values_list('name', flat=True))
        target_skills = required_skill_names + [s for s in preferred_skill_names if s not in required_skill_names]
        weight_lookup = {name: 2 for name in required_skill_names}
        for name in preferred_skill_names:
            weight_lookup.setdefault(name, 1)
    else:
        from apps.jobs.models import Recommendation
        recs = Recommendation.objects.filter(job_seeker=job_seeker).select_related('job').prefetch_related(
            'job__skills_required'
        ).order_by('-score')[:20]
        counter = Counter()
        for rec in recs:
            for name in rec.job.skills_required.values_list('name', flat=True):
                counter[name] += 1
        target_skills = [name for name, _ in counter.most_common(25)]
        weight_lookup = dict(counter)

    resume_lower = {s.lower() for s in resume_skills}
    matched, missing = [], []
    for skill in target_skills:
        if skill.lower() in resume_lower or any(
            skill.lower() in rs or rs in skill.lower() for rs in resume_lower
        ):
            matched.append(skill)
        else:
            missing.append(skill)

    # Priority = missing skills ranked by weight/frequency (most important first)
    priority_skills = sorted(missing, key=lambda s: -weight_lookup.get(s, 0))

    learning_suggestions = [
        {'skill': s, 'suggestion': _suggestion_for(s)} for s in priority_skills[:8]
    ]

    match_percentage = round((len(matched) / len(target_skills)) * 100, 1) if target_skills else 100.0

    return {
        'matched_skills': matched,
        'missing_skills': missing,
        'priority_skills': priority_skills,
        'learning_suggestions': learning_suggestions,
        'match_percentage': match_percentage,
        'has_resume': resume is not None,
    }


# ── Dashboard: Job Seeker ──────────────────────────────────────────────────────

def seeker_dashboard_data(user, request=None):
    from apps.jobs.models import JobApplication, SavedJob, Recommendation, SwipeHistory
    from apps.jobs.serializers import RecommendationSerializer, JobApplicationSerializer
    ctx = {'request': request}

    applications = JobApplication.objects.filter(job_seeker=user).select_related('job', 'job__company')
    saved_jobs = SavedJob.objects.filter(job_seeker=user)
    recs = Recommendation.objects.filter(job_seeker=user).select_related('job', 'job__company').order_by('-score')[:5]

    Status = JobApplication.Status
    interviews = applications.filter(
        status__in=[Status.INTERVIEW_SCHEDULED, Status.INTERVIEW_COMPLETED]
    ).count()

    # Resume score = latest computed ATS overall_score across this user's applications/resumes
    resume_score = None
    match_score_trend = []
    resume_improvement_trend = []
    try:
        from apps.resumes.models import Resume, ATSScore
        resume = Resume.objects.filter(user=user, is_primary=True).first()
        if resume:
            scores_qs = ATSScore.objects.filter(resume=resume).order_by('computed_at')[:30]
            scores = list(scores_qs)
            if scores:
                resume_score = round(scores[-1].overall_score, 1)
                match_score_trend = [
                    {'date': s.computed_at.date().isoformat(), 'score': round(s.overall_score, 1)}
                    for s in scores
                ]
                resume_improvement_trend = [
                    {
                        'date': s.computed_at.date().isoformat(),
                        'skill_match': round(s.skill_match, 1),
                        'keyword_match': round(s.keyword_match, 1),
                        'experience_match': round(s.experience_match, 1),
                        'education_match': round(s.education_match, 1),
                    }
                    for s in scores
                ]
    except Exception:
        pass

    avg_match_percentage = None
    if recs:
        avg_match_percentage = round(sum(r.match_percentage for r in recs) / len(recs), 1)

    # Application timeline: applications per day over the last 30 days
    since = timezone.now() - timedelta(days=30)
    timeline_counter = Counter()
    for app in applications.filter(applied_at__gte=since):
        timeline_counter[app.applied_at.date().isoformat()] += 1
    application_timeline = [
        {'date': d, 'count': c} for d, c in sorted(timeline_counter.items())
    ]

    status_distribution = dict(
        Counter(applications.values_list('status', flat=True))
    )

    skill_gap = compute_skill_gap(user)

    recent_activity = []
    for app in applications.order_by('-updated_at')[:5]:
        recent_activity.append({
            'type': 'application',
            'title': f"{app.get_status_display()} — {app.job.title}",
            'timestamp': app.updated_at,
        })
    for swipe in SwipeHistory.objects.filter(job_seeker=user).select_related('job').order_by('-swiped_at')[:5]:
        recent_activity.append({
            'type': 'swipe',
            'title': f"Swiped {swipe.direction} on {swipe.job.title}",
            'timestamp': swipe.swiped_at,
        })
    recent_activity.sort(key=lambda a: a['timestamp'], reverse=True)
    recent_activity = recent_activity[:8]

    return {
        'resume_score': resume_score,
        'average_match_percentage': avg_match_percentage,
        'applications_count': applications.count(),
        'saved_jobs_count': saved_jobs.count(),
        'interviews_count': interviews,
        'skill_gap': {
            'matched_count': len(skill_gap['matched_skills']),
            'missing_count': len(skill_gap['missing_skills']),
            'match_percentage': skill_gap['match_percentage'],
            'priority_skills': skill_gap['priority_skills'][:5],
        },
        'top_recommended_jobs': RecommendationSerializer(recs, many=True, context=ctx).data,
        'recent_activity': recent_activity,
        'charts': {
            'application_timeline': application_timeline,
            'status_distribution': status_distribution,
            'match_score_trend': match_score_trend,
            'resume_improvement_trend': resume_improvement_trend,
        },
    }


# ── Dashboard: Recruiter ───────────────────────────────────────────────────────

def recruiter_dashboard_data(user):
    from django.db.models import Count, Q
    from apps.jobs.models import Job, JobApplication

    jobs = Job.objects.filter(recruiter=user).annotate(
        live_applicant_count=Count('applications', distinct=True)
    )
    applications = JobApplication.objects.filter(job__recruiter=user).select_related('job', 'job_seeker')

    Status = JobApplication.Status
    hiring_funnel = [
        {'stage': 'Applied',              'count': applications.filter(status=Status.PENDING).count()},
        {'stage': 'Resume Reviewed',       'count': applications.filter(status=Status.REVIEWED).count()},
        {'stage': 'Shortlisted',            'count': applications.filter(status=Status.SHORTLISTED).count()},
        {'stage': 'Interview Scheduled',     'count': applications.filter(status=Status.INTERVIEW_SCHEDULED).count()},
        {'stage': 'Interview Completed',      'count': applications.filter(status=Status.INTERVIEW_COMPLETED).count()},
        {'stage': 'Offered',                   'count': applications.filter(status=Status.OFFERED).count()},
        {'stage': 'Accepted',                   'count': applications.filter(status=Status.ACCEPTED).count()},
    ]

    # Milestone 4 fix: compute applicant counts live from JobApplication rows
    # instead of the cached Job.applicant_count field. That field is only
    # bumped inside the `apply_to_job` view, so it can silently drift from
    # reality (e.g. applications created any other way) — a live COUNT()
    # annotation is always correct and costs one extra join, not a query
    # per job.
    most_popular_jobs = list(
        jobs.order_by('-live_applicant_count').values('id', 'title')[:5]
    )
    popular_counts = dict(jobs.values_list('id', 'live_applicant_count'))
    for j in most_popular_jobs:
        j['applicant_count'] = popular_counts.get(j['id'], 0)

    applications_per_job = list(
        jobs.order_by('-live_applicant_count').values('title', 'live_applicant_count')[:10]
    )
    applications_per_job = [{'job': j['title'], 'count': j['live_applicant_count']} for j in applications_per_job]

    average_ats_score = None
    candidate_skill_distribution = []
    try:
        from apps.resumes.models import Resume
        from apps.resumes.services import get_or_compute_ats
        scores = []
        skill_counter = Counter()
        for app in applications:
            resume = Resume.objects.filter(
                user=app.job_seeker, is_primary=True, parse_status=Resume.ParseStatus.SUCCESS
            ).first()
            if resume:
                scores.append(get_or_compute_ats(resume, app.job).overall_score)
                skill_counter.update(resume.all_skills)
        if scores:
            average_ats_score = round(sum(scores) / len(scores), 1)
        candidate_skill_distribution = [
            {'skill': s, 'count': c} for s, c in skill_counter.most_common(10)
        ]
    except Exception:
        pass

    return {
        'jobs_posted': jobs.count(),
        'applications_received': applications.count(),
        'shortlisted': applications.filter(status=Status.SHORTLISTED).count(),
        'hiring_funnel': hiring_funnel,
        'most_popular_jobs': most_popular_jobs,
        'average_ats_score': average_ats_score,
        'candidate_skill_distribution': candidate_skill_distribution,
        'charts': {
            'applications_per_job': applications_per_job,
            'hiring_funnel': hiring_funnel,
        },
    }


# ── Application history (job seeker) ───────────────────────────────────────────

def application_history_data(user):
    from apps.jobs.models import JobApplication
    from apps.jobs.serializers import JobApplicationSerializer

    applications = JobApplication.objects.filter(job_seeker=user).select_related('job', 'job__company').order_by('-applied_at')

    Status = JobApplication.Status
    dashboard_cards = {
        'total_applied':   applications.count(),
        'under_review':    applications.filter(status__in=[Status.PENDING, Status.REVIEWED]).count(),
        'interviews':      applications.filter(status__in=[Status.INTERVIEW_SCHEDULED, Status.INTERVIEW_COMPLETED]).count(),
        'rejected':        applications.filter(status=Status.REJECTED).count(),
        'offers':          applications.filter(status__in=[Status.OFFERED, Status.ACCEPTED]).count(),
    }

    status_distribution = dict(Counter(applications.values_list('status', flat=True)))

    return {
        'dashboard_cards': dashboard_cards,
        'charts': {
            'status_distribution': status_distribution,
        },
        'applications': JobApplicationSerializer(applications, many=True).data,
    }
