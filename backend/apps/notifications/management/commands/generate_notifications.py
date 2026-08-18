"""
SwipeX Milestone 4 — batch notification generator.

Run periodically (e.g. via cron / GitHub Actions schedule) to create the
"smart" notifications that aren't tied to a single instant event:

  Job seekers:
    - New job notification         (published jobs from the last run window)
    - Startup hiring alert          (job at a startup/newly-founded company, using
                                     the existing Company.company_type field)
    - High-match job alert          (recommendation score >= 80%)
    - Low-competition job alert     (competition_level == low, published recently)
    - Resume improvement reminder   (resume exists but has open ATS suggestions)
    - Saved job reminder            (job saved 3+ days ago, not yet applied)

  Recruiters:
    - Job expiration reminder       (deadline within the next 3 days)

Usage:
    python manage.py generate_notifications
    python manage.py generate_notifications --hours 24
"""

from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta

from apps.jobs.models import Job, JobApplication, SavedJob, Company
from apps.jobs.services import compute_recommendation_score
from apps.users.models import User
from apps.notifications import services as notif_services


class Command(BaseCommand):
    help = 'Generate Milestone 4 smart notifications (new job / startup hiring / high match / low competition / reminders).'

    def add_arguments(self, parser):
        parser.add_argument('--hours', type=int, default=24,
                            help='Look-back window (hours) for "new" jobs. Default 24.')

    def handle(self, *args, **options):
        hours = options['hours']
        cutoff = timezone.now() - timedelta(hours=hours)

        new_job_count = self._notify_new_and_matching_jobs(cutoff)
        startup_count = self._notify_startup_hiring(cutoff)
        low_comp_count = self._notify_low_competition(cutoff)
        reminder_count = self._notify_resume_reminders()
        saved_count = self._notify_saved_job_reminders()
        expiry_count = self._notify_job_expirations()

        self.stdout.write(self.style.SUCCESS(
            f"Notifications generated — new/high-match: {new_job_count}, "
            f"startup-hiring: {startup_count}, "
            f"low-competition: {low_comp_count}, resume reminders: {reminder_count}, "
            f"saved-job reminders: {saved_count}, job-expiration: {expiry_count}"
        ))

    # ── Job seekers ─────────────────────────────────────────────────────────

    def _notify_new_and_matching_jobs(self, cutoff):
        count = 0
        recent_jobs = Job.objects.filter(status=Job.Status.PUBLISHED, published_at__gte=cutoff)
        if not recent_jobs.exists():
            return 0

        seekers = User.objects.filter(role=User.Role.JOB_SEEKER, is_active=True)
        for job in recent_jobs:
            for seeker in seekers:
                if notif_services.recently_notified(seeker, job, 'new_job', hours=24 * 3) or \
                   notif_services.recently_notified(seeker, job, 'high_match', hours=24 * 3):
                    continue
                score, _reasons = compute_recommendation_score(seeker, job)
                if score >= 0.8:
                    notif_services.notify_high_match(seeker, job, score)
                    count += 1
                elif score >= 0.4:
                    notif_services.notify_new_job_match(seeker, job, score)
                    count += 1
        return count

    def _notify_startup_hiring(self, cutoff):
        """
        Milestone 4 — "Startup hiring alerts": distinct from the generic
        new-job/high-match notifications above. Fires specifically for jobs
        posted by companies whose `company_type` is a startup or newly
        founded startup (using the existing Company model — no fake data),
        sent to seekers whose profile reasonably matches the job.
        """
        count = 0
        startup_jobs = Job.objects.filter(
            status=Job.Status.PUBLISHED,
            published_at__gte=cutoff,
            company__company_type__in=[Company.CompanyType.STARTUP, Company.CompanyType.NEW_STARTUP],
        ).select_related('company')
        if not startup_jobs.exists():
            return 0

        seekers = User.objects.filter(role=User.Role.JOB_SEEKER, is_active=True)
        for job in startup_jobs:
            for seeker in seekers:
                if notif_services.recently_notified(seeker, job, 'startup_hiring', hours=24 * 7):
                    continue
                score, _reasons = compute_recommendation_score(seeker, job)
                if score >= 0.3:
                    notif_services.notify_startup_hiring(seeker, job)
                    count += 1
        return count

    def _notify_low_competition(self, cutoff):
        count = 0
        jobs = Job.objects.filter(
            status=Job.Status.PUBLISHED, competition_level=Job.CompetitionLevel.LOW, published_at__gte=cutoff
        )
        seekers = User.objects.filter(role=User.Role.JOB_SEEKER, is_active=True)
        for job in jobs:
            for seeker in seekers:
                if notif_services.recently_notified(seeker, job, 'low_competition', hours=24 * 7):
                    continue
                score, _reasons = compute_recommendation_score(seeker, job)
                if score >= 0.3:
                    notif_services.notify_low_competition(seeker, job)
                    count += 1
        return count

    def _notify_resume_reminders(self):
        count = 0
        try:
            from apps.resumes.models import Resume
        except Exception:
            return 0

        seekers_without_resume = User.objects.filter(
            role=User.Role.JOB_SEEKER, is_active=True
        ).exclude(id__in=Resume.objects.values_list('user_id', flat=True)).distinct()
        for seeker in seekers_without_resume:
            # No `job` is associated with this reminder type, so we dedupe on
            # (user, type) alone — without this check, a periodic cron run
            # would create a fresh "Improve your resume" notification every
            # single run, flooding the seeker's notification center.
            if notif_services.recently_notified(seeker, None, 'resume_reminder', hours=24 * 7):
                continue
            notif_services.notify_resume_improvement_reminder(seeker, suggestion_count=0)
            count += 1
        return count

    def _notify_saved_job_reminders(self):
        count = 0
        cutoff = timezone.now() - timedelta(days=3)
        saved = SavedJob.objects.filter(saved_at__lte=cutoff).select_related('job', 'job_seeker')
        applied_pairs = set(
            JobApplication.objects.values_list('job_seeker_id', 'job_id')
        )
        for s in saved:
            if (s.job_seeker_id, s.job_id) in applied_pairs:
                continue
            if s.job.status != Job.Status.PUBLISHED:
                continue
            if notif_services.recently_notified(s.job_seeker, s.job, 'saved_job_reminder', hours=24 * 7):
                continue
            notif_services.notify_saved_job_reminder(s.job_seeker, s.job)
            count += 1
        return count

    # ── Recruiters ──────────────────────────────────────────────────────────

    def _notify_job_expirations(self):
        count = 0
        today = timezone.now().date()
        soon = today + timedelta(days=3)
        jobs = Job.objects.filter(status=Job.Status.PUBLISHED, deadline__isnull=False,
                                  deadline__gte=today, deadline__lte=soon)
        for job in jobs:
            if notif_services.recently_notified(job.recruiter, job, 'job_expiration_reminder', hours=24 * 3):
                continue
            notif_services.notify_job_expiration(job)
            count += 1
        return count
