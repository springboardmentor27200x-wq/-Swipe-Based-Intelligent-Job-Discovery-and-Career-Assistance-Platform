import React, { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import PageShell from '../components/layout/PageShell'
import ProgressBar from '../components/charts/ProgressBar'
import { useSkillGap } from '../hooks/useAnalytics'
import { analyticsService } from '../services/analyticsService'

export default function SkillGapPage() {
  const [params] = useSearchParams()
  const jobId = params.get('job') || undefined
  const { data, loading, reload } = useSkillGap(jobId)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => { setSaved(false) }, [jobId])

  const handleSave = async () => {
    setSaving(true)
    try {
      await analyticsService.skillGapSave(jobId)
      setSaved(true)
    } catch (e) { console.error(e) }
    finally { setSaving(false) }
  }

  return (
    <PageShell narrow>
      <div className="mb-6">
        <Link to={jobId ? `/jobs/${jobId}` : '/dashboard'} className="text-sm text-slate hover:text-coral">
          ← Back
        </Link>
        <h1 className="mt-2 font-display text-3xl font-semibold text-ink">Skill Gap Analysis</h1>
        <p className="text-slate text-sm mt-1">
          {jobId
            ? 'Comparing your resume against this specific job.'
            : 'Comparing your resume against the skills most requested across your top recommendations.'}
        </p>
      </div>

      {loading && (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 rounded-full border-2 border-coral border-t-transparent animate-spin" />
        </div>
      )}

      {!loading && data && !data.has_resume && (
        <div className="rounded-card border border-dashed border-ink/15 py-12 text-center">
          <p className="text-4xl mb-3">📄</p>
          <p className="font-display text-xl text-ink">Upload a resume first</p>
          <p className="mt-1 text-sm text-slate">We need your parsed resume skills to run a gap analysis.</p>
          <Link to="/profile" className="mt-4 inline-block rounded-xl bg-coral px-5 py-2.5 text-sm font-medium text-white">
            Go to Profile
          </Link>
        </div>
      )}

      {!loading && data && data.has_resume && (
        <>
          <div className="rounded-card border border-ink/8 bg-white p-5 shadow-card mb-6">
            <ProgressBar
              label="Overall Skill Match"
              value={data.match_percentage}
              color={data.match_percentage >= 70 ? 'bg-teal' : data.match_percentage >= 40 ? 'bg-amber-500' : 'bg-coral'}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 mb-6">
            <div className="rounded-card border border-teal/20 bg-teal/5 p-5">
              <p className="text-sm font-semibold text-teal mb-3">
                Matched Skills ({data.matched_skills.length})
              </p>
              <div className="flex flex-wrap gap-2">
                {data.matched_skills.length === 0 && <p className="text-xs text-slate">None yet</p>}
                {data.matched_skills.map(s => (
                  <span key={s} className="rounded-full bg-teal/15 px-3 py-1 text-xs font-medium text-teal">
                    ✓ {s}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-card border border-coral/20 bg-coral/5 p-5">
              <p className="text-sm font-semibold text-coral mb-3">
                Missing Skills ({data.missing_skills.length})
              </p>
              <div className="flex flex-wrap gap-2">
                {data.missing_skills.length === 0 && <p className="text-xs text-slate">None — great coverage!</p>}
                {data.missing_skills.map(s => (
                  <span key={s} className="rounded-full bg-coral/15 px-3 py-1 text-xs font-medium text-coral">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {data.priority_skills.length > 0 && (
            <div className="rounded-card border border-ink/8 bg-white p-5 shadow-card mb-6">
              <p className="text-sm font-semibold text-ink mb-3">Priority Skills to Learn</p>
              <div className="space-y-3">
                {data.learning_suggestions.map(({ skill, suggestion }, i) => (
                  <div key={skill} className="flex gap-3 rounded-lg bg-sand/40 p-3">
                    <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-ink text-xs font-semibold text-paper">
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-ink">{skill}</p>
                      <p className="text-xs text-slate mt-0.5">{suggestion}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={saving || saved}
            className="w-full rounded-xl bg-ink px-4 py-3 text-sm font-medium text-paper hover:bg-ink/90 transition disabled:opacity-60"
          >
            {saved ? 'Saved to history ✓' : saving ? 'Saving…' : 'Save this analysis to history'}
          </button>
        </>
      )}
    </PageShell>
  )
}
