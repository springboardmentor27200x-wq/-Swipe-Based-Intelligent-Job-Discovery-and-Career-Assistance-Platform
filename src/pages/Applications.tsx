import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import { ApplicationItem, ApplicationStatus } from "../types";
import { useAuth } from "../components/AuthContext";
import { 
  Briefcase, Send, Clock, CheckCircle2, AlertTriangle, ArrowRight, 
  Sparkles, FileText, Building, MapPin, RefreshCw, Filter, ExternalLink,
  ChevronRight, X, Heart, ShieldCheck, Calendar, Video, MessageSquare, 
  Trash2, Search, Check, ChevronDown, ChevronUp, Award
} from "lucide-react";
import { Link } from "react-router-dom";

export const ApplicationsPage: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<"all" | "pending" | "applied" | "interview" | "offers">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [pendingApps, setPendingApps] = useState<ApplicationItem[]>([]);
  const [appliedApps, setAppliedApps] = useState<ApplicationItem[]>([]);
  const [expandedAppId, setExpandedAppId] = useState<string | null>(null);
  
  // Apply Modal state
  const [selectedJobForApply, setSelectedJobForApply] = useState<ApplicationItem | null>(null);
  const [coverNote, setCoverNote] = useState("");
  const [applying, setApplying] = useState(false);
  const [applySuccessMessage, setApplySuccessMessage] = useState<string | null>(null);

  // Withdraw Modal state
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null);
  const [withdrawLoading, setWithdrawLoading] = useState(false);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const res = await api.get("/seeker/applications");
      if (res.data) {
        setPendingApps(res.data.pendingApplications || []);
        setAppliedApps(res.data.appliedApplications || []);
      }
    } catch (err) {
      console.error("Failed to load applications", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleConfirmApply = async () => {
    if (!selectedJobForApply) return;
    setApplying(true);
    try {
      await api.post("/seeker/apply", {
        jobId: selectedJobForApply.jobId,
        coverNote
      });

      setApplySuccessMessage(`Application for ${selectedJobForApply.jobTitle} at ${selectedJobForApply.companyName} submitted successfully!`);
      setSelectedJobForApply(null);
      setCoverNote("");
      
      await fetchApplications();
      setActiveFilter("applied");

      setTimeout(() => {
        setApplySuccessMessage(null);
      }, 5000);
    } catch (err) {
      console.error("Failed to submit application", err);
    } finally {
      setApplying(false);
    }
  };

  const handleWithdraw = async (applicationId: string) => {
    setWithdrawLoading(true);
    try {
      await api.post(`/seeker/applications/${applicationId}/withdraw`);
      setWithdrawingId(null);
      await fetchApplications();
      setApplySuccessMessage("Application withdrawn successfully.");
      setTimeout(() => setApplySuccessMessage(null), 4000);
    } catch (err) {
      console.error("Failed to withdraw application", err);
    } finally {
      setWithdrawLoading(false);
    }
  };

  // Combine and filter list
  const allApplications = [...pendingApps, ...appliedApps];

  const filteredApplications = allApplications.filter((app) => {
    const matchesSearch = 
      app.jobTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.matchingKeywords.some((k) => k.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (activeFilter === "pending") return app.status === "saved_pending" || app.status === "swiped_right";
    if (activeFilter === "applied") return app.status === "applied";
    if (activeFilter === "interview") return app.status === "interview_scheduled" || app.status === "matched";
    if (activeFilter === "offers") return app.status === "selected" || app.status === "rejected";
    return true;
  });

  const getStatusBadge = (status: ApplicationStatus) => {
    switch (status) {
      case "saved_pending":
        return {
          label: "Saved Pending",
          bg: "bg-amber-50 text-amber-800 border-amber-200",
          icon: <Clock className="w-3 h-3 text-amber-600" />
        };
      case "applied":
        return {
          label: "Submitted",
          bg: "bg-blue-50 text-blue-700 border-blue-200",
          icon: <Send className="w-3 h-3 text-blue-600" />
        };
      case "interview_scheduled":
        return {
          label: "Interview Scheduled",
          bg: "bg-emerald-50 text-emerald-800 border-emerald-300 font-black",
          icon: <Calendar className="w-3 h-3 text-emerald-600" />
        };
      case "selected":
        return {
          label: "Offer Extended 🎉",
          bg: "bg-emerald-600 text-white border-emerald-700 font-black shadow-xs",
          icon: <Award className="w-3 h-3 text-white" />
        };
      case "rejected":
        return {
          label: "Concluded",
          bg: "bg-slate-100 text-slate-600 border-slate-300",
          icon: <X className="w-3 h-3 text-slate-500" />
        };
      default:
        return {
          label: status,
          bg: "bg-slate-50 text-slate-700 border-slate-200",
          icon: <Clock className="w-3 h-3" />
        };
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-bold text-slate-600">Syncing application pipeline & lifecycle statuses...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6 font-sans">
      
      {/* Top Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden border border-slate-800">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="px-3 py-1 bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 font-extrabold text-[10px] uppercase tracking-wider rounded-lg flex items-center space-x-1.5">
                <Briefcase className="w-3.5 h-3.5 text-indigo-400" />
                <span>SwipeX Application Tracking Hub</span>
              </span>
              <span className="text-xs text-slate-400 font-mono">Real-Time Pipeline Sync</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Application Lifecycle Tracker
            </h1>
            <p className="text-slate-300 text-xs md:text-sm max-w-2xl leading-relaxed">
              Track recruitment stage progression, view recruiter feedback, manage interview schedules, and convert pending swipe bookmarks into formal submissions.
            </p>
          </div>

          <button
            onClick={fetchApplications}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center space-x-2 self-start md:self-auto shrink-0"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Sync Applications</span>
          </button>
        </div>
      </div>

      {/* Metrics Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block">Total Tracked</span>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-2xl font-black text-slate-900 font-mono">{allApplications.length}</span>
            <span className="text-xs text-slate-500 font-bold">roles</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-extrabold text-amber-600 uppercase tracking-wider block">Pending Saved</span>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-2xl font-black text-amber-600 font-mono">{pendingApps.length}</span>
            <span className="text-xs text-slate-500 font-bold">to apply</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-extrabold text-indigo-600 uppercase tracking-wider block">In Review</span>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-2xl font-black text-indigo-600 font-mono">
              {appliedApps.filter((a) => a.status === "applied").length}
            </span>
            <span className="text-xs text-slate-500 font-bold">recruiter active</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-extrabold text-emerald-600 uppercase tracking-wider block">Interviews & Offers</span>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-2xl font-black text-emerald-600 font-mono">
              {appliedApps.filter((a) => a.status === "interview_scheduled" || a.status === "selected" || a.status === "matched").length}
            </span>
            <span className="text-xs text-emerald-700 font-bold">advanced</span>
          </div>
        </div>
      </div>

      {/* Success Notification Alert */}
      {applySuccessMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-4 rounded-2xl flex items-center justify-between shadow-sm animate-fadeIn">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold">{applySuccessMessage}</p>
              <p className="text-[10px] text-emerald-700">Application pipeline updated in real time.</p>
            </div>
          </div>
          <button 
            onClick={() => setApplySuccessMessage(null)}
            className="text-emerald-500 hover:text-emerald-800 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Stage Filter Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: "all", label: "All Roles", count: allApplications.length },
            { id: "pending", label: "Saved Pending", count: pendingApps.length },
            { id: "applied", label: "Submitted", count: appliedApps.filter((a) => a.status === "applied").length },
            { id: "interview", label: "Interviews", count: appliedApps.filter((a) => a.status === "interview_scheduled" || a.status === "matched").length },
            { id: "offers", label: "Offers & Outcomes", count: appliedApps.filter((a) => a.status === "selected" || a.status === "rejected").length }
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id as any)}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center space-x-1.5 ${
                activeFilter === f.id
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/80"
              }`}
            >
              <span>{f.label}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeFilter === f.id ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
              }`}>
                {f.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search Box */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by role, company, or skill..."
            className="w-full pl-9.5 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:border-indigo-600 outline-none text-xs text-slate-800 transition-all shadow-2xs"
          />
        </div>
      </div>

      {/* Applications List */}
      {filteredApplications.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
            <Briefcase className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-base font-extrabold text-slate-900">No applications match your filter</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Explore open positions in the Swipe Deck to bookmark roles or submit applications.
            </p>
          </div>
          <Link
            to="/discovery"
            className="inline-flex items-center space-x-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-md transition-all"
          >
            <span>Launch Swipe Deck</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredApplications.map((appItem) => {
            const badge = getStatusBadge(appItem.status);
            const isExpanded = expandedAppId === appItem.id;
            const isPending = appItem.status === "saved_pending" || appItem.status === "swiped_right";

            return (
              <div 
                key={appItem.id}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:border-indigo-200 transition-all overflow-hidden"
              >
                <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Left Role Info */}
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-black text-slate-900">{appItem.jobTitle}</h3>
                      <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 font-extrabold text-[11px] rounded-lg">
                        {appItem.companyName}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-lg border text-[10px] font-black uppercase tracking-wider flex items-center space-x-1.5 ${badge.bg}`}>
                        {badge.icon}
                        <span>{badge.label}</span>
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center space-x-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{appItem.location}</span>
                      </span>
                      <span>•</span>
                      <span>Salary: <strong className="text-slate-700">{appItem.salaryRange}</strong></span>
                      <span>•</span>
                      <span>Activity: <strong className="text-slate-700 font-mono">{new Date(appItem.appliedAt || appItem.savedAt).toLocaleDateString()}</strong></span>
                    </div>

                    {/* Skill Match Badges */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">Matching:</span>
                      {appItem.matchingKeywords.map((kw, i) => (
                        <span key={i} className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200/60 text-[10px] font-bold rounded">
                          ✓ {kw}
                        </span>
                      ))}

                      {appItem.missingKeywords.length > 0 && (
                        <>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-2 mr-1">Missing:</span>
                          {appItem.missingKeywords.slice(0, 3).map((kw, i) => (
                            <span key={i} className="px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200/60 text-[10px] font-bold rounded">
                              ! {kw}
                            </span>
                          ))}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Right Action & Score Buttons */}
                  <div className="flex items-center space-x-3 shrink-0 border-t md:border-t-0 md:border-l border-slate-100 pt-3 md:pt-0 md:pl-5">
                    <div className="text-center md:text-right pr-2">
                      <div className="text-xl font-black text-indigo-600 font-mono">
                        {appItem.matchScore}%
                      </div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        ATS Match
                      </div>
                    </div>

                    {isPending ? (
                      <button
                        onClick={() => setSelectedJobForApply(appItem)}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-sm transition-all flex items-center space-x-1.5"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Apply Now</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => setExpandedAppId(isExpanded ? null : appItem.id)}
                        className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all flex items-center space-x-1"
                      >
                        <span>{isExpanded ? "Hide Details" : "Track Stage"}</span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                    )}

                    <button
                      onClick={() => setWithdrawingId(appItem.id)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                      title="Withdraw application"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* EXPANDABLE STAGE PROGRESSION & RECRUITER FEEDBACK ACCORDION */}
                {isExpanded && (
                  <div className="bg-slate-50/80 border-t border-slate-100 p-5 space-y-5 animate-in fade-in duration-200">
                    
                    {/* Stage Timeline Stepper */}
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 mb-3 flex items-center space-x-1.5">
                        <Clock className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Application Stage Stepper</span>
                      </h4>

                      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                        {(appItem.timeline || []).map((step, idx) => (
                          <div 
                            key={idx}
                            className={`p-3 rounded-xl border transition-all ${
                              step.completed 
                                ? "bg-white border-indigo-200 shadow-2xs" 
                                : "bg-slate-100/50 border-slate-200 opacity-60"
                            }`}
                          >
                            <div className="flex items-center space-x-2 mb-1">
                              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                step.completed ? "bg-indigo-600 text-white" : "bg-slate-200 text-slate-500"
                              }`}>
                                {idx + 1}
                              </div>
                              <span className={`text-xs font-extrabold ${step.completed ? "text-slate-900" : "text-slate-500"}`}>
                                {step.label}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 leading-snug">
                              {step.description}
                            </p>
                            {step.date && (
                              <span className="text-[10px] text-indigo-600 font-mono font-bold block mt-1.5">
                                {new Date(step.date).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Interview Date Alert (if scheduled) */}
                    {appItem.interviewDate && (
                      <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex items-start space-x-3 text-emerald-900">
                        <Calendar className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <h5 className="text-xs font-black">Interview Confirmation & Access</h5>
                          <p className="text-xs text-emerald-800 mt-0.5">
                            Scheduled Date: <strong>{new Date(appItem.interviewDate).toLocaleDateString()}</strong> • Format: <strong>{appItem.interviewType || "Technical Video Discussion"}</strong>
                          </p>
                          <p className="text-[11px] text-emerald-700 mt-1">
                            A direct video link has been dispatched to your verified email.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Recruiter Feedback Note */}
                    {appItem.recruiterFeedback && (
                      <div className="bg-white border border-slate-200 p-4 rounded-2xl space-y-1">
                        <div className="flex items-center space-x-1.5 text-xs font-black text-slate-800">
                          <MessageSquare className="w-4 h-4 text-indigo-600" />
                          <span>Recruiter Feedback & Notes</span>
                        </div>
                        <p className="text-xs text-slate-600 italic leading-relaxed">
                          "{appItem.recruiterFeedback}"
                        </p>
                      </div>
                    )}

                    {/* Cover Note */}
                    {appItem.coverNote && (
                      <div className="text-xs text-slate-500">
                        Your Submitted Note: <span className="text-slate-700 italic">"{appItem.coverNote}"</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 1-CLICK APPLY MODAL */}
      {selectedJobForApply && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-slate-100 animate-scaleUp">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-extrabold text-indigo-600 uppercase tracking-wider">Submit Formal Application</span>
                <h3 className="text-lg font-black text-slate-900">{selectedJobForApply.jobTitle}</h3>
                <p className="text-xs text-slate-500">{selectedJobForApply.companyName} • {selectedJobForApply.location}</p>
              </div>

              <button
                onClick={() => setSelectedJobForApply(null)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-900 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Resume Preview Box */}
            <div className="bg-indigo-50/60 border border-indigo-100 p-4 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center space-x-1">
                  <FileText className="w-4 h-4 text-indigo-600" />
                  <span>Applicant Profile Attached</span>
                </span>
                <span className="text-[10px] font-bold text-emerald-700 bg-white px-2 py-0.5 rounded border border-indigo-200">
                  Ready to Transmit
                </span>
              </div>
              <p className="text-xs text-slate-700 font-medium">
                Applicant: <strong className="text-slate-900">{user?.profile?.fullName || user?.email}</strong>
              </p>
              <p className="text-xs text-slate-600">
                Active Resume: <strong className="text-indigo-700 font-mono">{user?.profile?.resumeName || "Uploaded Resume"}</strong>
              </p>
            </div>

            {/* Optional Cover Note */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Note to Recruiter (Optional)
              </label>
              <textarea
                value={coverNote}
                onChange={(e) => setCoverNote(e.target.value)}
                placeholder="Hi! I am excited about this role because my background in Python and React aligns closely with your team's goals..."
                rows={3}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-600 outline-none text-xs text-slate-800 transition-all resize-none"
              />
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => setSelectedJobForApply(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all"
              >
                Cancel
              </button>

              <button
                onClick={handleConfirmApply}
                disabled={applying}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center space-x-2"
              >
                {applying ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Submitting Application...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Confirm & Transmit Application</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* WITHDRAW CONFIRMATION MODAL */}
      {withdrawingId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-100 animate-scaleUp">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            
            <div className="text-center space-y-1">
              <h3 className="text-base font-black text-slate-900">Withdraw Application?</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                This will remove the application from both your dashboard and the recruiter's active candidate review queue.
              </p>
            </div>

            <div className="flex items-center justify-center space-x-3 pt-2">
              <button
                onClick={() => setWithdrawingId(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all"
              >
                Keep Application
              </button>

              <button
                onClick={() => handleWithdraw(withdrawingId)}
                disabled={withdrawLoading}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center space-x-1.5"
              >
                {withdrawLoading ? (
                  <span>Withdrawing...</span>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Confirm Withdrawal</span>
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
