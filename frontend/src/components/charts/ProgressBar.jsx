import React from 'react'

export default function ProgressBar({ label, value, max = 100, color = 'bg-teal', suffix = '%' }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))
  return (
    <div>
      {label && (
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-slate">{label}</span>
          <span className="text-xs font-medium text-ink">{Math.round(value)}{suffix}</span>
        </div>
      )}
      <div className="h-2 w-full rounded-full bg-sand overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
