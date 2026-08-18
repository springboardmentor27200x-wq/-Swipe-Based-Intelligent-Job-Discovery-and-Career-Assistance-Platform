import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import PageShell from '../components/layout/PageShell'
import { jobService } from '../services/jobService'

const STATUS_OPTS = [
  'pending', 'reviewed', 'shortlisted', 'interview_scheduled',
  'interview_completed', 'offered', 'accepted', 'rejected', 'withdrawn',
]
const STATUS_LABELS = {
  pending:              'Applied',
  reviewed:             'Resume Reviewed',
  shortlisted:          'Shortlisted',
  interview_scheduled:  'Interview Scheduled',
  interview_completed:  'Interview Completed',
  offered:              'Offered',
  accepted:             'Accepted',
  rejected:             'Rejected',
  withdrawn:            'Withdrawn',
}
const STATUS_STYLES = {
  pending:              'bg-sand text-slate',
  reviewed:             'bg-blue-50 text-blue-700',
  shortlisted:          'bg-teal/10 text-teal',
  interview_scheduled:  'bg-purple-50 text-purple-700',
  interview_completed:  'bg-purple-100 text-purple-800',
  offered:              'bg-green-50 text-green-700',
  accepted:             'bg-green-100 text-green-800',
  rejected:             'bg-coral/10 text-coral',
  withdrawn:            'bg-gray-100 text-gray-500',
}

export default function RecruiterApplicantsPage() {
  const { id }    = useParams()
  const [apps, setApps]         = useState([])
  const [job, setJob]           = useState(null)
  const [loading, setLoading]   = useState(true)
  const [updating, setUpdating] = useState(null)

  useEffect(() => {
    Promise.all([
      jobService.recruiterJobDetail(id),
      jobService.recruiterApplicants(id),
    ]).then(([j, a]) => { setJob(j); setApps(a) })
      .finally(() => setLoading(false))
  }, [id])

  const changeStatus = async (appId, newStatus) => {
    setUpdating(appId)
    try {
      const updated = await jobService.updateApplicationStatus(id, appId, newStatus)
      setApps(prev => prev.map(a => a.id === appId ? { ...a, status: updated.status, status_display: updated.status_display } : a))
    } catch (e) { console.error(e) }
    finally { setUpdating(null) }
  }

  return (
    <PageShell>
      <div className="mb-6">
        <Link to="/recruiter/jobs" className="text-sm text-slate hover:text-coral">← Back to Jobs</Link>
        <h1 className="font-display text-3xl font-semibold text-ink mt-2">
          Applicants {job ? `— ${job.title}` : ''}
        </h1>
        <p className="text-slate text-sm mt-1">{apps.length} applicant{apps.length !== 1 ? 's' : ''}</p>
      </div>

      {loading && (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 rounded-full border-2 border-coral border-t-transparent animate-spin" />
        </div>
      )}

      {!loading && apps.length === 0 && (
        <div className="py-16 text-center text-slate">
          <p className="font-display text-xl text-ink">No applicants yet</p>
          <p className="mt-1 text-sm">Share the job to attract more candidates.</p>
        </div>
      )}

      <div className="space-y-4">
        {apps.map(app => (
          <div key={app.id} className="rounded-card border border-ink/8 bg-white p-5 shadow-card">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <Link to={`/recruiter/jobs/${id}/applicants/${app.id}`} className="group min-w-0">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-ink flex items-center justify-center text-paper text-sm font-bold flex-shrink-0">
                    {app.seeker_name?.[0] || app.seeker_email?.[0] || '?'}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-ink group-hover:text-coral transition-colors">{app.seeker_name || 'Job Seeker'}</p>
                    <p className="text-xs text-slate">{app.seeker_email}</p>
                  </div>
                  {app.ats_score != null && (
                    <span className="ml-2 flex-shrink-0 rounded-full bg-teal/10 px-2.5 py-0.5 text-xs font-bold text-teal">
                      ATS {Math.round(app.ats_score)}%
                    </span>
                  )}
                </div>
                {app.cover_note && (
                  <p className="mt-3 text-sm text-slate/80 max-w-lg line-clamp-2">{app.cover_note}</p>
                )}
                <p className="mt-2 text-xs text-slate/50">
                  Applied {new Date(app.applied_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </Link>

              <div className="flex items-center gap-3 flex-shrink-0">
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_STYLES[app.status]}`}>
                  {app.status_display || STATUS_LABELS[app.status] || app.status}
                </span>
                <select
                  value={app.status}
                  onChange={(e) => changeStatus(app.id, e.target.value)}
                  disabled={updating === app.id}
                  className="rounded-xl border border-ink/10 px-3 py-1.5 text-xs text-ink focus:outline-none focus:ring-2 focus:ring-coral/30 disabled:opacity-50"
                >
                  {STATUS_OPTS.map(s => (
                    <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                  ))}
                </select>
                <Link
                  to={`/recruiter/jobs/${id}/applicants/${app.id}`}
                  className="text-xs bg-ink text-paper px-3 py-1.5 rounded-lg hover:bg-ink/90 transition"
                >
                  View Profile →
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </PageShell>
  )
}
