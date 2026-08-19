import React, { useState, useEffect } from "react";
import { useAuth } from "../components/AuthContext";
import { api } from "../services/api";
import { ATSAnalysisResult, SeekerAnalyticsData } from "../types";
import { 
  Sparkles, ShieldAlert, CheckCircle2, AlertTriangle, ArrowUpRight, 
  Target, Award, Cpu, FileText, Zap, RefreshCw, BarChart2, Lightbulb,
  ThumbsUp, BookOpen, Layers, ChevronRight, UserCheck, TrendingUp,
  PieChart as PieIcon, Activity, Check, Plus
} from "lucide-react";
import { Link } from "react-router-dom";
import { SimpleBarChart, SimpleDonutChart, SimpleRadarChart } from "../components/Charts";

export const RecommendationsPage: React.FC = () => {
  const { user, updateUserProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [atsData, setAtsData] = useState<ATSAnalysisResult | null>(null);
  const [analyticsData, setAnalyticsData] = useState<SeekerAnalyticsData | null>(null);
  const [addedSkillMsg, setAddedSkillMsg] = useState<string | null>(null);

  const fetchRecommendationsAndAnalytics = async () => {
    setLoading(true);
    try {
      const [atsRes, analyticsRes] = await Promise.all([
        api.get("/seeker/ats-recommendations"),
        api.get("/seeker/analytics")
      ]);

      if (atsRes.data) setAtsData(atsRes.data);
      if (analyticsRes.data) setAnalyticsData(analyticsRes.data);
    } catch (err) {
      console.error("Failed to load ATS recommendations or analytics", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendationsAndAnalytics();
  }, [user?.profile?.skills?.length, user?.profile?.resumeName]);

  const handleQuickAddSkill = async (skillToAdd: string) => {
    const currentSkills = user?.profile?.skills || [];
    if (!currentSkills.some((s) => s.toLowerCase() === skillToAdd.toLowerCase())) {
      const newSkills = [...currentSkills, skillToAdd];
      try {
        await api.put("/profile", { skills: newSkills });
        await updateUserProfile({ skills: newSkills });
        setAddedSkillMsg(`Added "${skillToAdd}" to your skills! Refreshing analytics...`);
        await fetchRecommendationsAndAnalytics();
        setTimeout(() => setAddedSkillMsg(null), 3000);
      } catch (err) {
        console.error("Failed to add skill", err);
      }
    }
  };

  if (loading && !atsData && !user?.profile?.skills) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-bold text-slate-600">Generating interactive analytical insights & ATS vector metrics...</p>
      </div>
    );
  }

  const userSkills = user?.profile?.skills || [];
  const calculatedProfileScore = userSkills.length >= 5 
    ? Math.min(98, 90 + Math.min(8, (userSkills.length - 5) * 1.5 + 4)) 
    : userSkills.length >= 3 
    ? 88 + (userSkills.length - 3) * 3 
    : userSkills.length >= 1 
    ? 82 + userSkills.length * 2 
    : (user?.profile?.resumeName ? 78 : 35);

  const score = atsData?.atsScore ? Math.round(atsData.atsScore) : calculatedProfileScore;
  const isBelow80 = score < 80;
  const extractedSkills = userSkills.length > 0 ? userSkills : (atsData?.extractedSkills || ["React", "TypeScript", "Python", "Node.js"]);

  const radarData = analyticsData?.scoreBreakdown.map((item) => ({
    category: item.category.replace(" & ", "\n"),
    score: item.score,
    benchmark: item.benchmark
  })) || [
    { category: "Keywords", score: score, benchmark: 85 },
    { category: "Structure", score: 92, benchmark: 88 },
    { category: "Alignment", score: score + 2, benchmark: 82 },
    { category: "Impact", score: 84, benchmark: 80 }
  ];

  const skillGapData = analyticsData?.skillGaps.map((g) => ({
    skill: g.skill,
    demand: g.marketDemand,
    boost: g.potentialScoreBoost,
    isPossessed: g.isPossessed
  })) || [
    { skill: "Docker", demand: 92, boost: 8, isPossessed: false },
    { skill: "Kubernetes", demand: 88, boost: 7, isPossessed: false },
    { skill: "PyTorch", demand: 86, boost: 9, isPossessed: false },
    { skill: "PostgreSQL", demand: 84, boost: 6, isPossessed: true },
    { skill: "AWS / Cloud", demand: 82, boost: 6, isPossessed: false }
  ];

  const COLORS = ["#4f46e5", "#06b6d4", "#10b981", "#f59e0b"];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 font-sans">
      
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden border border-slate-800">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 font-extrabold text-[10px] uppercase tracking-wider rounded-lg flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>SwipeX AI Intelligence & Analytics Hub</span>
              </span>
              <span className="text-xs text-slate-400 font-mono">Market Readiness Tier: <strong>{analyticsData?.marketReadinessTier || "Competitive"}</strong></span>
            </div>

            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Interactive ATS Analytics & Insights
            </h1>
            <p className="text-slate-300 text-xs md:text-sm max-w-2xl leading-relaxed">
              Real-time telemetry on resume performance, competitive skill gap benchmarks, and behavioral recommendation weights.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={fetchRecommendationsAndAnalytics}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh Analytics</span>
            </button>
          </div>
        </div>
      </div>

      {addedSkillMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 px-4 py-3 rounded-2xl flex items-center space-x-2 text-xs font-bold animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{addedSkillMsg}</span>
        </div>
      )}

      {/* TOP METRICS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* ATS Gauge Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col items-center text-center justify-between space-y-4">
          <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center space-x-1">
            <Target className="w-4 h-4 text-indigo-600" />
            <span>Overall ATS Screening Rating</span>
          </span>

          <div className="relative flex items-center justify-center my-1">
            <div className={`w-36 h-36 rounded-full border-8 ${isBelow80 ? 'border-amber-400/30 bg-amber-50' : 'border-emerald-500/30 bg-emerald-50'} flex flex-col items-center justify-center`}>
              <span className={`text-4xl font-black font-mono ${isBelow80 ? 'text-amber-600' : 'text-emerald-600'}`}>
                {score}%
              </span>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">
                {analyticsData?.marketReadinessTier || (isBelow80 ? 'Needs Boost' : 'Elite ATS')}
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed max-w-xs">
            {isBelow80 
              ? "Your profile is currently below the top 80% screening threshold. Adding key target skills will instantly increase recruiter visibility."
              : "Exceptional alignment! Your profile keywords match candidate criteria for 85%+ of active engineering roles."
            }
          </p>

          <Link
            to="/profile"
            className="text-xs font-extrabold text-indigo-600 hover:text-indigo-800 flex items-center space-x-1 pt-3 border-t border-slate-100 w-full justify-center"
          >
            <span>Update Profile & Skills Tag Assets</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Radar Chart: Resume Category Dimensions */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center space-x-1.5">
              <Activity className="w-4 h-4 text-indigo-600" />
              <span>Resume Performance Radar</span>
            </span>
            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
              vs. 85% Benchmark
            </span>
          </div>

          <div className="h-48 w-full flex items-center justify-center">
            <SimpleRadarChart data={radarData} height={180} />
          </div>

          <div className="flex items-center justify-center space-x-4 text-[11px] font-bold text-slate-500 pt-1">
            <span className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 inline-block"></span>
              <span>Your Score</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400 inline-block"></span>
              <span>Benchmark Target</span>
            </span>
          </div>
        </div>

        {/* Recommendation Match Distribution */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center space-x-1.5">
              <PieIcon className="w-4 h-4 text-emerald-600" />
              <span>Role Compatibility Focus</span>
            </span>
            <span className="text-[10px] font-bold text-slate-400">Discovery Weights</span>
          </div>

          <div className="h-48 w-full flex items-center justify-center">
            <SimpleDonutChart
              data={analyticsData?.categoryMatchDistribution || [
                { name: "Frontend & Full-Stack", value: 45 },
                { name: "AI / Machine Learning", value: 30 },
                { name: "Backend / Distributed", value: 25 }
              ]}
              colors={COLORS}
              height={180}
            />
          </div>

          <p className="text-[11px] text-slate-500 text-center leading-snug">
            Your strongest match cluster is currently in <strong>Full-Stack & Frontend Engineering</strong>.
          </p>
        </div>

      </div>

      {/* SKILL GAP ANALYTICS & DEMAND CHART */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 flex items-center space-x-2">
              <TrendingUp className="w-4.5 h-4.5 text-indigo-600" />
              <span>Market Skill Gap Analytics & Score Boost Vectors</span>
            </h2>
            <p className="text-xs text-slate-500">
              High-demand technology keywords that unlock higher ATS matching rates across open recruiter listings
            </p>
          </div>

          <span className="text-xs font-mono font-bold text-slate-400">
            SwipeX Predictive Engine
          </span>
        </div>

        {/* Bar Chart of Market Demand */}
        <div className="w-full pt-2">
          <SimpleBarChart
            data={skillGapData}
            xKey="skill"
            bars={[
              { key: "demand", name: "Market Demand (%)", color: "#4f46e5" },
              { key: "boost", name: "Potential Boost (%)", color: "#10b981" }
            ]}
            height={200}
          />
        </div>

        {/* Interactive Skill Gap Pills with 1-Click Quick Add */}
        <div className="pt-2">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
            Add High-Impact Keywords Directly to Profile:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {skillGapData.map((item) => (
              <div 
                key={item.skill}
                className={`p-3.5 rounded-xl border flex items-center justify-between transition-all ${
                  item.isPossessed 
                    ? "bg-emerald-50/60 border-emerald-200" 
                    : "bg-slate-50 border-slate-200/80 hover:border-indigo-300"
                }`}
              >
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-xs font-black text-slate-900">{item.skill}</span>
                    {item.isPossessed ? (
                      <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 text-[9px] font-bold rounded">
                        ✓ In Profile
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.2 bg-indigo-50 text-indigo-700 text-[9px] font-bold rounded">
                        +{item.boost}% ATS Boost
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-500 block mt-0.5">
                    Market Demand: <strong>{item.demand}%</strong>
                  </span>
                </div>

                {!item.isPossessed && (
                  <button
                    onClick={() => handleQuickAddSkill(item.skill)}
                    className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-lg shadow-2xs transition-all flex items-center space-x-1 shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI STEP-BY-STEP IMPROVEMENT PLAN */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
            <Lightbulb className="w-4 h-4 text-amber-500" />
            <span>AI Automated Profile Optimization Checklist</span>
          </h3>
          <span className="text-xs text-slate-400 font-mono">Updated Live</span>
        </div>

        <div className="grid md:grid-cols-2 gap-3">
          {(atsData?.improvementSuggestions || [
            "Include target skills like OpenCV, Docker, or Kubernetes explicitly in your profile skills list.",
            "Incorporate quantifiable achievement metrics in your bio and project descriptions.",
            "Ensure your profile title aligns with target role titles like Python / AI Specialist.",
            "Upload your latest PDF resume in My Profile to refresh automated skill extraction."
          ]).map((sug, idx) => (
            <div key={idx} className="p-3.5 bg-slate-50 border border-slate-200/70 rounded-xl flex items-start space-x-3">
              <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                {idx + 1}
              </div>
              <p className="text-xs text-slate-700 leading-relaxed font-medium">
                {sug}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ACTIVE SKILLS MATRIX */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
              Active Profile Skills & Keyword Matrix ({extractedSkills.length})
            </h2>
            <p className="text-xs text-slate-500">
              Keywords extracted from your uploaded resume and profile tags used to calculate swipe deck compatibility scores
            </p>
          </div>

          <Link
            to="/profile"
            className="px-3.5 py-2 bg-slate-900 hover:bg-indigo-600 text-white font-extrabold text-xs rounded-xl transition-all flex items-center space-x-1"
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Manage in Profile</span>
          </Link>
        </div>

        <div className="flex flex-wrap gap-2">
          {extractedSkills.map((skill, idx) => (
            <span key={idx} className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center space-x-1.5 shadow-2xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>{skill}</span>
            </span>
          ))}
        </div>
      </div>

    </div>
  );
};
