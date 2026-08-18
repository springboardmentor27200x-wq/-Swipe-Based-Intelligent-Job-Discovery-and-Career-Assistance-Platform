import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import PageShell from '../components/layout/PageShell'
import { jobService } from '../services/jobService'

const STATUS_PIPELINE = [
  'pending', 'reviewed', 'shortlisted', 'interview_scheduled',
  'interview_completed', 'offered', 'accepted',
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
const ATS_LABEL_STYLES = {
  Excellent: 'bg-teal/10 text-teal',
  Good:      'bg-coral/10 text-coral',
  Fair:      'bg-yellow-50 text-yellow-700',
  Poor:      'bg-gray-100 text-gray-600',
}

function Section({ title, children }) {
  return (
    <div className="rounded-card border border-ink/8 bg-white p-6 shadow-card">
      <h2 className="font-display text-lg font-semibold text-ink mb-3">{title}</h2>
      {children}
    </div>
  )
}

export default function ApplicantProfilePage() {
  const { jobId, appId } = useParams()
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')
  const [updating, setUpdating] = useState(false)
  const [note, setNote]       = useState('')

  const load = () => {
    setLoading(true)
    jobService.applicantProfile(jobId, appId)
      .then(setData)
      .catch(() => setError('Could not load applicant profile.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [jobId, appId])

  const changeStatus = async (newStatus) => {
    setUpdating(true)
    try {
      await jobService.updateApplicationStatus(jobId, appId, newStatus, note)
      setNote('')
      load()
    } catch (e) { console.error(e) }
    finally { setUpdating(false) }
  }

  if (loading) {
    return (
      <PageShell>
        <div className="flex justify-center py-24">
          <div className="h-8 w-8 rounded-full border-2 border-coral border-t-transparent animate-spin" />
        </div>
      </PageShell>
    )
  }

  if (error || !data) {
    return (
      <PageShell>
        <p className="text-coral">{error || 'Applicant not found.'}</p>
      </PageShell>
    )
  }

  const { personal, resume, education, experience, projects, skills, certifications, ats, application, job } = data
  const currentIndex = STATUS_PIPELINE.indexOf(application.status)
  const isTerminal = ['rejected', 'withdrawn'].includes(application.status)

  return (
    <PageShell>
      <div className="mb-6">
        <Link to={`/recruiter/jobs/${jobId}/applicants`} className="text-sm text-slate hover:text-coral">← Back to Applicants</Link>
      </div>

      {/* Header */}
      <div className="rounded-card border border-ink/8 bg-white p-6 shadow-card mb-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-ink flex items-center justify-center text-paper text-xl font-bold flex-shrink-0">
              {personal.full_name?.[0] || '?'}
            </div>
            <div>
              <h1 className="font-display text-2xl font-semibold text-ink">{personal.full_name}</h1>
              <p className="text-sm text-slate">{personal.headline || 'Job Seeker'}</p>
              <p className="text-xs text-slate/60 mt-0.5">Applied for <span className="font-medium text-ink">{job.title}</span></p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLES[application.status]}`}>
              {application.status_display}
            </span>
            {ats && (
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${ATS_LABEL_STYLES[ats.compatibility_label] || 'bg-sand text-slate'}`}>
                ATS {Math.round(ats.overall_score)}% · {ats.compatibility_label}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column — details */}
        <div className="lg:col-span-2 space-y-6">
          <Section title="Personal Details">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><p className="text-slate/60 text-xs">Email</p><p className="text-ink">{personal.email}</p></div>
              <div><p className="text-slate/60 text-xs">Phone</p><p className="text-ink">{personal.phone || '—'}</p></div>
              <div><p className="text-slate/60 text-xs">Location</p><p className="text-ink">{personal.location || '—'}</p></div>
              <div><p className="text-slate/60 text-xs">Experience</p><p className="text-ink">{personal.years_of_experience || 0} yrs</p></div>
              {personal.github && (
                <div><p className="text-slate/60 text-xs">GitHub</p>
                  <a href={personal.github} target="_blank" rel="noreferrer" className="text-coral hover:underline break-all">{personal.github}</a>
                </div>
              )}
              {personal.linkedin && (
                <div><p className="text-slate/60 text-xs">LinkedIn</p>
                  <a href={personal.linkedin} target="_blank" rel="noreferrer" className="text-coral hover:underline break-all">{personal.linkedin}</a>
                </div>
              )}
              {(personal.current_ctc || personal.expected_ctc) && (
                <div><p className="text-slate/60 text-xs">Current / Expected CTC</p>
                  <p className="text-ink">{personal.current_ctc || '—'} / {personal.expected_ctc || '—'}</p>
                </div>
              )}
            </div>
            {personal.bio && <p className="mt-4 text-sm text-slate">{personal.bio}</p>}
          </Section>

          {education?.length > 0 && (
            <Section title="Education">
              <ul className="text-sm text-ink space-y-1 list-disc list-inside">
                {education.map((line, i) => <li key={i}>{line}</li>)}
              </ul>
            </Section>
          )}

          {experience?.length > 0 && (
            <Section title="Experience">
              <ul className="text-sm text-ink space-y-1 list-disc list-inside">
                {experience.map((line, i) => <li key={i}>{line}</li>)}
              </ul>
            </Section>
          )}

          {projects?.length > 0 && (
            <Section title="Projects">
              <div className="space-y-3">
                {projects.map((proj, i) => (
                  <div key={i} className="rounded-lg bg-sand/40 px-4 py-3">
                    <p className="text-sm font-semibold text-ink">{proj.title || 'Untitled project'}</p>
                    {proj.description && <p className="text-sm text-slate mt-1">{proj.description}</p>}
                    {proj.technologies?.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {proj.technologies.map((t) => (
                          <span key={t} className="rounded-full bg-teal/10 px-2.5 py-0.5 text-xs font-medium text-teal">{t}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {skills?.length > 0 && (
            <Section title="Skills">
              <div className="flex flex-wrap gap-1.5">
                {skills.map((s) => (
                  <span key={s} className="rounded-full bg-coral/10 px-2.5 py-0.5 text-xs font-medium text-coral">{s}</span>
                ))}
              </div>
            </Section>
          )}

          {certifications?.length > 0 && (
            <Section title="Certifications">
              <ul className="text-sm text-ink space-y-1 list-disc list-inside">
                {certifications.map((line, i) => <li key={i}>{line}</li>)}
              </ul>
            </Section>
          )}

          {!resume && (
            <Section title="Resume">
              <p className="text-sm text-slate">This applicant hasn't uploaded a resume yet.</p>
            </Section>
          )}

          {resume && (
            <Section title="Resume Preview & Download">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <p className="text-sm font-medium text-ink">{resume.original_filename}</p>
                  <p className="text-xs text-slate/60">{resume.file_type?.toUpperCase()} · Uploaded {new Date(resume.uploaded_at).toLocaleDateString()}</p>
                </div>
                <div className="flex gap-2">
                  <a href={resume.file} target="_blank" rel="noreferrer"
                    className="text-xs border border-ink/15 text-ink px-3 py-1.5 rounded-lg hover:bg-sand/60 transition">
                    Preview
                  </a>
                  <a href={resume.file} download
                    className="text-xs bg-ink text-paper px-3 py-1.5 rounded-lg hover:bg-ink/90 transition">
                    Download
                  </a>
                </div>
              </div>
            </Section>
          )}

          {ats && (
            <Section title="ATS Compatibility for this Job">
              <div className="grid grid-cols-2 gap-3 text-xs mb-4">
                {[
                  ['Skill Match', ats.skill_match],
                  ['Keyword Match', ats.keyword_match],
                  ['Experience Match', ats.experience_match],
                  ['Education Match', ats.education_match],
                ].map(([label, value]) => (
                  <div key={label}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-slate/70">{label}</span>
                      <span className="font-medium text-ink">{Math.round(value)}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-sand overflow-hidden">
                      <div className="h-full rounded-full bg-coral" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
                    </div>
                  </div>
                ))}
              </div>

              {ats.matched_skills?.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs text-slate/60 mb-1.5">Matched skills</p>
                  <div className="flex flex-wrap gap-1.5">
                    {ats.matched_skills.map((s) => (
                      <span key={s} className="rounded-full bg-teal/10 px-2.5 py-0.5 text-xs font-medium text-teal">✓ {s}</span>
                    ))}
                  </div>
                </div>
              )}

              {ats.missing_skills?.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs text-slate/60 mb-1.5">Missing skills</p>
                  <div className="flex flex-wrap gap-1.5">
                    {ats.missing_skills.map((s) => (
                      <span key={s} className="rounded-full bg-coral/10 px-2.5 py-0.5 text-xs font-medium text-coral">{s}</span>
                    ))}
                  </div>
                </div>
              )}

              {ats.suggestions?.length > 0 && (
                <div className="border-t border-ink/8 pt-3 mt-3">
                  <p className="text-xs text-slate/60 mb-2">Resume optimization suggestions</p>
                  <ul className="space-y-1.5">
                    {ats.suggestions.map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-ink">
                        <span className="text-coral mt-0.5">•</span><span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Section>
          )}
        </div>

        {/* Right column — workflow control */}
        <div className="space-y-6">
          <Section title="Application Status">
            <div className="space-y-1.5 mb-4">
              {STATUS_PIPELINE.map((s, i) => (
                <div key={s} className={`flex items-center gap-2 text-sm ${
                  i <= currentIndex && !isTerminal ? 'text-ink font-medium' : 'text-slate/50'
                }`}>
                  <span className={`h-2 w-2 rounded-full flex-shrink-0 ${
                    i <= currentIndex && !isTerminal ? 'bg-teal' : 'bg-sand'
                  }`} />
                  {STATUS_LABELS[s]}
                </div>
              ))}
              {isTerminal && (
                <div className="flex items-center gap-2 text-sm font-medium text-coral">
                  <span className="h-2 w-2 rounded-full bg-coral flex-shrink-0" />
                  {STATUS_LABELS[application.status]}
                </div>
              )}
            </div>

            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Optional note for this status change..."
              rows={2}
              className="w-full rounded-xl border border-ink/10 px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-coral/30"
            />

            <div className="flex flex-wrap gap-2">
              {STATUS_PIPELINE.map((s) => (
                <button
                  key={s}
                  disabled={updating || application.status === s}
                  onClick={() => changeStatus(s)}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition disabled:opacity-40 ${
                    application.status === s
                      ? 'bg-ink text-paper border-ink'
                      : 'border-ink/15 text-ink hover:bg-sand/60'
                  }`}
                >
                  {STATUS_LABELS[s]}
                </button>
              ))}
              <button
                disabled={updating || application.status === 'rejected'}
                onClick={() => changeStatus('rejected')}
                className="text-xs px-3 py-1.5 rounded-lg border border-coral/30 text-coral hover:bg-coral/5 transition disabled:opacity-40"
              >
                Reject
              </button>
            </div>
          </Section>

          {application.status_history?.length > 0 && (
            <Section title="Status History">
              <ul className="space-y-3">
                {[...application.status_history].reverse().map((entry, i) => (
                  <li key={i} className="text-xs">
                    <p className="font-medium text-ink">{STATUS_LABELS[entry.status] || entry.status}</p>
                    <p className="text-slate/60">{new Date(entry.changed_at).toLocaleString()}</p>
                    {entry.note && <p className="text-slate mt-0.5">{entry.note}</p>}
                  </li>
                ))}
              </ul>
            </Section>
          )}
        </div>
      </div>
    </PageShell>
  )
}
