import React from 'react'

/**
 * Minimal SVG bar chart. data: [{ label, value }]
 */
export default function BarChart({ data = [], height = 160, color = '#0E6B6B', valueSuffix = '' }) {
  if (!data.length) {
    return <p className="text-sm text-slate py-8 text-center">No data yet</p>
  }
  const max = Math.max(...data.map(d => d.value), 1)
  const barWidth = 100 / data.length

  return (
    <div>
      <svg viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" className="w-full" style={{ height }}>
        {data.map((d, i) => {
          const h = (d.value / max) * (height - 24)
          const x = i * barWidth
          return (
            <g key={d.label + i}>
              <rect
                x={`${x + barWidth * 0.15}%`}
                y={height - 24 - h}
                width={`${barWidth * 0.7}%`}
                height={h}
                rx="3"
                fill={color}
                opacity={0.85}
              />
              <text
                x={`${x + barWidth * 0.5}%`}
                y={height - 8}
                fontSize="6"
                textAnchor="middle"
                fill="#5C6470"
              >
                {d.value}
              </text>
            </g>
          )
        })}
      </svg>
      <div className="mt-2 flex justify-between text-[10px] text-slate px-1">
        {data.map((d, i) => (
          <span key={d.label + i} className="truncate" style={{ width: `${barWidth}%`, textAlign: 'center' }}>
            {d.label}
          </span>
        ))}
      </div>
    </div>
  )
}
