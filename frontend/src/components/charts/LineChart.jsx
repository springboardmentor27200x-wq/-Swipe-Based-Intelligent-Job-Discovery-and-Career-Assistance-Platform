import React from 'react'

/**
 * Minimal SVG line chart. data: [{ label, value }]
 *
 * Handles sparse data explicitly:
 *  - 0 points → "No data yet" message
 *  - 1 point  → a filled dot + its value labelled directly above it
 *               (a straight line has nothing to connect, so we don't try
 *               to draw one — we make the single value legible instead)
 *  - 2+ points → normal connected line with visible markers
 */
export default function LineChart({ data = [], height = 160, color = '#FF5A5F', max: fixedMax }) {
  if (!data.length) {
    return <p className="text-sm text-slate py-8 text-center">No data yet</p>
  }

  const max = fixedMax ?? Math.max(...data.map(d => d.value), 1)
  const plotHeight = height - 32
  const valueY = (v) => height - 20 - (v / max) * plotHeight

  if (data.length === 1) {
    const only = data[0]
    const y = valueY(only.value)
    return (
      <div>
        <svg viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" className="w-full" style={{ height }}>
          {/* baseline for visual reference */}
          <line x1="0" y1={height - 20} x2="100" y2={height - 20} stroke="#EFE9DD" strokeWidth="1" />
          <line x1="50" y1={height - 20} x2="50" y2={y} stroke={color} strokeWidth="1.5" strokeDasharray="2 2" opacity="0.5" />
          <circle cx="50" cy={y} r="2.6" fill={color} />
          <text x="50" y={Math.max(y - 5, 6)} fontSize="7" textAnchor="middle" fill="#14171C" fontWeight="600">
            {only.value}
          </text>
        </svg>
        <div className="mt-2 text-center text-[10px] text-slate">{only.label}</div>
      </div>
    )
  }

  const stepX = 100 / (data.length - 1)
  const points = data.map((d, i) => ({ x: i * stepX, y: valueY(d.value), ...d }))
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')

  return (
    <div>
      <svg viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" className="w-full" style={{ height }}>
        <path d={pathD} fill="none" stroke={color} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="2" fill={color} />
        ))}
      </svg>
      <div className="mt-2 flex justify-between text-[10px] text-slate px-1">
        {data.map((d, i) => (
          (data.length <= 12 || i % Math.ceil(data.length / 8) === 0) ? (
            <span key={d.label + i} className="truncate">{d.label}</span>
          ) : null
        ))}
      </div>
    </div>
  )
}
