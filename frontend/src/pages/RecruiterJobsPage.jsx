import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PageShell from '../components/layout/PageShell'
import Button from '../components/ui/Button'
import { jobService } from '../services/jobService'
import { extractErrorMessage } from '../services/api'

const STATUS_PILL = {
  draft:     'bg-sand text-slate',
  published: 'bg-teal/10 text-teal',
  closed:    'bg-coral/10 text-coral',
  paused:    'bg-yellow-50 text-yellow-700',
}

export default function RecruiterJobsPage() {
  const [jobs, setJobs]       = useState([])
  const [loading, setLoading] = useState(true)
  const [actionId, setActionId] = useState(null)
  const [msg, setMsg]           = useState('')

  const load = () => {
    setLoading(true)
    jobService.recruiterJobs()
      .then(setJobs)
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const doPublish = async (id) => {
    setActionId(id); setMsg('')
    try {
      const updated = await jobService.publishJob(id)
      setJobs(prev => prev.map(j => j.id === id ? { ...j, status: updated.status } : j))
      setMsg('Job published successfully.')
    } catch (e) { setMsg(extractErrorMessage(e)) }
    finally { setActionId(null) }
  }

  const doClose = async (id) => {
    if (!confirm('Close this job? It will no longer appear in the feed.')) return
    setActionId(id); setMsg('')
    try {
      const updated = await jobService.closeJob(id)
      setJobs(prev => prev.map(j => j.id === id ? { ...j, status: updated.status } : j))
      setMsg('Job closed.')
    } catch (e) { setMsg(extractErrorMessage(e)) }
    finally { setActionId(null) }
  }

  const doDelete = async (id) => {
    if (!confirm('Delete this job permanently?')) return
    setActionId(id); setMsg('')
    try {
      await jobService.deleteJob(id)
      setJobs(prev => prev.filter(j => j.id !== id))
      setMsg('Job deleted.')
    } catch (e) { setMsg(extractErrorMessage(e)) }
    finally { setActionId(null) }
  }

  return (
    <PageShell>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink">My Job Posts</h1>
          <p className="text-slate text-sm mt-1">{jobs.length} total job{jobs.length !== 1 ? 's' : ''}</p>
        </div>
        <Link to="/recruiter/jobs/new">
          <Button variant="coral">+ Post a Job</Button>
        </Link>
      </div>

      {msg && (
        <div className="mb-4 rounded-xl bg-teal/10 px-4 py-3 text-sm text-teal">{msg}</div>
      )}

      {loading && (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 rounded-full border-2 border-coral border-t-transparent animate-spin" />
        </div>
      )}

      {!loading && jobs.length === 0 && (
        <div className="py-16 text-center rounded-card border border-dashed border-ink/15">
          <p className="font-display text-xl text-ink">No jobs posted yet</p>
          <p className="mt-1 text-sm text-slate">Create your first job posting to start receiving applications.</p>
          <Link to="/recruiter/jobs/new" className="mt-4 inline-block rounded-xl bg-coral px-5 py-2.5 text-sm font-medium text-white">
            Post a Job
          </Link>
        </div>
      )}

      <div className="space-y-4">
        {jobs.map(job => (
          <div key={job.id} className="rounded-card border border-ink/8 bg-white p-5 shadow-card">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <h2 className="font-display text-lg font-semibold text-ink">{job.title}</h2>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_PILL[job.status] || STATUS_PILL.draft}`}>
                    {job.status}
                  </span>
                </div>
                <p className="text-sm text-slate mt-0.5">{job.company_name}</p>

                <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate">
                  {[job.work_mode, job.job_type?.replace('_',' '), job.experience_level, job.location]
                    .filter(Boolean).map(t => (
                      <span key={t} className="rounded-full bg-sand px-2.5 py-0.5 capitalize">{t}</span>
                    ))}
                </div>

                <div className="mt-3 flex items-center gap-4 text-xs text-slate/60">
                  <span>{job.applicant_count} applicants</span>
                  <span className={`flex items-center gap-1 ${
                    job.competition_level === 'low' ? 'text-green-600' :
                    job.competition_level === 'medium' ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                    {job.competition_level} competition
                  </span>
                  {job.published_at && (
                    <span>Published {new Date(job.published_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2 flex-shrink-0">
                <Link to={`/recruiter/jobs/${job.id}/edit`}
                  className="rounded-xl border border-ink/10 px-3 py-1.5 text-xs font-medium text-slate hover:bg-sand text-center">
                  Edit
                </Link>
                <Link to={`/recruiter/jobs/${job.id}/applicants`}
                  className="rounded-xl border border-ink/10 px-3 py-1.5 text-xs font-medium text-slate hover:bg-sand text-center">
                  Applicants ({job.applicant_count})
                </Link>
                {job.status === 'draft' && (
                  <button onClick={() => doPublish(job.id)} disabled={actionId === job.id}
                    className="rounded-xl bg-teal px-3 py-1.5 text-xs font-medium text-white hover:bg-teal/90 disabled:opacity-50">
                    Publish
                  </button>
                )}
                {job.status === 'published' && (
                  <button onClick={() => doClose(job.id)} disabled={actionId === job.id}
                    className="rounded-xl border border-coral/30 px-3 py-1.5 text-xs font-medium text-coral hover:bg-coral/5 disabled:opacity-50">
                    Close
                  </button>
                )}
                <button onClick={() => doDelete(job.id)} disabled={actionId === job.id}
                  className="rounded-xl border border-red-200 px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 disabled:opacity-50">
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </PageShell>
  )
}
