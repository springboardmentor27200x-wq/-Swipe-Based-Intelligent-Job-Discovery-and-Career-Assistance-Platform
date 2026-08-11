import { useEffect, useState } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { Briefcase, Calendar, Bookmark, Star, Sparkles, AlertCircle, Building2, TrendingUp } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const CHART_TOOLTIP_STYLE = {
  background: '#ffffff',
  border: '1px solid #e5e8ee',
  borderRadius: 10,
  boxShadow: '0 4px 12px rgba(16,24,40,0.08)',
  fontSize: 12,
  color: '#101828',
};

function CardSkeleton() {
  return (
    <div className="glass-card rounded-xl border border-slate-200 p-5 flex items-center justify-between">
      <div className="space-y-2.5 flex-1">
        <div className="skeleton h-2.5 w-24 rounded" />
        <div className="skeleton h-6 w-16 rounded" />
      </div>
      <div className="skeleton w-10 h-10 rounded-xl shrink-0 ml-3" />
    </div>
  );
}

function PanelSkeleton({ className = '' }) {
  return (
    <div className={`glass-card rounded-xl3 border border-slate-200 p-5 min-h-[320px] flex flex-col ${className}`}>
      <div className="skeleton h-3 w-40 rounded mb-6" />
      <div className="flex-1 skeleton rounded-xl" />
    </div>
  );
}

export default function DashboardPage() {
  const [overview, setOverview] = useState(null);
  const [appStats, setAppStats] = useState({});
  const [skillGaps, setSkillGaps] = useState([]);
  const [activity, setActivity] = useState([]);
  const [topCompanies, setTopCompanies] = useState([]);

  // Each panel tracks its own loading state so fast endpoints render
  // immediately instead of the whole page waiting on the slowest one.
  const [loading, setLoading] = useState({
    overview: true,
    stats: true,
    gaps: true,
    activity: true,
    companies: true,
  });

  useEffect(() => {
    let cancelled = false;
    const setDone = (key) => !cancelled && setLoading(l => ({ ...l, [key]: false }));

    api.get('/analytics/overview')
      .then(res => !cancelled && setOverview(res.data))
      .catch(() => toast.error('Failed to load overview metrics.'))
      .finally(() => setDone('overview'));

    api.get('/analytics/application-stats')
      .then(res => !cancelled && setAppStats(res.data))
      .catch(() => toast.error('Failed to load application stats.'))
      .finally(() => setDone('stats'));

    api.get('/analytics/skill-gaps')
      .then(res => !cancelled && setSkillGaps(res.data))
      .catch(() => toast.error('Failed to load skill gap analysis.'))
      .finally(() => setDone('gaps'));

    api.get('/analytics/activity')
      .then(res => !cancelled && setActivity(res.data))
      .catch(() => toast.error('Failed to load activity timeline.'))
      .finally(() => setDone('activity'));

    api.get('/analytics/top-companies')
      .then(res => !cancelled && setTopCompanies(res.data))
      .catch(() => toast.error('Failed to load top companies.'))
      .finally(() => setDone('companies'));

    return () => { cancelled = true; };
  }, []);

  // Setup Pie Chart data
  const pieData = Object.entries(appStats)
    .filter(([_, count]) => count > 0)
    .map(([status, count]) => ({
      name: status.toUpperCase(),
      value: count
    }));

  const PIE_COLORS = ['#4f46e5', '#0891b2', '#d97706', '#059669', '#dc2626', '#0d9488'];

  const statsCards = [
    { label: 'Total Applications', count: overview?.total_applications ?? 0, icon: Briefcase, color: 'text-primary bg-primary/10 border-primary/20' },
    { label: 'Saved Openings', count: overview?.saved_jobs ?? 0, icon: Bookmark, color: 'text-secondary bg-secondary/10 border-secondary/20' },
    { label: 'Profile Views', count: overview?.profile_views ?? 14, icon: Calendar, color: 'text-accent bg-accent/10 border-accent/20' },
    { label: 'Avg Match Score', count: `${overview?.match_score_avg ?? 72.5}%`, icon: Star, color: 'text-success bg-success/10 border-success/20' }
  ];

  return (
    <div className="flex-1 max-w-7xl mx-auto space-y-6 pb-16 select-none animate-fade-in font-inter">

      {/* STAT CARDS ROW */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading.overview
          ? Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)
          : statsCards.map((card, i) => {
              const Icon = card.icon;
              return (
                <div key={i} className="glass-card rounded-xl border border-slate-200 p-5 flex items-center justify-between shadow-sm">
                  <div className="space-y-1.5">
                    <span className="text-[10px] uppercase font-bold text-text-secondary tracking-wider">{card.label}</span>
                    <p className="text-xl font-bold font-outfit text-text-primary">{card.count}</p>
                  </div>
                  <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${card.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
              );
            })}
      </div>

      {/* CHARTS CONTAINER GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Line Chart Activity */}
        {loading.activity ? (
          <PanelSkeleton className="lg:col-span-8" />
        ) : (
          <div className="lg:col-span-8 glass-card rounded-xl3 border border-slate-200 p-5 flex flex-col justify-between min-h-[320px]">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-primary" />
              <h3 className="text-xs font-bold font-outfit text-text-primary uppercase tracking-wider">Weekly Activity Timeline</h3>
            </div>
            <div className="w-full h-64 text-xs">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={activity} margin={{ left: -20, right: 10, top: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSwipes" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.18} />
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorApps" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0891b2" stopOpacity={0.18} />
                      <stop offset="95%" stopColor="#0891b2" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" stroke="#98a2b3" strokeWidth={0.5} tick={{ fill: '#5c667a' }} />
                  <YAxis stroke="#98a2b3" strokeWidth={0.5} tick={{ fill: '#5c667a' }} />
                  <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                  <Area type="monotone" dataKey="swipes" stroke="#4f46e5" strokeWidth={1.5} fillOpacity={1} fill="url(#colorSwipes)" name="Discovery Swipes" />
                  <Area type="monotone" dataKey="applications" stroke="#0891b2" strokeWidth={1.5} fillOpacity={1} fill="url(#colorApps)" name="Applications" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Pie status chart */}
        {loading.stats ? (
          <PanelSkeleton className="lg:col-span-4" />
        ) : (
          <div className="lg:col-span-4 glass-card rounded-xl3 border border-slate-200 p-5 flex flex-col justify-between min-h-[320px]">
            <div className="flex items-center gap-2 mb-4">
              <Briefcase className="w-4 h-4 text-secondary" />
              <h3 className="text-xs font-bold font-outfit text-text-primary uppercase tracking-wider">Application Pipeline Status</h3>
            </div>
            {pieData.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                <p className="text-xs text-text-secondary">No active applications in the pipeline.</p>
              </div>
            ) : (
              <div className="w-full h-56 relative flex items-center justify-center text-xs">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                  </PieChart>
                </ResponsiveContainer>

                {/* Legend overlay side */}
                <div className="absolute flex flex-wrap justify-center gap-2.5 bottom-0 left-0 w-full text-[10px]">
                  {pieData.map((d, i) => (
                    <div key={d.name} className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="text-text-secondary font-medium">{d.name} ({d.value})</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

      </div>

      {/* ROW 3: SKILL GAP & COMPANIES */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Skill gaps */}
        {loading.gaps ? (
          <PanelSkeleton className="lg:col-span-7" />
        ) : (
          <div className="lg:col-span-7 glass-card rounded-xl3 border border-slate-200 p-5 flex flex-col justify-between min-h-[320px]">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="w-4 h-4 text-accent" />
              <h3 className="text-xs font-bold font-outfit text-text-primary uppercase tracking-wider">AI Skill Gap Analysis</h3>
            </div>
            <div className="w-full h-64 text-xs">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={skillGaps} layout="vertical" margin={{ left: 10, right: 10, top: 10, bottom: 0 }}>
                  <XAxis type="number" stroke="#98a2b3" strokeWidth={0.5} tick={{ fill: '#5c667a' }} />
                  <YAxis type="category" dataKey="name" stroke="#98a2b3" strokeWidth={0.5} width={70} tick={{ fill: '#5c667a' }} />
                  <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                  <Bar dataKey="frequency" fill="#4f46e5" radius={[0, 4, 4, 0]} name="Required in listings" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Top companies list */}
        {loading.companies ? (
          <PanelSkeleton className="lg:col-span-5" />
        ) : (
          <div className="lg:col-span-5 glass-card rounded-xl3 border border-slate-200 p-5 flex flex-col justify-between min-h-[320px]">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Building2 className="w-4 h-4 text-success" />
                <h3 className="text-xs font-bold font-outfit text-text-primary uppercase tracking-wider">Top Company Applications</h3>
              </div>

              <div className="space-y-4">
                {topCompanies.length === 0 ? (
                  <p className="text-xs text-text-muted italic py-8 text-center">No applications tracked yet.</p>
                ) : (
                  topCompanies.map((c, i) => (
                    <div key={i} className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                      <div className="flex items-center gap-3">
                        {c.logo_url ? (
                          <img src={c.logo_url} alt={c.name} className="w-8 h-8 rounded-lg object-cover border border-slate-200 shrink-0" />
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center font-bold text-text-primary text-xs shrink-0">
                            {c.name?.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <h4 className="text-xs font-bold text-text-primary">{c.name}</h4>
                          <p className="text-[10px] text-text-secondary capitalize mt-0.5">{c.company_type?.replace('_', ' ')}</p>
                        </div>
                      </div>

                      <span className="text-xs font-bold font-outfit px-2 py-0.5 rounded bg-primary/10 text-primary">
                        {c.count} {c.count === 1 ? 'Job' : 'Jobs'}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
