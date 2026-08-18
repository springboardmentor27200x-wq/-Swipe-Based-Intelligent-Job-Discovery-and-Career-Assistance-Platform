import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { resumeService } from '../../services/resumeService'

const LABEL_STYLES = {
  Excellent:           'bg-teal/10 text-teal',
  Good:                'bg-coral/10 text-coral',
  Fair:                'bg-yellow-50 text-yellow-700',
  Poor:                'bg-gray-100 text-gray-600',
}

function ScoreRing({ score }) {
  const pct = Math.max(0, Math.min(100, score || 0))
  const color = pct >= 85 ? '#0f9d8f' : pct >= 70 ? '#ff5a4e' : pct >= 50 ? '#d9a441' : '#9aa0a6'
  const circumference = 2 * Math.PI * 34
  const offset = circumference - (pct / 100) * circumference

  return (
    <div className="relative h-24 w-24 flex-shrink-0">
      <svg viewBox="0 0 80 80" className="h-24 w-24 -rotate-90">
        <circle cx="40" cy="40" r="34" fill="none" stroke="#eee" strokeWidth="8" />
        <circle
          cx="40" cy="40" r="34" fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold text-ink">{Math.round(pct)}%</span>
      </div>
    </div>
  )
}

function Bar({ label, value }) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-slate/70">{label}</span>
        <span className="font-medium text-ink">{Math.round(value)}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-sand overflow-hidden">
        <div className="h-full rounded-full bg-coral" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
      </div>
    </div>
  )
}

export default function ResumeCompatibilityPanel({ jobId }) {
  const [state, setState] = useState('loading') // loading | no_resume | ready | error
  const [ats, setAts]     = useState(null)
  const [msg, setMsg]     = useState('')

  useEffect(() => {
    let cancelled = false
    setState('loading')
    resumeService.matchForJob(jobId)
      .then((res) => {
        if (cancelled) return
        if (!res.success) {
          setState('error')
          setMsg(res?.error?.message || 'Could not compute ATS score.')
          return
        }
        if (!res.data) {
          setState('no_resume')
          setMsg(res.message || 'Upload a resume to see your ATS score for this job.')
          return
        }
        setAts(res.data)
        setState('ready')
      })
      .catch(() => { if (!cancelled) setState('error') })
    return () => { cancelled = true }
  }, [jobId])

  if (state === 'loading') {
    return (
      <div className="mt-6 rounded-card border border-ink/8 bg-white p-6 shadow-card">
        <div className="flex justify-center py-6">
          <div className="h-6 w-6 rounded-full border-2 border-coral border-t-transparent animate-spin" />
        </div>
      </div>
    )
  }

  if (state === 'no_resume') {
    return (
      <div className="mt-6 rounded-card border border-dashed border-coral/30 bg-coral/[0.03] p-6">
        <h2 className="font-display text-lg font-semibold text-ink mb-1">Resume Compatibility</h2>
        <p className="text-sm text-slate">{msg}</p>
        <Link to="/profile" className="mt-3 inline-block text-sm font-medium text-coral hover:underline">
          Upload your resume →
        </Link>
      </div>
    )
  }

  if (state === 'error' || !ats) {
    return null
  }

  return (
    <div className="mt-6 rounded-card border border-ink/8 bg-white p-6 shadow-card">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-display text-lg font-semibold text-ink">Resume Compatibility</h2>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${LABEL_STYLES[ats.compatibility_label] || 'bg-sand text-slate'}`}>
          {ats.compatibility_label}
        </span>
      </div>

      <div className="flex items-start gap-6 flex-wrap">
        <div className="flex items-center gap-4">
          <ScoreRing score={ats.overall_score} />
          <div>
            <p className="text-sm text-slate">ATS Score</p>
            <p className="text-2xl font-bold text-ink">{Math.round(ats.overall_score)}%</p>
            <p className="text-xs text-slate/60">Compatibility: {ats.compatibility_label}</p>
          </div>
        </div>

        <div className="flex-1 min-w-[220px] space-y-3">
          <Bar label="Skill Match"      value={ats.skill_match} />
          <Bar label="Keyword Match"    value={ats.keyword_match} />
          <Bar label="Experience Match" value={ats.experience_match} />
          <Bar label="Education Match"  value={ats.education_match} />
        </div>
      </div>

      {ats.matched_skills?.length > 0 && (
        <div className="mt-5">
          <p className="text-xs text-slate/60 mb-1.5">Matched skills</p>
          <div className="flex flex-wrap gap-1.5">
            {ats.matched_skills.map((s) => (
              <span key={s} className="rounded-full bg-teal/10 px-2.5 py-0.5 text-xs font-medium text-teal">✓ {s}</span>
            ))}
          </div>
        </div>
      )}

      {ats.missing_skills?.length > 0 && (
        <div className="mt-4">
          <p className="text-xs text-slate/60 mb-1.5">Missing skills</p>
          <div className="flex flex-wrap gap-1.5">
            {ats.missing_skills.map((s) => (
              <span key={s} className="rounded-full bg-coral/10 px-2.5 py-0.5 text-xs font-medium text-coral">{s}</span>
            ))}
          </div>
        </div>
      )}

      {ats.suggestions?.length > 0 && (
        <div className="mt-5 border-t border-ink/8 pt-4">
          <p className="text-xs text-slate/60 mb-2">Resume optimization suggestions</p>
          <ul className="space-y-1.5">
            {ats.suggestions.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-ink">
                <span className="text-coral mt-0.5">•</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
