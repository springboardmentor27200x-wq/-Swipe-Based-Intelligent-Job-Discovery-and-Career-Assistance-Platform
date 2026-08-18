import { api } from './api'

// ── Resumes (Milestone 3) ───────────────────────────────────────────────────────
export const resumeService = {
  // Upload a new resume (multipart/form-data). Becomes the primary resume.
  upload: (file, onUploadProgress) => {
    const formData = new FormData()
    formData.append('file', file)
    return api
      .post('/resumes/upload/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress,
      })
      .then((r) => r.data)
  },

  list:      ()     => api.get('/resumes/').then(r => r.data.data),
  primary:   ()     => api.get('/resumes/primary/').then(r => r.data.data),
  get:       (id)   => api.get(`/resumes/${id}/`).then(r => r.data.data),
  delete:    (id)   => api.delete(`/resumes/${id}/`),
  setPrimary:(id)   => api.post(`/resumes/${id}/set-primary/`).then(r => r.data.data),
  reparse:   (id)   => api.post(`/resumes/${id}/reparse/`).then(r => r.data.data),

  // ATS score / compatibility / missing skills / suggestions for a given job
  matchForJob: (jobId) => api.get(`/resumes/match/${jobId}/`).then(r => r.data),
}
