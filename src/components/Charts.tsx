import React, { useState } from "react";

// --- CUSTOM SVG BAR CHART (VERTICAL OR HORIZONTAL) ---
interface BarChartProps {
  data: Array<{ [key: string]: any }>;
  xKey: string;
  bars: Array<{ key: string; name: string; color: string }>;
  height?: number;
}

export const SimpleBarChart: React.FC<BarChartProps> = ({ data, xKey, bars, height = 220 }) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return <div className="h-48 flex items-center justify-center text-xs text-slate-400">No chart data available</div>;
  }

  // Find max value across all bar keys
  const maxValue = Math.max(
    ...data.map((item) => Math.max(...bars.map((b) => Number(item[b.key]) || 0))),
    10
  );

  return (
    <div className="w-full flex flex-col justify-end" style={{ height }}>
      {/* Chart Canvas */}
      <div className="flex-1 flex items-end gap-2 sm:gap-4 pb-2 border-b border-slate-200 relative pt-6">
        {data.map((item, idx) => {
          const isHovered = hoveredIdx === idx;
          return (
            <div
              key={idx}
              className="flex-1 flex flex-col items-center justify-end h-full relative group cursor-pointer"
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              {/* Tooltip */}
              {isHovered && (
                <div className="absolute -top-12 z-30 bg-slate-900 text-white text-[11px] font-medium py-1 px-2.5 rounded-lg shadow-lg whitespace-nowrap pointer-events-none transform -translate-y-1">
                  <div className="font-bold text-slate-300 mb-0.5">{item[xKey]}</div>
                  {bars.map((b) => (
                    <div key={b.key} className="flex items-center space-x-1.5 text-[10px]">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: b.color }} />
                      <span>{b.name}:</span>
                      <span className="font-bold">{item[b.key]}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Bars Group */}
              <div className="w-full flex items-end justify-center gap-1 h-full">
                {bars.map((b) => {
                  const val = Number(item[b.key]) || 0;
                  const heightPercent = Math.max((val / maxValue) * 100, 4);
                  return (
                    <div
                      key={b.key}
                      style={{
                        height: `${heightPercent}%`,
                        backgroundColor: b.color
                      }}
                      className={`w-full max-w-[28px] rounded-t-md transition-all duration-200 ${
                        isHovered ? "brightness-110 shadow-sm" : "opacity-90"
                      }`}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* X-Axis Labels */}
      <div className="flex gap-2 sm:gap-4 pt-2">
        {data.map((item, idx) => (
          <div key={idx} className="flex-1 text-center truncate text-[10px] sm:text-xs font-bold text-slate-600">
            {String(item[xKey])}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 pt-3 text-[11px] font-semibold text-slate-500">
        {bars.map((b) => (
          <div key={b.key} className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: b.color }} />
            <span>{b.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- HORIZONTAL FUNNEL BAR CHART ---
interface FunnelChartProps {
  data: Array<{ stage: string; count: number }>;
  height?: number;
}

export const HorizontalFunnelChart: React.FC<FunnelChartProps> = ({ data, height = 240 }) => {
  if (!data || data.length === 0) {
    return <div className="h-48 flex items-center justify-center text-xs text-slate-400">No funnel data available</div>;
  }

  const maxCount = Math.max(...data.map((d) => d.count), 1);
  const colors = ["#4f46e5", "#6366f1", "#818cf8", "#10b981", "#059669"];

  return (
    <div className="w-full flex flex-col justify-center space-y-3 py-2" style={{ minHeight: height }}>
      {data.map((item, idx) => {
        const widthPercent = Math.max((item.count / maxCount) * 100, 6);
        const color = colors[idx % colors.length];

        return (
          <div key={item.stage} className="space-y-1">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span>{item.stage}</span>
              <span className="font-mono text-slate-900 font-extrabold">{item.count} candidates</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden relative">
              <div
                className="h-full rounded-full transition-all duration-500 flex items-center justify-end pr-2 text-[10px] font-bold text-white shadow-xs"
                style={{
                  width: `${widthPercent}%`,
                  backgroundColor: color
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

// --- INTERACTIVE AREA / TREND CHART ---
interface AreaTrendChartProps {
  data: Array<{ month: string; applications: number; interviews: number }>;
  height?: number;
}

export const SimpleAreaTrendChart: React.FC<AreaTrendChartProps> = ({ data, height = 220 }) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return <div className="h-48 flex items-center justify-center text-xs text-slate-400">No trend data available</div>;
  }

  const maxVal = Math.max(
    ...data.map((d) => Math.max(d.applications || 0, d.interviews || 0)),
    10
  );

  const paddingX = 20;
  const paddingY = 20;
  const chartWidth = 500;
  const chartHeight = 160;

  const pointsApp = data.map((d, i) => {
    const x = paddingX + (i / (data.length - 1 || 1)) * (chartWidth - paddingX * 2);
    const y = chartHeight - paddingY - ((d.applications || 0) / maxVal) * (chartHeight - paddingY * 2);
    return { x, y, val: d.applications, month: d.month };
  });

  const pointsInt = data.map((d, i) => {
    const x = paddingX + (i / (data.length - 1 || 1)) * (chartWidth - paddingX * 2);
    const y = chartHeight - paddingY - ((d.interviews || 0) / maxVal) * (chartHeight - paddingY * 2);
    return { x, y, val: d.interviews, month: d.month };
  });

  const generateAreaPath = (points: Array<{ x: number; y: number }>) => {
    if (points.length === 0) return "";
    const first = points[0];
    const last = points[points.length - 1];
    const lineCommands = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
    return `${lineCommands} L ${last.x} ${chartHeight - paddingY} L ${first.x} ${chartHeight - paddingY} Z`;
  };

  const generateLinePath = (points: Array<{ x: number; y: number }>) => {
    return points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  };

  return (
    <div className="w-full flex flex-col" style={{ height }}>
      <div className="flex-1 relative w-full">
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full overflow-visible">
          <defs>
            <linearGradient id="gradApp" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="gradInt" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line x1={paddingX} y1={chartHeight - paddingY} x2={chartWidth - paddingX} y2={chartHeight - paddingY} stroke="#e2e8f0" strokeWidth="1" />
          <line x1={paddingX} y1={chartHeight / 2} x2={chartWidth - paddingX} y2={chartHeight / 2} stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />

          {/* Areas */}
          <path d={generateAreaPath(pointsApp)} fill="url(#gradApp)" />
          <path d={generateAreaPath(pointsInt)} fill="url(#gradInt)" />

          {/* Lines */}
          <path d={generateLinePath(pointsApp)} fill="none" stroke="#4f46e5" strokeWidth="2.5" strokeLinecap="round" />
          <path d={generateLinePath(pointsInt)} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" />

          {/* Data Points */}
          {pointsApp.map((p, idx) => (
            <circle
              key={`app-${idx}`}
              cx={p.x}
              cy={p.y}
              r={hoveredIdx === idx ? 5 : 3.5}
              className="fill-indigo-600 stroke-white stroke-2 cursor-pointer transition-all"
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
            />
          ))}

          {pointsInt.map((p, idx) => (
            <circle
              key={`int-${idx}`}
              cx={p.x}
              cy={p.y}
              r={hoveredIdx === idx ? 5 : 3.5}
              className="fill-emerald-500 stroke-white stroke-2 cursor-pointer transition-all"
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
            />
          ))}
        </svg>

        {/* Hover Tooltip overlay */}
        {hoveredIdx !== null && (
          <div className="absolute top-2 right-4 bg-slate-900 text-white text-[11px] py-1.5 px-3 rounded-lg shadow-lg pointer-events-none">
            <div className="font-bold text-slate-300">{data[hoveredIdx].month}</div>
            <div className="flex items-center space-x-2 text-indigo-300">
              <span>Applications:</span>
              <span className="font-bold font-mono">{data[hoveredIdx].applications}</span>
            </div>
            <div className="flex items-center space-x-2 text-emerald-300">
              <span>Interviews:</span>
              <span className="font-bold font-mono">{data[hoveredIdx].interviews}</span>
            </div>
          </div>
        )}
      </div>

      {/* X-Axis labels */}
      <div className="flex justify-between px-2 pt-1 text-[11px] font-bold text-slate-500">
        {data.map((d) => (
          <span key={d.month}>{d.month}</span>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 pt-3 text-[11px] font-semibold text-slate-600">
        <span className="flex items-center space-x-1.5">
          <span className="w-3 h-1 bg-indigo-600 rounded-full inline-block"></span>
          <span>Applications</span>
        </span>
        <span className="flex items-center space-x-1.5">
          <span className="w-3 h-1 bg-emerald-500 rounded-full inline-block"></span>
          <span>Interviews Scheduled</span>
        </span>
      </div>
    </div>
  );
};

// --- INTERACTIVE DONUT / PIE CHART ---
interface DonutChartProps {
  data: Array<{ name?: string; range?: string; value?: number; candidates?: number }>;
  colors?: string[];
  height?: number;
}

export const SimpleDonutChart: React.FC<DonutChartProps> = ({
  data,
  colors = ["#4f46e5", "#06b6d4", "#10b981", "#f59e0b", "#8b5cf6"],
  height = 200
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return <div className="h-48 flex items-center justify-center text-xs text-slate-400">No distribution data</div>;
  }

  const items = data.map((d) => ({
    label: d.name || d.range || "Unknown",
    val: d.value ?? d.candidates ?? 0
  }));

  const total = items.reduce((acc, curr) => acc + curr.val, 0) || 1;

  // SVG Donut calculation
  const size = 160;
  const radius = 60;
  const strokeWidth = 24;
  const circumference = 2 * Math.PI * radius;

  let cumulativePercent = 0;

  return (
    <div className="w-full flex flex-col sm:flex-row items-center justify-center gap-4 py-2" style={{ minHeight: height }}>
      {/* SVG Donut */}
      <div className="relative w-40 h-40 flex items-center justify-center">
        <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full -rotate-90 transform">
          {items.map((item, idx) => {
            const percent = item.val / total;
            const strokeDasharray = `${circumference * percent} ${circumference * (1 - percent)}`;
            const strokeDashoffset = -circumference * cumulativePercent;
            cumulativePercent += percent;
            const color = colors[idx % colors.length];
            const isHovered = hoveredIdx === idx;

            return (
              <circle
                key={idx}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="transparent"
                stroke={color}
                strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-200 cursor-pointer"
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              />
            );
          })}
        </svg>

        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
          <span className="text-lg font-black font-mono text-slate-900">
            {hoveredIdx !== null ? items[hoveredIdx].val : total}
          </span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            {hoveredIdx !== null ? items[hoveredIdx].label.split(" ")[0] : "Total"}
          </span>
        </div>
      </div>

      {/* Legend list */}
      <div className="flex flex-col space-y-1.5 text-xs max-w-[200px]">
        {items.map((item, idx) => {
          const color = colors[idx % colors.length];
          const pct = Math.round((item.val / total) * 100);
          return (
            <div
              key={idx}
              className={`flex items-center justify-between space-x-3 px-2 py-1 rounded-md transition-colors cursor-pointer ${
                hoveredIdx === idx ? "bg-slate-100 font-bold" : "text-slate-600"
              }`}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              <div className="flex items-center space-x-2 truncate">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                <span className="truncate text-[11px]">{item.label}</span>
              </div>
              <span className="font-mono text-[11px] font-bold text-slate-800 shrink-0">{pct}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// --- RADAR PERFORMANCE CHART ---
interface RadarChartProps {
  data: Array<{ category: string; score: number; benchmark: number }>;
  height?: number;
}

export const SimpleRadarChart: React.FC<RadarChartProps> = ({ data, height = 200 }) => {
  if (!data || data.length === 0) {
    return <div className="h-48 flex items-center justify-center text-xs text-slate-400">No radar metrics</div>;
  }

  const size = 200;
  const center = size / 2;
  const radius = 70;
  const numSides = data.length;

  const getCoordinates = (index: number, val: number) => {
    const angle = (Math.PI * 2 / numSides) * index - Math.PI / 2;
    const dist = (val / 100) * radius;
    return {
      x: center + dist * Math.cos(angle),
      y: center + dist * Math.sin(angle)
    };
  };

  const scorePolygon = data.map((d, i) => {
    const { x, y } = getCoordinates(i, d.score);
    return `${x},${y}`;
  }).join(" ");

  const benchmarkPolygon = data.map((d, i) => {
    const { x, y } = getCoordinates(i, d.benchmark);
    return `${x},${y}`;
  }).join(" ");

  return (
    <div className="w-full flex flex-col items-center justify-center" style={{ height }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full max-h-[170px]">
        {/* Background Grids */}
        {[0.25, 0.5, 0.75, 1].map((level, lIdx) => {
          const gridPolygon = data.map((_, i) => {
            const angle = (Math.PI * 2 / numSides) * i - Math.PI / 2;
            const dist = level * radius;
            return `${center + dist * Math.cos(angle)},${center + dist * Math.sin(angle)}`;
          }).join(" ");
          return <polygon key={lIdx} points={gridPolygon} fill="none" stroke="#f1f5f9" strokeWidth="1.2" />;
        })}

        {/* Spokes */}
        {data.map((_, i) => {
          const angle = (Math.PI * 2 / numSides) * i - Math.PI / 2;
          const x = center + radius * Math.cos(angle);
          const y = center + radius * Math.sin(angle);
          return <line key={i} x1={center} y1={center} x2={x} y2={y} stroke="#e2e8f0" strokeWidth="1" />;
        })}

        {/* Benchmark Area */}
        <polygon points={benchmarkPolygon} fill="#94a3b8" fillOpacity="0.2" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="3 3" />

        {/* Candidate Score Area */}
        <polygon points={scorePolygon} fill="#4f46e5" fillOpacity="0.45" stroke="#4f46e5" strokeWidth="2.5" />

        {/* Category labels */}
        {data.map((d, i) => {
          const angle = (Math.PI * 2 / numSides) * i - Math.PI / 2;
          const dist = radius + 18;
          const x = center + dist * Math.cos(angle);
          const y = center + dist * Math.sin(angle);
          return (
            <text
              key={i}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="middle"
              className="text-[8.5px] font-extrabold fill-slate-600"
            >
              {d.category.split(" ")[0]}
            </text>
          );
        })}
      </svg>
    </div>
  );
};
