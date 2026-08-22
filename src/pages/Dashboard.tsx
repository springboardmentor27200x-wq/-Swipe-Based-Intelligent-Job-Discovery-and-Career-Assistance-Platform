import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import { Job, Match, RecruiterAnalyticsData } from "../types";
import { useAuth } from "../components/AuthContext";
import { motion, AnimatePresence } from "motion/react";
import { 
  PlusCircle, List, UserCheck, CheckCircle2, Sparkles, MapPin, 
  DollarSign, Brain, Mail, Compass, Star, ChevronRight, Check,
  BarChart3, TrendingUp, Users, Calendar, Video, MessageSquare,
  Award, X, FileText, ExternalLink, RefreshCw, Filter, Search, Heart
} from "lucide-react";
import {
  HorizontalFunnelChart,
  SimpleAreaTrendChart,
  SimpleBarChart,
  SimpleDonutChart
} from "../components/Charts";
import { UserAvatar } from "../components/UserAvatar";

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [applicants, setApplicants] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<RecruiterAnalyticsData | null>(null);
  const [activeTab, setActiveTab] = useState<"pipeline" | "analytics" | "listings" | "post">("pipeline");
  const [loading, setLoading] = useState(true);

  // New Job Form State
  const [title, setTitle] = useState("");
  const [companyName, setCompanyName] = useState(user?.profile?.companyName || "Tech Innovations");
  const [description, setDescription] = useState("");
  const [salaryRange, setSalaryRange] = useState("$130,000 - $165,000");
  const [location, setLocation] = useState("San Francisco, CA (Hybrid)");
  const [skillInput, setSkillInput] = useState("");
  const [requiredSkills, setRequiredSkills] = useState<string[]>(["React", "TypeScript"]);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Status Action Modal State
  const [selectedApplicantForAction, setSelectedApplicantForAction] = useState<any | null>(null);
  const [actionType, setActionType] = useState<"match" | "shortlist" | "interview" | "select" | "reject">("match");
  const [feedbackNote, setFeedbackNote] = useState("");
  const [interviewDate, setInterviewDate] = useState(new Date(Date.now() + 86400000 * 2).toISOString().split("T")[0]);
  const [interviewType, setInterviewType] = useState("Technical Architecture & Coding Round");
  const [actionLoading, setActionLoading] = useState(false);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [jobsRes, matchesRes, applicantsRes, analyticsRes] = await Promise.all([
        api.get<Job[]>("/jobs"),
        api.get<Match[]>("/matches"),
        api.get<any[]>("/recruiter/applicants"),
        api.get<RecruiterAnalyticsData>("/recruiter/analytics")
      ]);

      setJobs(jobsRes.data || []);
      setMatches(matchesRes.data || []);
      setApplicants(applicantsRes.data || []);
      setAnalytics(analyticsRes.data || null);
    } catch (err) {
      console.error("Failed to load recruiter data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handlePostJob = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg(null);

    try {
      await api.post("/jobs", {
        title,
        companyName,
        description,
        salaryRange,
        location,
        requiredSkills
      });

      setSuccessMsg("Job opportunity published to swipe decks!");
      setTitle("");
      setDescription("");
      setSkillInput("");
      setRequiredSkills(["React", "TypeScript"]);

      await fetchDashboardData();
      setTimeout(() => {
        setActiveTab("listings");
        setSuccessMsg(null);
      }, 1200);
    } catch (err) {
      console.error("Job post failed", err);
    }
  };

  const handleUpdateStatus = async () => {
    if (!selectedApplicantForAction) return;
    setActionLoading(true);

    const statusMap = {
      match: "matched",
      shortlist: "shortlisted",
      interview: "interview_scheduled",
      select: "selected",
      reject: "rejected"
    };

    try {
      await api.post(`/recruiter/applications/${selectedApplicantForAction.id}/status`, {
        status: statusMap[actionType],
        recruiterFeedback: feedbackNote,
        interviewDate: actionType === "interview" ? interviewDate : undefined,
        interviewType: actionType === "interview" ? interviewType : undefined
      });

      setSuccessMsg(
        actionType === "match"
          ? "🎉 Mutual Match confirmed! Candidate has been notified with direct connect details."
          : `Candidate updated to ${actionType.toUpperCase()}! Direct alert sent.`
      );
      setSelectedApplicantForAction(null);
      setFeedbackNote("");
      await fetchDashboardData();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      console.error("Failed to update status", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDirectMatch = async (app: any) => {
    try {
      await api.post(`/recruiter/applications/${app.id}/status`, {
        status: "matched",
        recruiterFeedback: "Congratulations! We loved your profile and skills and have initiated a direct Mutual Match."
      });
      setSuccessMsg(`🎉 Accepted & Mutual Match confirmed for ${app.candidateName}! Candidate notified.`);
      await fetchDashboardData();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      console.error("Failed to match candidate", err);
    }
  };

  const addSkill = () => {
    const s = skillInput.trim();
    if (s && !requiredSkills.includes(s)) {
      setRequiredSkills([...requiredSkills, s]);
      setSkillInput("");
    }
  };

  const removeSkill = (skill: string) => {
    setRequiredSkills(requiredSkills.filter((sk) => sk !== skill));
  };

  const COLORS = ["#4f46e5", "#06b6d4", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899"];

  const filteredApplicants = applicants.filter((app) => {
    const matchesSearch = 
      app.candidateName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.jobTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.skills.some((s: string) => s.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;
    if (statusFilter === "all") return app.status !== "rejected";
    return app.status === statusFilter;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6 font-sans">
      
      {/* Top Banner stats */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden border border-slate-800">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 font-extrabold text-[10px] uppercase tracking-wider rounded-lg flex items-center space-x-1.5">
                <Brain className="w-3.5 h-3.5 text-indigo-400" />
                <span>SwipeX Corporate Recruiter Workspace</span>
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {user?.profile?.companyName || "Enterprise Talent"}
              </span>
            </div>

            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Hiring Pipeline & Candidate Discovery
            </h1>
            <p className="text-slate-300 text-xs md:text-sm max-w-2xl leading-relaxed">
              Review applicant ATS match metrics, schedule technical video rounds, inspect talent credentials, and track candidate conversion funnels.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={fetchDashboardData}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh Pipeline</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Nav Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveTab("pipeline")}
            className={`px-4 py-2.5 rounded-xl font-extrabold text-xs transition-all flex items-center space-x-2 ${
              activeTab === "pipeline" 
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20" 
                : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200/80"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Applicant Review Pipeline</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] ${
              activeTab === "pipeline" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-700"
            }`}>
              {applicants.filter((a) => a.status !== "rejected").length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("analytics")}
            className={`px-4 py-2.5 rounded-xl font-extrabold text-xs transition-all flex items-center space-x-2 ${
              activeTab === "analytics" 
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20" 
                : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200/80"
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Hiring Trend Analytics</span>
          </button>

          <button
            onClick={() => setActiveTab("listings")}
            className={`px-4 py-2.5 rounded-xl font-extrabold text-xs transition-all flex items-center space-x-2 ${
              activeTab === "listings" 
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20" 
                : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200/80"
            }`}
          >
            <List className="w-4 h-4" />
            <span>Active Job Postings</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] ${
              activeTab === "listings" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-700"
            }`}>
              {jobs.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("post")}
            className={`px-4 py-2.5 rounded-xl font-extrabold text-xs transition-all flex items-center space-x-2 ${
              activeTab === "post" 
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20" 
                : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200/80"
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>Post New Role</span>
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-4 rounded-2xl flex items-center space-x-3 text-xs font-bold animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* TAB 1: APPLICANT REVIEW PIPELINE */}
      {activeTab === "pipeline" && (
        <div className="space-y-5">
          
          {/* Search & Status Filters */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              {[
                { id: "all", label: "Active Applicants" },
                { id: "applied", label: "Applied / In Review" },
                { id: "matched", label: "Mutual Matches" },
                { id: "interview_scheduled", label: "Interview Scheduled" },
                { id: "selected", label: "Offers Extended" },
                { id: "rejected", label: "Concluded / Passed" }
              ].map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setStatusFilter(filter.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    statusFilter === filter.id
                      ? "bg-slate-900 text-white shadow-xs"
                      : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            <div className="relative min-w-[260px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search candidate by name, job, or skill..."
                className="w-full pl-9.5 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:border-indigo-600 outline-none text-xs text-slate-800 transition-all"
              />
            </div>
          </div>

          {/* Candidate Pipeline Cards */}
          {filteredApplicants.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center space-y-3">
              <Users className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-900">No applicants in this stage</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                As seekers swipe right on your active job postings, their profiles and match vectors will appear here automatically.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredApplicants.map((app) => (
                <div 
                  key={app.id}
                  className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:border-indigo-200 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-5"
                >
                  {/* Candidate Profile Details */}
                  <div className="space-y-3 flex-1">
                    <div className="flex items-start space-x-3.5">
                      <UserAvatar
                        name={app.candidateName}
                        email={app.candidateEmail}
                        avatarUrl={app.candidateAvatar}
                        className="w-12 h-12 rounded-xl text-base shadow-sm shrink-0"
                        textSize="text-base"
                      />
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-black text-slate-900">{app.candidateName}</h3>
                          <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-700 text-[11px] font-bold rounded-lg">
                            {app.candidateTitle}
                          </span>
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-extrabold text-[10px] uppercase rounded">
                            Role: {app.jobTitle}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {app.candidateEmail} • Applied: <strong className="text-slate-700 font-mono">{new Date(app.appliedAt).toLocaleDateString()}</strong>
                        </p>
                      </div>
                    </div>

                    {app.candidateBio && (
                      <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 line-clamp-2">
                        {app.candidateBio}
                      </p>
                    )}

                    {/* Skill Keywords */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">Matching:</span>
                      {app.matchingKeywords.map((kw: string, i: number) => (
                        <span key={i} className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200/60 text-[10px] font-bold rounded">
                          ✓ {kw}
                        </span>
                      ))}

                      {app.missingKeywords.length > 0 && (
                        <>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-2 mr-1">Missing:</span>
                          {app.missingKeywords.slice(0, 3).map((kw: string, i: number) => (
                            <span key={i} className="px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200/60 text-[10px] font-bold rounded">
                              ! {kw}
                            </span>
                          ))}
                        </>
                      )}
                    </div>

                    {/* Interview Alert if scheduled */}
                    {app.interviewDate && (
                      <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl text-xs text-emerald-900 font-medium flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Interview confirmed for <strong>{new Date(app.interviewDate).toLocaleDateString()}</strong> ({app.interviewType || "Video Round"})</span>
                      </div>
                    )}

                    {/* Recruiter feedback if present */}
                    {app.recruiterFeedback && (
                      <div className="text-xs text-slate-500 italic">
                        Your Note: "{app.recruiterFeedback}"
                      </div>
                    )}
                  </div>

                  {/* Right Score & Actions */}
                  <div className="flex flex-col sm:flex-row lg:flex-col items-end justify-between gap-3 shrink-0 border-t lg:border-t-0 lg:border-l border-slate-100 pt-3 lg:pt-0 lg:pl-5">
                    <div className="text-right w-full">
                      <div className="text-2xl font-black text-indigo-600 font-mono">
                        {app.matchScore}%
                      </div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        ATS Match Score
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 w-full justify-end">
                      {app.status === "matched" ? (
                        <span className="px-3 py-1.5 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-black rounded-xl flex items-center space-x-1">
                          <Heart className="w-3.5 h-3.5 fill-emerald-600 text-emerald-600" />
                          <span>Mutual Match Active</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleDirectMatch(app)}
                          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl shadow-md transition-all flex items-center space-x-1.5 cursor-pointer"
                          title="Accept applicant profile and trigger Mutual Match notification"
                        >
                          <Heart className="w-3.5 h-3.5 fill-white" />
                          <span>Accept & Mutual Match</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedApplicantForAction(app);
                          setActionType("interview");
                        }}
                        className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl transition-all flex items-center space-x-1 cursor-pointer"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Schedule Interview</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedApplicantForAction(app);
                          setActionType("select");
                        }}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
                      >
                        Extend Offer
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: HIRING TREND ANALYTICS */}
      {activeTab === "analytics" && (
        <div className="space-y-6">
          
          {/* Top Metrics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Total Active Postings</span>
              <div className="text-3xl font-black text-slate-900 font-mono mt-1">{analytics?.totalJobs || jobs.length}</div>
              <span className="text-[11px] text-emerald-600 font-bold mt-1 block">Live on Swipe Decks</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Candidate Applications</span>
              <div className="text-3xl font-black text-indigo-600 font-mono mt-1">{analytics?.totalApplicants || applicants.length}</div>
              <span className="text-[11px] text-slate-500 font-bold mt-1 block">Formal Submissions</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Mutual Matches</span>
              <div className="text-3xl font-black text-emerald-600 font-mono mt-1">{analytics?.totalMatches || matches.length}</div>
              <span className="text-[11px] text-emerald-700 font-bold mt-1 block">Direct Messaging Active</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Interviews Scheduled</span>
              <div className="text-3xl font-black text-purple-600 font-mono mt-1">
                {applicants.filter((a) => a.status === "interview_scheduled" || a.status === "selected").length}
              </div>
              <span className="text-[11px] text-purple-700 font-bold mt-1 block">Active Rounds</span>
            </div>
          </div>

          {/* Hiring Funnel & Monthly Timeline Charts */}
          <div className="grid md:grid-cols-2 gap-6">
            
            {/* Conversion Funnel Bar Chart */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 text-indigo-600" />
                  <span>Applicant Conversion Funnel</span>
                </h3>
                <span className="text-xs font-mono font-bold text-slate-400">Step Progression</span>
              </div>

              <div className="w-full">
                <HorizontalFunnelChart data={analytics?.funnelMetrics || []} height={200} />
              </div>
            </div>

            {/* Monthly Trend Area Chart */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-emerald-600" />
                  <span>Monthly Application & Interview Velocity</span>
                </h3>
                <span className="text-xs font-mono font-bold text-slate-400">6-Month Trend</span>
              </div>

              <div className="w-full">
                <SimpleAreaTrendChart data={analytics?.hiringTrendTimeline || []} height={200} />
              </div>
            </div>

          </div>

          {/* Skill Demand Distribution & Match Score Clusters */}
          <div className="grid md:grid-cols-2 gap-6">
            
            {/* High Demand Skills in Postings */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                  Top Skills Requested in Job Cards
                </h3>
                <span className="text-xs font-bold text-slate-400">Demand Heatmap</span>
              </div>

              <div className="w-full">
                <SimpleBarChart
                  data={analytics?.skillDemandDistribution || []}
                  xKey="skill"
                  bars={[{ key: "avgMatchScore", name: "Avg Match (%)", color: "#06b6d4" }]}
                  height={190}
                />
              </div>
            </div>

            {/* Candidate Match Score Range Distribution */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                  Applicant Match Score Density
                </h3>
                <span className="text-xs font-bold text-slate-400">ATS Vectors</span>
              </div>

              <div className="w-full flex items-center justify-center">
                <SimpleDonutChart
                  data={analytics?.matchScoreDistribution || []}
                  colors={COLORS}
                  height={190}
                />
              </div>
            </div>

          </div>

        </div>
      )}

      {/* TAB 3: ACTIVE JOB LISTINGS */}
      {activeTab === "listings" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-500">
              Your published jobs currently active in seeker swipe decks.
            </p>
            <button
              onClick={() => setActiveTab("post")}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center space-x-1.5"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Create New Role</span>
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {jobs.map((job) => (
              <div key={job.id} className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all relative overflow-hidden">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-black text-slate-900 text-base">{job.title}</h4>
                    <p className="text-xs text-slate-500">{job.companyName} • {job.location}</p>
                  </div>
                  <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 font-mono font-bold text-[10px] rounded-lg">
                    {job.applicantCount || 0} Applicants
                  </span>
                </div>

                <p className="text-slate-600 text-xs my-3 line-clamp-3 leading-relaxed">
                  {job.description}
                </p>

                <div className="flex flex-wrap gap-1.5 mb-4">
                  {job.requiredSkills.map((sk, idx) => (
                    <span key={idx} className="px-2 py-0.5 bg-slate-50 text-slate-600 border border-slate-200 text-[10px] font-bold rounded-md">
                      {sk}
                    </span>
                  ))}
                </div>

                <div className="border-t border-slate-100 pt-3 flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-mono">Posted: {new Date(job.created_at).toLocaleDateString()}</span>
                  <span className="font-black text-indigo-700">{job.salaryRange}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: POST JOB FORM */}
      {activeTab === "post" && (
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200/80 shadow-xs max-w-3xl mx-auto space-y-6">
          <div>
            <h3 className="text-lg font-black text-slate-900">Publish New Career Opportunity</h3>
            <p className="text-xs text-slate-500 mt-1">
              This card will be ingested into the discovery deck and automatically ranked by candidate skill vectors.
            </p>
          </div>

          <form onSubmit={handlePostJob} className="space-y-5">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Job Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  placeholder="E.g., Senior Full-Stack Engineer"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-600 outline-none text-slate-800 text-xs transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Company / Organization Name
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  required
                  placeholder="E.g., Google"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-600 outline-none text-slate-800 text-xs transition-all"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Location & Work Mode
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  required
                  placeholder="E.g., Remote / San Francisco, CA"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-600 outline-none text-slate-800 text-xs transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Salary Range
                </label>
                <input
                  type="text"
                  value={salaryRange}
                  onChange={(e) => setSalaryRange(e.target.value)}
                  required
                  placeholder="E.g., $150,000 - $180,000"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-600 outline-none text-slate-800 text-xs transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Detailed Role Description
              </label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                placeholder="Detail core daily activities, tech stack features, scaling challenges, and corporate matching expectations."
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-600 outline-none text-slate-800 text-xs transition-all"
              />
            </div>

            {/* Skills tags */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Required Technical Keywords
              </label>
              <div className="flex space-x-2 mb-3">
                <input
                  type="text"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  placeholder="E.g., Python, Docker, PyTorch"
                  className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-600 outline-none text-slate-800 text-xs transition-all"
                />
                <button
                  type="button"
                  onClick={addSkill}
                  className="px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-all"
                >
                  Add Tag
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {requiredSkills.map((sk, idx) => (
                  <span key={idx} className="px-3 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold rounded-lg flex items-center space-x-1.5">
                    <span>{sk}</span>
                    <button type="button" onClick={() => removeSkill(sk)} className="text-indigo-400 hover:text-indigo-600 font-extrabold text-sm">×</button>
                  </span>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl text-xs uppercase tracking-wider transition-all shadow-md"
            >
              Publish Active Job Listing
            </button>
          </form>
        </div>
      )}

      {/* RECRUITER STATUS ACTION MODAL */}
      {selectedApplicantForAction && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-slate-100 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-extrabold text-indigo-600 uppercase tracking-wider">Candidate Pipeline Action</span>
                <h3 className="text-lg font-black text-slate-900">
                  {selectedApplicantForAction.candidateName}
                </h3>
                <p className="text-xs text-slate-500">
                  Applied for: {selectedApplicantForAction.jobTitle}
                </p>
              </div>

              <button
                onClick={() => setSelectedApplicantForAction(null)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-900 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Action Type Selector */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Select Stage Update
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "match", label: "Accept & Mutual Match", desc: "Mutual match accepted! Candidate is alerted" },
                  { id: "interview", label: "Schedule Interview", desc: "Invite to Technical Round" },
                  { id: "select", label: "Extend Job Offer", desc: "Formal Offer extended" },
                  { id: "reject", label: "Conclude / Reject", desc: "Polite pass" }
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActionType(item.id as any)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      actionType === item.id 
                        ? "bg-indigo-50 border-indigo-600 text-indigo-900 shadow-2xs" 
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <span className="text-xs font-black block">{item.label}</span>
                    <span className="text-[10px] text-slate-500">{item.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Interview details if selected */}
            {actionType === "interview" && (
              <div className="bg-emerald-50/70 border border-emerald-200 p-4 rounded-2xl space-y-3">
                <span className="text-xs font-black text-emerald-900 uppercase tracking-wider flex items-center space-x-1.5">
                  <Calendar className="w-4 h-4 text-emerald-600" />
                  <span>Interview Scheduling Parameters</span>
                </span>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Target Date</label>
                    <input
                      type="date"
                      value={interviewDate}
                      onChange={(e) => setInterviewDate(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-emerald-200 rounded-xl text-xs outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Format / Round</label>
                    <select
                      value={interviewType}
                      onChange={(e) => setInterviewType(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-emerald-200 rounded-xl text-xs outline-none"
                    >
                      <option value="Technical Architecture Round">Technical Architecture</option>
                      <option value="Live Coding & Pair Programming">Live Coding Round</option>
                      <option value="Hiring Manager Discussion">Hiring Manager Chat</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Recruiter Feedback Note */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Recruiter Note / Feedback (Dispatched to candidate)
              </label>
              <textarea
                rows={2}
                value={feedbackNote}
                onChange={(e) => setFeedbackNote(e.target.value)}
                placeholder="E.g., Impressive PyTorch and React portfolio! Looking forward to diving into system scaling."
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-600 outline-none text-xs text-slate-800 transition-all resize-none"
              />
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => setSelectedApplicantForAction(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all"
              >
                Cancel
              </button>

              <button
                onClick={handleUpdateStatus}
                disabled={actionLoading}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center space-x-2"
              >
                {actionLoading ? (
                  <span>Saving...</span>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Confirm Stage Update</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
