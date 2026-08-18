import React from 'react'
import { Link } from 'react-router-dom'
import { useSeekerStats } from '../../hooks/useJobs'
import { useSeekerDashboard } from '../../hooks/useAnalytics'
import LineChart from '../charts/LineChart'
import DonutChart from '../charts/DonutChart'
import ProgressBar from '../charts/ProgressBar'
import { STATUS_LABELS } from '../../constants/applicationStatus'

export default function JobSeekerDashboard({ user }) {
  const { stats, loading } = useSeekerStats()
  const { data: analytics, loading: analyticsLoading } = useSeekerDashboard()

  const cards = [
    { label: 'Saved Jobs',      value: stats?.saved_jobs     ?? '–', link: '/jobs/saved',   color: 'text-coral' },
    { label: 'Applications',    value: stats?.applied_jobs   ?? '–', link: '/jobs/applied', color: 'text-teal' },
    { label: 'Total Swipes',    value: stats?.swipe_count    ?? '–', link: '/jobs',         color: 'text-ink' },
    { label: 'Recommendations', value: stats?.recommendations ?? '–', link: '/jobs',        color: 'text-ink' },
  ]

  const matchTrendData = (analytics?.charts?.match_score_trend || []).map(p => ({
    label: new Date(p.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
    value: p.score,
  }))

  const statusDist = Object.entries(analytics?.charts?.status_distribution || {}).map(([k, v]) => ({
    label: STATUS_LABELS[k] || k,
    value: v,
  }))

  return (
    <div>
      <p className="text-sm uppercase tracking-wide text-coral font-medium">Job Seeker Workspace</p>
      <h1 className="mt-1 font-display text-4xl font-semibold text-ink">
        Hey {user.first_name || 'there'} — ready to swipe?
      </h1>
      <p className="mt-2 max-w-xl text-slate">
        Discover jobs tailored to your skills. Swipe right to save and apply, left to skip.
      </p>

      {!user.is_profile_complete && (
        <div className="mt-5 flex items-center justify-between rounded-card border border-coral/20 bg-coral/5 px-5 py-3">
          <p className="text-sm text-ink">Complete your profile to unlock better recommendations.</p>
          <Link to="/profile" className="text-sm font-medium text-coral hover:underline ml-4 flex-shrink-0">Finish profile →</Link>
        </div>
      )}

      <div className="mt-8 grid gap-4 grid-cols-2 sm:grid-cols-4">
        {cards.map(({ label, value, link, color }) => (
          <Link key={label} to={link}
            className="rounded-card border border-ink/8 bg-white p-5 shadow-card hover:shadow-lg transition-shadow">
            <p className="text-sm text-slate">{label}</p>
            <p className={`mt-2 font-display text-3xl font-semibold ${color}`}>
              {loading ? <span className="animate-pulse">–</span> : value}
            </p>
          </Link>
        ))}
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Link to="/jobs"
          className="rounded-card border border-ink/8 bg-ink p-6 shadow-card hover:bg-ink/90 transition">
          <p className="text-2xl mb-2">🔍</p>
          <p className="font-display text-lg font-semibold text-paper">Browse Feed</p>
          <p className="mt-1 text-sm text-paper/60">Swipe through personalised job cards</p>
        </Link>
        <Link to="/jobs/saved"
          className="rounded-card border border-coral/20 bg-coral/5 p-6 shadow-card hover:bg-coral/10 transition">
          <p className="text-2xl mb-2">♥</p>
          <p className="font-display text-lg font-semibold text-coral">Saved Jobs</p>
          <p className="mt-1 text-sm text-coral/70">Review your bookmarked jobs</p>
        </Link>
        <Link to="/jobs/applied"
          className="rounded-card border border-teal/20 bg-teal/5 p-6 shadow-card hover:bg-teal/10 transition">
          <p className="text-2xl mb-2">📋</p>
          <p className="font-display text-lg font-semibold text-teal">My Applications</p>
          <p className="mt-1 text-sm text-teal/70">Track your application statuses</p>
        </Link>
      </div>

      {stats && stats.right_swipes > 0 && (
        <div className="mt-6 rounded-card border border-ink/8 bg-white p-5 shadow-card">
          <p className="text-sm font-semibold text-ink mb-3">Swipe Activity</p>
          <div className="flex gap-8 text-center">
            <div>
              <p className="font-display text-2xl font-semibold text-teal">{stats.right_swipes}</p>
              <p className="text-xs text-slate">Saved</p>
            </div>
            <div>
              <p className="font-display text-2xl font-semibold text-coral">{stats.swipe_count - stats.right_swipes}</p>
              <p className="text-xs text-slate">Skipped</p>
            </div>
            {stats.shortlisted > 0 && (
              <div>
                <p className="font-display text-2xl font-semibold text-purple-600">{stats.shortlisted}</p>
                <p className="text-xs text-slate">Shortlisted</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Milestone 4: Analytics ─────────────────────────────────────────── */}
      <p className="mt-10 text-sm font-medium text-slate uppercase tracking-wide">Career Analytics</p>

      <div className="mt-3 grid gap-4 grid-cols-2 sm:grid-cols-4">
        {[
          { label: 'Resume Score',     value: analytics?.resume_score != null ? `${Math.round(analytics.resume_score)}%` : '–' },
          { label: 'Avg. Match',       value: analytics?.average_match_percentage != null ? `${Math.round(analytics.average_match_percentage)}%` : '–' },
          { label: 'Interviews',       value: analytics?.interviews_count ?? '–' },
          { label: 'Skill Coverage',   value: analytics?.skill_gap?.match_percentage != null ? `${Math.round(analytics.skill_gap.match_percentage)}%` : '–' },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-card border border-ink/8 bg-white p-4 shadow-card">
            <p className="text-xs text-slate">{label}</p>
            <p className="mt-1.5 font-display text-2xl font-semibold text-ink">
              {analyticsLoading ? <span className="animate-pulse">–</span> : value}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded-card border border-ink/8 bg-white p-5 shadow-card">
          <p className="text-sm font-semibold text-ink mb-3">Match Score Trend</p>
          {analyticsLoading ? (
            <div className="h-40 animate-pulse rounded-lg bg-sand/50" />
          ) : (
            <LineChart data={matchTrendData} />
          )}
        </div>

        <div className="rounded-card border border-ink/8 bg-white p-5 shadow-card">
          <p className="text-sm font-semibold text-ink mb-3">Application Status</p>
          {analyticsLoading ? (
            <div className="h-40 animate-pulse rounded-lg bg-sand/50" />
          ) : (
            <DonutChart data={statusDist} />
          )}
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded-card border border-ink/8 bg-white p-5 shadow-card">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-ink">Skill Gap</p>
            <Link to="/skill-gap" className="text-xs font-medium text-coral hover:underline">View details →</Link>
          </div>
          {analyticsLoading ? (
            <div className="h-16 animate-pulse rounded-lg bg-sand/50" />
          ) : (
            <>
              <ProgressBar
                value={analytics?.skill_gap?.match_percentage ?? 0}
                color={
                  (analytics?.skill_gap?.match_percentage ?? 0) >= 70 ? 'bg-teal'
                  : (analytics?.skill_gap?.match_percentage ?? 0) >= 40 ? 'bg-amber-500' : 'bg-coral'
                }
              />
              {analytics?.skill_gap?.priority_skills?.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {analytics.skill_gap.priority_skills.map(s => (
                    <span key={s} className="rounded-full bg-coral/10 px-2.5 py-0.5 text-xs text-coral">{s}</span>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        <div className="rounded-card border border-ink/8 bg-white p-5 shadow-card">
          <p className="text-sm font-semibold text-ink mb-3">Recent Activity</p>
          {analyticsLoading ? (
            <div className="h-16 animate-pulse rounded-lg bg-sand/50" />
          ) : analytics?.recent_activity?.length ? (
            <ul className="space-y-2.5">
              {analytics.recent_activity.map((a, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-ink">
                  <span className="h-1.5 w-1.5 rounded-full bg-teal flex-shrink-0" />
                  <span className="truncate">{a.title}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate">No recent activity yet.</p>
          )}
        </div>
      </div>

      {analytics?.top_recommended_jobs?.length > 0 && (
        <div className="mt-4 rounded-card border border-ink/8 bg-white p-5 shadow-card">
          <p className="text-sm font-semibold text-ink mb-3">Top Recommended Jobs</p>
          <div className="space-y-3">
            {analytics.top_recommended_jobs.slice(0, 3).map(rec => (
              <Link
                key={rec.id}
                to={`/jobs/${rec.job}`}
                className="block rounded-lg border border-ink/8 p-3 hover:border-coral/30 hover:bg-sand/30 transition"
              >
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink truncate">{rec.job_detail?.title}</p>
                    <p className="text-xs text-slate">{rec.job_detail?.company_name}</p>
                  </div>
                  <span className="flex-shrink-0 rounded-full bg-teal/10 px-2.5 py-1 text-xs font-semibold text-teal">
                    {rec.match_percentage}%
                  </span>
                </div>
                {rec.explanation?.summary && (
                  <p className="mt-1.5 text-xs text-slate/80">{rec.explanation.summary}</p>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
