import React, { useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { jobService } from '../../services/jobService'

const THRESHOLD = 90

export default function SwipeCard({ job, onSwiped }) {
  const navigate    = useNavigate()
  const cardRef     = useRef(null)
  const startRef    = useRef(null)
  const [offset, setOffset]     = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const [hint, setHint]         = useState(null)
  const [busy, setBusy]         = useState(false)
  const [toast, setToast]       = useState('')

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2200)
  }

  const onStart = (cx, cy) => { startRef.current = { x: cx, y: cy }; setDragging(true) }
  const onMove  = (cx, cy) => {
    if (!startRef.current) return
    const dx = cx - startRef.current.x
    const dy = cy - startRef.current.y
    setOffset({ x: dx, y: dy })
    setHint(dx > THRESHOLD / 2 ? 'save' : dx < -THRESHOLD / 2 ? 'skip' : null)
  }
  const onEnd = async () => {
    setDragging(false)
    const dx = offset.x
    if (dx > THRESHOLD)       await act('right', false)
    else if (dx < -THRESHOLD) await act('left', false)
    else { setOffset({ x: 0, y: 0 }); setHint(null) }
    startRef.current = null
  }

  const act = async (direction, apply = false) => {
    if (busy) return
    setBusy(true)
    try {
      await jobService.swipe({
        job_id:    job.id,
        direction,
        save:   direction === 'right',
        apply,
      })
      if (direction === 'right') showToast(apply ? '✓ Applied!' : '♥ Saved!')
      else showToast('Skipped')
      // Notify dashboards and stats to refresh counts immediately
      window.dispatchEvent(new Event('swipex:stats-refresh'))
      setTimeout(() => { onSwiped?.(job.id, direction) }, 250)
    } catch (e) {
      const msg = e?.response?.data?.error?.message || 'Something went wrong'
      showToast(msg)
      setOffset({ x: 0, y: 0 }); setHint(null)
    } finally {
      setBusy(false)
    }
  }

  const rotation  = offset.x * 0.10
  const transform = dragging
    ? `translateX(${offset.x}px) translateY(${offset.y * 0.25}px) rotate(${rotation}deg)`
    : 'translateX(0) translateY(0) rotate(0deg)'
  const alpha  = Math.min(Math.abs(offset.x) / THRESHOLD, 1)
  const isSave = offset.x > 0
  const isSkip = offset.x < 0

  const salary = job.salary_visible && (job.salary_min || job.salary_max)
    ? `₹${job.salary_min ? (job.salary_min / 100000).toFixed(1) + 'L' : ''}${job.salary_max ? '–' + (job.salary_max / 100000).toFixed(1) + 'L' : ''}`
    : 'Salary not disclosed'

  return (
    <div
      ref={cardRef}
      className="absolute inset-0 touch-none"
      style={{
        transform,
        transition: dragging ? 'none' : 'transform 0.3s cubic-bezier(0.34,1.56,0.64,1)',
        cursor: dragging ? 'grabbing' : 'grab',
        userSelect: 'none',
      }}
      onMouseDown  ={e => onStart(e.clientX, e.clientY)}
      onMouseMove  ={e => { if (dragging) onMove(e.clientX, e.clientY) }}
      onMouseUp    ={onEnd}
      onMouseLeave ={e => { if (dragging) onEnd() }}
      onTouchStart ={e => onStart(e.touches[0].clientX, e.touches[0].clientY)}
      onTouchMove  ={e => { e.preventDefault(); onMove(e.touches[0].clientX, e.touches[0].clientY) }}
      onTouchEnd   ={onEnd}
    >
      <div className="h-full w-full rounded-card border border-ink/8 bg-white shadow-card flex flex-col overflow-hidden relative">

        {/* Save overlay */}
        {isSave && (
          <div className="absolute inset-0 rounded-card border-4 border-teal bg-teal/10 z-20 flex items-center justify-start pl-8 pointer-events-none"
            style={{ opacity: alpha }}>
            <span className="text-teal text-5xl font-display font-black -rotate-12 drop-shadow">SAVE</span>
          </div>
        )}
        {/* Skip overlay */}
        {isSkip && (
          <div className="absolute inset-0 rounded-card border-4 border-coral bg-coral/10 z-20 flex items-center justify-end pr-8 pointer-events-none"
            style={{ opacity: alpha }}>
            <span className="text-coral text-5xl font-display font-black rotate-12 drop-shadow">SKIP</span>
          </div>
        )}

        {/* Toast */}
        {toast && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 rounded-full bg-ink text-paper text-sm px-4 py-2 shadow-lg pointer-events-none">
            {toast}
          </div>
        )}

        {/* Header */}
        <div className="bg-ink px-5 pt-5 pb-4 flex-shrink-0">
          <div className="flex items-start gap-3">
            <div className="h-12 w-12 rounded-xl bg-coral flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
              {(job.company_name || '?')[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-paper/50 uppercase tracking-wide truncate">{job.company_name}</p>
              <h2 className="font-display text-lg font-semibold text-paper leading-snug mt-0.5">{job.title}</h2>
            </div>
            {job.ats_score != null && (
              <div className="text-right flex-shrink-0">
                <span className="text-teal font-bold text-xl">{Math.round(job.ats_score)}%</span>
                <p className="text-paper/40 text-xs">{job.ats_compatibility || 'ATS'}</p>
              </div>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-hidden px-5 py-4 space-y-3">
          {/* Tags */}
          <div className="flex flex-wrap gap-1.5">
            {[
              job.work_mode,
              job.job_type?.replace(/_/g, ' '),
              job.experience_level,
              job.company_type?.replace(/_/g, ' '),
            ].filter(Boolean).map(tag => (
              <span key={tag} className="rounded-full bg-sand px-2.5 py-0.5 text-xs font-medium text-slate capitalize">
                {tag}
              </span>
            ))}
          </div>

          {/* Location + salary */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-gray-50 px-3 py-2">
              <p className="text-xs text-slate/60">📍 Location</p>
              <p className="text-sm font-medium text-ink truncate">{job.location || 'Not specified'}</p>
            </div>
            <div className="rounded-xl bg-gray-50 px-3 py-2">
              <p className="text-xs text-slate/60">💰 Salary</p>
              <p className="text-sm font-medium text-ink truncate">{salary}</p>
            </div>
          </div>

          {/* Skills */}
          {job.skills?.length > 0 && (
            <div>
              <p className="text-xs text-slate/60 mb-1.5">Required skills</p>
              <div className="flex flex-wrap gap-1.5">
                {job.skills.slice(0, 5).map(s => (
                  <span key={s} className="rounded-md bg-coral/10 px-2 py-0.5 text-xs font-medium text-coral">{s}</span>
                ))}
                {job.skills.length > 5 && (
                  <span className="text-xs text-slate/60">+{job.skills.length - 5} more</span>
                )}
              </div>
            </div>
          )}

          {/* Competition */}
          <div className="flex items-center gap-2 text-xs text-slate/70">
            <span className={`h-2 w-2 rounded-full ${
              job.competition_level === 'low' ? 'bg-green-400' :
              job.competition_level === 'medium' ? 'bg-yellow-400' : 'bg-red-400'
            }`} />
            <span className="capitalize">{job.competition_level} competition</span>
            {job.applicant_count > 0 && <span>· {job.applicant_count} applicants</span>}
          </div>
        </div>

        {/* Action buttons */}
        <div className="px-5 pb-5 pt-2 flex gap-2 flex-shrink-0 border-t border-ink/5">
          <button
            onMouseDown={e => e.stopPropagation()}
            onClick={e => { e.stopPropagation(); act('left', false) }}
            disabled={busy}
            className="flex-1 rounded-xl border-2 border-coral/30 bg-coral/5 py-2.5 text-sm font-semibold text-coral hover:bg-coral/10 transition disabled:opacity-40"
          >
            ✕ Skip
          </button>
          <button
            onMouseDown={e => e.stopPropagation()}
            onClick={e => { e.stopPropagation(); navigate(`/jobs/${job.id}`) }}
            className="rounded-xl border border-ink/10 bg-gray-50 px-3 py-2.5 text-sm text-slate hover:bg-gray-100 transition"
          >
            Info
          </button>
          <button
            onMouseDown={e => e.stopPropagation()}
            onClick={e => { e.stopPropagation(); act('right', false) }}
            disabled={busy}
            className="flex-1 rounded-xl border-2 border-teal/30 bg-teal/5 py-2.5 text-sm font-semibold text-teal hover:bg-teal/10 transition disabled:opacity-40"
          >
            ♥ Save
          </button>
          <button
            onMouseDown={e => e.stopPropagation()}
            onClick={e => { e.stopPropagation(); act('right', true) }}
            disabled={busy}
            className="flex-1 rounded-xl bg-coral py-2.5 text-sm font-semibold text-white hover:bg-coral/90 transition disabled:opacity-40"
          >
            Apply →
          </button>
        </div>
      </div>
    </div>
  )
}
