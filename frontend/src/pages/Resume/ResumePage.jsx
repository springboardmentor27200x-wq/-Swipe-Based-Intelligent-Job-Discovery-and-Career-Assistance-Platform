import { useEffect, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, FileText, CheckCircle, AlertTriangle, ArrowRight, Trash2, ShieldAlert, Sparkles, Check, X, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import resumeService from '../../services/resumeService';
import api from '../../services/api';
import Button from '../../components/UI/Button.jsx';
import toast from 'react-hot-toast';

export default function ResumePage() {
  const [resumes, setResumes] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    fetchResumes();
    fetchActiveJobs();
  }, []);

  const fetchResumes = async () => {
    try {
      const { data } = await api.get('/resume/');
      setResumes(data);
      // Auto select first resume if available
      if (data.length > 0 && !selectedResumeId) {
        const primary = data.find(r => r.is_primary) || data[0];
        setSelectedResumeId(primary.id);
      }
    } catch (err) {
      toast.error("Failed to load resumes.");
    }
  };

  const fetchActiveJobs = async () => {
    try {
      const { data } = await api.get('/jobs/');
      setJobs(data);
      if (data.length > 0) setSelectedJobId(data[0].id);
    } catch (err) {
      // fail silently
    }
  };

  const onDrop = async (acceptedFiles) => {
    if (acceptedFiles.length === 0) return;
    setIsUploading(true);
    const file = acceptedFiles[0];
    const formData = new FormData();
    formData.append('file', file);

    try {
      await resumeService.upload(formData);
      toast.success("Resume uploaded and parsed successfully!");
      fetchResumes();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Upload failed. Try PDF or DOCX.");
    } finally {
      setIsUploading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxFiles: 1
  });

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this resume?")) return;
    try {
      await resumeService.delete(id);
      toast.success("Resume deleted.");
      fetchResumes();
      if (selectedResumeId === id) setSelectedResumeId('');
    } catch (err) {
      toast.error("Delete failed.");
    }
  };

  const handleSetPrimary = async (id) => {
    try {
      await resumeService.setPrimary(id);
      toast.success("Primary resume updated.");
      fetchResumes();
    } catch (err) {
      toast.error("Action failed.");
    }
  };

  const runAnalysis = async () => {
    if (!selectedResumeId) {
      toast.error("Please upload or select a resume first");
      return;
    }
    if (!selectedJobId) {
      toast.error("Please select a job description to score against");
      return;
    }

    setIsAnalyzing(true);
    setAnalysisResult(null);

    try {
      const { data } = await api.post('/resume/analyze', {
        resume_id: parseInt(selectedResumeId),
        job_id: parseInt(selectedJobId)
      });
      setAnalysisResult(data);
      toast.success("ATS Compatibility Analysis Completed!");
    } catch (err) {
      toast.error("Analysis failed. Please verify selected items.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getScoreColor = (score) => {
    if (score < 40) return 'text-danger stroke-danger';
    if (score < 60) return 'text-orange-400 stroke-orange-400';
    if (score < 80) return 'text-accent stroke-accent';
    return 'text-success stroke-success';
  };

  return (
    <div className="flex-1 max-w-7xl mx-auto space-y-8 select-none pb-16">
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN (MANAGEMENT & UPLOAD) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-card rounded-xl3 border border-slate-200 p-6 space-y-6">
            <h3 className="text-sm font-bold font-outfit text-text-primary uppercase tracking-wider flex items-center gap-2">
              <UploadCloud className="w-4 h-4 text-primary" /> Manage Resumes
            </h3>

            {/* Dropzone Upload */}
            <div 
              {...getRootProps()} 
              className={`border-2 border-dashed rounded-xl2 p-6 text-center cursor-pointer transition-all duration-200 ${
                isDragActive 
                  ? 'border-primary bg-primary/5' 
                  : 'border-slate-200 bg-slate-50 hover:bg-slate-50'
              }`}
            >
              <input {...getInputProps()} />
              {isUploading ? (
                <div className="flex flex-col items-center py-4">
                  <RefreshCw className="w-8 h-8 text-primary animate-spin" />
                  <p className="text-xs text-text-secondary mt-3">Uploading and extracting text...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <UploadCloud className="w-10 h-10 text-text-secondary mb-3 group-hover:scale-105 transition-transform" />
                  <p className="text-xs font-semibold text-text-primary">Drag & drop your resume</p>
                  <p className="text-[10px] text-text-muted mt-1">Supports PDF, DOCX (Max 10MB)</p>
                </div>
              )}
            </div>

            {/* Resumes List */}
            <div className="space-y-2.5">
              {resumes.map((r) => (
                <div
                  key={r.id}
                  onClick={() => setSelectedResumeId(r.id)}
                  className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all duration-200 ${
                    selectedResumeId === r.id
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-slate-200 bg-slate-50 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText className={`w-5 h-5 shrink-0 ${r.is_primary ? 'text-primary' : 'text-text-secondary'}`} />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-text-primary truncate">{r.filename}</p>
                      <p className="text-[10px] text-text-secondary mt-0.5">{(r.file_size / 1024).toFixed(0)} KB</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {r.is_primary ? (
                      <span className="px-2 py-0.5 text-[9px] font-bold uppercase rounded bg-primary/10 text-primary border border-primary/20">Primary</span>
                    ) : (
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleSetPrimary(r.id); }}
                        className="text-[9px] font-bold uppercase hover:text-primary-light text-text-secondary transition-colors"
                      >
                        Set Primary
                      </button>
                    )}
                    <button 
                      onClick={(e) => handleDelete(r.id, e)}
                      className="p-1.5 rounded-lg text-text-secondary hover:text-danger hover:bg-danger/10 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

          </div>

          {/* ANALYSIS CONTROLLER TRIGGER */}
          <div className="glass-card rounded-xl3 border border-slate-200 p-6 space-y-4">
            <h3 className="text-sm font-bold font-outfit text-text-primary uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" /> ATS Score Calculator
            </h3>
            
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-text-muted mb-2">Select Target Job Description</label>
              <select
                value={selectedJobId}
                onChange={e => setSelectedJobId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs text-text-primary focus:outline-none focus:border-primary/50 transition-colors"
              >
                {jobs.map(job => (
                  <option key={job.id} value={job.id} className="bg-white text-text-primary text-xs">
                    {job.title} ({job.company?.name || 'MNC'})
                  </option>
                ))}
              </select>
            </div>

            <Button
              onClick={runAnalysis}
              isLoading={isAnalyzing}
              disabled={resumes.length === 0}
              fullWidth
              size="md"
              iconRight={<ArrowRight className="w-4 h-4" />}
            >
              Analyze Match Score
            </Button>
          </div>
        </div>

        {/* RIGHT COLUMN (ANALYSIS DISPLAY) */}
        <div className="lg:col-span-7">
          <AnimatePresence mode="wait">
            {isAnalyzing ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="glass-card rounded-xl3 border border-slate-200 p-12 text-center h-full flex flex-col items-center justify-center min-h-[400px]"
              >
                <div className="relative w-16 h-16 flex items-center justify-center">
                  <div className="w-full h-full rounded-full border-4 border-t-primary border-slate-200 animate-spin shadow-glow-purple" />
                  <Sparkles className="w-5 h-5 text-primary absolute animate-bounce" />
                </div>
                <h4 className="text-sm font-semibold text-text-primary mt-6 font-outfit">Parsing Resume Content</h4>
                <p className="text-xs text-text-secondary mt-2">Running keyword intersection analysis & calculating score...</p>
              </motion.div>
            ) : analysisResult ? (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15 }}
                className="glass-card rounded-xl3 border border-slate-200 p-6 space-y-6"
              >
                
                {/* Score gauge and header */}
                <div className="flex flex-col md:flex-row items-center gap-6 pb-6 border-b border-slate-200">
                  {/* Gauge dial */}
                  <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                      <circle cx="18" cy="18" r="16" fill="none" stroke="#e5e8ee" strokeWidth="3" />
                      <circle 
                        cx="18" 
                        cy="18" 
                        r="16" 
                        fill="none" 
                        strokeWidth="3" 
                        strokeDasharray="100" 
                        strokeDashoffset={100 - analysisResult.score} 
                        strokeLinecap="round" 
                        className={`transition-all duration-1000 ${
                          analysisResult.score < 40 
                            ? 'stroke-danger' 
                            : analysisResult.score < 65 
                            ? 'stroke-orange-400' 
                            : analysisResult.score < 80 
                            ? 'stroke-accent' 
                            : 'stroke-success'
                        }`}
                      />
                    </svg>
                    <span className="absolute text-2xl font-black text-text-primary font-outfit">{analysisResult.score.toFixed(0)}%</span>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold font-outfit text-text-primary">ATS Compatibility Result</h3>
                    <p className="text-xs text-text-secondary mt-1">
                      Target Role: <span className="text-primary font-medium">
                        {jobs.find(j => j.id === parseInt(selectedJobId))?.title}
                      </span>
                    </p>
                    
                    {/* Level check */}
                    <div className="flex gap-4 mt-3">
                      <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                        <CheckCircle className={`w-4 h-4 ${analysisResult.sections_found.experience ? 'text-success' : 'text-text-muted'}`} />
                        <span>Experience</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                        <CheckCircle className={`w-4 h-4 ${analysisResult.sections_found.skills ? 'text-success' : 'text-text-muted'}`} />
                        <span>Skills List</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                        <CheckCircle className={`w-4 h-4 ${analysisResult.sections_found.education ? 'text-success' : 'text-text-muted'}`} />
                        <span>Education</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Skills analysis */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Matched skills */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-success mb-3 flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5" /> Matched Skills ({analysisResult.matched_skills.length})
                    </h4>
                    {analysisResult.matched_skills.length === 0 ? (
                      <p className="text-xs text-text-muted italic">No matching skills detected.</p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {analysisResult.matched_skills.map(s => (
                          <span key={s} className="px-2 py-0.5 text-[10px] font-semibold rounded bg-success/10 text-success border border-success/10">
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Missing skills */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-danger mb-3 flex items-center gap-1.5">
                      <X className="w-3.5 h-3.5" /> Missing Skills ({analysisResult.missing_skills.length})
                    </h4>
                    {analysisResult.missing_skills.length === 0 ? (
                      <p className="text-xs text-success font-medium flex items-center gap-1">Perfect! No skills missing.</p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {analysisResult.missing_skills.map(s => (
                          <span key={s} className="px-2 py-0.5 text-[10px] font-semibold rounded bg-danger/10 text-danger border border-danger/10">
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Suggestions */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-accent" /> Optimization Recommendations
                  </h4>
                  <div className="space-y-2">
                    {analysisResult.suggestions.map((suggestion, idx) => (
                      <div key={idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex gap-3 text-xs text-text-secondary leading-relaxed">
                        <span className="w-5 h-5 rounded bg-primary/10 text-primary flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <span>{suggestion}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </motion.div>
            ) : (
              <div className="glass-card rounded-xl3 border border-slate-200 p-12 text-center h-full flex flex-col items-center justify-center min-h-[400px]">
                <FileText className="w-12 h-12 text-text-muted mb-4" />
                <h3 className="text-base font-bold text-text-primary font-outfit">Run Resume Match Checker</h3>
                <p className="text-xs text-text-secondary mt-2 max-w-sm mx-auto leading-relaxed">
                  Select a resume from your uploads and choose a target job openings posting, then click 'Analyze' to compute compatibility ratings, detect missing skills, and unlock optimization steps.
                </p>
              </div>
            )}
          </AnimatePresence>
        </div>

      </div>

    </div>
  );
}
