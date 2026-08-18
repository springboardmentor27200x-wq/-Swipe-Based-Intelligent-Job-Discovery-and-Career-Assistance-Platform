import React, { useEffect, useRef, useState } from 'react'
import Button from '../ui/Button'
import { resumeService } from '../../services/resumeService'
import { extractErrorMessage } from '../../services/api'

const STATUS_STYLES = {
  success: 'bg-teal/10 text-teal',
  pending: 'bg-yellow-50 text-yellow-700',
  failed:  'bg-coral/10 text-coral',
}

function ResumeRow({ resume, onSetPrimary, onDelete, onReparse, busy }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className={`rounded-xl border p-4 transition ${resume.is_primary ? 'border-coral/40 bg-coral/[0.03]' : 'border-ink/8 bg-white'}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-medium text-ink truncate">{resume.original_filename}</p>
            {resume.is_primary && (
              <span className="rounded-full bg-coral px-2 py-0.5 text-[11px] font-semibold text-white">Primary</span>
            )}
            <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${STATUS_STYLES[resume.parse_status] || 'bg-sand text-slate'}`}>
              {resume.parse_status}
            </span>
          </div>
          <p className="text-xs text-slate/70 mt-0.5">
            {resume.file_type.toUpperCase()} · {(resume.file_size / 1024).toFixed(0)} KB · Uploaded{' '}
            {new Date(resume.uploaded_at).toLocaleDateString()}
          </p>
          {resume.parse_status === 'failed' && resume.parse_error && (
            <p className="text-xs text-coral mt-1">{resume.parse_error}</p>
          )}
        </div>

        <div className="flex flex-shrink-0 items-center gap-2">
          {!resume.is_primary && (
            <button
              onClick={() => onSetPrimary(resume.id)}
              disabled={busy}
              className="text-xs border border-ink/15 text-ink px-2.5 py-1 rounded-lg hover:bg-sand/60 transition disabled:opacity-50"
            >
              Set primary
            </button>
          )}
          {resume.parse_status === 'failed' && (
            <button
              onClick={() => onReparse(resume.id)}
              disabled={busy}
              className="text-xs border border-teal/30 text-teal px-2.5 py-1 rounded-lg hover:bg-teal/5 transition disabled:opacity-50"
            >
              Retry parse
            </button>
          )}
          <button
            onClick={() => onDelete(resume.id)}
            disabled={busy}
            className="text-xs border border-coral/30 text-coral px-2.5 py-1 rounded-lg hover:bg-coral/5 transition disabled:opacity-50"
          >
            Delete
          </button>
        </div>
      </div>

      {resume.parse_status === 'success' && (
        <>
          <button
            onClick={() => setExpanded((e) => !e)}
            className="mt-3 text-xs font-medium text-coral hover:underline"
          >
            {expanded ? 'Hide parsed details ▲' : 'View parsed details ▼'}
          </button>

          {expanded && (
            <div className="mt-3 space-y-3 border-t border-ink/8 pt-3">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="text-slate/60">Name detected</p>
                  <p className="font-medium text-ink">{resume.parsed_name || '—'}</p>
                </div>
                <div>
                  <p className="text-slate/60">Experience (est.)</p>
                  <p className="font-medium text-ink">{resume.estimated_years_experience || 0} yrs</p>
                </div>
                <div>
                  <p className="text-slate/60">GitHub link</p>
                  {resume.has_github_link ? (
                    <a href={resume.parsed_github_url} target="_blank" rel="noreferrer" className="font-medium text-coral hover:underline truncate block">✓ {resume.parsed_github_url}</a>
                  ) : (
                    <p className="font-medium text-ink">Not found</p>
                  )}
                </div>
                <div>
                  <p className="text-slate/60">LinkedIn link</p>
                  {resume.has_linkedin_link ? (
                    <a href={resume.parsed_linkedin_url} target="_blank" rel="noreferrer" className="font-medium text-coral hover:underline truncate block">✓ {resume.parsed_linkedin_url}</a>
                  ) : (
                    <p className="font-medium text-ink">Not found</p>
                  )}
                </div>
              </div>

              {resume.all_skills?.length > 0 && (
                <div>
                  <p className="text-xs text-slate/60 mb-1.5">Detected skills</p>
                  <div className="flex flex-wrap gap-1.5">
                    {resume.all_skills.map((s) => (
                      <span key={s} className="rounded-full bg-coral/10 px-2.5 py-0.5 text-xs font-medium text-coral">{s}</span>
                    ))}
                  </div>
                </div>
              )}

              {resume.parsed_education?.length > 0 && (
                <div>
                  <p className="text-xs text-slate/60 mb-1">Education</p>
                  <ul className="text-xs text-ink space-y-0.5 list-disc list-inside">
                    {resume.parsed_education.slice(0, 4).map((line, i) => <li key={i}>{line}</li>)}
                  </ul>
                </div>
              )}

              {resume.parsed_experience?.length > 0 && (
                <div>
                  <p className="text-xs text-slate/60 mb-1">Experience</p>
                  <ul className="text-xs text-ink space-y-0.5 list-disc list-inside">
                    {resume.parsed_experience.slice(0, 4).map((line, i) => <li key={i}>{line}</li>)}
                  </ul>
                </div>
              )}

              {resume.parsed_projects?.length > 0 && (
                <div>
                  <p className="text-xs text-slate/60 mb-1.5">Projects</p>
                  <div className="space-y-2">
                    {resume.parsed_projects.slice(0, 6).map((proj, i) => (
                      <div key={i} className="rounded-lg bg-sand/40 px-3 py-2">
                        <p className="text-xs font-semibold text-ink">{proj.title || 'Untitled project'}</p>
                        {proj.description && (
                          <p className="text-xs text-slate mt-0.5">{proj.description}</p>
                        )}
                        {proj.technologies?.length > 0 && (
                          <div className="mt-1.5 flex flex-wrap gap-1">
                            {proj.technologies.map((t) => (
                              <span key={t} className="rounded-full bg-teal/10 px-2 py-0.5 text-[11px] font-medium text-teal">{t}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {resume.parsed_certifications?.length > 0 && (
                <div>
                  <p className="text-xs text-slate/60 mb-1">Certifications</p>
                  <ul className="text-xs text-ink space-y-0.5 list-disc list-inside">
                    {resume.parsed_certifications.slice(0, 4).map((line, i) => <li key={i}>{line}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default function ResumeManager() {
  const [resumes, setResumes]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [uploading, setUploading] = useState(false)
  const [busy, setBusy]         = useState(false)
  const [error, setError]       = useState('')
  const [message, setMessage]   = useState('')
  const fileInputRef = useRef(null)

  const loadResumes = () => {
    setLoading(true)
    resumeService.list()
      .then(setResumes)
      .catch((e) => setError(extractErrorMessage(e)))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadResumes() }, [])

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError(''); setMessage('')

    const isValid = /\.(pdf|docx)$/i.test(file.name)
    if (!isValid) {
      setError('Only .pdf and .docx resumes are supported.')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('File too large — maximum size is 10MB.')
      return
    }

    setUploading(true)
    try {
      const res = await resumeService.upload(file)
      if (res.success) {
        setMessage('Resume uploaded and parsed successfully.')
      } else {
        setError(res?.error?.message || 'Resume uploaded but parsing failed — you can retry below.')
      }
      loadResumes()
    } catch (err) {
      setError(extractErrorMessage(err))
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const withBusy = (fn) => async (...args) => {
    setBusy(true); setError(''); setMessage('')
    try {
      await fn(...args)
      loadResumes()
    } catch (err) {
      setError(extractErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const handleSetPrimary = withBusy((id) => resumeService.setPrimary(id))
  const handleReparse    = withBusy((id) => resumeService.reparse(id))
  const handleDelete     = withBusy((id) => {
    if (!window.confirm('Delete this resume? This cannot be undone.')) return Promise.resolve()
    return resumeService.delete(id)
  })

  return (
    <div className="rounded-card border border-ink/8 bg-white p-8 shadow-card">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-display text-xl font-semibold text-ink">Resume</h2>
          <p className="mt-1 text-sm text-slate">
            Upload your resume to unlock ATS scoring, job compatibility, and smarter recommendations.
          </p>
        </div>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx"
            className="hidden"
            id="resume-upload-input"
            onChange={handleFileChange}
          />
          <Button
            variant="coral"
            loading={uploading}
            onClick={() => fileInputRef.current?.click()}
          >
            {resumes.length > 0 ? 'Upload new resume' : 'Upload resume'}
          </Button>
        </div>
      </div>

      {message && <div className="mt-4 rounded-xl bg-teal/10 px-4 py-3 text-sm text-teal">{message}</div>}
      {error && <div className="mt-4 rounded-xl bg-coral/10 px-4 py-3 text-sm text-coral">{error}</div>}

      <div className="mt-6 space-y-3">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="h-6 w-6 rounded-full border-2 border-coral border-t-transparent animate-spin" />
          </div>
        ) : resumes.length === 0 ? (
          <div className="rounded-xl border border-dashed border-ink/15 py-10 text-center">
            <p className="text-sm text-slate">No resume uploaded yet.</p>
            <p className="text-xs text-slate/60 mt-1">PDF or DOCX, up to 10MB.</p>
          </div>
        ) : (
          resumes.map((r) => (
            <ResumeRow
              key={r.id}
              resume={r}
              busy={busy}
              onSetPrimary={handleSetPrimary}
              onDelete={handleDelete}
              onReparse={handleReparse}
            />
          ))
        )}
      </div>
    </div>
  )
}
