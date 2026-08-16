import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import MessageThread from "../components/MessageThread";
import api from "../api/axios";
import {
  Flame,
  FileText,
  Bell,
  User,
  LayoutGrid,
  Bookmark,
  Send,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  Sparkles,
  Upload,
  Search,
  MapPin,
  Briefcase,
  DollarSign,
  Zap,
  AlertTriangle,
  ChevronRight,
  LogOut,
  X,
  RotateCcw,
  Plus,
  Rocket,
  Target,
  Building2,
  ExternalLink,
  Menu,
} from "lucide-react";

import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";

/**
 * JobSeekerDashboard
 * -----------------------------------------------------------------------
 * Wired to the real backend (app/routers/jobseeker.py). Every section
 * fetches from its endpoint on mount, and every button calls the matching
 * endpoint before (or while) updating local state optimistically.
 *
 * Data-shape note: the backend returns snake_case fields nested a bit
 * differently than the old mock objects (e.g. ApplicationOut wraps a
 * full JobOut, JobOut uses `company_name`/`company_type`/`posted_at`).
 * The map... functions below convert each API response into the exact
 * shape this component's JSX already expects, so none of the render
 * code below needed to change — only the data source did.
 * -----------------------------------------------------------------------
 */

const NAV_ITEMS = [
  { key: "overview", label: "Overview", icon: LayoutGrid },
  { key: "discover", label: "Discover (Swipe)", icon: Flame },
  { key: "applications", label: "Applications", icon: Send },
  { key: "companies", label: "Companies & Startups", icon: Building2 },
  { key: "resume", label: "Resume & ATS", icon: FileText },
  { key: "notifications", label: "Notifications", icon: Bell },
  { key: "profile", label: "Profile", icon: User },
];

const COMPANY_TYPE_FILTERS = ["All", "MNC", "Startup", "Newly Founded"];
const EMPLOYMENT_TYPE_FILTERS = ["All", "Full-time", "Internship", "Remote", "Hybrid"];
const EXPERIENCE_LEVEL_FILTERS = ["All", "Fresher", "0-2 yrs", "2-5 yrs", "5+ yrs"];

const competitionColor = {
  Low: "text-emerald-300 bg-emerald-500/10 border-emerald-500/30",
  Medium: "text-amber-300 bg-amber-500/10 border-amber-500/30",
  High: "text-rose-300 bg-rose-500/10 border-rose-500/30",
};

const applicationStatMeta = [
  {
    key: "saved",
    label: "Saved",
    icon: Bookmark,
    color: "text-violet-300",
    bg: "bg-violet-500/10",
  },
  {
    key: "applied",
    label: "Applied",
    icon: Send,
    color: "text-sky-300",
    bg: "bg-sky-500/10",
  },
  {
    key: "interview",
    label: "Interview",
    icon: Clock,
    color: "text-amber-300",
    bg: "bg-amber-500/10",
  },
  {
    key: "shortlisted",
    label: "Shortlisted",
    icon: CheckCircle2,
    color: "text-emerald-300",
    bg: "bg-emerald-500/10",
  },
  {
    key: "rejected",
    label: "Rejected",
    icon: XCircle,
    color: "text-rose-300",
    bg: "bg-rose-500/10",
  },
];

const statusChartColors = {
  saved: "#a78bfa", // violet-400
  applied: "#38bdf8", // sky-400
  interview: "#fbbf24", // amber-400
  shortlisted: "#34d399", // emerald-400
  rejected: "#fb7185", // rose-400
};

const emptyApplications = {
  saved: [],
  applied: [],
  interview: [],
  shortlisted: [],
  rejected: [],
};

function timeAgo(mins) {
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// Minutes elapsed since an ISO timestamp the backend sent us.
function minutesSince(isoString) {
  if (!isoString) return 0;
  // If the string does not end with 'Z', append 'Z' to treat it as UTC
  const utcString = isoString.endsWith("Z") ? isoString : `${isoString}Z`;
  const diffMs = Date.now() - new Date(utcString).getTime();
  return Math.max(0, Math.round(diffMs / 60000));
}

function formatSalary(min, max) {
  if (min && max) return `₹${min}L – ₹${max}L`;
  if (min) return `₹${min}L+`;
  return "Not disclosed";
}

// ---- Mappers: API response shape -> the shape this component's JSX expects ----

function mapJob(apiJob) {
  return {
    id: apiJob.id,
    title: apiJob.title,
    company: apiJob.company_name,
    companyType: apiJob.company_type,
    match: apiJob.match_score, // may be null until the recommendation model is wired up
    location: apiJob.location,
    salary: formatSalary(apiJob.salary_min, apiJob.salary_max),
    salaryMin: apiJob.salary_min,
    salaryMax: apiJob.salary_max,
    postedMinsAgo: minutesSince(apiJob.posted_at),
    applicants: apiJob.applicant_count,
    competition: apiJob.competition_level,
    earlyApplicant: apiJob.applicant_count <= 3,
    skills: apiJob.skills || [],
  };
}

function mapApplication(apiApp) {
  return {
    id: apiApp.id, // Application row id — used for the Remove/DELETE call
    jobId: apiApp.job.id,
    title: apiApp.job.title,
    company: apiApp.job.company_name,
    companyType: apiApp.job.company_type,
  };
}

function mapResume(apiResume) {
  return {
    id: apiResume.id,
    name: apiResume.file_name,
    uploadedAt: timeAgo(minutesSince(apiResume.uploaded_at)),
    primary: apiResume.is_primary,
  };
}

function mapAts(apiAts) {
  if (!apiAts) return null;
  return {
    score: apiAts.score,
    missingSkills: apiAts.missing_skills,
    missingKeywords: apiAts.missing_keywords,
    suggestions: apiAts.suggestions,
  };
}

const NOTIF_STYLES = {
  "high-match": { icon: Target, color: "text-fuchsia-300" },
  "startup": { icon: Rocket, color: "text-orange-300" },
  "low-competition": { icon: Zap, color: "text-emerald-300" },
  "general": { icon: Bell, color: "text-violet-300" },
};

function mapNotification(apiNotif) {
  return {
    id: apiNotif.id,
    type: apiNotif.type,
    text: apiNotif.text,
    time: timeAgo(minutesSince(apiNotif.created_at)),
    read: apiNotif.is_read,
  };
}

export default function JobSeekerDashboard() {
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
  const [searchQuery, setSearchQuery] = useState("");
  const [apiError, setApiError] = useState("");
const [companyTypeFilter, setCompanyTypeFilter] = useState("All");
  const [salaryMinFilter, setSalaryMinFilter] = useState("");
  const [salaryMaxFilter, setSalaryMaxFilter] = useState("");
  const [employmentTypeFilter, setEmploymentTypeFilter] = useState("All");
  const [experienceLevelFilter, setExperienceLevelFilter] = useState("All");
  const [locationFilter, setLocationFilter] = useState("");
  const [skillFilters, setSkillFilters] = useState([]);
  const [skillFilterInput, setSkillFilterInput] = useState("");
  const [fresherFriendly, setFresherFriendly] = useState(false);
  const [lowCompetition, setLowCompetition] = useState(false);
  const [recentlyPosted, setRecentlyPosted] = useState(false);

  const [exitDirection, setExitDirection] = useState(null); // 'left' | 'up' | 'right' | null
  const ANIMATION_DURATION = 300; // ms — keep in sync with the CSS transition below
  const [exitingCards, setExitingCards] = useState({}); // { [jobId]: 'left' | 'up' | 'right' }

  const [chartAnimKey, setChartAnimKey] = useState(0);

  const [toast, setToast] = useState(null); // { id, text } | null

  // Mobile sidebar drawer toggle — UI-only state, no behavior change to any
  // existing feature. Sidebar content/logic is unchanged; this just controls
  // whether it's shown as an overlay on small screens.
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    if (active === "overview") {
      setChartAnimKey((k) => k + 1);
    }
  }, [active]);

  const [queue, setQueue] = useState([]);
  const [applications, setApplications] = useState(emptyApplications);
  const [atsScore, setAtsScore] = useState(null);
  const [resumeVersions, setResumeVersions] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [appFilter, setAppFilter] = useState("applied");
  const [profileCompletion, setProfileCompletion] = useState(0);
  const [profileForm, setProfileForm] = useState({
    fullName: displayName,
    email: user?.email || "",
    headline: "",
    skills: [],
    portfolio: [],
  });
  const [profileSavedMsg, setProfileSavedMsg] = useState("");

  const [openMessageThread, setOpenMessageThread] = useState(null);
  const activeMessageItem = openMessageThread
  ? Object.values(applications).flat().find((i) => i.id === openMessageThread)
  : null;

  const [companies, setCompanies] = useState([]);
  const [companiesTypeFilter, setCompaniesTypeFilter] = useState("All");
  const [selectedAtsJobModal, setSelectedAtsJobModal] = useState(null);

  const fileInputRef = useRef(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // ---------------------------------------------------------------------
  // Data loading — one fetch function per section, all called on mount.
  // ---------------------------------------------------------------------

  const fetchProfile = async () => {
    try {
      const { data } = await api.get("/api/jobseeker/profile");
      setProfileForm((prev) => ({
        ...prev,
        fullName: data.full_name,
        email: data.email,
        headline: data.headline || "",
        skills: data.skills.map((s) => s.name),
        portfolio: data.portfolio_links.map((p) => p.url),
      }));
      setProfileCompletion(data.profile_completion);
    } catch (err) {
      console.error("Failed to load profile:", err);
      setApiError("Couldn't load your profile.");
    }
  };

  const fetchApplications = async () => {
    try {
      const { data } = await api.get("/api/jobseeker/applications");
      const grouped = {
        saved: [],
        applied: [],
        interview: [],
        shortlisted: [],
        rejected: [],
      };
      data.forEach((row) => {
        if (grouped[row.status]) grouped[row.status].push(mapApplication(row));
      });
      setApplications(grouped);
    } catch (err) {
      console.error("Failed to load applications:", err);
      setApiError("Couldn't load your applications.");
    }
  };

  const fetchResumes = async () => {
    try {
      const { data } = await api.get("/api/jobseeker/resumes");
      setResumeVersions(data.map(mapResume));
    } catch (err) {
      console.error("Failed to load resumes:", err);
      setApiError("Couldn't load your resumes.");
    }
  };

  const fetchAts = async () => {
    try {
      const { data } = await api.get("/api/jobseeker/ats/latest");
      setAtsScore(mapAts(data));
    } catch (err) {
      console.error("Failed to load ATS analysis:", err);
      setAtsScore(null);
    }
  };

  const fetchNotifications = async () => {
  try {
    const { data } = await api.get("/api/jobseeker/notifications");
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

  const fetchDiscover = async () => {
    try {
      const params = { limit: 50 };
      if (searchQuery) params.search = searchQuery;
      if (companyTypeFilter !== "All") params.company_type = companyTypeFilter;
      if (employmentTypeFilter !== "All") params.employment_type = employmentTypeFilter;
      if (experienceLevelFilter !== "All") params.experience_level = experienceLevelFilter;
      if (locationFilter) params.location = locationFilter;
      if (skillFilters.length > 0) params.skill = skillFilters.join(",");
      if (salaryMinFilter) params.salary_min = Number(salaryMinFilter);
      if (salaryMaxFilter) params.salary_max = Number(salaryMaxFilter);
      if (fresherFriendly) params.fresher_friendly = true;
      if (lowCompetition) params.low_competition = true;
      if (recentlyPosted) params.recently_posted = true;

      const { data } = await api.get("/api/jobseeker/jobs/discover", { params });
      setQueue(data.map(mapJob));
    } catch (err) {
      console.error("Failed to load discover queue:", err);
      setApiError("Couldn't load recommended jobs.");
    }
  };

  const fetchCompanies = async () => {
    try {
      const params = {};
      if (companiesTypeFilter !== "All") params.company_type = companiesTypeFilter;
      const { data } = await api.get("/api/jobseeker/companies", { params });
      setCompanies(data);
    } catch (err) {
      console.error("Failed to load companies directory:", err);
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchApplications();
    fetchResumes();
    fetchAts();
    fetchNotifications();
    fetchDiscover();
    fetchCompanies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchCompanies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companiesTypeFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDiscover();
    }, 350); // debounce so typing in search/location/skill doesn't fire a request per keystroke
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    searchQuery,
    companyTypeFilter,
    employmentTypeFilter,
    experienceLevelFilter,
    locationFilter,
    skillFilters,
    salaryMinFilter,
    salaryMaxFilter,
    fresherFriendly,
    lowCompetition,
    recentlyPosted,
  ]);

  useEffect(() => {
  const intervalId = setInterval(() => {
    if (document.visibilityState === "visible") {
      fetchNotifications();
    }
  }, 8000); // check every 8 seconds

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

useEffect(() => {
  if (!toast) return;
  const timer = setTimeout(() => setToast(null), 5000);
  return () => clearTimeout(timer);
}, [toast]);

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

  // ---- Discover / swipe actions ----
  // ---- Discover / swipe actions ----
  const filteredDiscoverQueue = queue; // filtering now happens server-side in fetchDiscover()
  const currentJob = filteredDiscoverQueue[0];

  const handleSkip = async (job) => {
    const target = job || currentJob;
    if (!target) return;
    setQueue((prev) => prev.filter((j) => j.id !== target.id));
    try {
      await api.post("/api/jobseeker/swipe", {
        job_id: target.id,
        action: "skip",
      });
    } catch (err) {
      console.error("Failed to record skip:", err);
    }
  };

  const handleSave = async (job) => {
    const target = job || currentJob;
    if (!target) return;
    setQueue((prev) => prev.filter((j) => j.id !== target.id));
    try {
      await api.post("/api/jobseeker/swipe", {
        job_id: target.id,
        action: "save",
      });
      fetchApplications();
    } catch (err) {
      console.error("Failed to save job:", err);
    }
  };

  const handleApply = async (job) => {
    const target = job || currentJob;
    if (!target) return;
    setQueue((prev) => prev.filter((j) => j.id !== target.id));
    try {
      await api.post("/api/jobseeker/swipe", {
        job_id: target.id,
        action: "apply",
      });
      fetchApplications();
      fetchNotifications();
    } catch (err) {
      console.error("Failed to apply:", err);
    }
  };

  const triggerSwipe = (direction, actionFn, job) => {
    const target = job || currentJob;
    if (!target || exitDirection) return; // block double-clicks mid-animation

    setExitDirection(direction);

    setTimeout(() => {
      actionFn(target); // your real handleSkip/handleSave/handleApply
      setExitDirection(null); // reset so the next card animates fresh
    }, ANIMATION_DURATION);
  };

  const getCardStyle = () => {
    const base = {
      transition: `transform ${ANIMATION_DURATION}ms ease-in, opacity ${ANIMATION_DURATION}ms ease-in`,
    };
    if (!exitDirection) return base;

    const transforms = {
      left: "translateX(-160%) rotate(-12deg)",
      right: "translateX(160%) rotate(12deg)",
      up: "translateY(-160%) scale(0.85)",
    };

    return {
      ...base,
      transform: transforms[exitDirection],
      opacity: 0,
    };
  };

  const triggerCardSwipe = (direction, actionFn, job) => {
    if (exitingCards[job.id]) return; // already animating, ignore double click

    setExitingCards((prev) => ({ ...prev, [job.id]: direction }));

    setTimeout(() => {
      actionFn(job);
      setExitingCards((prev) => {
        const next = { ...prev };
        delete next[job.id];
        return next;
      });
    }, ANIMATION_DURATION);
  };

  const getExitStyle = (direction) => {
    const base = {
      transition: `transform ${ANIMATION_DURATION}ms ease-in, opacity ${ANIMATION_DURATION}ms ease-in`,
    };
    if (!direction) return base;

    const transforms = {
      left: "translateX(-160%) rotate(-12deg)",
      right: "translateX(160%) rotate(12deg)",
      up: "translateY(-160%) scale(0.85)",
    };

    return { ...base, transform: transforms[direction], opacity: 0 };
  };

  const checkAtsMatch = async (job) => {
    try {
      const { data } = await api.post(`/api/jobseeker/ats/analyze/${job.id}`);
      setSelectedAtsJobModal({ job, analysis: data });
      await fetchAts();
    } catch (err) {
      console.error("Failed to check ATS match:", err);
      setApiError(
        err?.response?.data?.detail ||
          "Couldn't check ATS match — upload a resume first.",
      );
    }
  };

  const resetQueue = () => fetchDiscover();

  // ---- Applications tab actions ----
  const removeApplication = async (statusKey, id) => {
    setApplications((prev) => ({
      ...prev,
      [statusKey]: prev[statusKey].filter((item) => item.id !== id),
    }));
    try {
      await api.delete(`/api/jobseeker/applications/${id}`);
    } catch (err) {
      console.error("Failed to remove application:", err);
      fetchApplications(); // resync with the server if the delete failed
    }
  };

  // Apply directly to a job you'd previously only saved.
  const applyToSavedJob = async (item) => {
    // optimistic: move the card from Saved to Applied immediately
    setApplications((prev) => ({
      ...prev,
      saved: prev.saved.filter((i) => i.id !== item.id),
      applied: [{ ...item }, ...prev.applied],
    }));
    try {
      await api.post("/api/jobseeker/swipe", {
        job_id: item.jobId,
        action: "apply",
      });
      fetchApplications(); // resync so the moved card gets its real data/order
      fetchNotifications();
    } catch (err) {
      console.error("Failed to apply:", err);
      fetchApplications(); // resync with the server if the call failed
      fetchNotifications();
    }
  };

  // ---- Resume actions ----
  const handleUploadClick = () => fileInputRef.current?.click();

  const handleFileSelected = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    try {
      await api.post("/api/jobseeker/resumes", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      await Promise.all([fetchResumes(), fetchAts(), fetchProfile()]);
    } catch (err) {
      console.error("Failed to upload resume:", err);
      setApiError(
        "Couldn't upload that resume — check the file type and try again.",
      );
    } finally {
      e.target.value = ""; // allow re-uploading the same filename later
    }
  };

 const setPrimaryResume = async (id) => {
  setResumeVersions((prev) =>
    prev.map((v) => ({ ...v, primary: v.id === id })),
  );
  try {
    await api.put(`/api/jobseeker/resumes/${id}/primary`);
    await fetchProfile();
  } catch (err) {
    console.error("Failed to set primary resume:", err);
    fetchResumes();
  }
};

  const deleteResume = async (resumeId) => {
    if (!window.confirm("Are you sure you want to remove this resume version?"))
      return;
    try {
      await api.delete(`/api/jobseeker/resumes/${resumeId}`);
      await fetchResumes(); // re-fetch resume list
    } catch (err) {
      console.error("Failed to delete resume:", err);
      alert(err?.response?.data?.detail || "Could not delete resume");
    }
  };

  // ---- Notification actions ----
  const markAsRead = async (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
    try {
      await api.put(`/api/jobseeker/notifications/${id}/read`);
    } catch (err) {
      console.error("Failed to mark notification read:", err);
    }
  };

  const dismissNotification = async (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    try {
      await api.delete(`/api/jobseeker/notifications/${id}`);
    } catch (err) {
      console.error("Failed to dismiss notification:", err);
    }
  };

  const markAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await api.put("/api/jobseeker/notifications/read-all");
    } catch (err) {
      console.error("Failed to mark all notifications read:", err);
    }
  };

  const chartData = applicationStatMeta.map(({ key, label }) => ({
    key,
    name: label,
    value: applications[key].length,
    color: statusChartColors[key],
  }));

  const totalApplications = chartData.reduce((sum, d) => sum + d.value, 0);

  // ---- Profile actions ----
  // Full name / email live on the `users` table (owned by auth), not on
  // job_seeker_profiles — so they're read-only here. Only skills and
  // portfolio links are actually saved by this form.
  const handleProfileChange = (e) =>
    setProfileForm({ ...profileForm, [e.target.name]: e.target.value });

  const [skillInput, setSkillInput] = useState("");
  const addSkill = () => {
    const val = skillInput.trim();
    if (!val || profileForm.skills.includes(val)) return;
    setProfileForm((prev) => ({ ...prev, skills: [...prev.skills, val] }));
    setSkillInput("");
  };
  const removeSkill = (skill) =>
    setProfileForm((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s !== skill),
    }));

  const addSkillFilter = () => {
    const val = skillFilterInput.trim();
    if (!val || skillFilters.some((s) => s.toLowerCase() === val.toLowerCase())) return;
    setSkillFilters((prev) => [...prev, val]);
    setSkillFilterInput("");
  };
  const removeSkillFilter = (skill) =>
    setSkillFilters((prev) => prev.filter((s) => s !== skill));

  const [portfolioInput, setPortfolioInput] = useState("");
  const addPortfolioLink = () => {
    const val = portfolioInput.trim();
    if (!val) return;
    setProfileForm((prev) => ({
      ...prev,
      portfolio: [...prev.portfolio, val],
    }));
    setPortfolioInput("");
  };
  const removePortfolioLink = (link) =>
    setProfileForm((prev) => ({
      ...prev,
      portfolio: prev.portfolio.filter((l) => l !== link),
    }));

  const handleSaveProfile = async () => {
    try {
      await api.put("/api/jobseeker/profile", {
        headline: profileForm.headline,
        skills: profileForm.skills,
        portfolio_links: profileForm.portfolio,
      });
      setProfileSavedMsg("Profile updated");
      fetchProfile();
    } catch (err) {
      console.error("Failed to save profile:", err);
      setProfileSavedMsg("Couldn't save — try again");
    } finally {
      setTimeout(() => setProfileSavedMsg(""), 2500);
    }
  };

  // Search filters the discover/recommended feed by title or company.
  // Search filters the discover/recommended feed by title, company, company type, and salary.
  const visibleQueue = filteredDiscoverQueue;

  return (
    <div className="min-h-screen w-full bg-[#0B0D12] text-slate-100 flex flex-col md:flex-row">
      <style>{`
  @keyframes slideIn {
    from { transform: translateY(20px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
`}</style>
      {/* Hidden file input used by the resume upload button */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx"
        className="hidden"
        onChange={handleFileSelected}
      />

      {/* Mobile top bar (visible below md) */}
      <div className="md:hidden sticky top-0 z-30 flex items-center justify-between px-4 h-14 border-b border-white/5 bg-[#0E1016]">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
            <Flame className="h-4 w-4 text-white" />
          </div>
          <span className="font-semibold tracking-tight text-[15px]">
            SwipeX
          </span>
        </div>
        <button
          onClick={() => setMobileNavOpen(true)}
          className="h-9 w-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10"
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
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
                  <Flame className="h-4 w-4 text-white" />
                </div>
                <span className="font-semibold tracking-tight text-[15px]">
                  SwipeX
                </span>
              </div>
              <button
                onClick={() => setMobileNavOpen(false)}
                className="h-8 w-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10"
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
                    setSearchQuery("");
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
                  {initials || <User className="h-4 w-4" />}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{displayName}</p>
                  <p className="text-xs text-slate-500">Job Seeker</p>
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
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
            <Flame className="h-4 w-4 text-white" />
          </div>
          <span className="font-semibold tracking-tight text-[15px]">
            SwipeX
          </span>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => {
                setActive(key);
                setSearchQuery("");
              }}
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
              {initials || <User className="h-4 w-4" />}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{displayName}</p>
              <p className="text-xs text-slate-500">Job Seeker</p>
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
        {/* Top bar (desktop / tablet) */}
        <header className="hidden md:flex h-16 border-b border-white/5 items-center justify-between px-4 lg:px-8 sticky top-0 bg-[#0B0D12]/90 backdrop-blur z-10 gap-4">
          <div className="min-w-0">
            <h1 className="text-base lg:text-lg font-semibold truncate">
              Welcome back, {displayName.split(" ")[0]}
            </h1>
            <p className="text-xs text-slate-500 truncate">
              Here's what's happening with your job search
            </p>
          </div>
          <div className="flex items-center gap-3 lg:gap-4 shrink-0">
            {(active === "discover" || active === "applications") && (
              <div className="relative hidden lg:block">
                <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={
                    active === "discover"
                      ? "Search jobs by title, company, skill..."
                      : "Search your applications..."
                  }
                  className="bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm w-56 xl:w-72 placeholder:text-slate-500 focus:outline-none focus:border-violet-500/50"
                />
              </div>
            )}
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

        {/* Mobile welcome + search (below md) */}
        <div className="md:hidden px-4 pt-4 space-y-3">
          <div>
            <h1 className="text-base font-semibold truncate">
              Welcome back, {displayName.split(" ")[0]}
            </h1>
            <p className="text-xs text-slate-500 truncate">
              Here's what's happening with your job search
            </p>
          </div>
          {(active === "discover" || active === "applications") && (
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  active === "discover"
                    ? "Search jobs..."
                    : "Search applications..."
                }
                className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm placeholder:text-slate-500 focus:outline-none focus:border-violet-500/50"
              />
            </div>
          )}
        </div>

        <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
          {apiError && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300 flex items-center justify-between gap-3">
              <span className="min-w-0">{apiError}</span>
              <button
                onClick={() => setApiError("")}
                className="text-rose-300 hover:text-rose-200 shrink-0"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {active === "overview" && (
            <>
              {/* Profile completion + Resume snapshot */}
              <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="col-span-1 md:col-span-2 rounded-xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-medium text-slate-300">
                      Profile completion
                    </h2>
                    <span className="text-sm font-semibold text-violet-300">
                      {profileCompletion}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-white/5 overflow-hidden mb-4">
                    <div
                      className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full"
                      style={{ width: `${profileCompletion}%` }}
                    />
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    {[
                      {
                        label: "Profile info",
                        done: Boolean(profileForm.headline),
                      },
                      {
                        label: "Resume upload",
                        done: resumeVersions.length > 0,
                      },
                      {
                        label: "Skill tags",
                        done: profileForm.skills.length > 0,
                      },
                      {
                        label: "Portfolio links",
                        done: profileForm.portfolio.length > 0,
                      },
                    ].map(({ label, done }) => (
                      <button
                        key={label}
                        onClick={() => setActive("profile")}
                        className="flex items-center gap-2 text-slate-400 hover:text-slate-200 text-left"
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full shrink-0 ${done ? "bg-emerald-400" : "bg-slate-600"}`}
                        />
                        <span className="truncate">{label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 sm:p-5 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-medium text-slate-300">
                      Resume
                    </h2>
                    <FileText className="h-4 w-4 text-slate-500" />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {resumeVersions.length} versions uploaded
                  </p>
                  <button
                    onClick={handleUploadClick}
                    className="mt-4 flex items-center justify-center gap-2 text-sm bg-violet-500/15 border border-violet-500/30 text-violet-200 rounded-lg py-2 hover:bg-violet-500/25 transition-colors"
                  >
                    <Upload className="h-3.5 w-3.5" /> Upload new version
                  </button>
                </div>
              </section>

              {/* Application tracking stats */}
              <section>
                <h2 className="text-sm font-medium text-slate-300 mb-3">
                  Application tracking
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                  {/* Stat boxes — unchanged, just re-flowed into a narrower column */}
                  <div className="lg:col-span-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {applicationStatMeta.map(
                      ({ key, label, icon: Icon, color, bg }) => (
                        <button
                          key={key}
                          onClick={() => {
                            setActive("applications");
                            setAppFilter(key);
                          }}
                          className={`rounded-xl border border-white/10 p-3 sm:p-4 text-left hover:border-violet-500/30 transition-colors ${bg}`}
                        >
                          <Icon className={`h-4 w-4 mb-2 ${color}`} />
                          <p className="text-xl sm:text-2xl font-semibold">
                            {applications[key].length}
                          </p>
                          <p className="text-xs text-slate-400">{label}</p>
                        </button>
                      ),
                    )}
                  </div>

                  {/* Donut chart card */}
                  <div className="lg:col-span-2 rounded-xl border border-white/10 bg-white/[0.03] p-4 sm:p-5 flex flex-col">
                    <h3 className="text-xs font-medium text-slate-400 mb-1">
                      Pipeline breakdown
                    </h3>
                    {totalApplications === 0 ? (
                      <div className="flex-1 flex items-center justify-center text-sm text-slate-600 py-10">
                        No activity yet
                      </div>
                    ) : (
                      <div className="relative flex-1 flex items-center justify-center overflow-hidden">
                        <PieChart key={chartAnimKey} width={200} height={200}>
                          <Pie
                            data={chartData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={56}
                            outerRadius={82}
                            paddingAngle={3}
                            isAnimationActive={true}
                            animationBegin={0}
                            animationDuration={900}
                            animationEasing="ease-out"
                            stroke="none"
                          >
                            {chartData.map((entry) => (
                              <Cell key={entry.key} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              background: "#0E1016",
                              border: "1px solid rgba(255,255,255,0.1)",
                              borderRadius: "8px",
                              fontSize: "12px",
                            }}
                            itemStyle={{ color: "#e2e8f0" }}
                          />
                        </PieChart>
                        {/* Center label overlay */}
                        <div className="absolute flex flex-col items-center pointer-events-none">
                          <span className="text-2xl font-semibold text-slate-100">
                            {totalApplications}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            Total
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Legend */}
                    <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 mt-3">
                      {chartData.map((d) => (
                        <div
                          key={d.key}
                          className="flex items-center gap-1.5 text-[11px] text-slate-400"
                        >
                          <span
                            className="h-2 w-2 rounded-full shrink-0"
                            style={{ backgroundColor: d.color }}
                          />
                          <span className="truncate">{d.name}</span>
                          <span className="ml-auto text-slate-500 shrink-0">
                            {d.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              {/* ATS / Resume analyzer */}
              <section className="rounded-xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
                <div className="flex items-center justify-between mb-4 gap-2">
                  <h2 className="text-sm font-medium text-slate-300 flex items-center gap-2 min-w-0">
                    <Sparkles className="h-4 w-4 text-violet-400 shrink-0" />
                    <span className="truncate">
                      AI Resume Analyzer & ATS Score
                    </span>
                  </h2>
                  <button
                    onClick={() => setActive("resume")}
                    className="text-xs text-violet-300 hover:text-violet-200 flex items-center gap-1 shrink-0"
                  >
                    Full breakdown <ChevronRight className="h-3 w-3" />
                  </button>
                </div>
                {atsScore ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="flex flex-col items-center justify-center rounded-lg border border-white/10 py-6">
                      <div
                        className={`h-20 w-20 rounded-full flex items-center justify-center text-xl font-semibold border-4 ${
                          atsScore.score >= 80
                            ? "border-emerald-500/60 text-emerald-300"
                            : "border-amber-500/60 text-amber-300"
                        }`}
                      >
                        {atsScore.score}%
                      </div>
                      <p className="text-xs text-slate-500 mt-3">
                        ATS Match Score
                      </p>
                      {atsScore.score < 80 && (
                        <p className="text-[11px] text-amber-300/80 mt-1 flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" /> Below
                          recommended 80%
                        </p>
                      )}
                    </div>

                    <div>
                      <p className="text-xs text-slate-500 mb-2">
                        Missing skills
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {atsScore.missingSkills.map((s) => (
                          <span
                            key={s}
                            className="text-xs px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/20"
                          >
                            {s}
                          </span>
                        ))}
                        {atsScore.missingSkills.length === 0 && (
                          <span className="text-xs text-slate-600">None</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-4 mb-2">
                        Missing keywords
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {atsScore.missingKeywords.map((k) => (
                          <span
                            key={k}
                            className="text-xs px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20"
                          >
                            {k}
                          </span>
                        ))}
                        {atsScore.missingKeywords.length === 0 && (
                          <span className="text-xs text-slate-600">None</span>
                        )}
                      </div>
                    </div>

                    <div>
                      <p className="text-xs text-slate-500 mb-2">
                        AI suggestions
                      </p>
                      <ul className="space-y-2">
                        {atsScore.suggestions.map((sug, i) => (
                          <li
                            key={i}
                            className="text-xs text-slate-300 flex gap-2"
                          >
                            <ChevronRight className="h-3.5 w-3.5 text-violet-400 shrink-0 mt-0.5" />
                            {sug}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">
                    Upload a resume to see your ATS score and suggestions.
                  </p>
                )}
              </section>

              {/* Recommended jobs preview */}
              <section>
                <div className="flex items-center justify-between mb-3 gap-2">
                  <h2 className="text-sm font-medium text-slate-300 flex items-center gap-2 min-w-0">
                    <TrendingUp className="h-4 w-4 text-violet-400 shrink-0" />
                    <span className="truncate">Recommended for you</span>
                  </h2>
                  <button
                    onClick={() => setActive("discover")}
                    className="text-xs text-violet-300 hover:text-violet-200 flex items-center gap-1 shrink-0"
                  >
                    Go to Discover <ChevronRight className="h-3 w-3" />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {queue
                    .filter((job) => job.match === null || job.match >= 10)
                    .slice(0, 3)
                    .map((job) => (
                      <div
                        key={job.id}
                        className="rounded-xl border border-white/10 bg-white/[0.03] p-4 hover:border-violet-500/30 transition-colors"
                        style={getExitStyle(exitingCards[job.id])}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">{job.title}</p>
                            <p className="text-xs text-slate-500 truncate">
                              {job.company}
                            </p>
                          </div>
                          <span className="text-xs font-semibold text-violet-300 bg-violet-500/10 border border-violet-500/30 rounded-full px-2 py-0.5 shrink-0">
                            {job.match != null ? `${job.match}% match` : "New"}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-3 text-[11px]">
                          <span className="px-2 py-0.5 rounded-full bg-white/5 text-slate-400 border border-white/10">
                            {job.companyType}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full border flex items-center gap-1 ${competitionColor[job.competition]}`}
                          >
                            <Zap className="h-3 w-3" /> {job.competition}{" "}
                            competition
                          </span>
                          {job.earlyApplicant && (
                            <span className="px-2 py-0.5 rounded-full bg-fuchsia-500/10 text-fuchsia-300 border border-fuchsia-500/20">
                              Early applicant
                            </span>
                          )}
                        </div>
                        <div className="mt-3 space-y-1 text-xs text-slate-500">
                          <p className="flex items-center gap-1.5">
                            <MapPin className="h-3 w-3 shrink-0" /> <span className="truncate">{job.location}</span>
                          </p>
                          <p className="flex items-center gap-1.5">
                            <DollarSign className="h-3 w-3 shrink-0" /> {job.salary}
                          </p>
                          <p className="flex items-center gap-1.5">
                            <Clock className="h-3 w-3 shrink-0" /> Posted{" "}
                            {timeAgo(job.postedMinsAgo)} · {job.applicants}{" "}
                            applicants
                          </p>
                        </div>
                        <div className="flex gap-2 mt-4">
                          <button
                            onClick={() =>
                              triggerCardSwipe("left", handleSkip, job)
                            }
                            className="flex-1 text-xs bg-white/5 border border-white/10 rounded-lg py-2 hover:bg-white/10"
                          >
                            Skip
                          </button>
                          <button
                            onClick={() =>
                              triggerCardSwipe("up", handleSave, job)
                            }
                            className="flex-1 text-xs bg-violet-500/15 border border-violet-500/30 text-violet-200 rounded-lg py-2 hover:bg-violet-500/25"
                          >
                            Save
                          </button>
                          <button
                            onClick={() =>
                              triggerCardSwipe("right", handleApply, job)
                            }
                            className="flex-1 text-xs bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-lg py-2 font-medium"
                          >
                            Apply
                          </button>
                        </div>
                      </div>
                    ))}
                  {queue.length === 0 && (
                    <p className="text-sm text-slate-500 col-span-full">
                      No matching jobs — try a different search.
                    </p>
                  )}
                </div>
              </section>

              {/* Notifications preview */}
              <section className="rounded-xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
                <div className="flex items-center justify-between mb-4 gap-2">
                  <h2 className="text-sm font-medium text-slate-300 flex items-center gap-2 min-w-0">
                    <Bell className="h-4 w-4 text-violet-400 shrink-0" />
                    <span className="truncate">Smart notifications</span>
                  </h2>
                  <button
                    onClick={() => setActive("notifications")}
                    className="text-xs text-violet-300 hover:text-violet-200 flex items-center gap-1 shrink-0"
                  >
                    View all <ChevronRight className="h-3 w-3" />
                  </button>
                </div>
                <div className="space-y-3">
                  {notifications.slice(0, 3).map((n) => (
                    <div
                      key={n.id}
                      className="flex items-start justify-between gap-3 text-sm border-b border-white/5 pb-3 last:border-0 last:pb-0"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <Briefcase className="h-4 w-4 text-slate-500 mt-0.5 shrink-0" />
                        <p
                          className={
                            n.read ? "text-slate-500" : "text-slate-200"
                          }
                        >
                          {n.text}
                        </p>
                      </div>
                      <span className="text-xs text-slate-500 shrink-0">
                        {n.time}
                      </span>
                    </div>
                  ))}
                  {notifications.length === 0 && (
                    <p className="text-sm text-slate-500">
                      No notifications yet.
                    </p>
                  )}
                </div>
              </section>
            </>
          )}

          {active === "discover" && (
            <section className="max-w-xl mx-auto">
              <h2 className="text-sm font-medium text-slate-300 mb-4 flex items-center gap-2">
                <Flame className="h-4 w-4 text-violet-400" /> Discover jobs
              </h2>

              {/* Filters: company type + salary range */}
              {/* Filters: company type, employment type, experience, location, skill, salary, advanced */}
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 mb-4 space-y-4">
                <div>
                  <p className="text-xs text-slate-500 mb-2">Company type</p>
                  <div className="flex flex-wrap gap-2">
                    {COMPANY_TYPE_FILTERS.map((t) => (
                      <button
                        key={t}
                        onClick={() => setCompanyTypeFilter(t)}
                        className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                          companyTypeFilter === t
                            ? "bg-violet-500/15 text-violet-200 border-violet-500/30"
                            : "bg-white/5 border-white/10 text-slate-400 hover:text-slate-200 hover:border-violet-500/40"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs text-slate-500 mb-2">Job type</p>
                  <div className="flex flex-wrap gap-2">
                    {EMPLOYMENT_TYPE_FILTERS.map((t) => (
                      <button
                        key={t}
                        onClick={() => setEmploymentTypeFilter(t)}
                        className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                          employmentTypeFilter === t
                            ? "bg-violet-500/15 text-violet-200 border-violet-500/30"
                            : "bg-white/5 border-white/10 text-slate-400 hover:text-slate-200 hover:border-violet-500/40"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs text-slate-500 mb-2">Experience level</p>
                  <div className="flex flex-wrap gap-2">
                    {EXPERIENCE_LEVEL_FILTERS.map((t) => (
                      <button
                        key={t}
                        onClick={() => setExperienceLevelFilter(t)}
                        className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                          experienceLevelFilter === t
                            ? "bg-violet-500/15 text-violet-200 border-violet-500/30"
                            : "bg-white/5 border-white/10 text-slate-400 hover:text-slate-200 hover:border-violet-500/40"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-slate-500 mb-2">Location</p>
                    <input
                      value={locationFilter}
                      onChange={(e) => setLocationFilter(e.target.value)}
                      placeholder="e.g. Bangalore"
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm placeholder:text-slate-500 focus:outline-none focus:border-violet-500/50"
                    />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-2">Skills</p>
                    {skillFilters.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {skillFilters.map((s) => (
                          <span
                            key={s}
                            className="text-xs px-2.5 py-1 rounded-full bg-violet-500/10 text-violet-200 border border-violet-500/30 flex items-center gap-1.5"
                          >
                            {s}
                            <button onClick={() => removeSkillFilter(s)}>
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <input
                        value={skillFilterInput}
                        onChange={(e) => setSkillFilterInput(e.target.value)}
                        onKeyDown={(e) =>
                          e.key === "Enter" && (e.preventDefault(), addSkillFilter())
                        }
                        placeholder="e.g. React, then Enter"
                        className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm placeholder:text-slate-500 focus:outline-none focus:border-violet-500/50"
                      />
                      <button
                        onClick={addSkillFilter}
                        className="px-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 shrink-0"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-slate-500 mb-2">Salary range (₹L)</p>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={salaryMinFilter}
                      onChange={(e) => setSalaryMinFilter(e.target.value)}
                      placeholder="Min"
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm placeholder:text-slate-500 focus:outline-none focus:border-violet-500/50"
                    />
                    <span className="text-slate-500 text-xs shrink-0">to</span>
                    <input
                      type="number"
                      value={salaryMaxFilter}
                      onChange={(e) => setSalaryMaxFilter(e.target.value)}
                      placeholder="Max"
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm placeholder:text-slate-500 focus:outline-none focus:border-violet-500/50"
                    />
                  </div>
                </div>

                <div>
                  <p className="text-xs text-slate-500 mb-2">Advanced filters</p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setFresherFriendly((v) => !v)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                        fresherFriendly
                          ? "bg-violet-500/15 text-violet-200 border-violet-500/30"
                          : "bg-white/5 border-white/10 text-slate-400 hover:text-slate-200 hover:border-violet-500/40"
                      }`}
                    >
                      Fresher-friendly
                    </button>
                    <button
                      onClick={() => setLowCompetition((v) => !v)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                        lowCompetition
                          ? "bg-violet-500/15 text-violet-200 border-violet-500/30"
                          : "bg-white/5 border-white/10 text-slate-400 hover:text-slate-200 hover:border-violet-500/40"
                      }`}
                    >
                      Low competition
                    </button>
                    <button
                      onClick={() => setRecentlyPosted((v) => !v)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                        recentlyPosted
                          ? "bg-violet-500/15 text-violet-200 border-violet-500/30"
                          : "bg-white/5 border-white/10 text-slate-400 hover:text-slate-200 hover:border-violet-500/40"
                      }`}
                    >
                      Recently posted
                    </button>
                  </div>
                </div>

                {(salaryMinFilter ||
                  salaryMaxFilter ||
                  companyTypeFilter !== "All" ||
                  employmentTypeFilter !== "All" ||
                  experienceLevelFilter !== "All" ||
                  locationFilter ||
                  skillFilters.length > 0 ||
                  fresherFriendly ||
                  lowCompetition ||
                  recentlyPosted) && (
                  <button
                    onClick={() => {
                      setSalaryMinFilter("");
                      setSalaryMaxFilter("");
                      setCompanyTypeFilter("All");
                      setEmploymentTypeFilter("All");
                      setExperienceLevelFilter("All");
                      setLocationFilter("");
                      setSkillFilters([]);
                      setSkillFilterInput("");
                      setFresherFriendly(false);
                      setLowCompetition(false);
                      setRecentlyPosted(false);
                    }}
                    className="text-xs px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-slate-200 whitespace-nowrap"
                  >
                    Clear all filters
                  </button>
                )}
              </div>

              {currentJob ? (
                <div
                  key={currentJob.id}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-6"
                  style={getCardStyle()}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-lg font-semibold truncate">
                        {currentJob.title}
                      </p>
                      <p className="text-sm text-slate-500 truncate">
                        {currentJob.company}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-violet-300 bg-violet-500/10 border border-violet-500/30 rounded-full px-3 py-1 shrink-0">
                      {currentJob.match != null
                        ? `${currentJob.match}% match`
                        : "New"}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-4 text-xs">
                    <span className="px-2.5 py-1 rounded-full bg-white/5 text-slate-400 border border-white/10">
                      {currentJob.companyType}
                    </span>
                    <span
                      className={`px-2.5 py-1 rounded-full border flex items-center gap-1 ${competitionColor[currentJob.competition]}`}
                    >
                      <Zap className="h-3.5 w-3.5" /> {currentJob.competition}{" "}
                      competition
                    </span>
                    {currentJob.earlyApplicant && (
                      <span className="px-2.5 py-1 rounded-full bg-fuchsia-500/10 text-fuchsia-300 border border-fuchsia-500/20">
                        Early applicant
                      </span>
                    )}
                  </div>
                  <div className="mt-5 space-y-2 text-sm text-slate-400">
                    <p className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 shrink-0" /> {currentJob.location}
                    </p>
                    <p className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 shrink-0" /> {currentJob.salary}
                    </p>
                    <p className="flex items-center gap-2">
                      <Clock className="h-4 w-4 shrink-0" /> Posted{" "}
                      {timeAgo(currentJob.postedMinsAgo)} ·{" "}
                      {currentJob.applicants} applicants
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 mt-6">
                    <button
                      onClick={() => triggerSwipe("left", handleSkip)}
                      className="flex-1 flex items-center justify-center gap-2 text-sm bg-white/5 border border-white/10 rounded-xl py-3 hover:bg-white/10"
                    >
                      <X className="h-4 w-4" /> Skip
                    </button>
                    <button
                      onClick={() => triggerSwipe("up", handleSave)}
                      className="flex-1 flex items-center justify-center gap-2 text-sm bg-violet-500/15 border border-violet-500/30 text-violet-200 rounded-xl py-3 hover:bg-violet-500/25"
                    >
                      <Bookmark className="h-4 w-4" /> Save
                    </button>
                    <button
                      onClick={() => triggerSwipe("right", handleApply)}
                      className="flex-1 flex items-center justify-center gap-2 text-sm bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-xl py-3 font-medium"
                    >
                      <Send className="h-4 w-4" /> Apply
                    </button>
                  </div>
                  <button
                    onClick={() => checkAtsMatch(currentJob)}
                    className="w-full mt-3 text-xs text-violet-300 hover:text-violet-200 border border-violet-500/30 rounded-lg py-2 hover:bg-violet-500/10"
                  >
                    Check ATS match for this job
                  </button>
                  <p className="text-xs text-slate-600 text-center mt-4">
                    {filteredDiscoverQueue.length - 1} more matching your search
                  </p>
                </div>
              ) : (
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-10 text-center">
                  <p className="text-slate-300 font-medium">
                    You're all caught up
                  </p>
                  <p className="text-sm text-slate-500 mt-1">
                    Check back later for new recommendations.
                  </p>
                  <button
                    onClick={resetQueue}
                    className="mt-4 inline-flex items-center gap-2 text-sm text-violet-300 hover:text-violet-200"
                  >
                    <RotateCcw className="h-4 w-4" /> Reload queue
                  </button>
                </div>
              )}
            </section>
          )}

          {active === "applications" && (
            <section>
              <h2 className="text-sm font-medium text-slate-300 mb-4 flex items-center gap-2">
                <Send className="h-4 w-4 text-violet-400" /> Applications
              </h2>
              <div className="flex flex-wrap gap-2 mb-5">
                {applicationStatMeta.map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setAppFilter(key)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                      appFilter === key
                        ? "bg-violet-500/15 text-violet-200 border-violet-500/30"
                        : "bg-white/5 text-slate-400 border-white/10 hover:text-slate-200"
                    }`}
                  >
                    {label} ({applications[key].length})
                  </button>
                ))}
              </div>
              <div className="space-y-3">
                {(() => {
                  const filteredApps = applications[appFilter].filter(
                    (item) =>
                      item.title
                        .toLowerCase()
                        .includes(searchQuery.toLowerCase()) ||
                      item.company
                        .toLowerCase()
                        .includes(searchQuery.toLowerCase()),
                  );
                  if (filteredApps.length === 0) {
                    return (
                      <p className="text-sm text-slate-500">
                        {searchQuery
                          ? "No applications match your search."
                          : "Nothing here yet."}
                      </p>
                    );
                  }
                  return filteredApps.map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4"
                    >
                      {/* this needs to remove if the error occurs -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */}
                      <div>
  <div className="flex items-center justify-between">
    {/* ...existing title/company/buttons row stays as-is... */}
  </div>
  {(appFilter === "shortlisted" || appFilter === "interview") && (
  <button
    onClick={() => setOpenMessageThread(item.id)}
    className="text-xs text-violet-300 hover:text-violet-200 mt-2"
  >
    Message recruiter
  </button>
)}
</div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{item.title}</p>
                        <p className="text-xs text-slate-500 truncate">
                          {item.company} · {item.companyType}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        {appFilter === "saved" && (
                          <button
                            onClick={() => applyToSavedJob(item)}
                            className="text-xs text-violet-300 hover:text-violet-200 flex items-center gap-1"
                          >
                            <Send className="h-3.5 w-3.5" /> Apply
                          </button>
                        )}
                        <button
                          onClick={() => removeApplication(appFilter, item.id)}
                          className="text-xs text-rose-300 hover:text-rose-200 flex items-center gap-1"
                        >
                          <X className="h-3.5 w-3.5" /> Remove
                        </button>
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </section>
          )}

          {active === "companies" && (
            <section className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-violet-400 shrink-0" /> Companies & Startups Directory
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Discover hiring MNCs, fast-growing startups, and newly founded tech companies.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {["All", "MNC", "Startup", "Newly Founded"].map((t) => (
                    <button
                      key={t}
                      onClick={() => setCompaniesTypeFilter(t)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                        companiesTypeFilter === t
                          ? "bg-violet-500/15 text-violet-200 border-violet-500/30 font-medium"
                          : "bg-white/5 border-white/10 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {companies.map((comp) => (
                  <div
                    key={comp.id}
                    className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 hover:border-violet-500/30 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="h-10 w-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-300 font-bold text-lg shrink-0">
                            {comp.name ? comp.name[0].toUpperCase() : "C"}
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-semibold text-sm text-slate-100 truncate">{comp.name || "Company"}</h3>
                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/5 text-slate-400 border border-white/10 mt-1 inline-block">
                              {comp.company_type}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
                        <Briefcase className="h-3.5 w-3.5 text-violet-400 shrink-0" />
                        <span>{comp.active_jobs_count} active opening(s)</span>
                      </div>
                    </div>

                    <div className="mt-5 pt-4 border-t border-white/5 flex items-center justify-between gap-2">
                      {comp.website ? (
                        <a
                          href={comp.website.startsWith("http") ? comp.website : `https://${comp.website}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-violet-300 hover:text-violet-200 flex items-center gap-1"
                        >
                          Visit website <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        <span className="text-xs text-slate-600">No website listed</span>
                      )}
                      <button
                        onClick={() => {
                          setCompanyTypeFilter(comp.company_type);
                          setActive("discover");
                        }}
                        className="text-xs px-3 py-1.5 rounded-lg bg-violet-500/15 text-violet-200 border border-violet-500/30 hover:bg-violet-500/25 shrink-0"
                      >
                        Explore Jobs
                      </button>
                    </div>
                  </div>
                ))}

                {companies.length === 0 && (
                  <div className="col-span-full rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center text-slate-400">
                    No companies found for this filter category.
                  </div>
                )}
              </div>
            </section>
          )}

          {active === "resume" && (
            <section className="space-y-6">
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-medium text-slate-300 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-violet-400" /> AI Resume
                    Analyzer & ATS Score
                  </h2>
                </div>
                {atsScore ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="flex flex-col items-center justify-center rounded-lg border border-white/10 py-6">
                      <div
                        className={`h-20 w-20 rounded-full flex items-center justify-center text-xl font-semibold border-4 ${
                          atsScore.score >= 80
                            ? "border-emerald-500/60 text-emerald-300"
                            : "border-amber-500/60 text-amber-300"
                        }`}
                      >
                        {atsScore.score}%
                      </div>
                      <p className="text-xs text-slate-500 mt-3">
                        ATS Match Score
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-2">
                        Missing skills
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {atsScore.missingSkills.map((s) => (
                          <span
                            key={s}
                            className="text-xs px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/20"
                          >
                            {s}
                          </span>
                        ))}
                        {atsScore.missingSkills.length === 0 && (
                          <span className="text-xs text-slate-600">None</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-4 mb-2">
                        Missing keywords
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {atsScore.missingKeywords.map((k) => (
                          <span
                            key={k}
                            className="text-xs px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20"
                          >
                            {k}
                          </span>
                        ))}
                        {atsScore.missingKeywords.length === 0 && (
                          <span className="text-xs text-slate-600">None</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-2">
                        AI suggestions
                      </p>
                      <ul className="space-y-2">
                        {atsScore.suggestions.map((sug, i) => (
                          <li
                            key={i}
                            className="text-xs text-slate-300 flex gap-2"
                          >
                            <ChevronRight className="h-3.5 w-3.5 text-violet-400 shrink-0 mt-0.5" />
                            {sug}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">
                    Upload a resume below to generate your first ATS analysis.
                  </p>
                )}
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <h2 className="text-sm font-medium text-slate-300 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-violet-400" /> Resume
                    versions
                  </h2>
                  <button
                    onClick={handleUploadClick}
                    className="flex items-center justify-center gap-2 text-xs bg-violet-500/15 border border-violet-500/30 text-violet-200 rounded-lg px-3 py-1.5 hover:bg-violet-500/25 self-start sm:self-auto"
                  >
                    <Upload className="h-3.5 w-3.5" /> Upload new version
                  </button>
                </div>
                <div className="space-y-2">
                  {resumeVersions.length === 0 && (
                    <p className="text-sm text-slate-500">
                      No resumes uploaded yet.
                    </p>
                  )}
                  {resumeVersions.map((v) => (
                    <div
                      key={v.id}
                      className="flex items-center justify-between gap-3 rounded-lg border border-white/10 p-3"
                    >
                      <div className="min-w-0">
                        <p className="text-sm truncate">{v.name}</p>
                        <p className="text-xs text-slate-500">
                          Uploaded {v.uploadedAt}
                        </p>
                      </div>
                      {v.primary ? (
                        <span className="text-xs text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-2.5 py-1 shrink-0">
                          Primary
                        </span>
                      ) : (
                        <button
                          onClick={() => setPrimaryResume(v.id)}
                          className="text-xs text-violet-300 hover:text-violet-200 shrink-0"
                        >
                          Set as primary
                        </button>
                      )}
                    </div>
                  ))}
                </div>
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
                {notifications.map((n) => {
                  const style = NOTIF_STYLES[n.type] || NOTIF_STYLES.general;
                  const Icon = style.icon;
                  return (
                  <div
                    key={n.id}
                    className="flex items-start justify-between gap-2 text-sm border-b border-white/5 pb-3 last:border-0 last:pb-0"
                  >
                    <button
                      onClick={() => markAsRead(n.id)}
                      className="flex items-start gap-3 text-left flex-1 min-w-0"
                    >
                      <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${style.color}`} />
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
                  );
                })}
              </div>
            </section>
          )}

          {active === "profile" && (
            <section className="max-w-2xl space-y-6">
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
                <h2 className="text-sm font-medium text-slate-300 mb-4 flex items-center gap-2">
                  <User className="h-4 w-4 text-violet-400" /> Profile
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-500">Full name</label>
                    <input
                      name="fullName"
                      value={profileForm.fullName}
                      onChange={handleProfileChange}
                      disabled
                      title="Managed from your account settings, not editable here"
                      className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-400 cursor-not-allowed focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500">Email</label>
                    <input
                      name="email"
                      value={profileForm.email}
                      onChange={handleProfileChange}
                      disabled
                      title="Managed from your account settings, not editable here"
                      className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-400 cursor-not-allowed focus:outline-none"
                    />
                  </div>
                </div>
                <p className="text-[11px] text-slate-600 mt-1.5">
                  Name and email come from your account settings — skills and
                  portfolio links below are what this form saves.
                </p>
                <div className="mt-5">
                  <label className="text-xs text-slate-500">
                    Professional headline
                  </label>
                  <input
                    value={profileForm.headline}
                    onChange={(e) =>
                      setProfileForm({
                        ...profileForm,
                        headline: e.target.value,
                      })
                    }
                    placeholder="e.g. Frontend Engineer with 2 years of React experience"
                    className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-500/50"
                  />
                </div>

                <div className="mt-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <label className="text-xs text-slate-500">Resume</label>
                    <button
                      onClick={handleUploadClick}
                      className="flex items-center gap-1.5 text-xs text-violet-300 hover:text-violet-200 self-start sm:self-auto"
                    >
                      <Upload className="h-3.5 w-3.5" /> Upload new version
                    </button>
                  </div>
                  <div className="space-y-2">
                    {resumeVersions.length === 0 && (
                      <p className="text-xs text-slate-600">
                        No resumes uploaded yet.
                      </p>
                    )}
                    {resumeVersions.map((v) => (
                      <div
                        key={v.id}
                        className="flex items-center justify-between gap-2 rounded-lg border border-white/10 p-2.5 text-sm"
                      >
                        <span className="text-slate-300 truncate">{v.name}</span>
                        {v.primary ? (
                          <span className="text-[10px] text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-2 py-0.5 shrink-0">
                            Primary
                          </span>
                        ) : (
                          <button
                            onClick={() => deleteResume(v.id)}
                            className="text-xs text-rose-400 hover:text-rose-300 shrink-0"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-5">
                  <label className="text-xs text-slate-500">Skills</label>
                  <div className="flex flex-wrap gap-2 mt-2 mb-2">
                    {profileForm.skills.map((s) => (
                      <span
                        key={s}
                        className="text-xs px-2.5 py-1 rounded-full bg-violet-500/10 text-violet-200 border border-violet-500/30 flex items-center gap-1.5"
                      >
                        {s}
                        <button onClick={() => removeSkill(s)}>
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                    {profileForm.skills.length === 0 && (
                      <span className="text-xs text-slate-600">
                        No skills added yet
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <input
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === "Enter" && (e.preventDefault(), addSkill())
                      }
                      placeholder="Add a skill and press Enter"
                      className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-500/50"
                    />
                    <button
                      onClick={addSkill}
                      className="px-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 shrink-0"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-5">
                  <label className="text-xs text-slate-500">
                    Portfolio links
                  </label>
                  <div className="space-y-2 mt-2 mb-2">
                    {profileForm.portfolio.map((link) => (
                      <div
                        key={link}
                        className="flex items-center justify-between gap-2 text-sm bg-white/5 border border-white/10 rounded-lg px-3 py-2"
                      >
                        <span className="truncate text-slate-300">{link}</span>
                        <button
                          onClick={() => removePortfolioLink(link)}
                          className="text-slate-500 hover:text-rose-300 shrink-0"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                    {profileForm.portfolio.length === 0 && (
                      <span className="text-xs text-slate-600">
                        No links added yet
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <input
                      value={portfolioInput}
                      onChange={(e) => setPortfolioInput(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === "Enter" &&
                        (e.preventDefault(), addPortfolioLink())
                      }
                      placeholder="https://your-portfolio.com"
                      className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-500/50"
                    />
                    <button
                      onClick={addPortfolioLink}
                      className="px-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 shrink-0"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-3 mt-6">
                  <button
                    onClick={handleSaveProfile}
                    className="bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-lg px-4 py-2 text-sm font-medium"
                  >
                    Save changes
                  </button>
                  {profileSavedMsg && (
                    <span className="text-xs text-emerald-300">
                      {profileSavedMsg}
                    </span>
                  )}
                </div>
              </div>
            </section>
          )}
        </div>
      </main>

      {activeMessageItem && (
        <MessageThread
          endpointBase="/api/jobseeker"
          resourcePath="applications"
          applicationId={activeMessageItem.id}
          title={activeMessageItem.title}
          subtitle={activeMessageItem.company}
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

      {/* ATS Analysis Modal */}
      {selectedAtsJobModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl max-w-xl w-full p-4 sm:p-6 space-y-5 shadow-2xl relative max-h-[90vh] overflow-y-auto text-left">
            <button
              onClick={() => setSelectedAtsJobModal(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-white/10 pb-4 pr-8">
              <div className="h-10 w-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-300 shrink-0">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-base text-white truncate">
                  ATS Match Analysis: {selectedAtsJobModal.job.title}
                </h3>
                <p className="text-xs text-slate-400 truncate">
                  {selectedAtsJobModal.job.company}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 bg-white/5 rounded-xl p-4 border border-white/10">
              <div>
                <p className="text-xs text-slate-400">ATS Match Score</p>
                <p className="text-2xl font-bold text-violet-300 mt-1">
                  {selectedAtsJobModal.analysis.score}%
                </p>
              </div>
              <div className="text-right shrink-0">
                {selectedAtsJobModal.analysis.score >= 80 ? (
                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                    High Compatibility Match
                  </span>
                ) : (
                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3 inline" /> Below 80% Threshold
                  </span>
                )}
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-slate-400 mb-2">Missing Skills</p>
              <div className="flex flex-wrap gap-2">
                {selectedAtsJobModal.analysis.missing_skills?.map((s) => (
                  <span key={s} className="text-xs px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/20">
                    {s}
                  </span>
                ))}
                {(!selectedAtsJobModal.analysis.missing_skills || selectedAtsJobModal.analysis.missing_skills.length === 0) && (
                  <span className="text-xs text-emerald-400 font-medium">All required skills detected!</span>
                )}
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-slate-400 mb-2">Missing Keywords from Job Description</p>
              <div className="flex flex-wrap gap-2">
                {selectedAtsJobModal.analysis.missing_keywords?.map((k) => (
                  <span key={k} className="text-xs px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
                    {k}
                  </span>
                ))}
                {(!selectedAtsJobModal.analysis.missing_keywords || selectedAtsJobModal.analysis.missing_keywords.length === 0) && (
                  <span className="text-xs text-emerald-400 font-medium">No missing keywords found!</span>
                )}
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-slate-400 mb-2">AI Optimization Advice</p>
              <ul className="space-y-2 bg-white/5 rounded-xl p-3 border border-white/5">
                {selectedAtsJobModal.analysis.suggestions?.map((sug, idx) => (
                  <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                    <ChevronRight className="h-3.5 w-3.5 text-violet-400 shrink-0 mt-0.5" />
                    <span>{sug}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={() => setSelectedAtsJobModal(null)}
                className="flex-1 py-2.5 rounded-xl border border-white/10 text-xs text-slate-300 hover:bg-white/5"
              >
                Close
              </button>
              <button
                onClick={() => {
                  const jobToApply = selectedAtsJobModal.job;
                  setSelectedAtsJobModal(null);
                  handleApply(jobToApply);
                }}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 text-xs font-medium text-white shadow-lg"
              >
                Apply to this Job
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
