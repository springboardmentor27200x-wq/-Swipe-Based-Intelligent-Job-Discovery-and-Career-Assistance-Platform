import React from 'react'
import { Link } from 'react-router-dom'

const ATS_BADGE_STYLES = {
  Excellent: 'bg-teal/10 text-teal',
  Good:      'bg-coral/10 text-coral',
  Fair:      'bg-yellow-50 text-yellow-700',
  Poor:      'bg-gray-100 text-gray-600',
}

export default function JobCard({ job, showActions = false, onSave, onUnsave }) {
  const salaryText = job.salary_visible && (job.salary_min || job.salary_max)
    ? `₹${job.salary_min ? (job.salary_min / 100000).toFixed(1) + 'L' : ''}${job.salary_max ? ' – ' + (job.salary_max / 100000).toFixed(1) + 'L' : ''}`
    : null

  return (
    <div className="rounded-card border border-ink/8 bg-white p-5 shadow-card hover:shadow-lg transition-shadow">
      <div className="flex items-start gap-4">
        {/* Logo placeholder */}
        <div className="h-11 w-11 rounded-xl bg-ink flex items-center justify-center text-paper font-bold text-base flex-shrink-0">
          {job.company_name?.[0] || '?'}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <Link to={`/jobs/${job.id}`} className="font-display text-lg font-semibold text-ink hover:text-coral transition-colors leading-tight">
                {job.title}
              </Link>
              <p className="text-sm text-slate mt-0.5">{job.company_name}</p>
            </div>
            {/* Milestone 3.1: single primary ATS Match Score badge (Match % removed) */}
            {job.ats_score != null && (
              <span className={`flex-shrink-0 rounded-full px-3 py-1 text-xs font-bold ${ATS_BADGE_STYLES[job.ats_compatibility] || 'bg-teal/10 text-teal'}`}>
                ATS {Math.round(job.ats_score)}%{job.ats_compatibility ? ` · ${job.ats_compatibility}` : ''}
              </span>
            )}
          </div>

          {/* Meta tags */}
          <div className="mt-3 flex flex-wrap gap-2">
            {[
              { label: job.work_mode, cls: 'bg-sand text-slate' },
              { label: job.job_type?.replace('_', ' '), cls: 'bg-sand text-slate' },
              { label: job.experience_level, cls: 'bg-sand text-slate' },
              { label: job.location, cls: 'bg-sand text-slate' },
              salaryText ? { label: salaryText, cls: 'bg-teal/10 text-teal' } : null,
            ].filter(Boolean).map(({ label, cls }) => label ? (
              <span key={label} className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${cls}`}>
                {label}
              </span>
            ) : null)}
          </div>

          {/* Skills */}
          {job.skills?.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {job.skills.slice(0, 5).map(s => (
                <span key={s} className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">{s}</span>
              ))}
              {job.skills.length > 5 && <span className="text-xs text-slate/60">+{job.skills.length - 5}</span>}
            </div>
          )}

          {/* Footer */}
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-3 text-xs text-slate/60">
              <span className={`flex items-center gap-1 ${
                job.competition_level === 'low' ? 'text-green-600' :
                job.competition_level === 'medium' ? 'text-yellow-600' : 'text-red-600'
              }`}>
                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                {job.competition_level} competition
              </span>
              {job.applicant_count > 0 && <span>{job.applicant_count} applicants</span>}
              {job.is_applied && <span className="text-teal font-medium">✓ Applied</span>}
              {job.is_saved && !job.is_applied && <span className="text-coral font-medium">♥ Saved</span>}
            </div>

            {showActions && (
              <div className="flex gap-2">
                {onSave && !job.is_saved && (
                  <button onClick={() => onSave(job.id)}
                    className="text-xs border border-coral/30 text-coral px-3 py-1 rounded-lg hover:bg-coral/5 transition">
                    Save
                  </button>
                )}
                {onUnsave && job.is_saved && (
                  <button onClick={() => onUnsave(job.id)}
                    className="text-xs border border-slate/30 text-slate px-3 py-1 rounded-lg hover:bg-sand transition">
                    Unsave
                  </button>
                )}
                <Link to={`/jobs/${job.id}`}
                  className="text-xs bg-ink text-paper px-3 py-1 rounded-lg hover:bg-ink/90 transition">
                  View →
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
