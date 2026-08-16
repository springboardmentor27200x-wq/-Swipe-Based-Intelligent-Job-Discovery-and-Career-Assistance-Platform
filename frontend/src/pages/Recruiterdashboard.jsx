import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import MessageThread from "../components/MessageThread";
// import { FunnelChart, Funnel, LabelList, Tooltip, ResponsiveContainer } from "recharts";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip, 
  Cell,
  LabelList,
  ResponsiveContainer,
} from "recharts";
import api from "../api/axios";
import {
  Flame,
  LayoutGrid,
  PlusCircle,
  Users,
  BarChart3,
  Building2,
  Bell,
  MapPin,
  DollarSign,
  Briefcase,
  Clock,
  Zap,
  CheckCircle2,
  XCircle,
  Send,
  ChevronRight,
  LogOut,
  X,
  FileText,
  Menu,
} from "lucide-react";

/**
 * RecruiterDashboard
 * -----------------------------------------------------------------------
 * Wired to app/routers/recruiter.py. Every section fetches from its
 * endpoint on mount, and every button calls the matching endpoint.
 *
 * A job created here is the exact same `Job` row the job seeker's
 * discover feed reads from — post one here, it shows up there
 * immediately, no extra wiring needed.
 * -----------------------------------------------------------------------
 */

const NAV_ITEMS = [
  { key: "overview", label: "Overview", icon: LayoutGrid },
  { key: "post-job", label: "Post a Job", icon: PlusCircle },
  { key: "applicants", label: "Applicants", icon: Users },
  { key: "analytics", label: "Analytics", icon: BarChart3 },
  { key: "notifications", label: "Notifications", icon: Bell },
  { key: "company", label: "Company Profile", icon: Building2 },
];

const employmentTypes = ["Full-time", "Internship", "Remote", "Hybrid"];
const companyTypes = ["MNC", "Startup", "Newly Founded"];
const experienceLevels = ["Fresher", "0-2 yrs", "2-5 yrs", "5+ yrs"];

const pipelineColumnMeta = [
  {
    key: "applied",
    label: "Applied",
    icon: Send,
    color: "text-sky-300 bg-sky-500/10 border-sky-500/20",
  },
  {
    key: "shortlisted",
    label: "Shortlisted",
    icon: CheckCircle2,
    color: "text-emerald-300 bg-emerald-500/10 border-emerald-500/20",
  },
  {
    key: "interview",
    label: "Interview",
    icon: Clock,
    color: "text-amber-300 bg-amber-500/10 border-amber-500/20",
  },
  {
    key: "rejected",
    label: "Rejected",
    icon: XCircle,
    color: "text-rose-300 bg-rose-500/10 border-rose-500/20",
  },
];

const competitionColor = {
  Low: "text-emerald-300 bg-emerald-500/10 border-emerald-500/30",
  Medium: "text-amber-300 bg-amber-500/10 border-amber-500/30",
  High: "text-rose-300 bg-rose-500/10 border-rose-500/30",
};

const emptyPipeline = {
  applied: [],
  shortlisted: [],
  interview: [],
  rejected: [],
};

function timeAgo(isoString) {
  if (!isoString) return "";
  // Check if the ISO string has a timezone identifier, if not append 'Z' to treat as UTC
  const utcString = isoString.endsWith("Z") ? isoString : `${isoString}Z`;
  const diffMs = Date.now() - new Date(utcString).getTime();
  const mins = Math.max(0, Math.round(diffMs / 60000));
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function formatSalary(min, max) {
  if (min && max) return `₹${min}L – ₹${max}L`;
  if (min) return `₹${min}L+`;
  return "Not disclosed";
}

// ---- Mappers: API response shape -> UI-friendly shape ----

function mapJob(apiJob) {
  return {
    id: apiJob.id,
    title: apiJob.title,
    location: apiJob.location,
    employmentType: apiJob.employment_type,
    experienceLevel: apiJob.experience_level,
    salary: formatSalary(apiJob.salary_min, apiJob.salary_max),
    posted: timeAgo(apiJob.posted_at),
    isActive: apiJob.is_active,
    applicants: apiJob.applicant_count,
    competition: apiJob.competition_level,
    skills: apiJob.skills,
    companyId: apiJob.company_id,
    companyName: apiJob.company_name,
  };
}

function mapApplicant(apiApplicant) {
  return {
    applicationId: apiApplicant.application_id,
    jobId: apiApplicant.job_id,
    jobTitle: apiApplicant.job_title,
    name: apiApplicant.candidate_name,
    email: apiApplicant.candidate_email,
    status: apiApplicant.status,
    ats: apiApplicant.ats_match_score,
    resumeId: apiApplicant.resume_id,
    resumeFileName: apiApplicant.resume_file_name,
  };
}

function mapNotification(apiNotif) {
  return {
    id: apiNotif.id,
    type: apiNotif.type,
    text: apiNotif.text,
    time: timeAgo(apiNotif.created_at),
    read: apiNotif.is_read,
  };
}

export default function RecruiterDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const displayName =
    user?.fullName ||
    user?.full_name ||
    user?.name ||
    user?.email?.split("@")[0] ||
    "there";
  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join("");

  const [active, setActive] = useState("overview");
  const [apiError, setApiError] = useState("");

  // Mobile sidebar drawer toggle — UI-only state, no behavior change to any
  // existing feature. Sidebar content/logic is unchanged; this just controls
  // whether it's shown as an overlay on small screens.
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const [company, setCompany] = useState({
    name: "",
    companyType: "",
    website: "",
    logoUrl: "",
  });
  const [companies, setCompanies] = useState([]);
  const [newCompanyForm, setNewCompanyForm] = useState({
    name: "",
    companyType: "",
    website: "",
  });
  const [showNewCompanyForm, setShowNewCompanyForm] = useState(false);
  const [switchingCompany, setSwitchingCompany] = useState(false);
  const [creatingCompany, setCreatingCompany] = useState(false);
  const [companyPickerOpen, setCompanyPickerOpen] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [pipeline, setPipeline] = useState(emptyPipeline);
  const [stats, setStats] = useState({
    activeJobs: 0,
    totalApplicants: 0,
    shortlisted: 0,
    interviews: 0,
  });
  const [notifications, setNotifications] = useState([]);
  const [toast, setToast] = useState(null); // { id, text } | null

  const unreadCount = notifications.filter((n) => !n.read).length;

  const funnelData = [
    { name: "Applied", value: stats.totalApplicants, fill: "#a78bfa" },
    {
      name: "Shortlisted",
      value: pipeline.shortlisted.length,
      fill: "#818cf8",
    },
    { name: "Interview", value: pipeline.interview.length, fill: "#38bdf8" },
  ];

  const [jobForm, setJobForm] = useState({
    title: "",
    location: "",
    employmentType: "",
    experienceLevel: "",
    salaryMin: "",
    salaryMax: "",
    skills: "",
    description: "",
    companyId: "",
  });
  const [postingJob, setPostingJob] = useState(false);
  const [postJobMsg, setPostJobMsg] = useState("");

  const [companyForm, setCompanyForm] = useState({
    name: "",
    companyType: "",
    website: "",
  });
  const [savingCompany, setSavingCompany] = useState(false);
  const [companySavedMsg, setCompanySavedMsg] = useState("");
  const [openMessageThread, setOpenMessageThread] = useState(null);
  const activeMessageCandidate = openMessageThread
  ? Object.values(pipeline).flat().find((c) => c.applicationId === openMessageThread)
  : null;

  // ---------------------------------------------------------------------
  // Data loading
  // ---------------------------------------------------------------------

  const fetchCompany = async () => {
    try {
      const { data } = await api.get("/api/recruiter/company");
      setCompany({
        name: data.name,
        companyType: data.company_type,
        website: data.website || "",
        logoUrl: data.logo_url || "",
      });
      setCompanyForm({
        name: data.name,
        companyType: data.company_type || "",
        website: data.website || "",
      });
    } catch (err) {
      console.error("Failed to load company profile:", err);
      setApiError("Couldn't load your company profile.");
    }
  };

  const fetchCompanies = async () => {
    try {
      const { data } = await api.get("/api/recruiter/companies");
      setCompanies(data);
      // keep the job form's selected company in sync with the active one,
      // but don't override a choice the recruiter already made in the dropdown
      setJobForm((prev) =>
        prev.companyId ? prev : { ...prev, companyId: data.find((c) => c.is_active)?.id || "" },
      );
    } catch (err) {
      console.error("Failed to load companies:", err);
      setApiError("Couldn't load your companies.");
    }
  };

  const fetchJobs = async () => {
    try {
      const { data } = await api.get("/api/recruiter/jobs");
      setJobs(data.map(mapJob));
    } catch (err) {
      console.error("Failed to load jobs:", err);
      setApiError("Couldn't load your job postings.");
    }
  };

  const fetchApplicants = async () => {
    try {
      const { data } = await api.get("/api/recruiter/applicants");
      const grouped = {
        applied: [],
        shortlisted: [],
        interview: [],
        rejected: [],
      };
      data.forEach((row) => {
        const mapped = mapApplicant(row);
        if (grouped[mapped.status]) grouped[mapped.status].push(mapped);
      });
      setPipeline(grouped);
    } catch (err) {
      console.error("Failed to load applicants:", err);
      setApiError("Couldn't load your applicants.");
    }
  };

  const fetchDashboardStats = async () => {
    try {
      const { data } = await api.get("/api/recruiter/dashboard");
      setStats({
        activeJobs: data.stats.active_jobs,
        totalApplicants: data.stats.total_applicants,
        shortlisted: data.stats.shortlisted,
        interviews: data.stats.interviews,
      });
    } catch (err) {
      console.error("Failed to load dashboard stats:", err);
    }
  };

  // const fetchNotifications = async () => {
  //   try {
  //     const { data } = await api.get("/api/recruiter/notifications");
  //     setNotifications(data.map(mapNotification));
  //   } catch (err) {
  //     console.error("Failed to load notifications:", err);
  //     setApiError("Couldn't load your notifications.");
  //   }
  // };

  useEffect(() => {
    fetchCompany();
    fetchCompanies();
    fetchJobs();
    fetchApplicants();
    fetchDashboardStats();
    fetchNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
  const intervalId = setInterval(() => {
    fetchNotifications();
  }, 8000); // check every 8 seconds

  return () => clearInterval(intervalId); // cleanup on unmount
}, []);

useEffect(() => {
  const intervalId = setInterval(() => {
    if (document.visibilityState === "visible") {
      fetchNotifications();
    }
  }, 8000);

  return () => clearInterval(intervalId);
}, []);

useEffect(() => {
  const handleVisibilityChange = () => {
    if (document.visibilityState === "visible") {
      fetchNotifications();
    }
  };
  document.addEventListener("visibilitychange", handleVisibilityChange);
  return () =>
    document.removeEventListener("visibilitychange", handleVisibilityChange);
}, []);

  // Auto-dismiss the toast a few seconds after it appears
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(timer);
  }, [toast]);

  // Close the "Posting as" dropdown when clicking anywhere outside it
  useEffect(() => {
    if (!companyPickerOpen) return;
    const handleClickOutside = (e) => {
      if (!e.target.closest("[data-company-picker]")) {
        setCompanyPickerOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [companyPickerOpen]);

  // ---- Logout ----
  const handleLogout = async () => {
    try {
      await logout?.();
    } catch {
      // even if the logout call fails, still take the user out locally
    } finally {
      navigate("/home");
    }
  };

  // ---- Post a job ----
  const handleJobFormChange = (field, value) =>
    setJobForm((prev) => ({ ...prev, [field]: value }));

  const handlePublishJob = async () => {
    if (
      !jobForm.title ||
      !jobForm.location ||
      !jobForm.employmentType ||
      !jobForm.experienceLevel
    ) {
      setPostJobMsg(
        "Fill in title, location, employment type, and experience level first.",
      );
      setTimeout(() => setPostJobMsg(""), 3000);
      return;
    }
    setPostingJob(true);
    try {
      await api.post("/api/recruiter/jobs", {
        title: jobForm.title,
        description: jobForm.description || null,
        location: jobForm.location,
        employment_type: jobForm.employmentType,
        experience_level: jobForm.experienceLevel,
        salary_min: jobForm.salaryMin ? Number(jobForm.salaryMin) : null,
        salary_max: jobForm.salaryMax ? Number(jobForm.salaryMax) : null,
        skills: jobForm.skills
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        company_id: jobForm.companyId || null,
      });
      setPostJobMsg("Job published — it's now visible to job seekers.");
      setJobForm((prev) => ({
        title: "",
        location: "",
        employmentType: "",
        experienceLevel: "",
        salaryMin: "",
        salaryMax: "",
        skills: "",
        description: "",
        companyId: prev.companyId, // keep the selected company for the next post
      }));
      await Promise.all([fetchJobs(), fetchDashboardStats()]);
    } catch (err) {
      console.error("Failed to publish job:", err);
      const detail = err?.response?.data?.detail;
      setPostJobMsg(
        detail ||
          "Couldn't publish that job — check your company profile is set up.",
      );
    } finally {
      setPostingJob(false);
      setTimeout(() => setPostJobMsg(""), 4000);
    }
  };

  // ---- Applicant pipeline ----
  const moveApplicant = async (applicationId, newStatus) => {
    // optimistic: pull the card out of its current column, drop it in the new one
    setPipeline((prev) => {
      let moved = null;
      const next = {};
      for (const key of Object.keys(prev)) {
        next[key] = prev[key].filter((c) => {
          if (c.applicationId === applicationId) {
            moved = { ...c, status: newStatus };
            return false;
          }
          return true;
        });
      }
      if (moved && next[newStatus])
        next[newStatus] = [moved, ...next[newStatus]];
      return next;
    });
    try {
      await api.put(`/api/recruiter/applicants/${applicationId}/status`, {
        status: newStatus,
      });
      fetchDashboardStats();
    } catch (err) {
      console.error("Failed to update applicant status:", err);
      fetchApplicants(); // resync with the server if the update failed
    }
  };

  const viewResume = async (resumeId) => {
    try {
      const response = await api.get(
        `/api/jobseeker/resumes/${resumeId}/download`,
        {
          responseType: "blob",
        },
      );
      const contentType = response.headers["content-type"] || "application/pdf";
      const blob = new Blob([response.data], { type: contentType });
      const url = window.URL.createObjectURL(blob);
      window.open(url, "_blank");
    } catch (err) {
      console.error("Failed to load resume:", err);
    }
  };

  // ---- Notification actions ----
  const markAsRead = async (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
    try {
      await api.put(`/api/recruiter/notifications/${id}/read`);
    } catch (err) {
      console.error("Failed to mark notification read:", err);
    }
  };

  const dismissNotification = async (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    try {
      await api.delete(`/api/recruiter/notifications/${id}`);
    } catch (err) {
      console.error("Failed to dismiss notification:", err);
    }
  };

  const markAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await api.put("/api/recruiter/notifications/read-all");
    } catch (err) {
      console.error("Failed to mark all notifications read:", err);
    }
  };

  // ---- Company profile ----
  // ---- Companies (multi-company) ----
  const handleActivateCompany = async (companyId) => {
    setSwitchingCompany(true);
    try {
      await api.put(`/api/recruiter/companies/${companyId}/activate`);
      await Promise.all([
        fetchCompany(),
        fetchCompanies(),
        fetchJobs(),
        fetchApplicants(),
        fetchDashboardStats(),
      ]);
    } catch (err) {
      console.error("Failed to switch company:", err);
      setApiError("Couldn't switch company — try again.");
    } finally {
      setSwitchingCompany(false);
    }
  };

  const handleNewCompanyFormChange = (field, value) =>
    setNewCompanyForm((prev) => ({ ...prev, [field]: value }));

  const handleCreateCompany = async () => {
    if (!newCompanyForm.name || !newCompanyForm.companyType) {
      setApiError("Enter a company name and select a company type first.");
      setTimeout(() => setApiError(""), 3000);
      return;
    }
    setCreatingCompany(true);
    try {
      await api.post("/api/recruiter/companies", {
        name: newCompanyForm.name,
        company_type: newCompanyForm.companyType,
        website: newCompanyForm.website || null,
      });
      setNewCompanyForm({ name: "", companyType: "", website: "" });
      setShowNewCompanyForm(false);
      await Promise.all([fetchCompany(), fetchCompanies()]);
    } catch (err) {
      console.error("Failed to create company:", err);
      setApiError("Couldn't create that company — try again.");
    } finally {
      setCreatingCompany(false);
    }
  };

  // ---- Company profile ----
  const handleCompanyFormChange = (field, value) =>
    setCompanyForm((prev) => ({ ...prev, [field]: value }));

  const handleSaveCompany = async () => {
    setSavingCompany(true);
    try {
      await api.put("/api/recruiter/company", {
        name: companyForm.name || null,
        company_type: companyForm.companyType || null,
        website: companyForm.website || null,
      });
      setCompanySavedMsg("Company profile saved");
      await fetchCompany();
    } catch (err) {
      console.error("Failed to save company profile:", err);
      setCompanySavedMsg("Couldn't save — try again");
    } finally {
      setSavingCompany(false);
      setTimeout(() => setCompanySavedMsg(""), 2500);
    }
  };

  const fetchNotifications = async () => {
  try {
    const { data } = await api.get("/api/recruiter/notifications");
    const mapped = data.map(mapNotification);
    setNotifications((prev) => {
      const prevUnread = prev.filter((n) => !n.read).length;
      const newUnread = mapped.filter((n) => !n.read).length;
      if (newUnread > prevUnread) {
        const latestUnread = mapped.find((n) => !n.read);
        if (latestUnread) {
          setToast({ id: latestUnread.id, text: latestUnread.text });
        }
      }
      return mapped;
    });
  } catch (err) {
    console.error("Failed to load notifications:", err);
    setApiError("Couldn't load your notifications.");
  }
};

  return (
    <div className="min-h-screen w-full bg-[#0B0D12] text-slate-100 flex flex-col md:flex-row">
      <style>{`
        @keyframes slideIn {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>

      {/* Mobile top bar (visible below md) */}
      <div className="md:hidden sticky top-0 z-30 flex items-center justify-between px-4 h-14 border-b border-white/5 bg-[#0E1016]">
        <div className="flex items-center gap-2 min-w-0">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shrink-0">
            <Flame className="h-4 w-4 text-white" />
          </div>
          <span className="font-semibold tracking-tight text-[15px] truncate">
            SwipeX <span className="text-slate-500 font-normal">for Business</span>
          </span>
        </div>
        <button
          onClick={() => setMobileNavOpen(true)}
          className="h-9 w-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 shrink-0"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5 text-slate-200" />
        </button>
      </div>

      {/* Mobile nav drawer overlay */}
      {mobileNavOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setMobileNavOpen(false)}
          />
          <aside className="relative z-50 w-72 max-w-[80vw] h-full bg-[#0E1016] border-r border-white/5 flex flex-col">
            <div className="px-5 py-5 flex items-center justify-between border-b border-white/5">
              <div className="flex items-center gap-2 min-w-0">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shrink-0">
                  <Flame className="h-4 w-4 text-white" />
                </div>
                <span className="font-semibold tracking-tight text-[15px] truncate">
                  SwipeX{" "}
                  <span className="text-slate-500 font-normal">for Business</span>
                </span>
              </div>
              <button
                onClick={() => setMobileNavOpen(false)}
                className="h-8 w-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 shrink-0"
                aria-label="Close menu"
              >
                <X className="h-4 w-4 text-slate-300" />
              </button>
            </div>

            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
              {NAV_ITEMS.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => {
                    setActive(key);
                    setMobileNavOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                    active === key
                      ? "bg-violet-500/15 text-violet-200 border border-violet-500/30"
                      : "text-slate-400 hover:bg-white/5 hover:text-slate-200 border border-transparent"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                  {key === "notifications" && unreadCount > 0 && (
                    <span className="ml-auto text-[10px] bg-rose-500 text-white rounded-full h-4 w-4 flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </button>
              ))}
            </nav>

            <div className="px-3 py-4 border-t border-white/5 space-y-3">
              <div className="flex items-center gap-3 px-2">
                <div className="h-9 w-9 rounded-full bg-slate-700 flex items-center justify-center text-xs font-medium shrink-0">
                  {initials || <Building2 className="h-4 w-4" />}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{displayName}</p>
                  <p className="text-xs text-slate-500 truncate">
                    {company.name || "Set up your company"} · Recruiter
                  </p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-rose-300 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 transition-colors"
              >
                <LogOut className="h-4 w-4" /> Log out
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Sidebar (desktop / tablet) */}
      <aside className="hidden md:flex w-56 lg:w-64 shrink-0 border-r border-white/5 bg-[#0E1016] flex-col">
        <div className="px-5 py-5 flex items-center gap-2 border-b border-white/5">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shrink-0">
            <Flame className="h-4 w-4 text-white" />
          </div>
          <span className="font-semibold tracking-tight text-[15px] truncate">
            SwipeX{" "}
            <span className="text-slate-500 font-normal">for Business</span>
          </span>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActive(key)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                active === key
                  ? "bg-violet-500/15 text-violet-200 border border-violet-500/30"
                  : "text-slate-400 hover:bg-white/5 hover:text-slate-200 border border-transparent"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{label}</span>
              {key === "notifications" && unreadCount > 0 && (
                <span className="ml-auto text-[10px] bg-rose-500 text-white rounded-full h-4 w-4 flex items-center justify-center shrink-0">
                  {unreadCount}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-white/5 space-y-3">
          <div className="flex items-center gap-3 px-2">
            <div className="h-9 w-9 rounded-full bg-slate-700 flex items-center justify-center text-xs font-medium shrink-0">
              {initials || <Building2 className="h-4 w-4" />}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{displayName}</p>
              <p className="text-xs text-slate-500 truncate">
                {company.name || "Set up your company"} · Recruiter
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-rose-300 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 transition-colors"
          >
            <LogOut className="h-4 w-4" /> Log out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0">
        <header className="hidden md:flex h-16 border-b border-white/5 items-center justify-between px-4 lg:px-8 sticky top-0 bg-[#0B0D12]/90 backdrop-blur z-10 gap-4">
          <div className="min-w-0">
            <h1 className="text-base lg:text-lg font-semibold truncate">Hiring overview</h1>
            <p className="text-xs text-slate-500 truncate">
              {company.name
                ? `${company.name}'s current pipeline at a glance`
                : "Set up your company profile to get started"}
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setActive("post-job")}
              className="flex items-center gap-2 text-sm bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-lg px-3 lg:px-4 py-2 font-medium whitespace-nowrap"
            >
              <PlusCircle className="h-4 w-4" /> <span className="hidden lg:inline">Post a job</span>
            </button>
            <button
              onClick={() => setActive("notifications")}
              className="relative h-9 w-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 shrink-0"
            >
              <Bell className="h-4 w-4 text-slate-300" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-rose-500 text-[10px] flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>
        </header>

        {/* Mobile header content + quick actions (below md) */}
        <div className="md:hidden px-4 pt-4 space-y-3">
          <div>
            <h1 className="text-base font-semibold truncate">Hiring overview</h1>
            <p className="text-xs text-slate-500">
              {company.name
                ? `${company.name}'s current pipeline at a glance`
                : "Set up your company profile to get started"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActive("post-job")}
              className="flex-1 flex items-center justify-center gap-2 text-sm bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-lg px-4 py-2 font-medium"
            >
              <PlusCircle className="h-4 w-4" /> Post a job
            </button>
            <button
              onClick={() => setActive("notifications")}
              className="relative h-9 w-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 shrink-0"
            >
              <Bell className="h-4 w-4 text-slate-300" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-rose-500 text-[10px] flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
          {/* {apiError && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300 flex items-center justify-between">
              {apiError}
              <button
                onClick={() => setApiError("")}
                className="text-rose-300 hover:text-rose-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )} */}

          {active === "overview" && (
            <>
              <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-xl border border-white/10 p-4 bg-violet-500/10">
                  <Briefcase className="h-4 w-4 mb-2 text-violet-300" />
                  <p className="text-xl sm:text-2xl font-semibold">{stats.activeJobs}</p>
                  <p className="text-xs text-slate-400">Active job posts</p>
                </div>
                <div className="rounded-xl border border-white/10 p-4 bg-sky-500/10">
                  <Users className="h-4 w-4 mb-2 text-sky-300" />
                  <p className="text-xl sm:text-2xl font-semibold">
                    {stats.totalApplicants}
                  </p>
                  <p className="text-xs text-slate-400">Total applicants</p>
                </div>
                <div className="rounded-xl border border-white/10 p-4 bg-emerald-500/10">
                  <CheckCircle2 className="h-4 w-4 mb-2 text-emerald-300" />
                  <p className="text-xl sm:text-2xl font-semibold">{stats.shortlisted}</p>
                  <p className="text-xs text-slate-400">Shortlisted</p>
                </div>
                <div className="rounded-xl border border-white/10 p-4 bg-amber-500/10">
                  <Clock className="h-4 w-4 mb-2 text-amber-300" />
                  <p className="text-xl sm:text-2xl font-semibold">{stats.interviews}</p>
                  <p className="text-xs text-slate-400">Interviews scheduled</p>
                </div>
              </section>

              <section className="rounded-xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
                <div className="flex items-center justify-between mb-4 gap-2">
                  <h2 className="text-sm font-medium text-slate-300 flex items-center gap-2 min-w-0">
                    <BarChart3 className="h-4 w-4 text-violet-400 shrink-0" />
                    <span className="truncate">Job performance & competition</span>
                  </h2>
                  <button
                    onClick={() => setActive("analytics")}
                    className="text-xs text-violet-300 hover:text-violet-200 flex items-center gap-1 shrink-0"
                  >
                    Full analytics <ChevronRight className="h-3 w-3" />
                  </button>
                </div>
                <div className="space-y-3">
                  {jobs.length === 0 && (
                    <p className="text-sm text-slate-500">
                      No jobs posted yet.
                    </p>
                  )}
                  {jobs.slice(0, 5).map((job) => (
                    <div
                      key={job.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm border-b border-white/5 pb-3 last:border-0 last:pb-0"
                    >
                      <div className="min-w-0">
                        <p className="font-medium truncate">{job.title}</p>
                        <p className="text-xs text-slate-500 flex items-center gap-1.5">
                          <Clock className="h-3 w-3 shrink-0" /> Posted {job.posted}
                        </p>
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        <span className="text-xs text-slate-400">
                          {job.applicants} applicants
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full border flex items-center gap-1 ${competitionColor[job.competition]}`}
                        >
                          <Zap className="h-3 w-3" /> {job.competition}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}

          {active === "post-job" && (
            <section className="rounded-xl border border-white/10 bg-white/[0.03] p-4 sm:p-5 max-w-3xl">
              <h2 className="text-sm font-medium text-slate-300 mb-4 flex items-center gap-2">
                <PlusCircle className="h-4 w-4 text-violet-400" /> Post a new
                job
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2 relative" data-company-picker>
                  <label className="text-xs text-slate-500">Posting as</label>
                  <button
                    type="button"
                    onClick={() => setCompanyPickerOpen((prev) => !prev)}
                    className="mt-1 w-full flex items-center justify-between bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-left hover:border-violet-500/40 focus:outline-none focus:border-violet-500/50 transition-colors"
                  >
                    <span className={jobForm.companyId ? "text-slate-100 truncate" : "text-slate-500 truncate"}>
                      {companies.find((c) => c.id === jobForm.companyId)?.name ||
                        (companies.length === 0 ? "No companies yet" : "Select a company")}
                    </span>
                    <ChevronRight
                      className={`h-3.5 w-3.5 text-slate-500 transition-transform shrink-0 ${
                        companyPickerOpen ? "rotate-90" : ""
                      }`}
                    />
                  </button>

                  {companyPickerOpen && companies.length > 0 && (
                    <div className="absolute z-20 mt-1 w-full rounded-lg border border-white/10 bg-[#14161d] shadow-lg shadow-black/40 overflow-hidden">
                      {companies.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            handleJobFormChange("companyId", c.id);
                            setCompanyPickerOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                            c.id === jobForm.companyId
                              ? "bg-violet-500/15 text-violet-200"
                              : "text-slate-300 hover:bg-white/5"
                          }`}
                        >
                          {c.name || "Untitled company"}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <label className="text-xs text-slate-500">Job title</label>
                  <input
                    value={jobForm.title}
                    onChange={(e) =>
                      handleJobFormChange("title", e.target.value)
                    }
                    className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm placeholder:text-slate-500 focus:outline-none focus:border-violet-500/50"
                    placeholder="e.g. Frontend Engineer"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500">Location</label>
                  <div className="relative mt-1">
                    <MapPin className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      value={jobForm.location}
                      onChange={(e) =>
                        handleJobFormChange("location", e.target.value)
                      }
                      className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm placeholder:text-slate-500 focus:outline-none focus:border-violet-500/50"
                      placeholder="e.g. Bengaluru / Remote"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-slate-500">
                    Employment type
                  </label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {employmentTypes.map((t) => (
                      <button
                        key={t}
                        onClick={() => handleJobFormChange("employmentType", t)}
                        className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                          jobForm.employmentType === t
                            ? "bg-violet-500/15 text-violet-200 border-violet-500/30"
                            : "bg-white/5 border-white/10 hover:border-violet-500/40 hover:text-violet-200"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs text-slate-500">
                    Experience level
                  </label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {experienceLevels.map((t) => (
                      <button
                        key={t}
                        onClick={() =>
                          handleJobFormChange("experienceLevel", t)
                        }
                        className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                          jobForm.experienceLevel === t
                            ? "bg-violet-500/15 text-violet-200 border-violet-500/30"
                            : "bg-white/5 border-white/10 hover:border-violet-500/40 hover:text-violet-200"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs text-slate-500">
                    Salary min (₹L)
                  </label>
                  <div className="relative mt-1">
                    <DollarSign className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="number"
                      value={jobForm.salaryMin}
                      onChange={(e) =>
                        handleJobFormChange("salaryMin", e.target.value)
                      }
                      className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm placeholder:text-slate-500 focus:outline-none focus:border-violet-500/50"
                      placeholder="e.g. 12"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-slate-500">
                    Salary max (₹L)
                  </label>
                  <div className="relative mt-1">
                    <DollarSign className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="number"
                      value={jobForm.salaryMax}
                      onChange={(e) =>
                        handleJobFormChange("salaryMax", e.target.value)
                      }
                      className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm placeholder:text-slate-500 focus:outline-none focus:border-violet-500/50"
                      placeholder="e.g. 18"
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="text-xs text-slate-500">
                    Required skills & technologies
                  </label>
                  <input
                    value={jobForm.skills}
                    onChange={(e) =>
                      handleJobFormChange("skills", e.target.value)
                    }
                    className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm placeholder:text-slate-500 focus:outline-none focus:border-violet-500/50"
                    placeholder="e.g. React, TypeScript, GraphQL — comma separated"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-xs text-slate-500">
                    Job description
                  </label>
                  <textarea
                    rows={3}
                    value={jobForm.description}
                    onChange={(e) =>
                      handleJobFormChange("description", e.target.value)
                    }
                    className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm placeholder:text-slate-500 focus:outline-none focus:border-violet-500/50"
                    placeholder="Role summary, responsibilities, requirements..."
                  />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 mt-4">
                <button
                  onClick={handlePublishJob}
                  disabled={postingJob}
                  className="flex items-center justify-center gap-2 text-sm bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-lg px-4 py-2 font-medium disabled:opacity-60"
                >
                  <PlusCircle className="h-4 w-4" />{" "}
                  {postingJob ? "Publishing..." : "Publish job"}
                </button>
                {postJobMsg && (
                  <span className="text-xs text-slate-300">{postJobMsg}</span>
                )}
              </div>
            </section>
          )}

          {active === "applicants" && (
            <section>
              <h2 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                <Users className="h-4 w-4 text-violet-400" /> Applicant pipeline
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {pipelineColumnMeta.map((col) => (
                  <div
                    key={col.key}
                    className="rounded-xl border border-white/10 bg-white/[0.03] p-3"
                  >
                    <div
                      className={`flex items-center gap-2 text-xs font-medium px-2 py-1 rounded-lg border w-fit mb-3 ${col.color}`}
                    >
                      <col.icon className="h-3.5 w-3.5" /> {col.label} (
                      {pipeline[col.key].length})
                    </div>
                    <div className="space-y-2">
                      {pipeline[col.key].length === 0 && (
                        <p className="text-xs text-slate-600 px-1">
                          No candidates here
                        </p>
                      )}
                      {pipeline[col.key].map((c) => (
                        <div key={c.applicationId} className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-medium truncate">{c.name}</p>
                            {c.ats != null && (
                              <span
                                className={`text-[10px] font-semibold px-1.5 py-0.5 rounded shrink-0 ${
                                  c.ats >= 80 ? "text-emerald-300 bg-emerald-500/10" : c.ats >= 65 ? "text-amber-300 bg-amber-500/10" : "text-rose-300 bg-rose-500/10"
                                }`}
                              >
                                {c.ats}% ATS
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 truncate">{c.jobTitle}</p>

                          {col.key === "applied" && (
                            <button
                              onClick={() => viewResume(c.resumeId)}
                              disabled={!c.resumeId}
                              className="flex items-center gap-1.5 text-[10px] px-2 py-1 mt-2 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-200 hover:bg-sky-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <FileText className="h-3 w-3" />
                              {c.resumeId ? "View resume" : "No resume uploaded"}
                            </button>
                          )}

                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {pipelineColumnMeta
                              .filter((opt) => opt.key !== col.key)
                              .map((opt) => (
                                <button
                                  key={opt.key}
                                  onClick={() => moveApplicant(c.applicationId, opt.key)}
                                  className="text-[10px] px-2 py-1 rounded-full bg-white/5 border border-white/10 text-slate-400 hover:text-slate-200 hover:border-violet-500/40"
                                >
                                  → {opt.label}
                                </button>
                              ))}
                          </div>
                          {(col.key === "shortlisted" || col.key === "interview") && (
                            <button
                              onClick={() => setOpenMessageThread(c.applicationId)}
                              className="text-[10px] px-2 py-1 mt-2 rounded-full bg-violet-500/10 border border-violet-500/30 text-violet-200 hover:bg-violet-500/20"
                            >
                              Message candidate
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {active === "analytics" && (
            <section className="rounded-xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
              <h2 className="text-sm font-medium text-slate-300 mb-4 flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-violet-400" /> Job
                performance & competition
              </h2>

              <div className="mb-8 pb-6 border-b border-white/5">
                <h3 className="text-xs font-medium text-slate-400 mb-3">
                  Hiring pipeline
                </h3>
                {stats.totalApplicants > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart
                      data={funnelData}
                      layout="vertical"
                      margin={{ top: 5, right: 40, left: 10, bottom: 5 }}
                    >
                      <XAxis type="number" hide />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={90}
                        tick={{ fill: "#94a3b8", fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          background: "#16161f",
                          border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: 8,
                        }}
                        itemStyle={{ color: "#e5e7eb" }}
                        cursor={{ fill: "rgba(255,255,255,0.03)" }}
                      />
                      <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={28}>
                        {funnelData.map((entry) => (
                          <Cell key={entry.name} fill={entry.fill} />
                        ))}
                        <LabelList
                          dataKey="value"
                          position="right"
                          fill="#e5e7eb"
                          fontSize={13}
                          fontWeight={600}
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-sm text-slate-500">
                    No applicants yet — this fills in once candidates start
                    applying.
                  </p>
                )}
                {pipeline.rejected.length > 0 && (
                  <p className="text-xs text-slate-500 mt-2">
                    Separately,{" "}
                    <span className="text-rose-300">
                      {pipeline.rejected.length}
                    </span>{" "}
                    candidate{pipeline.rejected.length !== 1 ? "s" : ""}{" "}
                    rejected across all stages.
                  </p>
                )}
              </div>
              <div className="space-y-3">
                {jobs.length === 0 && (
                  <p className="text-sm text-slate-500">No jobs posted yet.</p>
                )}
                {jobs.map((job) => (
                  <div
                    key={job.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm border-b border-white/5 pb-3 last:border-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <p className="font-medium truncate">{job.title}</p>
                      <p className="text-xs text-slate-500 flex flex-wrap items-center gap-1.5">
                        <MapPin className="h-3 w-3 shrink-0" /> {job.location} ·{" "}
                        <Clock className="h-3 w-3 shrink-0" /> Posted {job.posted}
                      </p>
                      {job.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          {job.skills.map((s) => (
                            <span
                              key={s}
                              className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-slate-400 border border-white/10"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <span className="text-xs text-slate-400">
                        {job.applicants} applicants
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full border flex items-center gap-1 ${competitionColor[job.competition]}`}
                      >
                        <Zap className="h-3 w-3" /> {job.competition}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {active === "notifications" && (
            <section className="rounded-xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
              <div className="flex items-center justify-between mb-4 gap-2">
                <h2 className="text-sm font-medium text-slate-300 flex items-center gap-2">
                  <Bell className="h-4 w-4 text-violet-400" /> Notifications
                </h2>
                <button
                  onClick={markAllRead}
                  className="text-xs text-violet-300 hover:text-violet-200 shrink-0"
                >
                  Mark all as read
                </button>
              </div>
              <div className="space-y-3">
                {notifications.length === 0 && (
                  <p className="text-sm text-slate-500">
                    You're all caught up.
                  </p>
                )}
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className="flex items-start justify-between gap-2 text-sm border-b border-white/5 pb-3 last:border-0 last:pb-0"
                  >
                    <button
                      onClick={() => markAsRead(n.id)}
                      className="flex items-start gap-3 text-left flex-1 min-w-0"
                    >
                      <span
                        className={`h-2 w-2 rounded-full mt-1.5 shrink-0 ${n.read ? "bg-transparent" : "bg-violet-400"}`}
                      />
                      <span
                        className={n.read ? "text-slate-500" : "text-slate-200"}
                      >
                        {n.text}
                      </span>
                    </button>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs text-slate-500">{n.time}</span>
                      <button
                        onClick={() => dismissNotification(n.id)}
                        className="text-slate-500 hover:text-rose-300"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {active === "company" && (
            <section className="rounded-xl border border-white/10 bg-white/[0.03] p-4 sm:p-5 max-w-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <h2 className="text-sm font-medium text-slate-300 flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-violet-400" /> Company
                  profile
                </h2>
                <button
                  onClick={() => setShowNewCompanyForm((prev) => !prev)}
                  className="flex items-center justify-center gap-1.5 text-xs bg-violet-500/15 border border-violet-500/30 text-violet-200 rounded-lg px-3 py-1.5 hover:bg-violet-500/25 self-start sm:self-auto"
                >
                  <PlusCircle className="h-3.5 w-3.5" /> New company
                </button>
              </div>

              {companies.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-5">
                  {companies.map((c) => (
                    <button
                      key={c.id}
                      disabled={switchingCompany || c.is_active}
                      onClick={() => handleActivateCompany(c.id)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-colors disabled:opacity-60 ${
                        c.is_active
                          ? "bg-violet-500/15 text-violet-200 border-violet-500/30"
                          : "bg-white/5 border-white/10 hover:border-violet-500/40 hover:text-violet-200"
                      }`}
                    >
                      {c.name || "Untitled company"}
                      {c.is_active && " (active)"}
                    </button>
                  ))}
                </div>
              )}

              {showNewCompanyForm && (
                <div className="rounded-lg border border-white/10 p-4 mb-5 space-y-3">
                  <div>
                    <label className="text-xs text-slate-500">
                      Company name
                    </label>
                    <input
                      value={newCompanyForm.name}
                      onChange={(e) =>
                        handleNewCompanyFormChange("name", e.target.value)
                      }
                      className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm placeholder:text-slate-500 focus:outline-none focus:border-violet-500/50"
                      placeholder="e.g. Orbit Analytics"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500">
                      Company type
                    </label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {companyTypes.map((t) => (
                        <button
                          key={t}
                          onClick={() =>
                            handleNewCompanyFormChange("companyType", t)
                          }
                          className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                            newCompanyForm.companyType === t
                              ? "bg-violet-500/15 text-violet-200 border-violet-500/30"
                              : "bg-white/5 border-white/10 hover:border-violet-500/40 hover:text-violet-200"
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-slate-500">Website</label>
                    <input
                      value={newCompanyForm.website}
                      onChange={(e) =>
                        handleNewCompanyFormChange("website", e.target.value)
                      }
                      className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm placeholder:text-slate-500 focus:outline-none focus:border-violet-500/50"
                      placeholder="https://company.com"
                    />
                  </div>
                  <button
                    onClick={handleCreateCompany}
                    disabled={creatingCompany}
                    className="bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-60"
                  >
                    {creatingCompany ? "Creating..." : "Create company"}
                  </button>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="text-xs text-slate-500">Company name</label>
                  <input
                    value={companyForm.name}
                    onChange={(e) =>
                      handleCompanyFormChange("name", e.target.value)
                    }
                    className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm placeholder:text-slate-500 focus:outline-none focus:border-violet-500/50"
                    placeholder="e.g. Nimbus Labs"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500">Company type</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {companyTypes.map((t) => (
                      <button
                        key={t}
                        onClick={() =>
                          handleCompanyFormChange("companyType", t)
                        }
                        className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                          companyForm.companyType === t
                            ? "bg-violet-500/15 text-violet-200 border-violet-500/30"
                            : "bg-white/5 border-white/10 hover:border-violet-500/40 hover:text-violet-200"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs text-slate-500">Website</label>
                  <input
                    value={companyForm.website}
                    onChange={(e) =>
                      handleCompanyFormChange("website", e.target.value)
                    }
                    className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm placeholder:text-slate-500 focus:outline-none focus:border-violet-500/50"
                    placeholder="https://yourcompany.com"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleSaveCompany}
                    disabled={savingCompany}
                    className="bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-60"
                  >
                    {savingCompany ? "Saving..." : "Save changes"}
                  </button>
                  {companySavedMsg && (
                    <span className="text-xs text-emerald-300">
                      {companySavedMsg}
                    </span>
                  )}
                </div>
              </div>
            </section>
          )}
        </div>
      </main>

      {activeMessageCandidate && (
        <MessageThread
          endpointBase="/api/recruiter"
          resourcePath="applicants"
          applicationId={activeMessageCandidate.applicationId}
          title={activeMessageCandidate.name}
          subtitle={activeMessageCandidate.jobTitle}
          onClose={() => setOpenMessageThread(null)}
        />
      )}

      {/* Toast notification */}
      {toast && (
        <div className="fixed bottom-4 right-4 left-4 sm:left-auto sm:bottom-6 sm:right-6 z-50 animate-[slideIn_0.3s_ease-out]">
          <div className="flex items-start gap-3 rounded-xl border border-violet-500/30 bg-[#14161d] shadow-lg shadow-black/40 px-4 py-3 sm:max-w-sm">
            <div className="h-8 w-8 shrink-0 rounded-full bg-violet-500/15 flex items-center justify-center">
              <Bell className="h-4 w-4 text-violet-300" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-violet-300">
                New notification
              </p>
              <p className="text-sm text-slate-200 mt-0.5 line-clamp-2">
                {toast.text}
              </p>
            </div>
            <button
              onClick={() => setToast(null)}
              className="text-slate-500 hover:text-slate-300 shrink-0"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
