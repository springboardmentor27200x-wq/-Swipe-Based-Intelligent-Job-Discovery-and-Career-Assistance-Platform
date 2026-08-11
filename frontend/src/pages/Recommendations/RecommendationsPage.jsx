import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Sparkles, TrendingUp, Bookmark, Check, ChevronRight, Zap, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import { fetchRecommendations, fetchTrending } from '../../store/jobsSlice';
import swipeService from '../../services/swipeService';
import Button from '../../components/UI/Button.jsx';
import toast from 'react-hot-toast';

export default function RecommendationsPage() {
  const dispatch = useDispatch();
  const { recommendations, trending, isRecsLoading } = useSelector(s => s.jobs);
  const { user } = useSelector(s => s.auth);

  useEffect(() => {
    dispatch(fetchRecommendations());
    dispatch(fetchTrending());
  }, [dispatch]);

  const handleAction = async (jobId, action) => {
    try {
      await swipeService.swipe(jobId, action);
      if (action === 'apply') {
        toast.success("Applied successfully!");
      } else if (action === 'save') {
        toast.success("Saved successfully!");
      }
      dispatch(fetchRecommendations());
    } catch (err) {
      toast.error("Action failed.");
    }
  };

  const getMatchScoreBadge = (score) => {
    if (score >= 80) return { label: 'Excellent Match', color: 'bg-accent/10 text-accent border-accent/20' };
    if (score >= 60) return { label: 'Good Match', color: 'bg-success/10 text-success border-success/20' };
    return { label: 'Fair Match', color: 'bg-primary/10 text-primary border-primary/20' };
  };

  return (
    <div className="flex-1 max-w-7xl mx-auto space-y-8 pb-16 select-none animate-fade-in">
      
      {/* HEADER SECTION */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-bold font-outfit text-text-primary flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" /> Personalized AI Matches
          </h2>
          <p className="text-xs text-text-secondary mt-1">Recommended opportunities computed based on your profile skills and experience.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* PERSONALIZED MATCHES LIST */}
        <div className="lg:col-span-8 space-y-4">
          {isRecsLoading ? (
            [1, 2, 3].map(i => (
              <div key={i} className="h-44 glass-card rounded-xl border border-slate-200 animate-pulse" />
            ))
          ) : recommendations.length === 0 ? (
            <div className="glass-card rounded-xl3 p-12 border border-slate-200 text-center">
              <Sparkles className="w-8 h-8 text-primary mx-auto mb-3 animate-pulse" />
              <h3 className="text-base font-bold text-text-primary font-outfit">Calculating matches...</h3>
              <p className="text-xs text-text-secondary mt-2 max-w-sm mx-auto">
                Make sure you have uploaded and set a primary resume in the Resume section, or added skills inside your profile page to unlock recommendations.
              </p>
            </div>
          ) : (
            recommendations.map((rec) => {
              const badge = getMatchScoreBadge(rec.match_score);
              return (
                <div
                  key={rec.id}
                  className="glass-card rounded-xl border border-slate-200 p-5 flex flex-col md:flex-row justify-between gap-6 hover:shadow-glow-purple hover:border-primary/20 transition-all duration-300 relative overflow-hidden"
                >
                  {/* Left block */}
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start gap-4">
                      {rec.company?.logo_url ? (
                        <img src={rec.company.logo_url} alt={rec.company.name} className="w-11 h-11 rounded-xl object-cover border border-slate-200 shrink-0" />
                      ) : (
                        <div className="w-11 h-11 rounded-xl bg-gradient-primary flex items-center justify-center font-bold text-white text-sm shrink-0">
                          {rec.company?.name?.charAt(0).toUpperCase() || 'J'}
                        </div>
                      )}
                      <div>
                        <h4 className="font-semibold text-text-primary text-base line-clamp-1">{rec.title}</h4>
                        <p className="text-xs text-text-secondary font-medium">
                          {rec.company?.name} • <span className="text-[10px] uppercase font-bold text-primary-light">{rec.company?.company_type}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-slate-50 border border-slate-200 text-text-secondary flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-text-muted" />
                        {rec.location}
                      </span>
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-slate-50 border border-slate-200 text-text-secondary capitalize">
                        {rec.job_type?.replace('_', ' ')}
                      </span>
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-slate-50 border border-slate-200 text-text-secondary capitalize">
                        {rec.experience_level}
                      </span>
                    </div>

                    <p className="text-xs text-text-secondary leading-relaxed line-clamp-2">{rec.description}</p>
                  </div>

                  {/* Right matching block */}
                  <div className="w-full md:w-48 shrink-0 flex flex-col justify-between items-end border-t md:border-t-0 border-slate-200 pt-4 md:pt-0">
                    <div className="text-right">
                      <span className={`inline-block px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded border ${badge.color}`}>
                        {badge.label}
                      </span>
                      <p className="text-2xl font-black text-text-primary font-outfit mt-1">{rec.match_score.toFixed(0)}%</p>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2 w-full mt-4 md:mt-0">
                      <Button
                        onClick={() => handleAction(rec.id, 'save')}
                        variant="secondary"
                        size="sm"
                        className="flex-1"
                        icon={<Bookmark className="w-3.5 h-3.5 text-accent" />}
                      />
                      <Button
                        onClick={() => handleAction(rec.id, 'apply')}
                        variant="primary"
                        size="sm"
                        className="flex-1 text-xs"
                        icon={<Check className="w-3.5 h-3.5" />}
                      >
                        Apply
                      </Button>
                    </div>
                  </div>

                </div>
              );
            })
          )}
        </div>

        {/* TRENDING JOBS SIDEBAR */}
        <div className="lg:col-span-4 space-y-4">
          <div className="glass-card rounded-xl3 border border-slate-200 p-6 space-y-6">
            <h3 className="text-sm font-bold font-outfit text-text-primary uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-secondary animate-bounce" /> Trending Opportunities
            </h3>

            <div className="space-y-4">
              {trending.slice(0, 5).map((trend) => (
                <div key={trend.id} className="p-3 bg-slate-50 hover:bg-slate-50 border border-slate-200 hover:border-slate-200 rounded-xl transition-all duration-200 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center font-bold text-text-primary text-xs shrink-0 mt-0.5">
                    {trend.company?.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-semibold text-text-primary truncate">{trend.title}</h4>
                    <p className="text-[10px] text-text-secondary truncate mt-0.5">{trend.company?.name}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[9px] font-bold text-success uppercase">{trend.competition_level} competition</span>
                      <button 
                        onClick={() => handleAction(trend.id, 'save')}
                        className="text-[9px] font-bold uppercase tracking-wider text-text-secondary hover:text-primary transition-colors flex items-center gap-0.5"
                      >
                        Save <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
