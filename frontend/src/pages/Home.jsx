import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Compass, Briefcase, FileText, CheckCircle2, ChevronRight, 
  Star, Sparkles, ShieldCheck, Flame, Heart, X, MessageSquare, Award, Orbit, Cpu, Zap, ChevronDown, Check, Users, Terminal, Play, Bell,
  User, CheckCircle, Database, Phone, Mail, Globe, ArrowRight, Shield, ZapOff, CheckSquare, Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Home() {
  const [demoState, setDemoState] = useState('swipe');
  const [swipeDirection, setSwipeDirection] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [faqOpen, setFaqOpen] = useState(null);

  // AI assistant preview mock states
  const [aiMessageIndex, setAiMessageIndex] = useState(0);
  const aiMessages = [
    { sender: 'assistant', text: "Analyzing your profile... I found a 98% match for 'Lead AI Platform Engineer' at NVIDIA." },
    { sender: 'user', text: "Wow, that's high! Does my resume highlight enough CUDA experience?" },
    { sender: 'assistant', text: "Yes! Your resume has 3 years of CUDA and PyTorch optimization work. Swiping right now..." },
    { sender: 'assistant', text: "Match confirmed! NVIDIA's recruiter just sent you a calendar link. Let's schedule the call." }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setAiMessageIndex(prev => (prev + 1) % aiMessages.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  // Mouse Parallax coordinates tracker
  useEffect(() => {
    const handleMove = (e) => {
      setMousePos({
        x: (e.clientX - window.innerWidth / 2) / 35,
        y: (e.clientY - window.innerHeight / 2) / 35
      });
    };
    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, []);

  const handleDemoAction = (action) => {
    if (action === 'like') {
      setSwipeDirection('right');
      setTimeout(() => {
        setDemoState('match');
      }, 250);
    } else {
      setSwipeDirection('left');
      setTimeout(() => {
        setDemoState('disliked');
      }, 250);
    }
  };

  const resetDemo = () => {
    setSwipeDirection(null);
    setDemoState('swipe');
  };

  const toggleFaq = (index) => {
    setFaqOpen(faqOpen === index ? null : index);
  };

  return (
    <div className="relative min-h-screen overflow-hidden text-left bg-[#f8fafc] text-slate-800">
      
      {/* Background aurora lighting */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-[5%] left-[-10%] w-[60vw] h-[60vh] bg-gradient-to-tr from-blue-500/5 via-indigo-500/5 to-transparent rounded-full blur-[130px]" />
        <div className="absolute bottom-[20%] right-[-10%] w-[50vw] h-[50vh] bg-gradient-to-br from-indigo-500/5 via-blue-500/5 to-transparent rounded-full blur-[130px]" />
      </div>

      {/* 1. HERO SECTION (Theme: Light Navy + Blue + Indigo) */}
      <section className="relative pt-36 pb-28 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-12 gap-16 items-center relative z-10">
          
          {/* Headline details */}
          <div className="lg:col-span-7 space-y-10 text-left">
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-xs font-black uppercase tracking-widest shadow-sm"
            >
              <Sparkles size={13} className="text-blue-500 mr-1.5 animate-pulse" />
              <span>The Future of AI Job Discovery</span>
            </motion.div>

            <h1 className="text-5xl sm:text-6xl md:text-[5.5rem] font-black leading-[0.9] tracking-tight text-slate-800">
              Find Your Perfect Job.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-800 drop-shadow-[0_0_35px_rgba(37,99,235,0.08)]">
                Powered by AI.
              </span>
            </h1>

            <p className="text-slate-500 text-base sm:text-lg max-w-xl leading-relaxed font-semibold">
              Bypass intermediate questionnaires. Swipe through roles, check match scores, and schedule virtual calls directly in recruiter calendars.
            </p>

            <div className="flex flex-wrap gap-4 pt-4">
              <Link
                to="/register"
                className="flex items-center space-x-2.5 px-10 py-5.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs rounded-full transition-all shadow-xl shadow-blue-500/10 hover:scale-[1.03] active:scale-95 group uppercase tracking-widest border border-transparent"
              >
                <span>🚀 Start Swiping</span>
                <ChevronRight size={15} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <button
                onClick={() => setDemoState('swipe')}
                className="flex items-center space-x-2 px-10 py-5.5 border border-slate-200 hover:bg-slate-100 bg-white text-slate-600 font-black text-xs rounded-full transition-all hover:scale-[1.03] active:scale-95 uppercase tracking-widest shadow-sm cursor-pointer"
              >
                <Play size={14} className="fill-slate-500 text-slate-500 mr-1.5 animate-pulse" />
                <span>Watch Live Demo</span>
              </button>
            </div>
          </div>

          {/* Interactive Demo swiper card */}
          <div className="lg:col-span-5 flex justify-center items-center">
            <div style={{ perspective: 1200 }} className="w-full max-w-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full relative p-[1px] rounded-[38px] bg-slate-200/50 shadow-md select-none"
              >
                <div className="w-full h-[460px] bg-white rounded-[37px] p-8 flex flex-col justify-between overflow-hidden relative border border-slate-100">
                  <div className="absolute top-0 left-0 right-0 h-44 bg-gradient-to-b from-blue-50 to-transparent -z-10" />

                  <AnimatePresence mode="wait">
                    {demoState === 'swipe' && (
                      <motion.div
                        key="demo-deck"
                        initial={{ opacity: 0 }}
                        animate={{ 
                          opacity: 1, 
                          x: swipeDirection === 'right' ? 320 : swipeDirection === 'left' ? -320 : 0,
                          rotate: swipeDirection === 'right' ? 14 : swipeDirection === 'left' ? -14 : 0
                        }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="h-full flex flex-col justify-between text-left"
                      >
                        <div className="space-y-4">
                          <div className="flex justify-between items-start">
                            <span className="px-3 py-1 rounded bg-blue-50 border border-blue-100 text-blue-600 text-[9px] font-black uppercase tracking-widest">
                              Full-Time
                            </span>
                            <span className="px-3 py-1 rounded bg-indigo-50 border border-indigo-100 text-indigo-600 text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5">
                              <Cpu size={10} className="animate-spin" />
                              <span>98% Match</span>
                            </span>
                          </div>

                          <div>
                            <h3 className="text-2xl font-black text-slate-800 leading-tight">Lead AI Platform Engineer</h3>
                            <p className="text-blue-600 text-xs font-extrabold mt-0.5">NVIDIA Corporation</p>
                          </div>

                          <div className="flex items-center space-x-2 text-slate-400 text-xxs font-black uppercase tracking-wider">
                            <span className="text-slate-700 font-extrabold">$230k - $280k</span>
                            <span>•</span>
                            <span>Santa Clara, CA</span>
                          </div>

                          <p className="text-slate-600 text-xs leading-relaxed font-semibold">
                            Orchestrate generative agent hardware layers. Run CUDA optimizations on GPU stream clusters.
                          </p>
                        </div>

                        {/* Recruiter Activity preview */}
                        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-[10px] text-slate-600 font-bold flex items-center gap-2">
                          <span className="relative flex h-2 w-2 shrink-0">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
                          </span>
                          <span>Active Recruiter reviewing stack...</span>
                        </div>

                        {/* Swiper deck buttons */}
                        <div className="flex justify-center items-center space-x-6 pt-4 border-t border-slate-100">
                          <button 
                            onClick={() => handleDemoAction('dislike')}
                            className="w-12 h-12 rounded-full bg-white border border-rose-200 hover:bg-rose-50 flex items-center justify-center text-rose-500 shadow-md hover:scale-110 active:scale-95 transition-all cursor-pointer"
                          >
                            <X size={18} />
                          </button>
                          <button 
                            onClick={() => handleDemoAction('like')}
                            className="w-14 h-14 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 flex items-center justify-center text-white shadow-xl shadow-blue-500/20 hover:scale-110 active:scale-95 transition-all cursor-pointer"
                          >
                            <Heart size={22} className="fill-white animate-pulse" />
                          </button>
                        </div>
                      </motion.div>
                    )}

                    {demoState === 'match' && (
                      <motion.div
                        key="demo-match"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="h-full flex flex-col justify-between items-center text-center py-6"
                      >
                        <div className="space-y-4">
                          <div className="inline-flex p-4.5 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 animate-bounce shadow-sm">
                            <Sparkles size={32} />
                          </div>
                          <h4 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-650 tracking-tight">It's a Match!</h4>
                          <p className="text-slate-500 text-xs leading-relaxed max-w-[280px] mx-auto font-semibold">
                            Hiring squad approved your qualifications. Messaging and calendar slots are unlocked.
                          </p>
                        </div>

                        <div className="flex items-center justify-center -space-x-3 my-4">
                          <div className="w-12 h-12 rounded-full border-2 border-white bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-black text-xs text-white shadow-lg">
                            YOU
                          </div>
                          <div className="w-12 h-12 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center font-black text-[9px] text-blue-600 shadow-lg">
                            NVDA
                          </div>
                        </div>

                        <button 
                          onClick={resetDemo}
                          className="w-full py-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-650 font-extrabold text-xs transition-all border border-slate-250 uppercase tracking-widest cursor-pointer"
                        >
                          Reswipe Deck
                        </button>
                      </motion.div>
                    )}

                    {demoState === 'disliked' && (
                      <motion.div
                        key="demo-dislike"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="h-full flex flex-col justify-between items-center text-center py-8"
                      >
                        <div className="space-y-3">
                          <div className="inline-flex p-4 rounded-full bg-slate-50 border border-slate-200 text-slate-400">
                            <Compass size={32} />
                          </div>
                          <h4 className="text-xl font-black text-slate-800">Listing Passed</h4>
                          <p className="text-slate-500 text-xs leading-relaxed max-w-[240px] mx-auto font-semibold">
                            Skip records committed successfully. Loading next matching card...
                          </p>
                        </div>

                        <button 
                          onClick={resetDemo}
                          className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-605 text-white font-extrabold text-xs transition-all uppercase tracking-widest cursor-pointer"
                        >
                          Reswipe Deck
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            </div>
          </div>

        </div>
      </section>

      {/* 2. FLOATING LOGOS SCROLLING PANEL (Theme: White Glass Cards) */}
      <section className="py-14 bg-gradient-to-r from-slate-100 via-slate-50 to-slate-100 border-y border-slate-200/80 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-center mb-8">Trusted by talent matching squads worldwide</p>
          <div className="w-full overflow-hidden relative">
            <div className="flex space-x-8 animate-scroll-left whitespace-nowrap">
              {[
                'Google', 'Microsoft', 'Apple', 'Amazon', 'Netflix', 'Figma', 'Stripe', 'Nvidia', 'Meta', 'Airbnb',
                'Google', 'Microsoft', 'Apple', 'Amazon', 'Netflix', 'Figma', 'Stripe', 'Nvidia', 'Meta', 'Airbnb'
              ].map((logo, i) => (
                <div key={i} className="inline-block px-8 py-4.5 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 transition-all text-xs font-black tracking-widest text-slate-650 uppercase shadow-sm select-none cursor-default">
                  {logo}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 3. STATISTICS METRICS (Theme: Cyan + Blue cards) */}
      <section className="py-24 relative overflow-hidden bg-gradient-to-b from-[#f8fafc] via-blue-50/50 to-[#f8fafc] border-b border-slate-200/80">
        <div className="absolute top-[20%] left-[20%] w-[380px] h-[380px] bg-gradient-to-tr from-blue-500/5 via-indigo-500/5 to-transparent rounded-full blur-[110px] pointer-events-none" />
        <div className="max-w-6xl mx-auto px-6 space-y-16 relative z-10">
          <div className="text-center space-y-3">
            <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Platform Match Telemetry</span>
            <h2 className="text-4xl font-black text-slate-800 tracking-tight uppercase">SwipeX Match Metrics</h2>
            <p className="text-slate-500 text-xs max-w-lg mx-auto font-semibold">Real-time stats tracking seeker applications and recruiter interviews scheduled.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { val: "12,000+", label: "Verified Matches Made", desc: "Seekers connected directly to engineering recruiters", icon: Sparkles },
              { val: "98.2%", label: "AI Stack Fit Index", desc: "Automated candidate-job match success rate", icon: Cpu },
              { val: "15 mins", label: "Average Call Scheduled", desc: "Average duration to unlock calendars from matches", icon: Clock }
            ].map((st, i) => {
              const Icon = st.icon;
              return (
                <div key={i} className="p-[1px] rounded-3xl bg-slate-200/50 shadow-sm transform hover:-translate-y-1.5 transition-all duration-300">
                  <div className="bg-white p-8 rounded-[23px] text-center space-y-4 border border-slate-200/80 shadow-md">
                    <div className="w-12 h-12 mx-auto rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                      <Icon size={20} />
                    </div>
                    <div className="space-y-1">
                      <span className="text-4xl font-black text-slate-850 block">{st.val}</span>
                      <span className="text-xs font-black text-slate-700 block uppercase tracking-wider">{st.label}</span>
                    </div>
                    <p className="text-slate-500 text-xxs font-semibold leading-relaxed">{st.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. FEATURES SECTION (Theme: Purple + Pink Gradient cards) */}
      <section className="py-24 relative overflow-hidden bg-gradient-to-b from-[#f8fafc] via-slate-100/50 to-[#f8fafc] border-b border-slate-200/80">
        <div className="absolute bottom-[10%] right-[10%] w-[380px] h-[380px] bg-gradient-to-tr from-blue-500/5 via-indigo-500/5 to-transparent rounded-full blur-[110px] pointer-events-none" />
        <div className="max-w-6xl mx-auto px-6 space-y-16 relative z-10">
          <div className="text-left space-y-3">
            <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Enterprise Core Capabilities</span>
            <h2 className="text-4xl font-black text-slate-800 tracking-tight uppercase">High-Performance Matching</h2>
            <p className="text-slate-500 text-xs font-semibold">Engineered to bypass traditional ATS bottlenecks completely.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { title: "Tinder-Style Swiper", desc: "Swipe right on matching roles. Skip long questionnaires and lock direct pipelines.", icon: Compass, grad: "from-blue-50/30 to-indigo-50/30" },
              { title: "Smart Resume Analysis", desc: "Upload PDFs to compile real-time ATS match audits and identify keyword stack gaps.", icon: FileText, grad: "from-indigo-50/30 to-blue-50/30" },
              { title: "WebRTC Conferences", desc: "Practice video calls or attend recruiter meetups directly inside matching channels.", icon: MessageSquare, grad: "from-blue-50/30 to-indigo-50/30" }
            ].map((feat, i) => {
              const Icon = feat.icon;
              return (
                <div key={i} className="p-[1px] rounded-3xl bg-slate-200/50 shadow-sm transition-all duration-300 transform hover:-translate-y-1">
                  <div className={`bg-white bg-gradient-to-b ${feat.grad} p-8 rounded-[23px] h-full flex flex-col justify-between text-left relative overflow-hidden border border-slate-200 shadow-md`}>
                    <div className="space-y-4">
                      <div className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                        <Icon size={18} />
                      </div>
                      <h3 className="text-slate-800 font-black text-lg">{feat.title}</h3>
                      <p className="text-slate-600 text-xs leading-relaxed font-semibold">{feat.desc}</p>
                    </div>
                    <div className="pt-6 mt-6 border-t border-slate-100">
                      <Link to="/register" className="text-xxs font-black text-blue-600 hover:underline uppercase tracking-wider flex items-center gap-1">
                        Learn More <ArrowRight size={10} />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. WHY SWIPEX SECTION (Theme: Emerald + Cyan Grid) */}
      <section className="py-24 relative overflow-hidden bg-gradient-to-b from-[#f8fafc] via-emerald-50/20 to-[#f8fafc] border-b border-slate-200/80">
        <div className="absolute top-[20%] right-[20%] w-[380px] h-[380px] bg-gradient-to-tr from-blue-500/5 via-indigo-500/5 to-transparent rounded-full blur-[110px] pointer-events-none" />
        <div className="max-w-6xl mx-auto px-6 space-y-16 relative z-10">
          <div className="text-center space-y-3">
            <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Why Choose Us</span>
            <h2 className="text-4xl font-black text-slate-800 tracking-tight uppercase">Algorithmic Talent Sourcing</h2>
            <p className="text-slate-500 text-xs max-w-lg mx-auto font-semibold">We connect stack proficiencies directly to recruiter calendars, eliminating intermediate forms.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: "AI Matching", desc: "Automated analysis comparing job skills lists with candidate profiles.", icon: Sparkles },
              { title: "Smart Resume Analysis", desc: "Upload resumes in CV dashboard to verify ATS score metrics.", icon: FileText },
              { title: "Swipe Interface", desc: "Tinder deck swiper to skip filters and directly apply to teams.", icon: Compass },
              { title: "Instant Recruiter Connect", desc: "Chat matching rooms unlock immediately after mutual likes.", icon: Users },
              { title: "AI Cover Letters", desc: "Generates professional introduction statements matching role description requirements.", icon: Cpu },
              { title: "Career Analytics", desc: "Detailed seeker dashboard timelines summarizing match applications pipelines.", icon: Award }
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className="p-6 rounded-3xl bg-white border border-slate-200 hover:border-blue-500/30 transition-all text-left space-y-3 shadow-md">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                    <Icon size={16} />
                  </div>
                  <h4 className="text-slate-800 font-extrabold text-sm">{item.title}</h4>
                  <p className="text-slate-550 text-xxs leading-relaxed font-semibold">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 6. HOW IT WORKS TIMELINE (Theme: Orange + Purple) */}
      <section className="py-24 relative overflow-hidden bg-gradient-to-b from-[#f8fafc] via-indigo-50/20 to-[#f8fafc] border-b border-slate-200/80">
        <div className="absolute bottom-[20%] left-[20%] w-[380px] h-[380px] bg-gradient-to-tr from-blue-500/5 via-indigo-500/5 to-transparent rounded-full blur-[110px] pointer-events-none" />
        <div className="max-w-4xl mx-auto px-6 space-y-16 relative z-10">
          <div className="text-center space-y-3">
            <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">How It Works</span>
            <h2 className="text-4xl font-black text-slate-800 tracking-tight uppercase">Your Route to Landing Roles</h2>
            <p className="text-slate-500 text-xs max-w-sm mx-auto font-semibold">Deploy profiles, check match indexes, swiping cards, and match directly.</p>
          </div>

          <div className="relative border-l border-dashed border-slate-200 pl-6 ml-2 space-y-12 text-left">
            {[
              { step: "Step 1", title: "Create Profile", desc: "Build your professional seeker account and list stack specializations.", icon: User },
              { step: "Step 2", title: "AI Analysis", desc: "Upload PDF resumes to run automated parser diagnostics.", icon: Cpu },
              { step: "Step 3", title: "Swipe Jobs", desc: "Explore matching roles. Swipe right to like, swipe left to pass.", icon: Compass },
              { step: "Step 4", title: "Get Matched", desc: "Recruiter mutual likes unlock instant chat threads.", icon: Sparkles },
              { step: "Step 5", title: "Get Hired", desc: "Schedule calls directly inside channel calendars.", icon: Award }
            ].map((node, i) => {
              const Icon = node.icon;
              return (
                <div key={i} className="relative space-y-1">
                  <span className="absolute -left-[33.5px] top-1 w-5 h-5 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center ring-4 ring-white shadow-md text-white text-[9px] font-black">
                    {i+1}
                  </span>
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-black text-blue-600 uppercase tracking-wider">{node.step}</span>
                    <Icon size={12} className="text-blue-600" />
                  </div>
                  <h4 className="text-slate-850 font-black text-sm">{node.title}</h4>
                  <p className="text-slate-600 text-xxs font-semibold max-w-lg leading-relaxed">{node.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 7. TESTIMONIALS (Theme: Pink + Blue cards) */}
      <section className="py-24 relative overflow-hidden bg-gradient-to-b from-[#f8fafc] via-blue-50/20 to-[#f8fafc] border-b border-slate-200/80">
        <div className="max-w-6xl mx-auto px-6 space-y-16 relative z-10">
          <div className="text-center space-y-3">
            <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Seeker Reviews</span>
            <h2 className="text-4xl font-black text-slate-800 tracking-tight uppercase">Matched and Deployed</h2>
            <p className="text-slate-500 text-xs font-semibold max-w-xs mx-auto">Success reports sent directly from engineering team members.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { name: "Sarah Jenkins", role: "Software Engineer", company: "Google", text: "SwipeX bypassed the resume black hole completely. Swiped right, matched with Google recruiter, scheduled interview directly.", grad: "from-blue-50/20 to-white" },
              { name: "David Chen", role: "AI Tech Lead", company: "Microsoft", text: "Match score accuracy was extremely high. The built-in practice questions prepared me for the WebRTC panel session perfectly.", grad: "from-indigo-50/20 to-white" },
              { name: "Elena Rostova", role: "Product Designer", company: "Amazon", text: "Redesign dashboard layout is very modern. Direct messaging unlocked calendar synchronization immediately.", grad: "from-blue-50/20 to-white" }
            ].map((user, i) => (
              <div key={i} className="p-[1px] rounded-3xl bg-slate-200/50 shadow-sm transition-all duration-300 transform hover:-translate-y-1">
                <div className={`bg-white bg-gradient-to-b ${user.grad} p-8 rounded-[23px] h-full flex flex-col justify-between text-left border border-slate-200 shadow-md`}>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-1.5 text-amber-500">
                      {[...Array(5)].map((_, idx) => <Star key={idx} size={11} className="fill-amber-500 text-amber-500" />)}
                    </div>
                    <p className="text-slate-650 text-xxs leading-relaxed italic font-semibold">"{user.text}"</p>
                  </div>
                  <div className="pt-6 border-t border-slate-100 mt-6 flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center font-black text-xs text-blue-600 shadow-sm">
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-slate-800 font-black text-xs">{user.name}</h4>
                      <p className="text-[10px] text-slate-400 font-extrabold uppercase">{user.role} @ <span className="text-slate-700">{user.company}</span></p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. FAQ CENTER SECTION (Theme: Indigo + Purple Glass Cards) */}
      <section className="py-24 relative overflow-hidden bg-gradient-to-b from-[#f8fafc] via-indigo-50/10 to-[#f8fafc] border-b border-slate-200/80">
        <div className="max-w-4xl mx-auto px-6 space-y-12 relative z-10">
          <div className="text-center space-y-3">
            <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Support Portal</span>
            <h2 className="text-4xl font-black text-slate-800 tracking-tight uppercase">FAQ Center</h2>
            <p className="text-slate-500 text-xs font-semibold">Everything you need to know about SwipeX operations</p>
          </div>

          <div className="space-y-4 text-left">
            {[
              { q: "How does Swipe matching work?", a: "When you swipe right (like) on a job, it registers as an application. If the recruiter likes your profile back, a Match is immediately declared, unlocking chat messaging and video call rounds." },
              { q: "Is a resume file mandatory?", a: "Yes, you must upload at least one PDF resume in your Profile section before you can swipe right to apply for roles." },
              { q: "How is the Match score computed?", a: "Our AI match engine compares skills list keywords in your resume against job profile metadata, assigning a percentage score." }
            ].map((faq, i) => (
              <div key={i} className="p-[1px] rounded-2xl bg-slate-200/50 shadow-sm">
                <div className="bg-white rounded-[15px] p-5 border border-slate-200">
                  <button
                    type="button"
                    onClick={() => toggleFaq(i)}
                    className="w-full flex items-center justify-between text-left text-xs font-black text-slate-800 uppercase tracking-wider cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown size={14} className={`text-slate-500 transition-transform ${faqOpen === i ? 'rotate-180 text-blue-600' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {faqOpen === i && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <p className="text-slate-600 text-xxs leading-relaxed pt-3 font-semibold border-t border-slate-100 mt-3">
                          {faq.a}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 9. PREMIUM MULTI-COLOR FOOTER */}
      <footer className="py-20 relative overflow-hidden bg-gradient-to-t from-blue-50/50 via-[#f8fafc] to-[#f8fafc]">
        <div className="max-w-7xl mx-auto px-6 relative z-10 grid md:grid-cols-4 gap-12 border-t border-slate-200 pt-16 text-left text-slate-800">
          <div className="space-y-4">
            <h3 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-1.5">
              <Sparkles size={16} className="text-blue-600" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-650">SwipeX Inc.</span>
            </h3>
            <p className="text-slate-600 text-xxs leading-relaxed font-semibold">Bypass intermediary forms. Elevate technical matches directly to recruiting channels.</p>
          </div>

          <div className="space-y-4">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Seeker Channels</h4>
            <div className="flex flex-col space-y-2 text-xxs font-extrabold text-slate-600">
              <Link to="/swipe" className="hover:text-blue-600 transition-colors">Swipe Deck</Link>
              <Link to="/jobs" className="hover:text-blue-600 transition-colors">Search Jobs</Link>
              <Link to="/applications" className="hover:text-blue-600 transition-colors">Kanban Pipeline</Link>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Connect</h4>
            <div className="flex flex-col space-y-2 text-xxs font-extrabold text-slate-600">
              <Link to="/profile" className="hover:text-blue-600 transition-colors">Candidate Profile</Link>
              <Link to="/messages" className="hover:text-blue-600 transition-colors">Match Channels</Link>
              <Link to="/calendar" className="hover:text-blue-600 transition-colors">Interview Calendar</Link>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Newsletter</h4>
            <p className="text-slate-500 text-xxs font-semibold">Stay updated with our latest AI recommendations.</p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Email address..."
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xxs text-slate-800 focus:border-blue-500/50 outline-none font-semibold"
              />
              <button 
                type="button"
                onClick={() => alert('Subscribed successfully!')}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xxs uppercase tracking-wider rounded-xl cursor-pointer"
              >
                Join
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 pt-12 mt-12 border-t border-slate-200 text-center text-slate-400 text-xxs font-bold">
          &copy; {new Date().getFullYear()} SwipeX Corporation. All rights reserved. Bypassing ATS blocks globally.
        </div>
      </footer>

    </div>
  );
}
