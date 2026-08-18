import React, { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import PageShell from '../components/layout/PageShell'
import Button from '../components/ui/Button'
import ResumeCompatibilityPanel from '../components/resume/ResumeCompatibilityPanel'
import { jobService } from '../services/jobService'
import { extractErrorMessage } from '../services/api'
import { useAuth } from '../store/AuthContext'

export default function JobDetailPage() {
  const { id }       = useParams()
  const { user }     = useAuth()
  const navigate     = useNavigate()
  const [job, setJob]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [applying, setApplying] = useState(false)
  const [saving, setSaving]   = useState(false)
  const [msg, setMsg]         = useState('')
  const [error, setError]     = useState('')

  useEffect(() => {
    jobService.get(id)
      .then(setJob)
      .catch(() => navigate('/jobs'))
      .finally(() => setLoading(false))
  }, [id])

  const handleApply = async () => {
    setApplying(true)
    setMsg(''); setError('')
    try {
      await jobService.applyToJob(id)
      setMsg('Application submitted!')
      setJob(j => ({ ...j, is_applied: true }))
    } catch (e) {
      setError(extractErrorMessage(e))
    } finally {
      setApplying(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await jobService.swipe({ job_id: id, direction: 'right', save: true, apply: false })
      setJob(j => ({ ...j, is_saved: true }))
    } catch (e) {
      setError(extractErrorMessage(e))
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <PageShell narrow>
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 rounded-full border-2 border-coral border-t-transparent animate-spin" />
      </div>
    </PageShell>
  )

  if (!job) return null

  const salaryText = job.salary_visible && (job.salary_min || job.salary_max)
    ? `₹${job.salary_min ? (job.salary_min / 100000).toFixed(1) + 'L' : ''}${job.salary_max ? ' – ' + (job.salary_max / 100000).toFixed(1) + 'L' : ''} per year`
    : 'Salary not disclosed'

  return (
    <PageShell>
      <div className="max-w-3xl mx-auto">
        {/* Back */}
        <Link to="/jobs" className="text-sm text-slate hover:text-coral">← Back to jobs</Link>

        {/* Header card */}
        <div className="mt-4 rounded-card border border-ink/8 bg-white p-8 shadow-card">
          <div className="flex items-start gap-5">
            <div className="h-16 w-16 rounded-xl bg-ink flex items-center justify-center text-paper font-bold text-2xl flex-shrink-0">
              {job.company_detail?.name?.[0] || '?'}
            </div>
            <div className="flex-1">
              <h1 className="font-display text-3xl font-semibold text-ink">{job.title}</h1>
              <p className="text-slate mt-1">{job.company_detail?.name}</p>
              {job.ats_score != null && (
                <span className="mt-2 inline-block rounded-full bg-teal/10 px-3 py-1 text-sm font-bold text-teal">
                  ATS {Math.round(job.ats_score)}%{job.ats_compatibility ? ` · ${job.ats_compatibility}` : ''}
                </span>
              )}
            </div>
          </div>

          {/* Meta grid */}
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              { label: 'Salary',     value: salaryText },
              { label: 'Work Mode',  value: job.work_mode },
              { label: 'Job Type',   value: job.job_type?.replace('_', ' ') },
              { label: 'Experience', value: job.experience_level },
              { label: 'Location',   value: job.location || 'Not specified' },
              { label: 'Openings',   value: job.openings },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-xl bg-sand/50 px-4 py-3">
                <p className="text-xs text-slate/60 uppercase tracking-wide">{label}</p>
                <p className="mt-0.5 text-sm font-medium text-ink capitalize">{value}</p>
              </div>
            ))}
          </div>

          {/* Competition */}
          <div className="mt-4 flex items-center gap-2 text-sm text-slate">
            <span className={`h-2 w-2 rounded-full ${
              job.competition_level === 'low' ? 'bg-green-500' :
              job.competition_level === 'medium' ? 'bg-yellow-500' : 'bg-red-500'
            }`} />
            {job.competition_level} competition · {job.applicant_count} applicants
          </div>

          {/* CTA */}
          {user?.is_job_seeker && (
            <div className="mt-6 flex gap-3">
              {job.is_applied ? (
                <div className="rounded-xl bg-teal/10 px-5 py-3 text-sm font-medium text-teal">✓ Applied</div>
              ) : (
                <Button variant="coral" onClick={handleApply} loading={applying}>Apply Now</Button>
              )}
              {!job.is_saved && !job.is_applied && (
                <Button variant="outline" onClick={handleSave} loading={saving}>♥ Save Job</Button>
              )}
              {job.is_saved && <div className="rounded-xl border border-coral/20 px-5 py-3 text-sm text-coral">♥ Saved</div>}
              <Link
                to={`/skill-gap?job=${job.id}`}
                className="rounded-xl border border-ink/10 px-5 py-3 text-sm font-medium text-ink hover:bg-sand/60 transition"
              >
                🧩 Skill Gap
              </Link>
            </div>
          )}
          {msg   && <p className="mt-3 text-sm text-teal">{msg}</p>}
          {error && <p className="mt-3 text-sm text-coral">{error}</p>}
        </div>

        {/* Resume Compatibility (Milestone 3) */}
        {user?.is_job_seeker && <ResumeCompatibilityPanel jobId={job.id} />}

        {/* Skills */}
        {job.skills_required?.length > 0 && (
          <div className="mt-6 rounded-card border border-ink/8 bg-white p-6 shadow-card">
            <h2 className="font-display text-lg font-semibold text-ink mb-4">Required Skills</h2>
            <div className="flex flex-wrap gap-2">
              {job.skills_required.map(s => (
                <span key={s.id} className="rounded-full bg-coral/10 px-3 py-1 text-sm font-medium text-coral">{s.name}</span>
              ))}
            </div>
          </div>
        )}

        {/* Description */}
        <div className="mt-6 rounded-card border border-ink/8 bg-white p-6 shadow-card">
          <h2 className="font-display text-lg font-semibold text-ink mb-4">Job Description</h2>
          <div className="prose prose-sm max-w-none text-slate whitespace-pre-line">{job.description}</div>
        </div>

        {/* Requirements */}
        {job.requirements && (
          <div className="mt-6 rounded-card border border-ink/8 bg-white p-6 shadow-card">
            <h2 className="font-display text-lg font-semibold text-ink mb-4">Requirements</h2>
            <div className="prose prose-sm max-w-none text-slate whitespace-pre-line">{job.requirements}</div>
          </div>
        )}

        {/* Benefits */}
        {job.benefits && (
          <div className="mt-6 rounded-card border border-ink/8 bg-white p-6 shadow-card">
            <h2 className="font-display text-lg font-semibold text-ink mb-4">Benefits</h2>
            <div className="prose prose-sm max-w-none text-slate whitespace-pre-line">{job.benefits}</div>
          </div>
        )}

        {/* Company section */}
        {job.company_detail && (
          <div className="mt-6 rounded-card border border-ink/8 bg-white p-6 shadow-card">
            <h2 className="font-display text-lg font-semibold text-ink mb-4">About {job.company_detail.name}</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {[
                { label: 'Industry',     value: job.company_detail.industry },
                { label: 'Type',         value: job.company_detail.company_type?.replace('_', ' ') },
                { label: 'Headquarters', value: job.company_detail.headquarters },
              ].filter(x => x.value).map(({ label, value }) => (
                <div key={label}>
                  <p className="text-xs text-slate/60">{label}</p>
                  <p className="font-medium text-ink capitalize">{value}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </PageShell>
  )
}
