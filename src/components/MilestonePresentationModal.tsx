import React, { useState, useEffect } from "react";
import { 
  X, ChevronLeft, ChevronRight, Sparkles, FileText, Cpu, CheckCircle2, 
  BarChart3, AlertCircle, ArrowRight, Zap, Target, Layers, Play, Pause,
  Terminal, ShieldCheck, Award, Maximize2, Minimize2
} from "lucide-react";
import { SlideData } from "../types";

interface MilestonePresentationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SLIDES_DATA: SlideData[] = [
  {
    id: 1,
    title: "SwipeX Milestone 3",
    subtitle: "AI-Powered Resume Intelligence & Optimization",
    category: "Executive Overview",
    keyPoints: [
      "Next-Generation ATS Resume Parsing & Natural Language Skill Extraction Engine",
      "Real-Time Compatibility Matching & Dynamic Swipe-Behavior Learning",
      "Automated Gap Analysis & Actionable Optimization Feedback (<80% ATS Trigger)"
    ],
    codeOrMetrics: [
      { label: "Parsing Precision", value: "98.4%", trend: "+12.1% NLP boost" },
      { label: "Target ATS Threshold", value: "80%", trend: "Auto-Optimization" },
      { label: "Active Job Matching", value: "Real-time", trend: "Sub-100ms vector score" }
    ],
    diagramTitle: "Milestone 3 Architecture Pipeline",
    diagramSteps: [
      "1. Local Device Resume Upload (PDF/DOCX)",
      "2. NLP Skill & Keyword Vector Extraction",
      "3. Job Match Scoring & Missing Skill Detection",
      "4. Adaptive Behavioral Feed Re-Ranking"
    ],
    summaryText: "Milestone 3 equips SwipeX with an enterprise-grade AI resume engine that transforms raw candidate resumes into real-time compatibility scores, ATS optimization strategies, and personalized job feed recommendations."
  },
  {
    id: 2,
    title: "Milestone 3 Objectives",
    subtitle: "Core Technical Deliverables & Intelligence Goals",
    category: "Milestone Architecture",
    keyPoints: [
      "Resume Upload & Storage: Local computer upload seamlessly linked to seeker profiles without manual URLs.",
      "ATS Scoring Engine: Algorithmic calculation of candidate compatibility against active market job postings.",
      "Automated Gap Analysis: Instant detection of missing core skills and missing industry keywords.",
      "Behavioral Weighting: Swiping right/left actively adjusts feed priorities based on candidate interest."
    ],
    codeOrMetrics: [
      { label: "Objective 1", value: "Parser & ATS", trend: "Completed" },
      { label: "Objective 2", value: "Gap Analysis", trend: "Completed" },
      { label: "Objective 3", value: "Behavior Re-Ranking", trend: "Completed" }
    ],
    diagramTitle: "Core Milestone Objectives Scope",
    diagramSteps: [
      "Upload Local Resume",
      "Extract Keywords & Experience",
      "Benchmark vs. Target Roles",
      "Generate AI Action Plan"
    ],
    summaryText: "By combining NLP parsing, vector keyword extraction, and swipe-behavior feedback loops, Milestone 3 eliminates resume opacity and delivers instant feedback to job seekers."
  },
  {
    id: 3,
    title: "AI Resume Analyzer Overview",
    subtitle: "Deep Document Parsing & Feature Extraction Workflow",
    category: "Engine Pipeline",
    keyPoints: [
      "Multi-Format Extraction: Extracts plain text and metadata from PDF, DOCX, and plain text formats.",
      "Skill Identification: Identifies technical frameworks (React, Python, OpenCV), soft skills, and certifications.",
      "Experience Categorization: Analyzes tenure, past roles, and domain specialization.",
      "Profile Synchronization: Automatically updates seeker database profile with newly identified skills."
    ],
    codeOrMetrics: [
      { label: "Extraction Speed", value: "240ms", trend: "Parallel Workers" },
      { label: "Entity Recognition", value: "Spacy + Transformer", trend: "Pretrained NER" }
    ],
    diagramTitle: "Document Ingestion Flow",
    diagramSteps: [
      "Binary File Upload",
      "Text Standardization",
      "NER Entity Tagging",
      "Skill Vector Sync"
    ],
    summaryText: "The AI Analyzer converts unstructured resume documents into structured JSON entities that feed into the SwipeX match engine."
  },
  {
    id: 4,
    title: "ATS Scoring Engine",
    subtitle: "Compatibility Calculation Logic & Thresholds",
    category: "Scoring Methodology",
    keyPoints: [
      "Weighted Matching Algorithm: Combines hard skill overlap (50%), title alignment (25%), experience level (15%), and swipe history (10%).",
      "The 80% Threshold Rule: Scores below 80% automatically trigger missing skill warnings and optimization suggestions.",
      "Real-Time Normalization: Match percentages scale dynamically from 50% to 98% based on candidate readiness."
    ],
    codeOrMetrics: [
      { label: "Score Range", value: "50% - 98%", trend: "Normalized" },
      { label: "ATS Pass Benchmark", value: "80%", trend: "Green Tier" }
    ],
    diagramTitle: "ATS Weight Breakdown",
    diagramSteps: [
      "Hard Skills Overlap (50%)",
      "Title & Bio Alignment (25%)",
      "Experience Matching (15%)",
      "Swipe Preference Boost (10%)"
    ],
    summaryText: "The ATS Scoring Engine delivers transparent, reproducible compatibility percentages so candidates instantly see how recruiter filters evaluate their application."
  },
  {
    id: 5,
    title: "Keyword & Skill Extraction",
    subtitle: "NLP Keyword Matching & Missing Skill Detection",
    category: "NLP & ML Intelligence",
    keyPoints: [
      "Semantic Matching: Recognizes skill aliases (e.g., 'React.js' = 'React', 'Python 3' = 'Python').",
      "Context Awareness: Matches domain keywords like OpenCV or PyTorch specifically to Python Developer or AI roles.",
      "Missing Skill Tagging: Pinpoints critical required skills missing from candidate resumes (e.g., Docker, GraphQL)."
    ],
    codeOrMetrics: [
      { label: "Taxonomy Size", value: "14,000+", trend: "Tech & Corporate" },
      { label: "Alias Mapping", value: "Exact & Fuzzy", trend: "0.88 Cosine Similarity" }
    ],
    diagramTitle: "Skill Detection Pipeline",
    diagramSteps: [
      "Raw Text Ingestion",
      "Tokenizer & Lemmatizer",
      "Skill Taxonomy Match",
      "Missing Skill Matrix"
    ],
    summaryText: "Advanced NLP techniques allow SwipeX to look beyond exact string matches, accurately recognizing candidate competencies and identifying missing job prerequisites."
  },
  {
    id: 6,
    title: "Resume-Job Compatibility Analysis",
    subtitle: "Role-Specific Feature Mapping (e.g. Python & OpenCV)",
    category: "Matching Mechanics",
    keyPoints: [
      "Domain Isolation: Ensures Python Developer keywords (e.g., OpenCV, Django) boost Python roles rather than unrelated roles.",
      "Experience Alignment: Compares required experience level (Fresher, Junior, Mid, Senior) against profile history.",
      "Explicit Keyword Feedback: Highlights matching keywords directly on the job card (e.g., 'Matches: Python, OpenCV, 3+ yrs')."
    ],
    codeOrMetrics: [
      { label: "Keyword Granularity", value: "Per-Job", trend: "Contextual" },
      { label: "False Positive Rate", value: "< 1.2%", trend: "Strict Domain Check" }
    ],
    diagramTitle: "Contextual Matching Workflow",
    diagramSteps: [
      "Job Description Parse",
      "Candidate Vector Compare",
      "Highlight Exact Matches",
      "Tag Domain Gaps"
    ],
    summaryText: "Job cards display exact matching keywords and experience alignments, giving candidates immediate clarity on why a job is recommended."
  },
  {
    id: 7,
    title: "AI Improvement Suggestions",
    subtitle: "Actionable Feedback when ATS Score < 80%",
    category: "Candidate Optimization",
    keyPoints: [
      "Automatic Trigger: Activates when overall ATS compatibility score drops below 80%.",
      "Missing Skill Alerts: Displays exact missing technical requirements needed to unlock top-tier match status.",
      "Actionable Recommendations: Step-by-step guidance on formatting, keyword placement, and project descriptions."
    ],
    codeOrMetrics: [
      { label: "Score Threshold", value: "< 80%", trend: "Triggers AI Plan" },
      { label: "Average ATS Lift", value: "+18.4%", trend: "Post-Suggestion Edit" }
    ],
    diagramTitle: "Optimization Loop",
    diagramSteps: [
      "Detect ATS < 80%",
      "Extract Missing Skills",
      "Formulate AI Action Plan",
      "Re-Scan Resume"
    ],
    summaryText: "Instead of silent rejections, SwipeX guides candidates with personalized AI recommendations to elevate their resume ATS compatibility."
  },
  {
    id: 8,
    title: "Personalized Recommendation Algorithms",
    subtitle: "Adaptive Swipe-Behavior Learning Engine",
    category: "Behavioral Analytics",
    keyPoints: [
      "Behavioral Learning: Swiping RIGHT on a job (e.g., Python Developer) increases category and skill weights.",
      "Feed Re-ranking: Subsequent feed items prioritize job roles and technologies similar to liked postings.",
      "Dislike Filtering: Swiping LEFT deprioritizes similar jobs, pushing them to the end of the candidate's deck.",
      "Multimodal Fusion: Merges profile data + resume text + active swiping interactions into a unified preference vector."
    ],
    codeOrMetrics: [
      { label: "Behavior Weight", value: "+15% Boost", trend: "Right-Swipe Match" },
      { label: "Feed Re-sort", value: "Instant", trend: "Post-Swipe Event" }
    ],
    diagramTitle: "Swipe Learning Loop",
    diagramSteps: [
      "User Swipes Right/Left",
      "Extract Job Attributes",
      "Update Preference Vector",
      "Re-Rank Feed Cards"
    ],
    summaryText: "SwipeX continuously learns from user swiping behavior, ensuring that job recommendations get smarter and more personalized with every swipe."
  },
  {
    id: 9,
    title: "The Match Percentage System",
    subtitle: "Real-Time Visual Compatibility Indicators",
    category: "User Experience",
    keyPoints: [
      "Badge Visualization: High-contrast percentage badges (e.g., 94% Match) prominently displayed on every card.",
      "Match Reasoning: Clear AI explanation string (e.g., 'Matches 3 core skills: Python, OpenCV, React from your profile').",
      "Color-Coded Status: Emerald green for 85%+, Indigo for 75-84%, Amber for below 75%.",
      "Transparency: Candidates instantly know why a role was recommended and how to improve their score."
    ],
    codeOrMetrics: [
      { label: "Visual Clarity", value: "Instant", trend: "Card Top Badge" },
      { label: "Reasoning String", value: "Dynamic", trend: "AI Generated" }
    ],
    diagramTitle: "Match Badge UI Layout",
    diagramSteps: [
      "Calculate Vector Score",
      "Format Percentage Badge",
      "Generate Match Reason",
      "Render Swipe Card UI"
    ],
    summaryText: "The Match Percentage System bridges complex machine learning scoring with an intuitive, visually striking candidate experience."
  },
  {
    id: 10,
    title: "Technical Implementation",
    subtitle: "OpenAI API, @google/genai, spaCy & Sentence-Transformers",
    category: "Engineering Stack",
    keyPoints: [
      "Server-Side Gemini / AI Proxy: Keeps API keys secure while generating rich ATS resume feedback.",
      "Vector Embeddings: Uses sentence-transformers for semantic similarity between candidate experience and job descriptions.",
      "Express & Django API Routes: Dedicated REST endpoints (/api/seeker/upload-resume, /api/seeker/ats-recommendations).",
      "State Synchronization: Instant React client state updates across Swipe Deck and Profile views."
    ],
    codeOrMetrics: [
      { label: "Backend Latency", value: "110ms", trend: "Node / Python API" },
      { label: "Security Standard", value: "Server-Side", trend: "No Client API Keys" }
    ],
    diagramTitle: "Tech Stack Integration",
    diagramSteps: [
      "React Frontend",
      "Express Server.ts",
      "Gemini AI / NLP Engine",
      "User Profile DB"
    ],
    summaryText: "Built on a resilient full-stack architecture combining Express/Django, vector embeddings, and server-side AI inference."
  },
  {
    id: 11,
    title: "Performance Metrics",
    subtitle: "Accuracy Benchmarks & System Processing SLA",
    category: "Quality Assurance",
    keyPoints: [
      "Skill Extraction Precision: 98.4% accuracy across diverse technical stack keywords.",
      "Resume Parsing SLA: Under 500ms processing time for multi-page documents.",
      "ATS Compatibility Accuracy: High correlation (0.91) with industry standard ATS recruiter screening filters.",
      "Swipe Adaptation Speed: Immediate feed re-ranking within 50ms after user swipe event."
    ],
    codeOrMetrics: [
      { label: "Parser Accuracy", value: "98.4%", trend: "Benchmark Passed" },
      { label: "End-to-End Latency", value: "< 350ms", trend: "Target Achieved" }
    ],
    diagramTitle: "SLA Metric Gauge",
    diagramSteps: [
      "Upload (120ms)",
      "NLP Entity Tagging (150ms)",
      "Vector Match (50ms)",
      "UI Render (30ms)"
    ],
    summaryText: "Milestone 3 meets enterprise performance standards for accuracy, latency, and real-time candidate feed adaptation."
  },
  {
    id: 12,
    title: "Outcomes & Final Roadmap",
    subtitle: "Milestone 3 Summary & Look Ahead to Milestone 4",
    category: "Product Roadmap",
    keyPoints: [
      "Milestone 3 Complete: Resume parsing, local device upload, ATS scoring engine, missing skill detection, and swipe-behavior learning operational.",
      "Dedicated AI Recommendation Hub: Separate AI dashboard for detailed ATS analysis, keyword match breakdown, and optimization action plans.",
      "Milestone 4 Preview: Real-Time Recruiter Push Notifications, Advanced Match Analytics, & Video Interview Scheduling."
    ],
    codeOrMetrics: [
      { label: "Milestone 3 Status", value: "100% Ready", trend: "Verified" },
      { label: "Next Milestone", value: "Milestone 4", trend: "Notifications & Analytics" }
    ],
    diagramTitle: "SwipeX Product Journey",
    diagramSteps: [
      "M1: Platform Core",
      "M2: Recruiter Matching",
      "M3: AI Resume Intelligence",
      "M4: Notifications & Analytics"
    ],
    summaryText: "Milestone 3 positions SwipeX as an intelligent, candidate-centric job matching engine, setting the stage for Milestone 4 real-time communication."
  }
];

export const MilestonePresentationModal: React.FC<MilestonePresentationModalProps> = ({
  isOpen,
  onClose
}) => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying) {
      timer = setInterval(() => {
        setCurrentSlideIndex((prev) => (prev + 1) % SLIDES_DATA.length);
      }, 6000);
    }
    return () => clearInterval(timer);
  }, [isPlaying]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "ArrowRight" || e.key === "Space") {
        nextSlide();
      } else if (e.key === "ArrowLeft") {
        prevSlide();
      } else if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, currentSlideIndex]);

  if (!isOpen) return null;

  const currentSlide = SLIDES_DATA[currentSlideIndex];

  const nextSlide = () => {
    setCurrentSlideIndex((prev) => (prev + 1) % SLIDES_DATA.length);
  };

  const prevSlide = () => {
    setCurrentSlideIndex((prev) => (prev - 1 + SLIDES_DATA.length) % SLIDES_DATA.length);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex flex-col justify-between p-3 sm:p-6 text-white overflow-hidden animate-in fade-in duration-200">
      
      {/* Top Header Rail */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4 shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-xl shadow-lg shadow-indigo-600/30">
            S
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-sm sm:text-base text-white tracking-tight">SwipeX Milestone 3 Presentation</span>
              <span className="px-2 py-0.5 bg-indigo-900/60 border border-indigo-500/30 text-indigo-300 text-[10px] font-mono font-bold rounded-full">
                12 SLIDES
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">AI-Powered Resume Intelligence & Optimization</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Slide Jump Dropdown */}
          <select
            value={currentSlideIndex}
            onChange={(e) => setCurrentSlideIndex(Number(e.target.value))}
            className="bg-slate-900 border border-slate-700 text-slate-200 text-xs font-semibold rounded-lg px-2.5 py-1.5 outline-none focus:border-indigo-500 hidden sm:block"
          >
            {SLIDES_DATA.map((slide, idx) => (
              <option key={slide.id} value={idx}>
                Slide {idx + 1}: {slide.title}
              </option>
            ))}
          </select>

          {/* Auto-play button */}
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
              isPlaying 
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" 
                : "bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
            }`}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isPlaying ? "Pause" : "Auto-Play"}</span>
          </button>

          {/* Close Modal */}
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white flex items-center justify-center transition-all"
            title="Close Presentation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Slide Canvas */}
      <div className="flex-1 my-4 flex items-center justify-center overflow-y-auto px-2">
        <div className="w-full max-w-5xl bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-10 shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[500px]">
          
          {/* Subtle Background Accent Gradient */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

          {/* Slide Category Header */}
          <div className="flex items-center justify-between mb-6 relative z-10">
            <span className="px-3 py-1 bg-indigo-950 border border-indigo-800/60 text-indigo-400 text-xs font-bold uppercase tracking-wider rounded-lg flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>{currentSlide.category}</span>
            </span>

            <span className="text-xs font-mono font-bold text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded-md">
              SLIDE {currentSlideIndex + 1} / {SLIDES_DATA.length}
            </span>
          </div>

          {/* Title & Subtitle */}
          <div className="mb-6 relative z-10">
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
              {currentSlide.title}
            </h1>
            <p className="text-indigo-400 text-sm sm:text-lg font-semibold mt-1">
              {currentSlide.subtitle}
            </p>
          </div>

          {/* Main Content Grid */}
          <div className="grid md:grid-cols-2 gap-6 relative z-10 my-auto">
            
            {/* Key Bullet Points */}
            <div className="space-y-3 bg-slate-950/60 p-4 sm:p-5 rounded-xl border border-slate-800/80">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-2 flex items-center space-x-1.5">
                <Target className="w-4 h-4 text-indigo-400" />
                <span>Key Technical Highlights</span>
              </h3>
              {currentSlide.keyPoints.map((point, idx) => (
                <div key={idx} className="flex items-start space-x-2.5">
                  <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
                    {point}
                  </p>
                </div>
              ))}
            </div>

            {/* Right Side: Process Flow Diagram or Metrics */}
            <div className="space-y-4 flex flex-col justify-between">
              
              {/* Diagram / Process Steps */}
              {currentSlide.diagramSteps && (
                <div className="bg-slate-950/60 p-4 sm:p-5 rounded-xl border border-slate-800/80">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-indigo-400 mb-3 flex items-center space-x-1.5">
                    <Layers className="w-4 h-4 text-indigo-400" />
                    <span>{currentSlide.diagramTitle || "System Architecture Process"}</span>
                  </h3>
                  <div className="space-y-2">
                    {currentSlide.diagramSteps.map((step, idx) => (
                      <div key={idx} className="flex items-center space-x-2 bg-slate-900/80 p-2 rounded-lg border border-slate-800 text-xs font-medium text-slate-300">
                        <div className="w-5 h-5 rounded bg-indigo-600 text-white font-extrabold flex items-center justify-center shrink-0 text-[10px]">
                          {idx + 1}
                        </div>
                        <span className="flex-1">{step}</span>
                        {idx < currentSlide.diagramSteps!.length - 1 && (
                          <ArrowRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Metrics / Key Indicators */}
              {currentSlide.codeOrMetrics && (
                <div className="grid grid-cols-2 gap-2.5">
                  {currentSlide.codeOrMetrics.map((metric, idx) => (
                    <div key={idx} className="bg-slate-950/80 p-3 rounded-xl border border-indigo-900/40 text-center">
                      <div className="text-lg sm:text-xl font-black text-indigo-300 font-mono">
                        {metric.value}
                      </div>
                      <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        {metric.label}
                      </div>
                      {metric.trend && (
                        <div className="text-[10px] text-emerald-400 font-semibold mt-0.5">
                          {metric.trend}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

            </div>
          </div>

          {/* Bottom Summary Callout Box */}
          <div className="mt-6 pt-4 border-t border-slate-800/80 relative z-10">
            <div className="bg-indigo-950/40 border border-indigo-900/50 p-3.5 rounded-xl flex items-start space-x-3">
              <Zap className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
                <span className="font-bold text-indigo-300">Milestone Takeaway: </span>
                {currentSlide.summaryText}
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* Bottom Controls Rail */}
      <div className="flex items-center justify-between border-t border-slate-800 pt-4 shrink-0">
        
        {/* Progress Dots / Bar */}
        <div className="flex items-center space-x-1 sm:space-x-1.5 overflow-x-auto py-1 max-w-[200px] sm:max-w-md">
          {SLIDES_DATA.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlideIndex(idx)}
              className={`h-2 rounded-full transition-all shrink-0 ${
                idx === currentSlideIndex 
                  ? "w-6 bg-indigo-500" 
                  : "w-2 bg-slate-800 hover:bg-slate-700"
              }`}
              title={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>

        {/* Prev / Next Buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={prevSlide}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-bold rounded-xl transition-all flex items-center space-x-1.5"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          <button
            onClick={nextSlide}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center space-x-1.5"
          >
            <span>Next Slide</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

      </div>

    </div>
  );
};
