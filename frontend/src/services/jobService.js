import api from './api.js';

const jobService = {
  getFeed: () => api.get('/jobs/feed'),
  getAll: (params = {}) => api.get('/jobs/', { params }),
  getById: (id) => api.get(`/jobs/${id}`),
  create: (data) => api.post('/jobs/', data),
  update: (id, data) => api.put(`/jobs/${id}`, data),
  delete: (id) => api.delete(`/jobs/${id}`),
  getMyJobs: () => api.get('/jobs/my-jobs'),
  getApplicants: () => api.get('/recruiter/applicants'),
  updateApplicantStatus: (applicationId, statusValue) =>
    api.put(`/recruiter/applications/${applicationId}/status`, { status: statusValue }),
};

export default jobService;
