import React from 'react'

const STAT_CARDS = [
  { label: 'Total users', value: '—', sub: 'Connect Milestone 4 analytics' },
  { label: 'Recruiters', value: '—', sub: 'Pending verification queue' },
  { label: 'Platform status', value: 'Healthy', sub: 'All systems operational' },
]

export default function AdminDashboard({ user }) {
  return (
    <div>
      <p className="text-sm uppercase tracking-wide text-coral">Admin workspace</p>
      <h1 className="mt-2 font-display text-4xl font-semibold text-ink">
        Platform overview
      </h1>
      <p className="mt-2 max-w-xl text-slate">
        User management, recruiter verification, and platform-wide analytics
        expand in later milestones. Core auth and role infrastructure is live.
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        {STAT_CARDS.map((c) => (
          <div key={c.label} className="rounded-card border border-ink/8 bg-white p-6 shadow-card">
            <p className="text-sm text-slate">{c.label}</p>
            <p className="mt-2 font-display text-3xl font-semibold text-ink">{c.value}</p>
            <p className="mt-1 text-xs text-slate/70">{c.sub}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 rounded-card border border-ink/8 bg-white p-6 shadow-card">
        <p className="text-sm text-slate">Signed in as</p>
        <p className="mt-1 font-display text-lg font-semibold text-ink">{user.email}</p>
        <p className="text-xs text-slate/70">Use the Django admin at /admin/ for full user management.</p>
      </div>
    </div>
  )
}
