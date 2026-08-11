import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Search, MapPin, DollarSign, Briefcase, Filter, X, Check, Bookmark, Sparkles, Building2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchAllJobs, setFilters, clearFilters } from '../../store/jobsSlice';
import swipeService from '../../services/swipeService';
import Button from '../../components/UI/Button.jsx';
import toast from 'react-hot-toast';

export default function JobsPage() {
  const dispatch = useDispatch();
  const { allJobs, filters, isLoading } = useSelector(s => s.jobs);
  
  const [localSearch, setLocalSearch] = useState(filters.search || '');
  const [selectedJobDetail, setSelectedJobDetail] = useState(null);

  // Load jobs on change
  useEffect(() => {
    dispatch(fetchAllJobs(filters));
  }, [dispatch, filters]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    dispatch(setFilters({ search: localSearch }));
  };

  const handleFilterSelect = (key, value) => {
    dispatch(setFilters({ [key]: value }));
  };

  const handleAction = async (job, action) => {
    try {
      await swipeService.swipe(job.id, action);
      if (action === 'apply') {
        toast.success(`Applied for ${job.title}!`);
      } else if (action === 'save') {
        toast.success(`Saved ${job.title}!`);
      }
      setSelectedJobDetail(null);
      // Reload jobs list to update states
      dispatch(fetchAllJobs(filters));
    } catch (err) {
      toast.error("Failed to execute action.");
    }
  };

  const clearAll = () => {
    setLocalSearch('');
    dispatch(clearFilters());
  };

  return (
    <div className="flex-1 flex flex-col xl:flex-row gap-8 max-w-7xl mx-auto min-h-screen pb-12 select-none">
      
      {/* FILTER PANEL SIDEBAR */}
      <div className="w-full xl:w-72 shrink-0">
        <div className="glass-card rounded-xl3 border border-slate-200 p-6 space-y-6 sticky top-28">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold font-outfit text-text-primary uppercase tracking-wider flex items-center gap-2">
              <Filter className="w-4 h-4 text-primary" /> Filters
            </span>
            <button 
              onClick={clearAll}
              className="text-[10px] font-bold uppercase tracking-wider text-text-muted hover:text-primary transition-colors"
            >
              Clear All
            </button>
          </div>

          {/* Search Box */}
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              value={localSearch}
              onChange={e => setLocalSearch(e.target.value)}
              placeholder="Search job title, company..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-xs text-text-primary placeholder-text-muted focus:outline-none focus:border-primary/50 transition-all duration-200"
            />
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-text-secondary" />
          </form>

          {/* Company Type Filter */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-text-muted mb-2">Company Type</label>
            <div className="flex flex-col gap-1.5">
              {[
                { value: '', label: 'All Companies' },
                { value: 'mnc', label: 'Multi-Nationals (MNC)' },
                { value: 'startup', label: 'Fast-Growth Startups' },
                { value: 'new_startup', label: 'Newly Founded Startups' }
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => handleFilterSelect('company_type', opt.value)}
                  className={`text-left px-3 py-2 text-xs rounded-lg transition-all duration-200 ${
                    filters.company_type === opt.value
                      ? 'bg-primary/10 text-primary font-medium border border-primary/20'
                      : 'text-text-secondary hover:bg-slate-50 border border-transparent'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Job Type Filter */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-text-muted mb-2">Job Type</label>
            <div className="flex flex-wrap gap-1.5">
              {[
                { value: '', label: 'All Types' },
                { value: 'full_time', label: 'Full-time' },
                { value: 'remote', label: 'Remote' },
                { value: 'internship', label: 'Internships' }
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => handleFilterSelect('job_type', opt.value)}
                  className={`px-2.5 py-1.5 text-xs rounded-lg border transition-all duration-200 ${
                    filters.job_type === opt.value
                      ? 'bg-primary/10 border-primary text-primary'
                      : 'border-slate-200 bg-slate-50 text-text-secondary hover:bg-slate-100'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Experience level */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-text-muted mb-2">Experience level</label>
            <div className="flex flex-col gap-1.5">
              {[
                { value: '', label: 'Any Experience' },
                { value: 'fresher', label: 'Fresher-Friendly' },
                { value: 'junior', label: 'Junior (1-3 yrs)' },
                { value: 'mid', label: 'Mid-Level (3-5 yrs)' },
                { value: 'senior', label: 'Senior (5+ yrs)' }
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => handleFilterSelect('experience_level', opt.value)}
                  className={`text-left px-3 py-2 text-xs rounded-lg transition-all duration-200 ${
                    filters.experience_level === opt.value
                      ? 'bg-primary/10 text-primary font-medium border border-primary/20'
                      : 'text-text-secondary hover:bg-slate-50 border border-transparent'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* JOBS GRID DISPLAY */}
      <div className="flex-1">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 4, 5, 6].map(i => (
              <div key={i} className="h-44 glass-card rounded-xl border border-slate-200 animate-pulse" />
            ))}
          </div>
        ) : allJobs.length === 0 ? (
          <div className="glass-card rounded-xl3 p-12 border border-slate-200 text-center">
            <h3 className="text-lg font-bold text-text-primary font-outfit">No jobs match your search</h3>
            <p className="text-sm text-text-secondary mt-2">Try relaxing or changing your active filters</p>
            <Button onClick={clearAll} size="sm" className="mt-4" variant="outline">Reset Filters</Button>
          </div>
        ) : (
          <motion.div 
            initial="hidden"
            animate="show"
            variants={{
              hidden: {},
              show: { transition: { staggerChildren: 0.05 } }
            }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            {allJobs.map((job) => (
              <motion.div
                key={job.id}
                variants={{
                  hidden: { opacity: 0, y: 12 },
                  show: { opacity: 1, y: 0 }
                }}
                whileHover={{ scale: 1.01, borderColor: 'rgba(79,70,229,0.3)' }}
                onClick={() => setSelectedJobDetail(job)}
                className="glass-card rounded-xl border border-slate-200 p-5 flex flex-col justify-between shadow-sm cursor-pointer hover:shadow-glow-purple transition-all duration-300 relative group overflow-hidden"
              >
                {/* Gradient ribbon top */}
                <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${
                  job.company?.company_type === 'mnc'
                    ? 'from-primary to-primary-light'
                    : job.company?.company_type === 'startup'
                    ? 'from-secondary to-blue-400'
                    : 'from-accent to-yellow-500'
                }`} />

                <div>
                  <div className="flex items-start gap-4">
                    {job.company?.logo_url ? (
                      <img 
                        src={job.company.logo_url} 
                        alt={job.company.name} 
                        className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0" 
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center font-bold text-white text-xs shrink-0">
                        {job.company?.name?.charAt(0).toUpperCase() || 'J'}
                      </div>
                    )}
                    <div>
                      <h4 className="font-semibold text-text-primary text-sm group-hover:text-primary transition-colors line-clamp-1">{job.title}</h4>
                      <p className="text-[11px] text-text-secondary flex items-center gap-1 font-medium">
                        {job.company?.name} • <span className="text-[9px] uppercase font-bold text-primary-light">{job.company?.company_type}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mt-4">
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-slate-50 border border-slate-200 text-text-secondary flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {job.location}
                    </span>
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-slate-50 border border-slate-200 text-text-secondary capitalize">
                      {job.job_type?.replace('_', ' ')}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${
                      job.competition_level === 'low'
                        ? 'bg-success/15 text-success'
                        : job.competition_level === 'medium'
                        ? 'bg-accent/15 text-accent'
                        : 'bg-danger/15 text-danger'
                    }`}>
                      {job.competition_level} comp
                    </span>
                  </div>

                  <p className="text-xs text-text-secondary mt-3 leading-relaxed line-clamp-2">
                    {job.description}
                  </p>
                </div>

                <div className="border-t border-slate-200 pt-3.5 mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5 text-text-muted" />
                    <span className="text-xs font-bold text-text-primary">
                      ₹{(job.min_salary / 1000).toFixed(0)}k - {(job.max_salary / 1000).toFixed(0)}k / mo
                    </span>
                  </div>
                  
                  {/* Match dial placeholder badge */}
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                    Match {(job.match_score || 72).toFixed(0)}%
                  </span>
                </div>

              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {/* EXPANDED DETAILED MODAL */}
      <AnimatePresence>
        {selectedJobDetail && (
          <>
            {/* Click outside Overlay blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedJobDetail(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            >
              {/* Modal Container */}
              <motion.div
                initial={{ scale: 0.95, y: 15 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 15 }}
                onClick={e => e.stopPropagation()}
                className="w-full max-w-xl bg-bg-secondary border border-slate-200 rounded-xl3 p-6 shadow-card overflow-hidden max-h-[85vh] flex flex-col justify-between"
              >
                
                {/* Header info */}
                <div>
                  <div className="flex items-start justify-between border-b border-slate-200 pb-4 mb-4">
                    <div className="flex items-center gap-4">
                      {selectedJobDetail.company?.logo_url ? (
                        <img 
                          src={selectedJobDetail.company.logo_url} 
                          alt={selectedJobDetail.company.name} 
                          className="w-12 h-12 rounded-xl object-cover border border-slate-200"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center font-bold text-white text-base">
                          {selectedJobDetail.company?.name?.charAt(0).toUpperCase() || 'J'}
                        </div>
                      )}
                      <div>
                        <h3 className="font-bold text-text-primary text-lg font-outfit">{selectedJobDetail.title}</h3>
                        <p className="text-xs text-text-secondary mt-0.5">{selectedJobDetail.company?.name} • ★ {selectedJobDetail.company?.rating || '4.2'}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setSelectedJobDetail(null)}
                      className="p-1.5 rounded-lg bg-slate-50 border border-slate-200 text-text-secondary hover:text-text-primary"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Scrollable specs */}
                  <div className="overflow-y-auto pr-1 space-y-5 max-h-[45vh] scrollbar-thin">
                    <div>
                      <h4 className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-2">Description</h4>
                      <p className="text-xs text-text-secondary leading-relaxed">{selectedJobDetail.description}</p>
                    </div>

                    <div>
                      <h4 className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-2">Skills Required</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedJobDetail.skills_required?.map(skill => (
                          <span key={skill} className="px-2 py-0.5 text-[10px] font-semibold rounded bg-primary/10 text-primary border border-primary/20">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-2">Requirements</h4>
                      <ul className="space-y-1.5">
                        {selectedJobDetail.requirements?.map((req, i) => (
                          <li key={i} className="text-xs text-text-secondary flex items-start gap-2">
                            <span className="w-1 h-1 rounded-full bg-primary mt-2 shrink-0" />
                            <span>{req}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-2">Company Information</h4>
                      <div className="grid grid-cols-2 gap-4 bg-slate-50 border border-slate-200 p-4 rounded-xl">
                        <div className="text-xs">
                          <p className="text-text-secondary font-medium">Type</p>
                          <p className="text-text-primary font-bold capitalize mt-0.5">{selectedJobDetail.company?.company_type?.replace('_', ' ')}</p>
                        </div>
                        <div className="text-xs">
                          <p className="text-text-secondary font-medium">Industry</p>
                          <p className="text-text-primary font-bold mt-0.5">{selectedJobDetail.company?.industry}</p>
                        </div>
                        <div className="text-xs">
                          <p className="text-text-secondary font-medium">Size</p>
                          <p className="text-text-primary font-bold mt-0.5">{selectedJobDetail.company?.size} employees</p>
                        </div>
                        <div className="text-xs">
                          <p className="text-text-secondary font-medium">Location</p>
                          <p className="text-text-primary font-bold mt-0.5">{selectedJobDetail.company?.location}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer buttons */}
                <div className="flex gap-4 border-t border-slate-200 pt-4 mt-4">
                  <Button
                    onClick={() => handleAction(selectedJobDetail, 'save')}
                    variant="secondary"
                    fullWidth
                    icon={<Bookmark className="w-4 h-4 text-accent" />}
                  >
                    Save Opportunity
                  </Button>
                  <Button
                    onClick={() => handleAction(selectedJobDetail, 'apply')}
                    variant="primary"
                    fullWidth
                    icon={<Check className="w-4 h-4" />}
                  >
                    Apply Now
                  </Button>
                </div>

              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
