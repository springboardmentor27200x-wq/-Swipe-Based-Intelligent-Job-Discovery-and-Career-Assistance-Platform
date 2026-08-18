import React from 'react'

const PALETTE = ['#FF5A5F', '#0E6B6B', '#14171C', '#EFE9DD', '#9B7EDE', '#F2A65A', '#5C6470']

/**
 * Minimal SVG donut chart. data: [{ label, value }]
 */
export default function DonutChart({ data = [], size = 140, strokeWidth = 18 }) {
  const total = data.reduce((sum, d) => sum + d.value, 0)
  if (!total) {
    return <p className="text-sm text-slate py-8 text-center">No data yet</p>
  }

  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  let offset = 0

  return (
    <div className="flex items-center gap-5">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          {data.map((d, i) => {
            const fraction = d.value / total
            const dash = fraction * circumference
            const el = (
              <circle
                key={d.label + i}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={PALETTE[i % PALETTE.length]}
                strokeWidth={strokeWidth}
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeDashoffset={-offset}
              />
            )
            offset += dash
            return el
          })}
        </g>
      </svg>
      <div className="flex-1 space-y-1.5 min-w-0">
        {data.map((d, i) => (
          <div key={d.label + i} className="flex items-center gap-2 text-xs">
            <span className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ background: PALETTE[i % PALETTE.length] }} />
            <span className="text-slate capitalize truncate">{d.label.replace(/_/g, ' ')}</span>
            <span className="ml-auto font-medium text-ink">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
