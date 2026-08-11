import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2, Plus, Users, Briefcase, X, MapPin, DollarSign, Trash2, Edit3,
} from 'lucide-react';
import toast from 'react-hot-toast';
import jobService from '../../services/jobService.js';
import companyService from '../../services/companyService.js';
import Button from '../../components/UI/Button.jsx';
import { formatSalary, timeAgo, getStatusConfig } from '../../utils/helpers.js';

const EMPTY_JOB_FORM = {
  title: '', company_id: '', description: '', job_type: 'full_time',
  experience_level: 'fresher', min_salary: '', max_salary: '', location: '',
  is_remote: false, skills_required: '', tags: '',
};

const EMPTY_COMPANY_FORM = {
  name: '', company_type: 'startup', industry: '', size: '11-50', location: '',
};

export default function RecruiterPage() {
  const [tab, setTab] = useState('jobs');
  const [jobs, setJobs] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [applicants, setApplicants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [showJobModal, setShowJobModal] = useState(false);
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [jobForm, setJobForm] = useState(EMPTY_JOB_FORM);
  const [companyForm, setCompanyForm] = useState(EMPTY_COMPANY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setIsLoading(true);
    try {
      const [jobsRes, companiesRes, applicantsRes] = await Promise.all([
        jobService.getMyJobs(),
        companyService.getAll(),
        jobService.getApplicants(),
      ]);
      setJobs(jobsRes.data);
      setCompanies(companiesRes.data);
      setApplicants(applicantsRes.data);
    } catch (err) {
      toast.error('Failed to load recruiter data.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCompany = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const { data } = await companyService.create(companyForm);
      setCompanies((c) => [...c, data]);
      setJobForm((f) => ({ ...f, company_id: data.id }));
      toast.success('Company added!');
      setShowCompanyModal(false);
      setCompanyForm(EMPTY_COMPANY_FORM);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create company.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateJob = async (e) => {
    e.preventDefault();
    if (!jobForm.company_id) {
      toast.error('Please select or add a company first.');
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = {
        ...jobForm,
        company_id: Number(jobForm.company_id),
        min_salary: jobForm.min_salary ? Number(jobForm.min_salary) : null,
        max_salary: jobForm.max_salary ? Number(jobForm.max_salary) : null,
        skills_required: jobForm.skills_required.split(',').map((s) => s.trim()).filter(Boolean),
        tags: jobForm.tags.split(',').map((s) => s.trim()).filter(Boolean),
        requirements: [],
        benefits: [],
      };
      await jobService.create(payload);
      toast.success('Job posted successfully!');
      setShowJobModal(false);
      setJobForm(EMPTY_JOB_FORM);
      loadAll();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to post job.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteJob = async (jobId) => {
    try {
      await jobService.delete(jobId);
      toast.success('Job removed.');
      setJobs((prev) => prev.filter((j) => j.id !== jobId));
    } catch (err) {
      toast.error('Failed to remove job.');
    }
  };

  const handleStatusChange = async (applicationId, newStatus) => {
    try {
      await jobService.updateApplicantStatus(applicationId, newStatus);
      setApplicants((prev) => prev.map((a) => (a.application_id === applicationId ? { ...a, status: newStatus } : a)));
      toast.success(`Marked as ${newStatus}`);
    } catch (err) {
      toast.error('Failed to update status.');
    }
  };

  const STATUS_OPTIONS = ['applied', 'shortlisted', 'interview', 'offered', 'rejected'];

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[70vh]">
        <div className="w-12 h-12 rounded-full border-4 border-t-primary border-slate-200 animate-spin" />
        <p className="text-xs text-text-secondary mt-4 font-medium">Loading recruiter panel...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 max-w-6xl mx-auto space-y-6 pb-16 animate-fade-in font-inter">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold font-outfit text-text-primary flex items-center gap-2">
            <Building2 className="w-6 h-6 text-primary" /> Recruiter Panel
          </h1>
          <p className="text-sm text-text-secondary mt-1">Post jobs and manage your candidate pipeline.</p>
        </div>
        <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={() => setShowJobModal(true)}>
          Post a Job
        </Button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="glass-card rounded-xl border border-slate-200 p-5">
          <span className="text-[10px] uppercase font-bold text-text-secondary tracking-wider">Active Jobs</span>
          <p className="text-xl font-bold font-outfit text-text-primary mt-1">{jobs.filter((j) => j.is_active).length}</p>
        </div>
        <div className="glass-card rounded-xl border border-slate-200 p-5">
          <span className="text-[10px] uppercase font-bold text-text-secondary tracking-wider">Total Applicants</span>
          <p className="text-xl font-bold font-outfit text-text-primary mt-1">{applicants.length}</p>
        </div>
        <div className="glass-card rounded-xl border border-slate-200 p-5">
          <span className="text-[10px] uppercase font-bold text-text-secondary tracking-wider">Shortlisted</span>
          <p className="text-xl font-bold font-outfit text-text-primary mt-1">
            {applicants.filter((a) => a.status === 'shortlisted').length}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        {[{ value: 'jobs', label: 'My Job Postings', icon: Briefcase }, { value: 'applicants', label: 'Applicants', icon: Users }].map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.value}
              onClick={() => setTab(t.value)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all ${
                tab === t.value ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-text-primary'
              }`}
            >
              <Icon className="w-4 h-4" /> {t.label}
            </button>
          );
        })}
      </div>

      {tab === 'jobs' && (
        <div className="space-y-4">
          {jobs.length === 0 && (
            <div className="glass-card rounded-2xl border border-slate-200 p-12 text-center">
              <Briefcase className="w-10 h-10 text-text-muted mx-auto mb-3" />
              <p className="text-text-secondary text-sm">You haven't posted any jobs yet.</p>
            </div>
          )}
          {jobs.map((job) => (
            <motion.div key={job.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card-hover rounded-2xl border border-slate-200 p-6 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-text-primary truncate">{job.title}</h3>
                  <span className={`badge ${job.is_active ? 'bg-success/15 text-success border-success/20' : 'bg-slate-50 text-text-muted border-slate-200'}`}>
                    {job.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-text-secondary mt-1.5 flex-wrap">
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {job.location}</span>
                  <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" /> {formatSalary(job.min_salary, job.max_salary)}</span>
                  <span>{job.applicant_count} applicants</span>
                  <span>Posted {timeAgo(job.created_at)}</span>
                </div>
              </div>
              <Button variant="danger" size="sm" icon={<Trash2 className="w-3.5 h-3.5" />} onClick={() => handleDeleteJob(job.id)}>
                Remove
              </Button>
            </motion.div>
          ))}
        </div>
      )}

      {tab === 'applicants' && (
        <div className="space-y-4">
          {applicants.length === 0 && (
            <div className="glass-card rounded-2xl border border-slate-200 p-12 text-center">
              <Users className="w-10 h-10 text-text-muted mx-auto mb-3" />
              <p className="text-text-secondary text-sm">No applicants yet.</p>
            </div>
          )}
          {applicants.map((a) => {
            const cfg = getStatusConfig(a.status);
            return (
              <motion.div key={a.application_id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl border border-slate-200 p-6 flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <p className="font-semibold text-text-primary">{a.applicant_name}</p>
                  <p className="text-xs text-text-secondary">{a.applicant_email}</p>
                  <p className="text-xs text-text-muted mt-1">Applied for <span className="text-text-secondary">{a.job_title}</span> · {timeAgo(a.applied_at)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="badge" style={{ color: cfg.color, background: cfg.bg }}>{cfg.label}</span>
                  <select
                    value={a.status}
                    onChange={(e) => handleStatusChange(a.application_id, e.target.value)}
                    className="input-glass !w-auto !py-2 text-xs"
                  >
                    {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Post Job Modal */}
      <AnimatePresence>
        {showJobModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowJobModal(false)}>
            <motion.form
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              onClick={(e) => e.stopPropagation()} onSubmit={handleCreateJob}
              className="glass-card rounded-2xl border border-slate-200 p-8 max-w-lg w-full space-y-4 max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold font-outfit text-text-primary">Post a New Job</h2>
                <button type="button" onClick={() => setShowJobModal(false)}><X className="w-5 h-5 text-text-secondary" /></button>
              </div>

              <input className="input-glass" placeholder="Job title" required value={jobForm.title} onChange={(e) => setJobForm((f) => ({ ...f, title: e.target.value }))} />

              <div className="flex gap-2">
                <select className="input-glass" required value={jobForm.company_id} onChange={(e) => setJobForm((f) => ({ ...f, company_id: e.target.value }))}>
                  <option value="">Select company...</option>
                  {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <Button type="button" variant="secondary" onClick={() => setShowCompanyModal(true)}>New</Button>
              </div>

              <textarea rows={3} className="input-glass resize-none" placeholder="Job description" required value={jobForm.description} onChange={(e) => setJobForm((f) => ({ ...f, description: e.target.value }))} />

              <div className="grid grid-cols-2 gap-3">
                <select className="input-glass" value={jobForm.job_type} onChange={(e) => setJobForm((f) => ({ ...f, job_type: e.target.value }))}>
                  <option value="full_time">Full-time</option>
                  <option value="part_time">Part-time</option>
                  <option value="internship">Internship</option>
                  <option value="contract">Contract</option>
                </select>
                <select className="input-glass" value={jobForm.experience_level} onChange={(e) => setJobForm((f) => ({ ...f, experience_level: e.target.value }))}>
                  <option value="fresher">Fresher</option>
                  <option value="junior">Junior</option>
                  <option value="mid">Mid</option>
                  <option value="senior">Senior</option>
                  <option value="lead">Lead</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <input type="number" className="input-glass" placeholder="Min salary" value={jobForm.min_salary} onChange={(e) => setJobForm((f) => ({ ...f, min_salary: e.target.value }))} />
                <input type="number" className="input-glass" placeholder="Max salary" value={jobForm.max_salary} onChange={(e) => setJobForm((f) => ({ ...f, max_salary: e.target.value }))} />
              </div>

              <input className="input-glass" placeholder="Location" required value={jobForm.location} onChange={(e) => setJobForm((f) => ({ ...f, location: e.target.value }))} />
              <label className="flex items-center gap-2 text-sm text-text-secondary">
                <input type="checkbox" checked={jobForm.is_remote} onChange={(e) => setJobForm((f) => ({ ...f, is_remote: e.target.checked }))} /> Remote friendly
              </label>
              <input className="input-glass" placeholder="Skills required (comma separated)" value={jobForm.skills_required} onChange={(e) => setJobForm((f) => ({ ...f, skills_required: e.target.value }))} />
              <input className="input-glass" placeholder="Tags (comma separated)" value={jobForm.tags} onChange={(e) => setJobForm((f) => ({ ...f, tags: e.target.value }))} />

              <Button type="submit" variant="primary" fullWidth isLoading={isSubmitting}>Post Job</Button>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* New Company Modal */}
      <AnimatePresence>
        {showCompanyModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4" onClick={() => setShowCompanyModal(false)}>
            <motion.form
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              onClick={(e) => e.stopPropagation()} onSubmit={handleCreateCompany}
              className="glass-card rounded-2xl border border-slate-200 p-8 max-w-md w-full space-y-4"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold font-outfit text-text-primary">Add Company</h2>
                <button type="button" onClick={() => setShowCompanyModal(false)}><X className="w-5 h-5 text-text-secondary" /></button>
              </div>
              <input className="input-glass" placeholder="Company name" required value={companyForm.name} onChange={(e) => setCompanyForm((f) => ({ ...f, name: e.target.value }))} />
              <select className="input-glass" value={companyForm.company_type} onChange={(e) => setCompanyForm((f) => ({ ...f, company_type: e.target.value }))}>
                <option value="mnc">MNC</option>
                <option value="startup">Startup</option>
                <option value="new_startup">New Startup</option>
              </select>
              <input className="input-glass" placeholder="Industry" required value={companyForm.industry} onChange={(e) => setCompanyForm((f) => ({ ...f, industry: e.target.value }))} />
              <input className="input-glass" placeholder="Company size (e.g. 11-50)" value={companyForm.size} onChange={(e) => setCompanyForm((f) => ({ ...f, size: e.target.value }))} />
              <input className="input-glass" placeholder="Location" required value={companyForm.location} onChange={(e) => setCompanyForm((f) => ({ ...f, location: e.target.value }))} />
              <Button type="submit" variant="primary" fullWidth isLoading={isSubmitting}>Add Company</Button>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
