import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  Users,
  Briefcase,
  FileText,
  Send,
  LogOut,
  Search,
  Download,
  ArrowUpDown,
  X,
  ShieldCheck,
  Trash2,
  Settings,
} from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  AreaChart,
  Area,
} from "recharts";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

const ACCENT = "#d946ef";
const ACCENT_2 = "#8b5cf6";
const GREEN = "#34d399";
const RED = "#f87171";
const PAGE_SIZE = 5;
const AUTO_REFRESH_MS = 45000;

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [jobSeekers, setJobSeekers] = useState([]);
  const [recruiters, setRecruiters] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [topJobs, setTopJobs] = useState([]);
  const [topCompanies, setTopCompanies] = useState([]);

  const [tab, setTab] = useState("jobseekers");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [sortDir, setSortDir] = useState("desc");
  const [page, setPage] = useState(1);
  const [confirmAction, setConfirmAction] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [toast, setToast] = useState(null);
  const [platformSettings, setPlatformSettings] = useState(null);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState("");

  const prevCounts = useRef({ jobSeekers: null, recruiters: null });

  const loadAll = async (isBackgroundRefresh = false) => {
    if (!isBackgroundRefresh) setLoading(true);
    setError("");
    try {
      const [s, j, r, jb, ad, tj, tc, pset] = await Promise.all([
        api.get("/api/admin/dashboard/stats"),
        api.get("/api/admin/jobseekers"),
        api.get("/api/admin/recruiters"),
        api.get("/api/admin/jobs"),
        api.get("/api/admin/admins"),
        api.get("/api/admin/insights/top-jobs"),
        api.get("/api/admin/insights/top-companies"),
        api.get("/api/admin/settings"),
      ]);
      setStats(s.data);
      setJobSeekers(j.data);
      setRecruiters(r.data);
      setJobs(jb.data);
      setAdmins(ad.data);
      setTopJobs(tj.data);
      setTopCompanies(tc.data);
      setPlatformSettings(pset.data);
      setLastUpdated(new Date());

      if (prevCounts.current.jobSeekers !== null) {
        const newJobSeekers = j.data.length - prevCounts.current.jobSeekers;
        const newRecruiters = r.data.length - prevCounts.current.recruiters;
        if (newJobSeekers > 0) {
          setToast(`${newJobSeekers} new job seeker${newJobSeekers > 1 ? "s" : ""} signed up`);
        } else if (newRecruiters > 0) {
          setToast(`${newRecruiters} new recruiter${newRecruiters > 1 ? "s" : ""} signed up`);
        }
      }
      prevCounts.current = { jobSeekers: j.data.length, recruiters: r.data.length };
    } catch (err) {
      setError(err?.response?.data?.detail || "Could not load dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    const interval = setInterval(() => loadAll(true), AUTO_REFRESH_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(t);
  }, [toast]);

  const requestToggleUser = (row) => setConfirmAction({ kind: "toggle-user", row });
  const requestDeleteUser = (row) => setConfirmAction({ kind: "delete-user", row });
  const requestToggleJob = (row) => setConfirmAction({ kind: "toggle-job", row });

  const runConfirmedAction = async () => {
    if (!confirmAction) return;
    const { kind, row } = confirmAction;
    try {
      if (kind === "toggle-user") {
        await api.put(`/api/admin/users/${row.user_id}/toggle-active`);
      } else if (kind === "delete-user") {
        await api.delete(`/api/admin/users/${row.user_id}`);
      } else if (kind === "toggle-job") {
        await api.put(`/api/admin/jobs/${row.id}/toggle-active`);
      }
      setConfirmAction(null);
      setSelectedUser(null);
      loadAll(true);
    } catch (err) {
      setError(err?.response?.data?.detail || "That action could not be completed.");
      setConfirmAction(null);
    }
  };

  const saveSettings = async (updates) => {
    setSettingsSaving(true);
    setSettingsMsg("");
    try {
      const { data } = await api.put("/api/admin/settings", updates);
      setPlatformSettings(data);
      setSettingsMsg("Saved.");
    } catch (err) {
      setSettingsMsg(err?.response?.data?.detail || "Could not save settings.");
    } finally {
      setSettingsSaving(false);
      setTimeout(() => setSettingsMsg(""), 3000);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const buildUserRows = (list) => {
    let rows = list.filter(
      (r) =>
        r.full_name.toLowerCase().includes(search.toLowerCase()) ||
        r.email.toLowerCase().includes(search.toLowerCase())
    );
    rows = [...rows].sort((a, b) => {
      const diff = new Date(a.created_at) - new Date(b.created_at);
      return sortDir === "asc" ? diff : -diff;
    });
    return rows;
  };

  const buildJobRows = () => {
    let rows = jobs.filter(
      (j) =>
        j.title.toLowerCase().includes(search.toLowerCase()) ||
        j.company_name.toLowerCase().includes(search.toLowerCase())
    );
    rows = [...rows].sort((a, b) => {
      const diff = new Date(a.posted_at) - new Date(b.posted_at);
      return sortDir === "asc" ? diff : -diff;
    });
    return rows;
  };

  const filteredJobSeekers = buildUserRows(jobSeekers);
  const filteredRecruiters = buildUserRows(recruiters);
  const filteredJobs = buildJobRows();
  const filteredAdmins = admins.filter(
    (a) =>
      a.full_name.toLowerCase().includes(search.toLowerCase()) ||
      a.email.toLowerCase().includes(search.toLowerCase())
  );

  const activeRows =
    tab === "jobseekers" ? filteredJobSeekers :
    tab === "recruiters" ? filteredRecruiters :
    tab === "jobs" ? filteredJobs :
    tab === "settings" ? [] :
    filteredAdmins;

  const totalPages = Math.max(1, Math.ceil(activeRows.length / PAGE_SIZE));
  const pageRows = activeRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const goToTab = (t) => {
    setTab(t);
    setPage(1);
    setSearch("");
  };

  const exportCSV = () => {
    let header, lines;
    if (tab === "jobs") {
      header = ["Title", "Company", "Location", "Type", "Posted", "Applicants", "Status"];
      lines = activeRows.map((r) => [
        r.title, r.company_name, r.location, r.employment_type,
        new Date(r.posted_at).toLocaleDateString(), r.applicant_count,
        r.is_active ? "Active" : "Inactive",
      ]);
    } else if (tab === "admins") {
      header = ["Name", "Email", "Joined"];
      lines = activeRows.map((r) => [r.full_name, r.email, new Date(r.created_at).toLocaleDateString()]);
    } else {
      const extraCol = tab === "jobseekers" ? "Location" : "Company";
      const extraKey = tab === "jobseekers" ? "location" : "company_name";
      header = ["Name", "Email", extraCol, "Joined", "Status"];
      lines = activeRows.map((r) => [
        r.full_name, r.email, r[extraKey] || "",
        new Date(r.created_at).toLocaleDateString(), r.is_active ? "Active" : "Disabled",
      ]);
    }
    const csv = [header, ...lines]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `swipex-${tab}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const distributionData = useMemo(() => {
    if (!stats) return [];
    return [
      { name: "Job Seekers", value: stats.total_job_seekers },
      { name: "Recruiters", value: stats.total_recruiters },
    ];
  }, [stats]);

  const activeVsDisabledData = useMemo(() => {
    if (!stats) return [];
    return [
      { name: "Job Seekers", Active: stats.active_job_seekers, Disabled: stats.total_job_seekers - stats.active_job_seekers },
      { name: "Recruiters", Active: stats.active_recruiters, Disabled: stats.total_recruiters - stats.active_recruiters },
    ];
  }, [stats]);

  const signupTrendData = useMemo(() => {
    const months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: d.toLocaleString("default", { month: "short" }), "Job Seekers": 0, Recruiters: 0 });
    }
    const bucket = (dateStr, field) => {
      const d = new Date(dateStr);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const row = months.find((m) => m.key === key);
      if (row) row[field] += 1;
    };
    jobSeekers.forEach((u) => bucket(u.created_at, "Job Seekers"));
    recruiters.forEach((u) => bucket(u.created_at, "Recruiters"));
    return months;
  }, [jobSeekers, recruiters]);

  const topJobsChartData = topJobs.map((j) => ({ name: j.title.length > 16 ? j.title.slice(0, 16) + "…" : j.title, Applicants: j.applicant_count }));
  const topCompaniesChartData = topCompanies.map((c) => ({ name: c.company_name.length > 16 ? c.company_name.slice(0, 16) + "…" : c.company_name, Jobs: c.job_count }));

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#05050b] font-sans text-white">
      <div className="pointer-events-none absolute inset-0">
        <motion.div animate={{ opacity: [0.5, 0.8, 0.5], scale: [1, 1.08, 1] }} transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }} className="absolute -top-40 -left-32 h-[30rem] w-[30rem] rounded-full bg-violet-600/20 blur-[120px]" />
        <motion.div animate={{ opacity: [0.4, 0.7, 0.4], scale: [1.05, 1, 1.05] }} transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }} className="absolute -bottom-40 -right-32 h-[32rem] w-[32rem] rounded-full bg-fuchsia-600/15 blur-[130px]" />
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="fixed right-6 top-6 z-50 rounded-xl border border-fuchsia-500/30 bg-[#12121b] px-4 py-3 text-sm text-fuchsia-200 shadow-xl">
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {confirmAction && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4" onClick={() => setConfirmAction(null)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#12121b] p-6">
              <ConfirmBody action={confirmAction} />
              <div className="mt-5 flex justify-end gap-2">
                <button onClick={() => setConfirmAction(null)} className="rounded-lg border border-white/10 px-4 py-2 text-sm text-gray-300 hover:bg-white/[0.05]">
                  Cancel
                </button>
                <button
                  onClick={runConfirmedAction}
                  className={`rounded-lg px-4 py-2 text-sm font-medium text-white ${
                    confirmAction.kind === "delete-user"
                      ? "bg-red-600 hover:bg-red-500"
                      : "bg-gradient-to-r from-violet-600 to-fuchsia-600"
                  }`}
                >
                  Confirm
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedUser && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex justify-end bg-black/60" onClick={() => setSelectedUser(null)}>
            <motion.div initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 40, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="h-full w-full max-w-sm overflow-y-auto border-l border-white/10 bg-[#0a0a12] p-6">
              <div className="mb-6 flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-300">User details</p>
                <button onClick={() => setSelectedUser(null)}><X className="h-5 w-5 text-gray-400" /></button>
              </div>
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-violet-500/30 to-fuchsia-500/30 text-lg font-semibold text-fuchsia-200">
                {initials(selectedUser.full_name)}
              </div>
              <h2 className="text-lg font-bold text-white">{selectedUser.full_name}</h2>
              <p className="text-sm text-gray-400">{selectedUser.email}</p>
              <div className="mt-5 space-y-3 text-sm">
                {selectedUser.location !== undefined && <DetailRow label="Location" value={selectedUser.location || "—"} />}
                {selectedUser.headline !== undefined && <DetailRow label="Headline" value={selectedUser.headline || "—"} />}
                {selectedUser.company_name !== undefined && <DetailRow label="Company" value={selectedUser.company_name || "—"} />}
                <DetailRow label="Joined" value={new Date(selectedUser.created_at).toLocaleDateString()} />
                <DetailRow label="Status" value={selectedUser.is_active ? "Active" : "Disabled"} />
              </div>
              <div className="mt-6 space-y-2">
                <button onClick={() => requestToggleUser(selectedUser)} className="w-full rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium text-gray-200 hover:bg-white/[0.05]">
                  {selectedUser.is_active ? "Disable account" : "Enable account"}
                </button>
                <button onClick={() => requestDeleteUser(selectedUser)} className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/20 px-4 py-2.5 text-sm font-medium text-red-400 hover:bg-red-500/10">
                  <Trash2 className="h-4 w-4" /> Delete permanently
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10 mx-auto max-w-7xl px-6 py-10 sm:px-10">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 text-lg font-bold text-white shadow-lg shadow-fuchsia-500/30">X</div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">SwipeX <span className="text-fuchsia-400">Admin</span></h1>
              <p className="text-xs text-gray-400">Signed in as {user?.full_name || user?.email}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-gray-200 transition-colors hover:bg-white/[0.08]">
            <LogOut className="h-4 w-4" /> Log out
          </button>
        </div>

        {lastUpdated && (
          <div className="mb-6 flex items-center gap-2 text-xs text-gray-500">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-green-400" />
            </span>
            Last updated {lastUpdated.toLocaleTimeString()} · auto-refreshes every 45s
          </div>
        )}

        {error && <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>}

        {loading ? (
          <SkeletonDashboard />
        ) : (
          <>
            {stats && (
              <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
                <StatCard icon={Users} color="violet" label="Job Seekers" value={stats.total_job_seekers} sub={`${stats.active_job_seekers} active`} />
                <StatCard icon={Briefcase} color="fuchsia" label="Recruiters" value={stats.total_recruiters} sub={`${stats.active_recruiters} active`} />
                <StatCard icon={FileText} color="blue" label="Jobs Posted" value={stats.total_jobs} />
                <StatCard icon={Send} color="green" label="Applications" value={stats.total_applications} />
              </div>
            )}

            <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
              <ChartCard title="User Distribution">
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={distributionData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={80} paddingAngle={4}>
                      <Cell fill={ACCENT_2} /><Cell fill={ACCENT} />
                    </Pie>
                    <Tooltip contentStyle={{ background: "#12121b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-2 flex justify-center gap-5 text-xs">
                  <LegendDot color={ACCENT_2} label="Job Seekers" /><LegendDot color={ACCENT} label="Recruiters" />
                </div>
              </ChartCard>

              <ChartCard title="Active vs Disabled">
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={activeVsDisabledData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                    <XAxis dataKey="name" stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip cursor={{ fill: "rgba(255,255,255,0.05)" }} contentStyle={{ background: "#12121b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 12 }} />
                    <Bar dataKey="Active" fill={GREEN} radius={[6, 6, 0, 0]} />
                    <Bar dataKey="Disabled" fill={RED} radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Signups — Last 6 Months">
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={signupTrendData}>
                    <defs>
                      <linearGradient id="jsGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={ACCENT_2} stopOpacity={0.5} /><stop offset="95%" stopColor={ACCENT_2} stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="rcGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={ACCENT} stopOpacity={0.5} /><stop offset="95%" stopColor={ACCENT} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                    <XAxis dataKey="label" stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={{ background: "#12121b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 12 }} />
                    <Area type="monotone" dataKey="Job Seekers" stroke={ACCENT_2} fill="url(#jsGradient)" strokeWidth={2} />
                    <Area type="monotone" dataKey="Recruiters" stroke={ACCENT} fill="url(#rcGradient)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>

            <div className="mb-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
              <ChartCard title="Top 5 Jobs by Applicants">
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={topJobsChartData} layout="vertical" margin={{ left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" horizontal={false} />
                    <XAxis type="number" stroke="#888" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                    <YAxis type="category" dataKey="name" stroke="#888" fontSize={11} tickLine={false} axisLine={false} width={110} />
                    <Tooltip cursor={{ fill: "rgba(255,255,255,0.05)" }} contentStyle={{ background: "#12121b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 12 }} />
                    <Bar dataKey="Applicants" fill={ACCENT} radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Top 5 Companies by Job Count">
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={topCompaniesChartData} layout="vertical" margin={{ left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" horizontal={false} />
                    <XAxis type="number" stroke="#888" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                    <YAxis type="category" dataKey="name" stroke="#888" fontSize={11} tickLine={false} axisLine={false} width={110} />
                    <Tooltip cursor={{ fill: "rgba(255,255,255,0.05)" }} contentStyle={{ background: "#12121b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 12 }} />
                    <Bar dataKey="Jobs" fill={ACCENT_2} radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>

            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                <TabButton icon={Users} active={tab === "jobseekers"} onClick={() => goToTab("jobseekers")}>Job Seekers ({jobSeekers.length})</TabButton>
                <TabButton icon={Briefcase} active={tab === "recruiters"} onClick={() => goToTab("recruiters")}>Recruiters ({recruiters.length})</TabButton>
                <TabButton icon={FileText} active={tab === "jobs"} onClick={() => goToTab("jobs")}>Jobs ({jobs.length})</TabButton>
                <TabButton icon={ShieldCheck} active={tab === "admins"} onClick={() => goToTab("admins")}>Admins ({admins.length})</TabButton>
                <TabButton icon={Settings} active={tab === "settings"} onClick={() => goToTab("settings")}>Settings</TabButton>
              </div>
              {tab !== "settings" && (
              <div className="flex items-center gap-2">
                <div className="relative w-full max-w-xs">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                  <input
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    placeholder="Search…"
                    className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-2 pl-9 pr-4 text-sm text-white placeholder-gray-500 outline-none focus:border-fuchsia-500/60"
                  />
                </div>
                <button onClick={exportCSV} className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-medium text-gray-200 hover:bg-white/[0.08]">
                  <Download className="h-3.5 w-3.5" /> Export CSV
                </button>
              </div>
              )}
            </div>

            {tab === "jobs" ? (
              <JobsTable rows={pageRows} sortDir={sortDir} onSortToggle={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))} onToggle={requestToggleJob} />
            ) : tab === "admins" ? (
              <AdminsTable rows={pageRows} />
            ) : tab === "settings" ? (
              <SettingsPanel
                settings={platformSettings}
                onSave={saveSettings}
                saving={settingsSaving}
                message={settingsMsg}
              />
            ) : (
              <UserTable
                rows={pageRows}
                extraCol={tab === "jobseekers" ? "Location" : "Company"}
                extraKey={tab === "jobseekers" ? "location" : "company_name"}
                onToggle={requestToggleUser}
                onSelect={setSelectedUser}
                sortDir={sortDir}
                onSortToggle={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
              />
            )}

            {activeRows.length > PAGE_SIZE && (
              <div className="mt-4 flex items-center justify-between text-sm text-gray-400">
                <span>Showing {(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, activeRows.length)} of {activeRows.length}</span>
                <div className="flex gap-2">
                  <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="rounded-lg border border-white/10 px-3 py-1 disabled:opacity-30">Prev</button>
                  <button disabled={page === totalPages} onClick={() => setPage((p) => p + 1)} className="rounded-lg border border-white/10 px-3 py-1 disabled:opacity-30">Next</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function ConfirmBody({ action }) {
  const { kind, row } = action;
  if (kind === "delete-user") {
    return (
      <>
        <p className="text-sm text-gray-300">
          Permanently delete <span className="font-semibold text-white">{row.full_name}</span>'s account?
        </p>
        <p className="mt-1 text-xs text-red-400">
          This cannot be undone. If they have resumes, applications, or posted jobs, this will be blocked — disable the account instead.
        </p>
      </>
    );
  }
  if (kind === "toggle-job") {
    return (
      <p className="text-sm text-gray-300">
        {row.is_active ? "Deactivate" : "Reactivate"} the job{" "}
        <span className="font-semibold text-white">{row.title}</span>?
      </p>
    );
  }
  return (
    <>
      <p className="text-sm text-gray-300">
        {row.is_active ? "Disable" : "Enable"} <span className="font-semibold text-white">{row.full_name}</span>'s account?
      </p>
      <p className="mt-1 text-xs text-gray-500">
        {row.is_active ? "They won't be able to log in until re-enabled." : "They will be able to log in again immediately."}
      </p>
    </>
  );
}

const COLOR_MAP = {
  violet: { bg: "bg-violet-500/10", text: "text-violet-400" },
  fuchsia: { bg: "bg-fuchsia-500/10", text: "text-fuchsia-400" },
  blue: { bg: "bg-blue-500/10", text: "text-blue-400" },
  green: { bg: "bg-green-500/10", text: "text-green-400" },
};

function StatCard({ icon: Icon, color, label, value, sub }) {
  const c = COLOR_MAP[color] || COLOR_MAP.violet;
  return (
    <motion.div whileHover={{ y: -3 }} transition={{ duration: 0.2 }} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl">
      <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-lg ${c.bg}`}><Icon className={`h-4.5 w-4.5 ${c.text}`} /></div>
      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">{label}</p>
      <p className="mt-1 text-3xl font-bold text-white">{value}</p>
      {sub && <p className="mt-1 text-xs text-gray-500">{sub}</p>}
    </motion.div>
  );
}

function ChartCard({ title, children }) {
  return (
    <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl">
      <p className="mb-2 text-sm font-semibold text-gray-200">{title}</p>
      {children}
    </motion.div>
  );
}

function LegendDot({ color, label }) {
  return <div className="flex items-center gap-1.5 text-gray-400"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />{label}</div>;
}

function TabButton({ icon: Icon, active, onClick, children }) {
  return (
    <button onClick={onClick} className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors ${active ? "bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 text-white shadow-lg shadow-fuchsia-600/25" : "border border-white/10 bg-white/[0.04] text-gray-300 hover:bg-white/[0.08]"}`}>
      <Icon className="h-4 w-4" />{children}
    </button>
  );
}

function DetailRow({ label, value }) {
  return <div className="flex items-center justify-between border-b border-white/5 pb-2"><span className="text-gray-500">{label}</span><span className="font-medium text-gray-200">{value}</span></div>;
}

function initials(name) {
  return name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
}

function SkeletonDashboard() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{[...Array(4)].map((_, i) => <div key={i} className="h-28 rounded-2xl border border-white/10 bg-white/[0.03]" />)}</div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">{[...Array(3)].map((_, i) => <div key={i} className="h-56 rounded-2xl border border-white/10 bg-white/[0.03]" />)}</div>
      <div className="h-64 rounded-2xl border border-white/10 bg-white/[0.03]" />
    </div>
  );
}

function UserTable({ rows, extraCol, extraKey, onToggle, onSelect, sortDir, onSortToggle }) {
  if (rows.length === 0) {
    return <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-10 text-center text-sm text-gray-500">No records found.</div>;
  }
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
      <table className="w-full text-left text-sm">
        <thead className="bg-white/[0.04] text-xs uppercase tracking-wide text-gray-400">
          <tr>
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">Email</th>
            <th className="px-4 py-3">{extraCol}</th>
            <th className="px-4 py-3"><button onClick={onSortToggle} className="flex items-center gap-1 hover:text-white">Joined <ArrowUpDown className="h-3 w-3" /></button></th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3 text-right">Action</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.user_id} onClick={() => onSelect(r)} className="cursor-pointer border-t border-white/5 hover:bg-white/[0.03]">
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-violet-500/30 to-fuchsia-500/30 text-xs font-semibold text-fuchsia-200">{initials(r.full_name)}</div>
                  <span className="font-medium text-white">{r.full_name}</span>
                </div>
              </td>
              <td className="px-4 py-3 text-gray-300">{r.email}</td>
              <td className="px-4 py-3 text-gray-300">{r[extraKey] || "—"}</td>
              <td className="px-4 py-3 text-gray-400">{new Date(r.created_at).toLocaleDateString()}</td>
              <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${r.is_active ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>{r.is_active ? "Active" : "Disabled"}</span></td>
              <td className="px-4 py-3 text-right">
                <button onClick={(e) => { e.stopPropagation(); onToggle(r); }} className="rounded-lg border border-white/10 px-3 py-1 text-xs font-medium text-gray-200 hover:bg-white/[0.08]">
                  {r.is_active ? "Disable" : "Enable"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function JobsTable({ rows, sortDir, onSortToggle, onToggle }) {
  if (rows.length === 0) {
    return <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-10 text-center text-sm text-gray-500">No jobs found.</div>;
  }
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
      <table className="w-full text-left text-sm">
        <thead className="bg-white/[0.04] text-xs uppercase tracking-wide text-gray-400">
          <tr>
            <th className="px-4 py-3">Title</th>
            <th className="px-4 py-3">Company</th>
            <th className="px-4 py-3">Location</th>
            <th className="px-4 py-3">Type</th>
            <th className="px-4 py-3"><button onClick={onSortToggle} className="flex items-center gap-1 hover:text-white">Posted <ArrowUpDown className="h-3 w-3" /></button></th>
            <th className="px-4 py-3">Applicants</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3 text-right">Action</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((j) => (
            <tr key={j.id} className="border-t border-white/5 hover:bg-white/[0.03]">
              <td className="px-4 py-3 font-medium text-white">{j.title}</td>
              <td className="px-4 py-3 text-gray-300">{j.company_name}</td>
              <td className="px-4 py-3 text-gray-300">{j.location}</td>
              <td className="px-4 py-3 text-gray-300">{j.employment_type}</td>
              <td className="px-4 py-3 text-gray-400">{new Date(j.posted_at).toLocaleDateString()}</td>
              <td className="px-4 py-3 text-gray-300">{j.applicant_count}</td>
              <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${j.is_active ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>{j.is_active ? "Active" : "Inactive"}</span></td>
              <td className="px-4 py-3 text-right">
                <button onClick={() => onToggle(j)} className="rounded-lg border border-white/10 px-3 py-1 text-xs font-medium text-gray-200 hover:bg-white/[0.08]">
                  {j.is_active ? "Deactivate" : "Activate"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AdminsTable({ rows }) {
  if (rows.length === 0) {
    return <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-10 text-center text-sm text-gray-500">No admins found.</div>;
  }
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
      <table className="w-full text-left text-sm">
        <thead className="bg-white/[0.04] text-xs uppercase tracking-wide text-gray-400">
          <tr><th className="px-4 py-3">Name</th><th className="px-4 py-3">Email</th><th className="px-4 py-3">Joined</th></tr>
        </thead>
        <tbody>
          {rows.map((a) => (
            <tr key={a.id} className="border-t border-white/5 hover:bg-white/[0.03]">
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-violet-500/30 to-fuchsia-500/30 text-xs font-semibold text-fuchsia-200">{initials(a.full_name)}</div>
                  <span className="font-medium text-white">{a.full_name}</span>
                </div>
              </td>
              <td className="px-4 py-3 text-gray-300">{a.email}</td>
              <td className="px-4 py-3 text-gray-400">{new Date(a.created_at).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SettingsPanel({ settings, onSave, saving, message }) {
  const [form, setForm] = useState(settings);

  useEffect(() => {
    setForm(settings);
  }, [settings]);

  if (!form) {
    return <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-10 text-center text-sm text-gray-500">Loading settings…</div>;
  }

  const toggle = (key) => setForm((f) => ({ ...f, [key]: !f[key] }));
  const setNumber = (key, value) => setForm((f) => ({ ...f, [key]: Number(value) }));

  return (
    <div className="max-w-xl rounded-2xl border border-white/10 bg-white/[0.02] p-6 space-y-5">
      <ToggleRow
        label="Maintenance mode"
        sub="Blocks all non-admin requests platform-wide"
        checked={form.maintenance_mode}
        onChange={() => toggle("maintenance_mode")}
      />
      <ToggleRow
        label="Allow new signups"
        sub="Turn off to freeze new account creation"
        checked={form.allow_new_signups}
        onChange={() => toggle("allow_new_signups")}
      />
      <ToggleRow
        label="Allow Google OAuth login"
        sub="Turn off to force email/password only"
        checked={form.allow_google_oauth}
        onChange={() => toggle("allow_google_oauth")}
      />
      <NumberRow
        label="Max resume versions per user"
        value={form.max_resume_versions}
        onChange={(v) => setNumber("max_resume_versions", v)}
      />
      <NumberRow
        label="Daily swipe limit"
        value={form.daily_swipe_limit}
        onChange={(v) => setNumber("daily_swipe_limit", v)}
      />

      <div className="flex items-center gap-3 pt-2">
        <button
          disabled={saving}
          onClick={() => onSave(form)}
          className="rounded-xl bg-fuchsia-500 px-4 py-2 text-sm font-semibold text-white hover:bg-fuchsia-400 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
        {message && <span className="text-xs text-gray-400">{message}</span>}
      </div>
    </div>
  );
}

function ToggleRow({ label, sub, checked, onChange }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-white">{label}</p>
        <p className="text-xs text-gray-500">{sub}</p>
      </div>
      <button
        type="button"
        onClick={onChange}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 ${checked ? "bg-fuchsia-500" : "bg-white/10"}`}
      >
        <span
          className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${checked ? "translate-x-5" : "translate-x-0"}`}
        />
      </button>
    </div>
  );
}

function NumberRow({ label, value, onChange }) {
  return (
    <div className="flex items-center justify-between">
      <p className="text-sm font-medium text-white">{label}</p>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-24 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-right text-sm text-white outline-none focus:border-fuchsia-500/60"
      />
    </div>
  );
}