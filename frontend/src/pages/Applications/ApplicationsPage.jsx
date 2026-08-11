import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Briefcase, Calendar, ChevronRight, HelpCircle, Star, ArrowRight, FolderPlus, Clock, Sparkles, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import Button from '../../components/UI/Button.jsx';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

export default function ApplicationsPage() {
  const { user } = useSelector(s => s.auth);
  const [applications, setApplications] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get('/swipe/applications');
      setApplications(data);
    } catch (err) {
      toast.error("Failed to load application history.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleWithdraw = async (app) => {
    const previous = applications;
    setApplications((prev) => prev.filter((a) => a.id !== app.id));
    try {
      await api.delete(`/swipe/applications/${app.id}`);
      toast.success(`Withdrew application for ${app.job_title}`);
    } catch (err) {
      setApplications(previous);
      toast.error(err.response?.data?.detail || "Failed to withdraw application.");
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'saved': return 'bg-secondary/10 text-secondary border-secondary/20';
      case 'applied': return 'bg-primary/10 text-primary border-primary/20';
      case 'shortlisted': return 'bg-accent/10 text-accent border-accent/20';
      case 'interview': return 'bg-success/10 text-success border-success/20';
      case 'offered': return 'bg-teal-50 text-teal-700 border-teal-200';
      case 'rejected': return 'bg-danger/10 text-danger border-danger/20';
      default: return 'bg-slate-50 text-text-secondary border-slate-200';
    }
  };

  const tabs = [
    { value: 'all', label: 'All Jobs' },
    { value: 'saved', label: 'Saved' },
    { value: 'applied', label: 'Applied' },
    { value: 'shortlisted', label: 'Shortlisted' },
    { value: 'interview', label: 'Interviews' },
    { value: 'offered', label: 'Offers' },
    { value: 'rejected', label: 'Archived' }
  ];

  const filteredApps = activeTab === 'all' 
    ? applications 
    : applications.filter(app => app.status === activeTab);

  return (
    <div className="flex-1 max-w-7xl mx-auto space-y-6 pb-16 select-none animate-fade-in">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 pb-4 gap-4">
        <div>
          <h2 className="text-xl font-bold font-outfit text-text-primary flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-primary" /> Application Pipeline
          </h2>
          <p className="text-xs text-text-secondary mt-1">Track the status of your saved and applied opportunities.</p>
        </div>
      </div>

      {/* FILTER TABS */}
      <div className="flex overflow-x-auto gap-1.5 pb-2.5 scrollbar-none border-b border-slate-200">
        {tabs.map(tab => {
          const count = tab.value === 'all' 
            ? applications.length 
            : applications.filter(a => a.status === tab.value).length;
          return (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`px-4 py-2.5 text-xs font-semibold rounded-xl border shrink-0 transition-all duration-200 flex items-center gap-2 ${
                activeTab === tab.value
                  ? 'bg-gradient-button text-white border-transparent shadow-glow-purple'
                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-text-secondary hover:text-text-primary'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                activeTab === tab.value 
                  ? 'bg-white/25 text-white' 
                  : 'bg-slate-50 text-text-muted'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* APPLICATIONS LIST */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 glass-card rounded-xl border border-slate-200 animate-pulse" />
          ))}
        </div>
      ) : filteredApps.length === 0 ? (
        <div className="glass-card rounded-xl3 p-12 border border-slate-200 text-center">
          <FolderPlus className="w-10 h-10 text-text-muted mx-auto mb-3" />
          <h3 className="text-base font-bold text-text-primary font-outfit">Pipeline empty in this stage</h3>
          <p className="text-xs text-text-secondary mt-2 max-w-xs mx-auto">
            Swipe right on new jobs in the Discover feed to add them to your tracking pipeline.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredApps.map((app) => (
            <div
              key={app.id}
              className="glass-card rounded-xl border border-slate-200 p-4 flex flex-col md:flex-row items-center justify-between gap-4 hover:border-slate-300 transition-all duration-200"
            >
              
              {/* Left Details */}
              <div className="flex items-center gap-4 min-w-0 flex-1">
                {app.company_logo_url ? (
                  <img src={app.company_logo_url} alt={app.company_name} className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center font-bold text-text-primary text-xs shrink-0">
                    {app.company_name?.charAt(0).toUpperCase()}
                  </div>
                )}

                <div className="min-w-0">
                  <h4 className="font-semibold text-text-primary text-sm truncate">{app.job_title}</h4>
                  <p className="text-xs text-text-secondary truncate mt-0.5">{app.company_name}</p>
                </div>
              </div>

              {/* Status and Score */}
              <div className="flex flex-wrap items-center gap-4 md:gap-6 shrink-0 w-full md:w-auto justify-between md:justify-end">
                {app.match_score && (
                  <span className="flex items-center gap-1 text-xs text-text-secondary">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                    <span className="font-bold text-text-primary font-outfit">{app.match_score.toFixed(0)}%</span> Match
                  </span>
                )}

                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-text-muted flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDistanceToNow(new Date(app.applied_at))} ago
                  </span>
                  
                  <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded border ${getStatusStyle(app.status)}`}>
                    {app.status}
                  </span>
                </div>
              </div>

              <button
                onClick={() => handleWithdraw(app)}
                title="Withdraw application"
                className="flex items-center gap-1 text-[11px] font-semibold text-text-secondary hover:text-danger transition-colors px-2.5 py-1.5 rounded-lg hover:bg-danger/10 shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" /> Withdraw
              </button>

            </div>
          ))}
        </div>
      )}

    </div>
  );
}
