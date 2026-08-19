import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";
import { Job, Match, SwipeResponse } from "../types";
import { useAuth } from "../components/AuthContext";
import { motion, AnimatePresence, useMotionValue, useTransform } from "motion/react";
import { 
  X, Heart, MapPin, DollarSign, Brain, Sparkles, FolderUp, 
  CheckCircle, Flame, ArrowRight, Star, Search, SlidersHorizontal, 
  RotateCcw, Clock, Users, Shield, Briefcase, GraduationCap 
} from "lucide-react";

export const Discovery: React.FC = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Real-time Swiping State
  const [dragDirection, setDragDirection] = useState<"left" | "right" | null>(null);
  
  // Match Success Overlay state
  const [matchDetails, setMatchDetails] = useState<any | null>(null);
  
  // Right Swipe Choice Modal state (Apply Now vs Save Pending)
  const [swipeRightChoiceJob, setSwipeRightChoiceJob] = useState<Job | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Resume Upload Simulation state
  const [uploadingResume, setUploadingResume] = useState(false);
  const [resumeName, setResumeName] = useState("alex_rivera_resume.pdf");
  const [dragOver, setDragOver] = useState(false);

  // Smart and Advanced Filters state (Task 1 & Task 4)
  const [search, setSearch] = useState("");
  const [orgType, setOrgType] = useState("");
  const [jobType, setJobType] = useState("");
  const [expLevel, setExpLevel] = useState("");
  const [isFresher, setIsFresher] = useState(false);
  const [lowCompetition, setLowCompetition] = useState(false);
  const [locationFilter, setLocationFilter] = useState("");
  const [salaryMin, setSalaryMin] = useState<number>(0);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Framer Motion values for interactive swiping physics
  const motionX = useMotionValue(0);
  const motionY = useMotionValue(0);
  const rotateValue = useTransform(motionX, [-200, 200], [-25, 25]);
  const applyOpacity = useTransform(motionX, [0, 150], [0, 1]);
  const skipOpacity = useTransform(motionX, [-150, 0], [1, 0]);

  // Fetch data on mount and whenever filters change (Real-time Filtering!)
  useEffect(() => {
    fetchDiscoveryData();
  }, [search, orgType, jobType, expLevel, isFresher, lowCompetition, locationFilter, salaryMin]);

  const fetchDiscoveryData = async (overrideParams?: any) => {
    try {
      setLoading(true);
      const params: any = overrideParams !== undefined ? overrideParams : {};
      if (overrideParams === undefined) {
        if (search) params.search = search;
        if (orgType) params.organizationType = orgType;
        if (jobType) params.jobType = jobType;
        if (expLevel) params.experienceLevel = expLevel;
        if (isFresher) params.isFresherFriendly = "true";
        if (lowCompetition) params.lowCompetition = "true";
        if (locationFilter) params.location = locationFilter;
        if (salaryMin > 0) params.salaryMin = salaryMin;
      }

      const [jobsRes, matchesRes] = await Promise.allSettled([
        api.get<Job[]>("/jobs", { params }),
        api.get<Match[]>("/matches")
      ]);
      
      if (jobsRes.status === "fulfilled" && Array.isArray(jobsRes.value.data)) {
        setJobs(jobsRes.value.data);
      }
      if (matchesRes.status === "fulfilled" && Array.isArray(matchesRes.value.data)) {
        setMatches(matchesRes.value.data);
      }
      setCurrentIndex(0);
    } catch (err) {
      console.error("Failed to load discovery information", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSwipe = async (direction: "left" | "right") => {
    if (jobs.length === 0 || currentIndex >= jobs.length) return;

    const currentJob = jobs[currentIndex];

    if (direction === "right") {
      motionX.set(0);
      motionY.set(0);
      setDragDirection(null);
      setSwipeRightChoiceJob(currentJob);
      return;
    }

    // Left swipe (pass / skip)
    setDragDirection("left");
    motionX.set(-350);

    try {
      await api.post("/seeker/swipe", {
        jobId: currentJob.id,
        direction: "left",
      });
      setActionMessage(`Passed on ${currentJob.title}`);
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err) {
      console.error("Failed to record left swipe", err);
    } finally {
      setCurrentIndex((prev) => prev + 1);
      setDragDirection(null);
      motionX.set(0);
      motionY.set(0);
    }
  };

  const executeSwipeWithAction = async (applyAction: "apply_now" | "save_pending") => {
    if (!swipeRightChoiceJob) return;

    const currentJob = swipeRightChoiceJob;
    setSwipeRightChoiceJob(null);
    setDragDirection("right");
    motionX.set(350);

    try {
      const res = await api.post<SwipeResponse>("/seeker/swipe", {
        jobId: currentJob.id,
        direction: "right",
        applyAction
      });

      if (applyAction === "apply_now") {
        setActionMessage(`Application submitted for ${currentJob.title} at ${currentJob.companyName}!`);
      } else {
        setActionMessage(`Saved ${currentJob.title} to your "My Applications" pending list!`);
      }

      setTimeout(() => setActionMessage(null), 4000);

      if (res.data.matched && res.data.matchDetails) {
        setMatchDetails(res.data.matchDetails);
        const matchesRes = await api.get<Match[]>("/matches");
        setMatches(matchesRes.data);
      }
    } catch (err) {
      console.error("Failed to execute swipe with action", err);
    } finally {
      setCurrentIndex((prev) => prev + 1);
      setDragDirection(null);
      motionX.set(0);
      motionY.set(0);
    }
  };

  const resetAllFilters = () => {
    setSearch("");
    setOrgType("");
    setJobType("");
    setExpLevel("");
    setIsFresher(false);
    setLowCompetition(false);
    setLocationFilter("");
    setSalaryMin(0);
  };

  const handleResetDeck = async () => {
    try {
      setLoading(true);
      resetAllFilters();
      setCurrentIndex(0);
      await api.post("/seeker/reset-deck");
      await fetchDiscoveryData({});
      setActionMessage("Deck reset! All job listings cleared from swipe history and refreshed with your latest profile & recommendations.");
      setTimeout(() => setActionMessage(null), 4000);
    } catch (err) {
      console.error("Failed to reset deck", err);
    } finally {
      setLoading(false);
    }
  };

  // Humanize creation times (Freshness indicator)
  const getJobFreshness = (dateString: string) => {
    const createdDate = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - createdDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) {
      return `Posted ${diffMins} ${diffMins === 1 ? "minute" : "minutes"} ago`;
    } else if (diffHours < 24) {
      return `Posted ${diffHours} ${diffHours === 1 ? "hour" : "hours"} ago`;
    } else {
      return `Posted ${diffDays} ${diffDays === 1 ? "day" : "days"} ago`;
    }
  };

  // Simulating Drag and Drop Resume Upload
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      uploadFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      uploadFile(e.target.files[0]);
    }
  };

  const uploadFile = async (file: File) => {
    setUploadingResume(true);
    try {
      const extractedSkills = ["React", "TypeScript", "Node.js", "Python", "Tailwind CSS", "PostgreSQL", "Generative AI"];
      const resumeText = `Resume file ${file.name} for ${user?.profile?.fullName || 'Candidate'}. Experienced developer skilled in web applications, API backend, database systems, and AI integration.`;

      const res = await api.post("/seeker/upload-resume", {
        resumeName: file.name,
        resumeText: resumeText,
        extractedSkills: extractedSkills
      });

      if (res.data) {
        setResumeName(file.name);
        await fetchDiscoveryData();
      }
    } catch (err) {
      console.error("Failed to process resume upload", err);
    } finally {
      setUploadingResume(false);
    }
  };

  const currentJobCard = jobs[currentIndex];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      
      {/* Action Toast Notification */}
      {actionMessage && (
        <div className="mb-6 p-4 bg-emerald-600 text-white rounded-2xl shadow-lg flex items-center justify-between animate-fadeIn">
          <div className="flex items-center space-x-3">
            <CheckCircle className="w-5 h-5 text-emerald-200" />
            <span className="text-xs font-extrabold">{actionMessage}</span>
          </div>
          <button 
            onClick={() => setActionMessage(null)}
            className="text-white/80 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Upper Status Welcome Banner */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between bg-white p-6 rounded-2xl border border-slate-100 shadow-sm gap-4">
        <div>
          <span className="text-indigo-600 font-extrabold text-xs uppercase tracking-wider block mb-1">
            Elite Swipe-to-Hire Core Engine
          </span>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
            <span>Welcome, {user?.profile?.fullName || "Professional"}</span>
            <span className="text-xl">👋</span>
          </h2>
          <p className="text-slate-500 text-xs mt-0.5">
            Matching live candidate profiles to tier-1 companies. Swipe Right to Apply, Swipe Left to Skip!
          </p>
        </div>

        {/* Mini Stats Badges */}
        <div className="flex items-center space-x-3 shrink-0">
          <div className="bg-slate-50 rounded-xl px-4 py-2 border border-slate-100 flex items-center space-x-2.5">
            <Flame className="w-4 h-4 text-amber-500" />
            <div>
              <span className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider">Mutual Matches</span>
              <span className="text-xs font-bold text-slate-800">{matches.length} matches</span>
            </div>
          </div>

          <div className="bg-indigo-50/50 rounded-xl px-4 py-2 border border-indigo-100/50 flex items-center space-x-2.5">
            <Sparkles className="w-4 h-4 text-indigo-600 animate-pulse" />
            <div>
              <span className="block text-[9px] uppercase font-bold text-indigo-500 tracking-wider">Feed Count</span>
              <span className="text-xs font-bold text-indigo-900">
                {jobs.length - currentIndex > 0 ? `${jobs.length - currentIndex} jobs` : "Feed empty"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Task 4: Filter Drawer Trigger & Search bar */}
      <div className="mb-8 flex items-center space-x-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by job title, company name, or stack keywords..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-indigo-600 shadow-sm transition-all"
          />
          {search && (
            <button 
              onClick={() => setSearch("")} 
              className="text-slate-400 hover:text-slate-600 absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold"
            >
              Clear
            </button>
          )}
        </div>

        <button
          onClick={() => setIsDrawerOpen(true)}
          className={`px-4 py-2.5 rounded-xl border text-xs font-bold flex items-center space-x-2 transition-all cursor-pointer shadow-sm ${
            orgType || jobType || expLevel || isFresher || lowCompetition || locationFilter || salaryMin > 0
              ? "bg-indigo-600 border-indigo-600 text-white"
              : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span className="hidden sm:inline">Smart Filters</span>
          {(orgType || jobType || expLevel || isFresher || lowCompetition || locationFilter || salaryMin > 0) && (
            <span className="w-2 h-2 bg-rose-500 rounded-full"></span>
          )}
        </button>
      </div>

      {/* Main Workspace layout */}
      <div className="grid lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Swipe Deck (7 Cols) */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col items-center">
          
          <AnimatePresence mode="wait">
            {loading ? (
              <div key="loading" className="w-full max-w-md h-[510px] bg-white rounded-2xl border border-slate-100 shadow-md flex flex-col items-center justify-center p-6 text-center">
                <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-slate-500 text-xs font-medium font-mono">Assembling customized matching recommendations...</p>
              </div>
            ) : currentIndex >= jobs.length || !currentJobCard ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md bg-white rounded-2xl border border-slate-100 shadow-md p-8 text-center flex flex-col items-center justify-center h-[510px]"
              >
                <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-5">
                  <CheckCircle className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-extrabold text-slate-900 mb-2">Recommendation Deck Completed!</h3>
                <p className="text-slate-500 text-xs max-w-xs mx-auto mb-6 leading-relaxed">
                  You've swiped through all available jobs matching your filters. Try clearing some filters or searching for new technologies to keep swiping!
                </p>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={resetAllFilters}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all flex items-center justify-center space-x-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Clear Filters</span>
                  </button>

                  <button
                    onClick={handleResetDeck}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-all shadow-md"
                  >
                    Reset Deck
                  </button>
                </div>
              </motion.div>
            ) : (
              <div className="w-full max-w-md relative h-[510px]">
                {/* Underneath Card Stack Mock (visual depth effect) */}
                {currentIndex + 1 < jobs.length && (
                  <div className="absolute inset-x-4 top-4 -bottom-4 bg-white/70 rounded-2xl border border-slate-100 shadow-sm translate-y-2 scale-95 pointer-events-none z-0"></div>
                )}
                {currentIndex + 2 < jobs.length && (
                  <div className="absolute inset-x-8 top-8 -bottom-8 bg-white/40 rounded-2xl border border-slate-50 shadow-xs translate-y-4 scale-90 pointer-events-none z-[-1]"></div>
                )}

                {/* Primary Swipe Card */}
                <motion.div
                  key={currentJobCard.id}
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  style={{ x: motionX, y: motionY, rotate: rotateValue }}
                  onDrag={(e, info) => {
                    const offset = info.offset.x;
                    if (offset > 40) {
                      setDragDirection("right");
                    } else if (offset < -40) {
                      setDragDirection("left");
                    } else {
                      setDragDirection(null);
                    }
                  }}
                  onDragEnd={(e, info) => {
                    const threshold = 130;
                    if (info.offset.x > threshold) {
                      handleSwipe("right");
                    } else if (info.offset.x < -threshold) {
                      handleSwipe("left");
                    } else {
                      setDragDirection(null);
                    }
                  }}
                  animate={
                    dragDirection === "left" && motionX.get() < -150
                      ? { x: -450, opacity: 0 }
                      : dragDirection === "right" && motionX.get() > 150
                      ? { x: 450, opacity: 0 }
                      : { x: 0, y: 0, opacity: 1 }
                  }
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  className="w-full h-full bg-white rounded-2xl border border-slate-200/80 shadow-xl overflow-hidden relative cursor-grab active:cursor-grabbing flex flex-col justify-between z-10 select-none"
                >
                  {/* Decorative Banner */}
                  <div className="h-2.5 bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 shrink-0"></div>

                  {/* Swipe Overlays based on drag value */}
                  <motion.div 
                    style={{ opacity: applyOpacity }}
                    className="absolute inset-0 bg-emerald-500/90 backdrop-blur-xs flex flex-col items-center justify-center pointer-events-none z-20 text-white"
                  >
                    <Heart className="w-16 h-16 animate-bounce fill-white" />
                    <span className="text-xl font-black uppercase tracking-widest mt-2">Apply & Save!</span>
                  </motion.div>

                  <motion.div 
                    style={{ opacity: skipOpacity }}
                    className="absolute inset-0 bg-rose-500/90 backdrop-blur-xs flex flex-col items-center justify-center pointer-events-none z-20 text-white"
                  >
                    <X className="w-16 h-16 animate-pulse" />
                    <span className="text-xl font-black uppercase tracking-widest mt-2">Skip Offer</span>
                  </motion.div>

                  {/* Card Content body */}
                  <div className="p-6 flex-1 overflow-y-auto space-y-5">
                    
                    {/* AI Recommendation Highlight Box */}
                    {currentJobCard.matchScore && (
                      <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-indigo-50 p-3 rounded-xl border border-indigo-100/80 flex items-start space-x-3 shadow-xs">
                        <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-xs">
                          {currentJobCard.matchScore}%
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-1.5 text-indigo-700 font-extrabold text-[11px] uppercase tracking-wider">
                            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                            <span>AI Recommendation</span>
                          </div>
                          <p className="text-[11px] font-medium text-slate-700 mt-0.5 leading-snug">
                            {currentJobCard.aiRecommendationReason || `High ${currentJobCard.matchScore}% match based on your skills and resume.`}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Header Row: Logo, Title, and Org Type Tag */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1 pr-3">
                        <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                          <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[9px] font-bold rounded uppercase tracking-wider">
                            {currentJobCard.organizationType?.replace('_', ' ') || "Startup"}
                          </span>
                          <span className="px-2 py-0.5 bg-slate-50 border border-slate-200 text-slate-600 text-[9px] font-bold rounded uppercase">
                            {currentJobCard.jobType?.replace('_', ' ') || "Full Time"}
                          </span>
                        </div>
                        <h3 className="text-lg font-black text-slate-900 tracking-tight leading-snug">
                          {currentJobCard.title}
                        </h3>
                        <p className="text-xs font-bold text-slate-500 mt-0.5">
                          {currentJobCard.companyName}
                        </p>
                      </div>

                      <img
                        src={currentJobCard.companyLogo || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=150"}
                        alt={currentJobCard.companyName}
                        className="w-12 h-12 rounded-xl object-cover border border-slate-100 shadow-sm shrink-0 referrer-policy='no-referrer'"
                      />
                    </div>

                    {/* Metadata indicators (Task 3: freshness & competition) */}
                    <div className="grid grid-cols-2 gap-2.5 pt-1.5">
                      <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-100/70 flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-indigo-500 shrink-0" />
                        <div className="truncate">
                          <span className="block text-[8px] uppercase font-bold text-slate-400">Freshness</span>
                          <span className="text-[10px] font-bold text-slate-700 truncate block">
                            {getJobFreshness(currentJobCard.created_at)}
                          </span>
                        </div>
                      </div>

                      <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-100/70 flex items-center space-x-2">
                        <Users className="w-4 h-4 text-emerald-500 shrink-0" />
                        <div className="truncate">
                          <span className="block text-[8px] uppercase font-bold text-slate-400">Competition</span>
                          <span className="text-[10px] font-bold text-slate-700 truncate flex items-center space-x-1">
                            <span className="truncate">{currentJobCard.applicantCount} candidates</span>
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                              currentJobCard.competitionLevel === 'high' 
                                ? 'bg-rose-500' 
                                : currentJobCard.competitionLevel === 'medium' 
                                ? 'bg-amber-400' 
                                : 'bg-emerald-500'
                            }`} title={`Competition level: ${currentJobCard.competitionLevel}`}></span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Salary and Location row */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center space-x-2 text-slate-600">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-xs font-semibold truncate">{currentJobCard.location}</span>
                      </div>
                      <div className="flex items-center space-x-1.5 text-emerald-700">
                        <DollarSign className="w-3.5 h-3.5" />
                        <span className="text-xs font-bold truncate">{currentJobCard.salaryRange}</span>
                      </div>
                    </div>

                    {/* Job Details description text */}
                    <div className="border-t border-slate-100 pt-3">
                      <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Offer Description
                      </span>
                      <p className="text-slate-600 text-xs leading-relaxed line-clamp-4">
                        {currentJobCard.description}
                      </p>
                    </div>

                    {/* Skills requirements */}
                    <div>
                      <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center space-x-1">
                        <Brain className="w-3 h-3 text-indigo-500" />
                        <span>Preferred Stack</span>
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {currentJobCard.requiredSkills.map((skill, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-bold rounded uppercase tracking-wide border border-slate-200/50">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                  </div>

                  {/* Bottom Panel controls inside Card */}
                  <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 shrink-0 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                    <span className="flex items-center space-x-1">
                      <Shield className="w-3 h-3 text-slate-300" />
                      <span>Verified Client</span>
                    </span>
                    <span>Hold & drag left or right</span>
                  </div>

                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Core Interactive Swipe buttons */}
          {!loading && currentIndex < jobs.length && currentJobCard && (
            <div className="flex items-center justify-center space-x-6 mt-6">
              {/* Pass / Skip Button (✖) */}
              <button
                type="button"
                onClick={() => handleSwipe("left")}
                className="w-14 h-14 bg-white hover:bg-rose-50 text-rose-500 hover:text-rose-600 rounded-full border border-slate-200/80 shadow-md hover:shadow-lg flex items-center justify-center transition-all transform hover:scale-110 active:scale-95 group cursor-pointer"
                title="Pass / Skip this job listing"
              >
                <X className="w-6 h-6 group-hover:scale-115 transition-transform" />
              </button>

              {/* Like / Heart Button (❤) -> Opens Choice Modal (Save for Later or Apply Now) */}
              <button
                type="button"
                onClick={() => handleSwipe("right")}
                className="w-16 h-16 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg hover:shadow-xl flex items-center justify-center transition-all transform hover:scale-110 active:scale-95 group cursor-pointer relative overflow-hidden"
                title="Like this Opportunity (Choose Save for Later or Apply Now)"
              >
                <div className="absolute inset-0 bg-gradient-to-tr from-indigo-700 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <Heart className="w-7 h-7 relative z-10 group-hover:scale-115 transition-transform fill-white" />
              </button>
            </div>
          )}

          {/* Quick interactive note */}
          <div className="mt-5 text-center text-[11px] text-slate-500 font-medium">
            💡 Tap <strong>✖</strong> to pass or <strong>❤</strong> to choose <strong>Save for Later</strong> or <strong>Apply Now</strong>.
          </div>
        </div>

        {/* Right Column: Resume module + Active Matches drawer (5 Cols) */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-6">
          
          {/* AI ATS Intelligence & Recommendation Overview Card */}
          <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-6 rounded-2xl shadow-md border border-indigo-800/60 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex items-center justify-between mb-3">
              <span className="px-2.5 py-0.5 bg-indigo-500/30 border border-indigo-400/30 text-indigo-200 text-[10px] font-extrabold uppercase tracking-wider rounded-lg flex items-center space-x-1">
                <Sparkles className="w-3 h-3 text-indigo-300" />
                <span>AI Recommendation</span>
              </span>
              <span className="text-[10px] font-mono text-emerald-400 font-bold">ATS Active</span>
            </div>

            <h3 className="text-sm font-extrabold text-white tracking-tight mb-1">
              Resume Intelligence & ATS Readiness
            </h3>
            <p className="text-slate-300 text-[11px] mb-4 leading-relaxed">
              Upload your resume in <span className="text-indigo-300 font-bold">My Profile</span> to extract skills, view missing keyword analysis, and get AI suggestions.
            </p>

            <div className="space-y-2 pt-2 border-t border-indigo-800/60">
              <Link
                to="/profile"
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center space-x-1.5"
              >
                <FolderUp className="w-3.5 h-3.5" />
                <span>Upload Resume in Profile</span>
              </Link>

              <Link
                to="/recommendations"
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-indigo-200 font-bold text-xs rounded-xl transition-all border border-indigo-800/80 flex items-center justify-center space-x-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>View ATS Score & Suggestions</span>
              </Link>
            </div>
          </div>

          {/* Active Matches Sidebar list */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="text-xs font-bold text-slate-900 tracking-wider uppercase mb-1.5 flex items-center space-x-2">
              <Star className="w-4 h-4 text-indigo-600" />
              <span>Mutual Matches</span>
              {matches.length > 0 && (
                <span className="ml-1.5 px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[9px] font-bold rounded-full">
                  {matches.length}
                </span>
              )}
            </h3>
            <p className="text-slate-400 text-[11px] mb-4">
              When both you and the company's recruiter swipe right, a mutual match is born.
            </p>

            <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
              {matches.length === 0 ? (
                <div className="text-center py-6 bg-slate-50/50 border border-slate-100 rounded-xl">
                  <p className="text-[11px] font-bold text-slate-400">No mutual matches yet</p>
                  <p className="text-[9px] text-slate-400 mt-0.5 max-w-[200px] mx-auto">
                    Keep swiping! Mutual matches automatically trigger interview scheduling contacts.
                  </p>
                </div>
              ) : (
                matches.map((m) => (
                  <div key={m.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 hover:border-indigo-100 hover:bg-white transition-all flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-xs font-extrabold text-slate-800 line-clamp-1 pr-2">
                          {m.job?.title || "Engineering Role"}
                        </span>
                        <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 text-[8px] font-black rounded uppercase">
                          Match
                        </span>
                      </div>
                      <span className="text-[11px] font-bold text-indigo-600 block mb-1.5">
                        {m.job?.companyName || "Technology Partner"}
                      </span>
                      <div className="flex items-center space-x-1 text-[9px] text-slate-400 mb-2">
                        <MapPin className="w-3 h-3 shrink-0" />
                        <span className="truncate">{m.job?.location}</span>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => alert(`Connect directly with recruiter at: careers@${(m.job?.companyName || "recruiter").toLowerCase().replace(/\s+/g, '')}.com`)}
                      className="w-full py-1.5 bg-white hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200 hover:border-indigo-200 text-[10px] font-bold rounded-lg transition-all flex items-center justify-center space-x-1"
                    >
                      <span>Connect Recruiter</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>

      {/* Task 1 & 4 Filter Drawer Component overlay */}
      <AnimatePresence>
        {isDrawerOpen && (
          <div className="fixed inset-0 z-50 overflow-hidden">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs cursor-pointer"
            />

            {/* Content box */}
            <div className="absolute inset-y-0 right-0 max-w-full flex">
              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 30, stiffness: 300 }}
                className="w-screen max-w-md bg-white shadow-2xl flex flex-col"
              >
                {/* Header */}
                <div className="px-6 py-5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">Smart Filtering</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">Toggle filters to immediately refresh the Swipe deck</p>
                  </div>
                  <button
                    onClick={() => setIsDrawerOpen(false)}
                    className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-slate-600 transition-all cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Filters container */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  
                  {/* Organization Type filter */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                      Organization Type
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: "MNCs", val: "mnc" },
                        { label: "Startups", val: "startup" },
                        { label: "Newly Founded", val: "newly_founded" },
                      ].map((item) => (
                        <button
                          key={item.val}
                          onClick={() => setOrgType(orgType === item.val ? "" : item.val)}
                          className={`py-2 px-1 rounded-xl border text-[11px] font-semibold text-center transition-all cursor-pointer ${
                            orgType === item.val
                              ? "bg-indigo-50 border-indigo-500 text-indigo-700 font-extrabold"
                              : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Job Type filter */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                      Job Arrangement
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: "Remote", val: "remote" },
                        { label: "Internship", val: "internship" },
                        { label: "Full-time", val: "full_time" },
                      ].map((item) => (
                        <button
                          key={item.val}
                          onClick={() => setJobType(jobType === item.val ? "" : item.val)}
                          className={`py-2 px-1 rounded-xl border text-[11px] font-semibold text-center transition-all cursor-pointer ${
                            jobType === item.val
                              ? "bg-indigo-50 border-indigo-500 text-indigo-700 font-extrabold"
                              : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Experience Level filter */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                      Experience Level Requirements
                    </label>
                    <select
                      value={expLevel}
                      onChange={(e) => setExpLevel(e.target.value)}
                      className="w-full bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-indigo-600 cursor-pointer"
                    >
                      <option value="">Any Experience level</option>
                      <option value="fresher">Fresher (0 - 1 year)</option>
                      <option value="junior">Junior (1 - 3 years)</option>
                      <option value="mid">Mid-level (3 - 5 years)</option>
                      <option value="senior">Senior (5+ years)</option>
                    </select>
                  </div>

                  {/* Location field */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                      Geographic Location
                    </label>
                    <input
                      type="text"
                      value={locationFilter}
                      onChange={(e) => setLocationFilter(e.target.value)}
                      placeholder="E.g., Remote, Mountain View, New York..."
                      className="w-full bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-indigo-600"
                    />
                  </div>

                  {/* Minimum Salary Limit */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Minimum Salary Filter
                      </label>
                      <span className="text-xs font-black text-indigo-600 font-mono">
                        {salaryMin === 0 ? "Any amount" : `$${(salaryMin / 1000).toFixed(0)}k+`}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="200000"
                      step="10000"
                      value={salaryMin}
                      onChange={(e) => setSalaryMin(parseInt(e.target.value, 10))}
                      className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                  </div>

                  {/* Task 1 Advanced Filters Checklist */}
                  <div className="border-t border-slate-100 pt-5 space-y-4">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Task 1 Advanced Target Filters
                    </label>

                    {/* Fresher Friendly */}
                    <div className="flex items-start">
                      <input
                        type="checkbox"
                        id="fresher-friendly-checkbox"
                        checked={isFresher}
                        onChange={(e) => setIsFresher(e.target.checked)}
                        className="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500 mt-0.5 cursor-pointer"
                      />
                      <label htmlFor="fresher-friendly-checkbox" className="ml-2.5 text-xs text-slate-700 cursor-pointer">
                        <span className="font-extrabold block">Fresher-friendly opportunities</span>
                        <span className="text-[10px] text-slate-400 block">Highlights internships or jobs with entry-level experience requests.</span>
                      </label>
                    </div>

                    {/* Low Competition */}
                    <div className="flex items-start">
                      <input
                        type="checkbox"
                        id="low-competition-checkbox"
                        checked={lowCompetition}
                        onChange={(e) => setLowCompetition(e.target.checked)}
                        className="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500 mt-0.5 cursor-pointer"
                      />
                      <label htmlFor="low-competition-checkbox" className="ml-2.5 text-xs text-slate-700 cursor-pointer">
                        <span className="font-extrabold block">Low competition jobs</span>
                        <span className="text-[10px] text-slate-400 block">Displays listings with low applicant counts for rapid responses.</span>
                      </label>
                    </div>
                  </div>

                </div>

                {/* Footer Buttons */}
                <div className="p-6 border-t border-slate-100 bg-slate-50 flex items-center space-x-3">
                  <button
                    onClick={resetAllFilters}
                    className="flex-1 py-2.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs transition-all cursor-pointer text-center"
                  >
                    Clear Filters
                  </button>
                  <button
                    onClick={() => setIsDrawerOpen(false)}
                    className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-all cursor-pointer text-center shadow-md"
                  >
                    Close & Apply
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Swipe Right Choice Modal (Apply Now vs Save Pending) */}
      <AnimatePresence>
        {swipeRightChoiceJob && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg bg-white rounded-3xl overflow-hidden shadow-2xl relative border border-indigo-100 p-6 space-y-5"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                    <Heart className="w-4 h-4 fill-emerald-600" />
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold text-indigo-600 uppercase tracking-wider">Opportunity Liked</span>
                    <h3 className="text-base font-black text-slate-900">{swipeRightChoiceJob.title}</h3>
                  </div>
                </div>

                <button
                  onClick={() => setSwipeRightChoiceJob(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-900 flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-bold">{swipeRightChoiceJob.companyName} • {swipeRightChoiceJob.location}</span>
                  <span className="text-indigo-600 font-black font-mono">{swipeRightChoiceJob.matchScore || 85}% Match</span>
                </div>
                <p className="text-xs text-slate-600 line-clamp-2">
                  {swipeRightChoiceJob.description}
                </p>
                <p className="text-[10px] text-indigo-700 font-semibold bg-indigo-50/80 p-2 rounded-lg">
                  💡 {swipeRightChoiceJob.aiRecommendationReason || "Matches 4 core technical skills from your resume & profile"}
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-700 text-center">
                  How would you like to proceed with this role?
                </p>

                <div className="grid gap-2.5">
                  <button
                    onClick={() => executeSwipeWithAction("apply_now")}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center space-x-2"
                  >
                    <Briefcase className="w-4 h-4" />
                    <span>Apply Now Immediately (Submit Profile & Resume)</span>
                  </button>

                  <button
                    onClick={() => executeSwipeWithAction("save_pending")}
                    className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs rounded-2xl border border-slate-200 transition-all flex items-center justify-center space-x-2"
                  >
                    <Clock className="w-4 h-4 text-slate-600" />
                    <span>Save for Later (Pending Applications List)</span>
                  </button>

                  <button
                    onClick={() => setSwipeRightChoiceJob(null)}
                    className="w-full py-2 text-slate-400 hover:text-slate-600 font-bold text-xs transition-all text-center"
                  >
                    Cancel & Continue Swiping
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Dynamic Celebration match modal */}
      <AnimatePresence>
        {matchDetails && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-white rounded-2xl overflow-hidden shadow-2xl relative border border-indigo-100"
            >
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-8 text-center text-white relative">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mx-auto mb-3 animate-bounce">
                  <Flame className="w-8 h-8 text-amber-300 fill-amber-300" />
                </div>
                <h3 className="text-2xl font-black tracking-tight">It's a Match!</h3>
                <p className="text-indigo-100 text-xs mt-0.5">Mutual swipe interest validated by SwipeX AI</p>
              </div>

              <div className="p-6 text-center">
                <span className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1.5">
                  Opportunity Profile
                </span>
                <h4 className="text-lg font-extrabold text-slate-900">
                  {matchDetails.jobTitle}
                </h4>
                <p className="text-indigo-600 font-black text-xs mb-5">
                  {matchDetails.companyName}
                </p>

                <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-left mb-5">
                  <span className="block text-slate-400 text-[9px] font-bold uppercase tracking-wider mb-1">
                    Recruitment Coordinator Contact
                  </span>
                  <span className="text-slate-800 text-xs font-bold font-mono block">
                    {matchDetails.contactEmail}
                  </span>
                  <span className="text-slate-400 text-[9px] mt-1.5 block leading-normal">
                    You can email the coordinator directly to arrange your initial technical introduction call. Quote SwipeX Match Token #{Math.floor(Math.random() * 89999 + 10000)}.
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setMatchDetails(null)}
                    className="py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all cursor-pointer"
                  >
                    Keep Swiping
                  </button>

                  <button
                    onClick={() => {
                      setMatchDetails(null);
                      window.open(`mailto:${matchDetails.contactEmail}?subject=SwipeX AI Match Introduction - ${matchDetails.jobTitle}`);
                    }}
                    className="py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-all shadow-md cursor-pointer"
                  >
                    Send Email
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
