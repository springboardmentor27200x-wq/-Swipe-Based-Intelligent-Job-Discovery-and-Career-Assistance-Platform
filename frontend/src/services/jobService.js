import { api } from './api'

// ── Skills ────────────────────────────────────────────────────────────────────
export const skillsService = {
  search: (q) => api.get(`/jobs/skills/?search=${encodeURIComponent(q)}`).then(r => r.data.data),
}

// ── Companies ─────────────────────────────────────────────────────────────────
export const companyService = {
  list:        ()       => api.get('/jobs/companies/').then(r => r.data.data),
  // Recruiter's own companies — filtered server-side
  myCompanies: ()       => api.get('/jobs/companies/mine/').then(r => r.data.data),
  get:         (id)     => api.get(`/jobs/companies/${id}/`).then(r => r.data.data),
  create:      (data)   => api.post('/jobs/companies/', data).then(r => r.data.data),
  update:      (id, d)  => api.patch(`/jobs/companies/${id}/`, d).then(r => r.data.data),
  delete:      (id)     => api.delete(`/jobs/companies/${id}/`),
}

// ── Jobs ──────────────────────────────────────────────────────────────────────
export const jobService = {
  // Public
  list:    (params = {}) => api.get('/jobs/', { params }).then(r => r.data),
  get:     (id)          => api.get(`/jobs/${id}/`).then(r => r.data.data),
  latest:  ()            => api.get('/jobs/latest/').then(r => r.data.data),
  startups:()            => api.get('/jobs/startups/').then(r => r.data.data),
  mncs:    ()            => api.get('/jobs/mncs/').then(r => r.data.data),

  // Job seeker
  feed:            (params = {}) => api.get('/jobs/feed/', { params }).then(r => r.data.data),
  recommended:     ()            => api.get('/jobs/recommended/').then(r => r.data.data),
  savedJobs:       ()            => api.get('/jobs/saved/').then(r => r.data.data),
  unsaveJob:       (jobId)       => api.delete(`/jobs/saved/${jobId}/`),
  myApplications:  ()            => api.get('/jobs/applications/').then(r => r.data.data),
  applyToJob:      (id, data={}) => api.post(`/jobs/${id}/apply/`, data).then(r => r.data.data),
  seekerStats:     ()            => api.get('/jobs/seeker/stats/').then(r => r.data.data),

  // Swipe
  swipe:           (payload) => api.post('/jobs/swipe/', payload).then(r => r.data.data),
  swipeHistory:    ()        => api.get('/jobs/swipe/history/').then(r => r.data.data),

  // Recruiter
  recruiterJobs:   ()         => api.get('/jobs/recruiter/jobs/').then(r => r.data.data),
  recruiterJobDetail: (id)    => api.get(`/jobs/recruiter/jobs/${id}/`).then(r => r.data.data),
  createJob:       (data)     => api.post('/jobs/recruiter/jobs/', data).then(r => r.data.data),
  updateJob:       (id, data) => api.patch(`/jobs/recruiter/jobs/${id}/`, data).then(r => r.data.data),
  deleteJob:       (id)       => api.delete(`/jobs/recruiter/jobs/${id}/`),
  publishJob:      (id)       => api.post(`/jobs/recruiter/jobs/${id}/publish/`).then(r => r.data.data),
  closeJob:        (id)       => api.post(`/jobs/recruiter/jobs/${id}/close/`).then(r => r.data.data),
  recruiterApplicants: (jid)  => api.get(`/jobs/recruiter/jobs/${jid}/applicants/`).then(r => r.data.data),
  updateApplicationStatus: (jid, aid, newStatus, note) =>
    api.patch(`/jobs/recruiter/jobs/${jid}/applicants/${aid}/`, { status: newStatus, note }).then(r => r.data.data),
  applicantProfile: (jid, aid) => api.get(`/jobs/recruiter/jobs/${jid}/applicants/${aid}/profile/`).then(r => r.data.data),
  recruiterStats:  ()         => api.get('/jobs/recruiter/stats/').then(r => r.data.data),
}
