import { api } from './api'

// ── Analytics / Dashboards / Skill Gap (Milestone 4) ────────────────────────────
export const analyticsService = {
  seekerDashboard:      () => api.get('/dashboard/seeker/').then(r => r.data.data),
  recruiterDashboard:   () => api.get('/dashboard/recruiter/').then(r => r.data.data),
  overview:             () => api.get('/analytics/').then(r => r.data.data),
  applicationHistory:   () => api.get('/application-history/').then(r => r.data.data),

  skillGap:        (jobId) => api.get('/skill-gap/', { params: jobId ? { job_id: jobId } : {} }).then(r => r.data.data),
  skillGapSave:    (jobId) => api.post('/skill-gap/', jobId ? { job_id: jobId } : {}).then(r => r.data.data),
  skillGapHistory: ()      => api.get('/skill-gap/history/').then(r => r.data.data),

  recommendationsHistory: () => api.get('/recommendations/history/').then(r => r.data.data),
}
