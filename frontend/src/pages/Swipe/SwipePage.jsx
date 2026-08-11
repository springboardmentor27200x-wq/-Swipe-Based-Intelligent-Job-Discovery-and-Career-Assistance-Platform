import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { 
  Check, X, Bookmark, Zap, MapPin, Building, Calendar, Users, AlertCircle, Sparkles, HelpCircle 
} from 'lucide-react';
import { fetchFeedJobs, incrementJobIndex } from '../../store/jobsSlice';
import swipeService from '../../services/swipeService';
import Button from '../../components/UI/Button.jsx';
import toast from 'react-hot-toast';

export default function SwipePage() {
  const dispatch = useDispatch();
  const { feedJobs, currentJobIndex, isFeedLoading } = useSelector(s => s.jobs);
  const { user } = useSelector(s => s.auth);
  
  const [swipeDirection, setSwipeDirection] = useState(null);
  const [savedJobs, setSavedJobs] = useState([]);

  // Drag physics using Framer Motion
  const dragX = useMotionValue(0);
  const rotate = useTransform(dragX, [-200, 200], [-15, 15]);
  const opacity = useTransform(dragX, [-200, -100, 0, 100, 200], [0.5, 0.8, 1, 0.8, 0.5]);
  
  // Swipe overlays
  const yesOpacity = useTransform(dragX, [0, 100], [0, 1]);
  const noOpacity = useTransform(dragX, [-100, 0], [1, 0]);

  useEffect(() => {
    dispatch(fetchFeedJobs());
  }, [dispatch]);

  // Keyboard Navigation listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (currentJobIndex >= feedJobs.length) return;
      if (e.key === 'ArrowRight') {
        handleSwipe('apply');
      } else if (e.key === 'ArrowLeft') {
        handleSwipe('skip');
      } else if (e.key === 'ArrowDown') {
        handleSwipe('save');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentJobIndex, feedJobs]);

  const currentJob = feedJobs[currentJobIndex];

  const handleSwipe = async (action) => {
    if (!currentJob) return;
    
    setSwipeDirection(action === 'apply' ? 'right' : action === 'skip' ? 'left' : 'down');
    
    try {
      await swipeService.swipe(currentJob.id, action);
      if (action === 'apply') {
        toast.success(`Applied for ${currentJob.title}!`, { id: 'apply' });
      } else if (action === 'save') {
        toast.success(`Saved ${currentJob.title}!`, { id: 'save' });
      } else {
        toast(`Skipped ${currentJob.title}`, { id: 'skip', icon: '👋' });
      }
    } catch (err) {
      toast.error("Failed to register action.");
    }

    setTimeout(() => {
      setSwipeDirection(null);
      dragX.set(0);
      dispatch(incrementJobIndex());
    }, 200);
  };

  const handleDragEnd = (event, info) => {
    const threshold = 120;
    if (info.offset.x > threshold) {
      handleSwipe('apply');
    } else if (info.offset.x < -threshold) {
      handleSwipe('skip');
    } else if (info.offset.y > threshold) {
      handleSwipe('save');
    }
  };

  if (isFeedLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[70vh]">
        <div className="w-16 h-16 rounded-full border-4 border-t-primary border-slate-200 animate-spin shadow-glow-purple" />
        <p className="text-text-secondary mt-6 font-medium animate-pulse">Loading discovery feed...</p>
      </div>
    );
  }

  const isFeedEnded = currentJobIndex >= feedJobs.length;

  return (
    <div className="flex-1 flex flex-col lg:flex-row gap-8 max-w-7xl mx-auto h-[calc(100vh-140px)] min-h-[500px]">
      
      {/* LEFT COLUMN: SWIPE CONTROLLER STACK */}
      <div className="flex-1 flex flex-col justify-center items-center relative py-6">
        
        <AnimatePresence mode="wait">
          {isFeedEnded ? (
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-card rounded-xl3 p-8 border border-slate-200 text-center max-w-sm"
            >
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-8 h-8 text-primary animate-pulse" />
              </div>
              <h3 className="text-xl font-bold font-outfit text-text-primary">All Caught Up!</h3>
              <p className="text-sm text-text-secondary mt-3 leading-relaxed">
                You've swiped through all available jobs. Check back soon or customize your profile filters to see new jobs.
              </p>
              <Button 
                onClick={() => dispatch(fetchFeedJobs())}
                variant="outline" 
                size="md" 
                className="mt-6"
              >
                Reload Feed
              </Button>
            </motion.div>
          ) : (
            <div className="relative w-full max-w-[380px] h-[500px] flex items-center justify-center">
              
              {/* Stack Background Cards */}
              {feedJobs.slice(currentJobIndex + 1, currentJobIndex + 3).map((job, idx) => (
                <div
                  key={job.id}
                  className="absolute w-full h-[470px] glass-card rounded-xl3 border border-slate-200 p-6 shadow-card select-none"
                  style={{
                    transform: `translateY(${(idx + 1) * 12}px) scale(${1 - (idx + 1) * 0.05})`,
                    opacity: 0.3 - idx * 0.1,
                    zIndex: 10 - idx
                  }}
                >
                  <div className="w-12 h-12 rounded-xl bg-slate-50" />
                  <div className="h-6 w-3/4 bg-slate-50 rounded mt-6" />
                  <div className="h-4 w-1/2 bg-slate-50 rounded mt-3" />
                </div>
              ))}

              {/* Active Draggable Card */}
              <motion.div
                drag
                dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                onDragEnd={handleDragEnd}
                style={{ x: dragX, rotate, opacity }}
                animate={swipeDirection === 'right' ? { x: 400, opacity: 0 } : swipeDirection === 'left' ? { x: -400, opacity: 0 } : swipeDirection === 'down' ? { y: 400, opacity: 0 } : {}}
                transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                className="absolute w-full h-[470px] glass-card rounded-xl3 border border-slate-200 p-6 flex flex-col justify-between shadow-card cursor-grab active:cursor-grabbing z-30 select-none overflow-hidden"
              >
                
                {/* Drag Indicators Stamps */}
                <motion.div 
                  style={{ opacity: yesOpacity }} 
                  className="absolute top-10 right-10 border-4 border-success text-success font-extrabold font-outfit uppercase px-4 py-2 rounded-xl text-2xl rotate-12 pointer-events-none tracking-wider"
                >
                  APPLY
                </motion.div>
                <motion.div 
                  style={{ opacity: noOpacity }} 
                  className="absolute top-10 left-10 border-4 border-danger text-danger font-extrabold font-outfit uppercase px-4 py-2 rounded-xl text-2xl -rotate-12 pointer-events-none tracking-wider"
                >
                  SKIP
                </motion.div>

                {/* Company Type Gradient Top Ribbon */}
                <div className={`absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r ${
                  currentJob.company?.company_type === 'mnc'
                    ? 'from-primary to-primary-light'
                    : currentJob.company?.company_type === 'startup'
                    ? 'from-secondary to-blue-400'
                    : 'from-accent to-yellow-500'
                }`} />

                {/* Top Section */}
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      {currentJob.company?.logo_url ? (
                        <img 
                          src={currentJob.company.logo_url} 
                          alt={currentJob.company.name} 
                          className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0" 
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center font-bold text-white text-base shadow-sm shrink-0">
                          {currentJob.company?.name?.charAt(0).toUpperCase() || 'J'}
                        </div>
                      )}
                      <div>
                        <h4 className="font-semibold text-text-primary text-base line-clamp-1">{currentJob.title}</h4>
                        <p className="text-xs text-text-secondary flex items-center gap-1 mt-0.5 font-medium">
                          {currentJob.company?.name} • <span className="text-[10px] uppercase font-bold tracking-widest text-primary-light">{currentJob.company?.company_type?.replace('_', ' ')}</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-5">
                    <span className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-slate-50 border border-slate-200 text-text-secondary flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {currentJob.location}
                    </span>
                    <span className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-slate-50 border border-slate-200 text-text-secondary capitalize">
                      {currentJob.job_type?.replace('_', ' ')}
                    </span>
                    <span className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-slate-50 border border-slate-200 text-text-secondary capitalize">
                      {currentJob.experience_level}
                    </span>
                  </div>

                  <p className="text-xs text-text-secondary mt-5 leading-relaxed line-clamp-4">
                    {currentJob.description}
                  </p>
                </div>

                {/* Bottom Section */}
                <div>
                  <div className="mb-4">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1.5">Required Skills</p>
                    <div className="flex flex-wrap gap-1.5">
                      {currentJob.skills_required?.slice(0, 3).map((skill) => (
                        <span key={skill} className="px-2 py-0.5 text-[10px] font-semibold rounded bg-primary/10 text-primary border border-primary/20">
                          {skill}
                        </span>
                      ))}
                      {currentJob.skills_required?.length > 3 && (
                        <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-slate-50 border border-slate-200 text-text-secondary">
                          +{currentJob.skills_required.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Competition Status indicator */}
                  <div className="flex items-center justify-between border-t border-slate-200 pt-4">
                    <div>
                      <p className="text-[10px] text-text-secondary">Monthly Salary</p>
                      <p className="text-sm font-bold font-outfit text-text-primary">
                        ₹{(currentJob.min_salary / 1000).toFixed(0)}k - {(currentJob.max_salary / 1000).toFixed(0)}k
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-[10px] text-text-secondary">Competition Level</p>
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide mt-0.5 ${
                        currentJob.competition_level === 'low'
                          ? 'bg-success/20 text-success'
                          : currentJob.competition_level === 'medium'
                          ? 'bg-accent/20 text-accent'
                          : 'bg-danger/20 text-danger animate-pulse'
                      }`}>
                        {currentJob.competition_level} ({currentJob.applicant_count} applicants)
                      </span>
                    </div>
                  </div>
                </div>

              </motion.div>

              {/* ACTION OVERLAYS CONTROLLER BUTTONS */}
              <div className="absolute -bottom-16 flex items-center justify-center gap-6 w-full z-40">
                <button
                  onClick={() => handleSwipe('skip')}
                  className="w-14 h-14 rounded-full bg-white border border-slate-200 shadow-md flex items-center justify-center text-danger hover:bg-danger/10 hover:border-danger/30 hover:scale-105 active:scale-95 transition-all duration-200"
                  title="Swipe Left: Skip (ArrowLeft)"
                >
                  <X className="w-6 h-6" />
                </button>
                <button
                  onClick={() => handleSwipe('save')}
                  className="w-12 h-12 rounded-full bg-white border border-slate-200 shadow-md flex items-center justify-center text-accent hover:bg-accent/10 hover:border-accent/30 hover:scale-105 active:scale-95 transition-all duration-200"
                  title="Swipe Down: Save (ArrowDown)"
                >
                  <Bookmark className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleSwipe('apply')}
                  className="w-14 h-14 rounded-full bg-white border border-slate-200 shadow-md flex items-center justify-center text-success hover:bg-success/10 hover:border-success/30 hover:scale-105 active:scale-95 transition-all duration-200"
                  title="Swipe Right: Apply (ArrowRight)"
                >
                  <Check className="w-6 h-6" />
                </button>
              </div>

            </div>
          )}
        </AnimatePresence>
      </div>

      {/* RIGHT COLUMN: JOB DETAILS & MATCH ANALYSIS */}
      <div className="w-full lg:w-[420px] bg-white border border-slate-200 shadow-sm rounded-xl3 p-6 overflow-y-auto flex flex-col justify-between h-[500px] lg:h-auto scrollbar-thin select-none">
        {currentJob ? (
          <div className="space-y-6 flex-1 flex flex-col justify-between">
            {/* Match score gauge */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-bold font-outfit text-text-primary uppercase tracking-wider">AI Compatibility Match</h3>
              </div>

              {/* Radial dial */}
              <div className="flex items-center gap-5 bg-slate-50 border border-slate-200 rounded-xl p-4">
                <div className="relative w-18 h-18 shrink-0 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="16" fill="none" stroke="#e5e8ee" strokeWidth="3" />
                    <circle 
                      cx="18" 
                      cy="18" 
                      r="16" 
                      fill="none" 
                      stroke="url(#matchGrad)" 
                      strokeWidth="3" 
                      strokeDasharray="100" 
                      strokeDashoffset={100 - (currentJob.match_score || 72)} 
                      strokeLinecap="round" 
                      className="transition-all duration-1000"
                    />
                    <defs>
                      <linearGradient id="matchGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#4f46e5" />
                        <stop offset="100%" stopColor="#0891b2" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <span className="absolute text-sm font-black text-text-primary font-outfit">{(currentJob.match_score || 72).toFixed(0)}%</span>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-text-primary">Skills Compatibility</h4>
                  <p className="text-xs text-text-secondary mt-1">
                    Matches {(currentJob.skills_required?.filter(s => user?.skills?.toLowerCase()?.includes(s.toLowerCase()))?.length || 0)} of {currentJob.skills_required?.length || 0} required skills from your profile.
                  </p>
                </div>
              </div>
            </div>

            {/* Detailed requirements list */}
            <div className="flex-1 overflow-y-auto max-h-[160px] lg:max-h-none scrollbar-thin">
              <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-2">Role Requirements</h4>
              <ul className="space-y-2">
                {currentJob.requirements?.map((req, i) => (
                  <li key={i} className="text-xs text-text-secondary leading-relaxed flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Industry and Company Rating summary */}
            <div className="border-t border-slate-200 pt-4 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-text-secondary">Company Rating</span>
                <span className="text-text-primary font-bold text-accent">★ {currentJob.company?.rating || '4.0'} / 5.0</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-text-secondary">Industry Sector</span>
                <span className="text-text-primary font-semibold">{currentJob.company?.industry || 'Technology'}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-text-secondary">Employee Count</span>
                <span className="text-text-primary font-semibold">{currentJob.company?.size || '11-50'} members</span>
              </div>
            </div>

          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-text-secondary">
            <AlertCircle className="w-8 h-8 text-text-muted mb-3" />
            <p className="text-xs font-medium">No job selected.</p>
          </div>
        )}
      </div>

    </div>
  );
}
