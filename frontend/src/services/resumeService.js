import api from './api.js';

const resumeService = {
  upload: (formData) =>
    api.post('/resume/upload', formData, {
      headers: { 'Content-Type': undefined },
    }),

  getAll: () => api.get('/resume/'),

  delete: (id) => api.delete(`/resume/${id}`),

  setPrimary: (id) => api.put(`/resume/${id}/set-primary`),

  analyze: (resumeId, jobId) =>
    api.post('/resume/analyze', { resume_id: resumeId, job_id: jobId }),
};

export default resumeService;
