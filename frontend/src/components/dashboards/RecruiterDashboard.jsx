import React from 'react'
import { Link } from 'react-router-dom'
import { useRecruiterStats } from '../../hooks/useJobs'
import { useRecruiterDashboard } from '../../hooks/useAnalytics'
import BarChart from '../charts/BarChart'
import DonutChart from '../charts/DonutChart'

export default function RecruiterDashboard({ user }) {
  const { stats, loading } = useRecruiterStats()
  const { data: analytics, loading: analyticsLoading } = useRecruiterDashboard()

  const cards = [
    { label: 'Total Jobs',       value: stats?.total_jobs       ?? '–', color: 'text-ink' },
    { label: 'Active Jobs',      value: stats?.active_jobs      ?? '–', color: 'text-teal' },
    { label: 'Total Applicants', value: stats?.total_applicants ?? '–', color: 'text-coral' },
    { label: 'Draft Jobs',       value: stats?.draft_jobs       ?? '–', color: 'text-slate' },
  ]

  const pipelineCards = [
    { label: 'New Applications', value: stats?.new_applications ?? '–', color: 'text-ink' },
    { label: 'Shortlisted',      value: stats?.shortlisted      ?? '–', color: 'text-teal' },
    { label: 'Interviews',       value: stats?.interviews       ?? '–', color: 'text-purple-600' },
    { label: 'Offers',           value: stats?.offers           ?? '–', color: 'text-green-600' },
    { label: 'Rejected',         value: stats?.rejected         ?? '–', color: 'text-coral' },
    {
      label: 'Avg. ATS Score',
      value: stats?.average_ats_score != null ? `${Math.round(stats.average_ats_score)}%` : '–',
      color: 'text-ink',
    },
  ]

  const funnelData = (analytics?.charts?.hiring_funnel || []).map(f => ({ label: f.stage, value: f.count }))
  const perJobData = (analytics?.charts?.applications_per_job || []).map(j => ({ label: j.job, value: j.count }))
  const skillDist = (analytics?.candidate_skill_distribution || []).map(s => ({ label: s.skill, value: s.count }))

  return (
    <div>
      <p className="text-sm uppercase tracking-wide text-coral font-medium">Recruiter Workspace</p>
      <h1 className="mt-1 font-display text-4xl font-semibold text-ink">
        Welcome, {user.first_name || 'Recruiter'}
      </h1>
      <p className="mt-2 max-w-xl text-slate">
        Manage job postings, track applicants, and build your company profile.
      </p>

      <div className="mt-8 grid gap-4 grid-cols-2 sm:grid-cols-4">
        {cards.map(({ label, value, color }) => (
          <div key={label}
            className="rounded-card border border-ink/8 bg-white p-5 shadow-card">
            <p className="text-sm text-slate">{label}</p>
            <p className={`mt-2 font-display text-3xl font-semibold ${color}`}>
              {loading ? <span className="animate-pulse">–</span> : value}
            </p>
          </div>
        ))}
      </div>

      <p className="mt-8 text-sm font-medium text-slate uppercase tracking-wide">Recruitment Pipeline</p>
      <div className="mt-3 grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
        {pipelineCards.map(({ label, value, color }) => (
          <div key={label}
            className="rounded-card border border-ink/8 bg-white p-4 shadow-card">
            <p className="text-xs text-slate">{label}</p>
            <p className={`mt-1.5 font-display text-2xl font-semibold ${color}`}>
              {loading ? <span className="animate-pulse">–</span> : value}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Link to="/recruiter/jobs/new"
          className="rounded-card border border-ink/8 bg-ink p-6 shadow-card hover:bg-ink/90 transition">
          <p className="text-2xl mb-2">✍️</p>
          <p className="font-display text-lg font-semibold text-paper">Post a Job</p>
          <p className="mt-1 text-sm text-paper/60">Create a new job listing</p>
        </Link>
        <Link to="/recruiter/jobs"
          className="rounded-card border border-coral/20 bg-coral/5 p-6 shadow-card hover:bg-coral/10 transition">
          <p className="text-2xl mb-2">📋</p>
          <p className="font-display text-lg font-semibold text-coral">Manage Jobs</p>
          <p className="mt-1 text-sm text-coral/70">Edit, publish, or close listings</p>
        </Link>
        <Link to="/recruiter/company"
          className="rounded-card border border-teal/20 bg-teal/5 p-6 shadow-card hover:bg-teal/10 transition">
          <p className="text-2xl mb-2">🏢</p>
          <p className="font-display text-lg font-semibold text-teal">Company Profile</p>
          <p className="mt-1 text-sm text-teal/70">Update your company details</p>
        </Link>
      </div>

      {/* ── Milestone 4: Analytics ─────────────────────────────────────────── */}
      <p className="mt-10 text-sm font-medium text-slate uppercase tracking-wide">Hiring Analytics</p>

      <div className="mt-3 rounded-card border border-ink/8 bg-white p-5 shadow-card">
        <p className="text-sm font-semibold text-ink mb-3">Hiring Funnel</p>
        {analyticsLoading ? (
          <div className="h-40 animate-pulse rounded-lg bg-sand/50" />
        ) : (
          <BarChart data={funnelData} color="#0E6B6B" />
        )}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded-card border border-ink/8 bg-white p-5 shadow-card">
          <p className="text-sm font-semibold text-ink mb-3">Applications per Job</p>
          {analyticsLoading ? (
            <div className="h-40 animate-pulse rounded-lg bg-sand/50" />
          ) : (
            <BarChart data={perJobData} color="#14171C" />
          )}
        </div>

        <div className="rounded-card border border-ink/8 bg-white p-5 shadow-card">
          <p className="text-sm font-semibold text-ink mb-3">Candidate Skill Distribution</p>
          {analyticsLoading ? (
            <div className="h-40 animate-pulse rounded-lg bg-sand/50" />
          ) : (
            <DonutChart data={skillDist} />
          )}
        </div>
      </div>

      {analytics?.most_popular_jobs?.length > 0 && (
        <div className="mt-4 rounded-card border border-ink/8 bg-white p-5 shadow-card">
          <p className="text-sm font-semibold text-ink mb-3">Most Popular Jobs</p>
          <div className="space-y-2">
            {analytics.most_popular_jobs.map(job => (
              <Link
                key={job.id}
                to={`/recruiter/jobs/${job.id}/applicants`}
                className="flex items-center justify-between rounded-lg border border-ink/8 p-3 hover:border-coral/30 hover:bg-sand/30 transition"
              >
                <p className="text-sm font-medium text-ink truncate">{job.title}</p>
                <span className="flex-shrink-0 rounded-full bg-coral/10 px-2.5 py-1 text-xs font-semibold text-coral">
                  {job.applicant_count} applicants
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
