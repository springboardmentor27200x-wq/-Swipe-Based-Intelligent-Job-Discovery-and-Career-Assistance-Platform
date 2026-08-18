import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import PageShell from '../components/layout/PageShell'
import StatusTimeline from '../components/applications/StatusTimeline'
import DonutChart from '../components/charts/DonutChart'
import { useApplicationHistory } from '../hooks/useAnalytics'
import { STATUS_STYLES, STATUS_LABELS } from '../constants/applicationStatus'

export default function AppliedJobsPage() {
  const { data, loading } = useApplicationHistory()
  const [expandedId, setExpandedId] = useState(null)

  const apps = data?.applications || []
  const cards = data?.dashboard_cards

  const statusDist = Object.entries(data?.charts?.status_distribution || {}).map(([k, v]) => ({
    label: STATUS_LABELS[k] || k,
    value: v,
  }))

  return (
    <PageShell>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink">My Applications</h1>
          <p className="text-slate text-sm mt-1">
            {loading ? 'Loading…' : `${apps.length} application${apps.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <Link to="/jobs"
          className="rounded-xl bg-ink px-4 py-2 text-sm font-medium text-paper hover:bg-ink/90 transition">
          Browse More
        </Link>
      </div>

      {/* ── Milestone 4: Dashboard cards ─────────────────────────────────────── */}
      {cards && (
        <div className="mb-6 grid gap-4 grid-cols-2 sm:grid-cols-5">
          {[
            { label: 'Total Applied',  value: cards.total_applied,  color: 'text-ink' },
            { label: 'Under Review',   value: cards.under_review,   color: 'text-blue-600' },
            { label: 'Interviews',     value: cards.interviews,     color: 'text-purple-600' },
            { label: 'Rejected',       value: cards.rejected,       color: 'text-coral' },
            { label: 'Offers',         value: cards.offers,         color: 'text-green-600' },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-card border border-ink/8 bg-white p-4 shadow-card">
              <p className="text-xs text-slate">{label}</p>
              <p className={`mt-1.5 font-display text-2xl font-semibold ${color}`}>{value}</p>
            </div>
          ))}
        </div>
      )}

      {!loading && apps.length > 0 && (
        <div className="mb-8 rounded-card border border-ink/8 bg-white p-6 shadow-card">
          <p className="text-sm font-semibold text-ink mb-4">Status Distribution</p>
          <div className="max-w-md mx-auto sm:mx-0">
            <DonutChart data={statusDist} size={180} strokeWidth={22} />
          </div>
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 rounded-full border-2 border-coral border-t-transparent animate-spin" />
        </div>
      )}

      {!loading && apps.length === 0 && (
        <div className="py-16 text-center rounded-card border border-dashed border-ink/15">
          <p className="text-4xl mb-3">📋</p>
          <p className="font-display text-xl text-ink">No applications yet</p>
          <p className="mt-1 text-sm text-slate">Apply to jobs from the feed or a job detail page.</p>
          <Link to="/jobs"
            className="mt-4 inline-block rounded-xl bg-coral px-5 py-2.5 text-sm font-medium text-white">
            Browse Jobs
          </Link>
        </div>
      )}

      <div className="space-y-4">
        {apps.map(app => {
          const detail = app.job_detail || {}
          const isExpanded = expandedId === app.id
          return (
            <div key={app.id}
              className="rounded-card border border-ink/8 bg-white p-5 shadow-card">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div className="h-11 w-11 rounded-xl bg-ink flex items-center justify-center text-paper font-bold text-base flex-shrink-0">
                    {(detail.company_name || '?')[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/jobs/${app.job || detail.id}`}
                      className="font-display text-lg font-semibold text-ink hover:text-coral transition-colors"
                    >
                      {detail.title || 'Job'}
                    </Link>
                    <p className="text-sm text-slate mt-0.5">{detail.company_name}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {[detail.work_mode, detail.experience_level, detail.location]
                        .filter(Boolean)
                        .map(tag => (
                          <span key={tag}
                            className="rounded-full bg-sand px-2.5 py-0.5 text-xs text-slate capitalize">
                            {tag.replace(/_/g, ' ')}
                          </span>
                        ))}
                    </div>
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <span className={`inline-block rounded-full px-3 py-1 text-xs font-medium capitalize ${STATUS_STYLES[app.status] || STATUS_STYLES.pending}`}>
                    {app.status_display || STATUS_LABELS[app.status] || app.status}
                  </span>
                  <p className="mt-1 text-xs text-slate/60">
                    Applied {new Date(app.applied_at).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'short', year: 'numeric'
                    })}
                  </p>
                  <p className="mt-0.5 text-xs text-slate/50">
                    Updated {new Date(app.updated_at).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'short'
                    })}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setExpandedId(isExpanded ? null : app.id)}
                className="mt-4 text-xs font-medium text-coral hover:underline"
              >
                {isExpanded ? 'Hide timeline ▲' : 'View status timeline ▼'}
              </button>

              {isExpanded && (
                <div className="mt-4 pt-4 border-t border-ink/8">
                  <StatusTimeline status={app.status} statusHistory={app.status_history || []} />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </PageShell>
  )
}
