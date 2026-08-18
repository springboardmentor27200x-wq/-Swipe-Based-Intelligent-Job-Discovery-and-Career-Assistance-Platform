import { api } from './api'

// ── Notifications (Milestone 4) ────────────────────────────────────────────────
export const notificationService = {
  list:         (params = {}) => api.get('/notifications/', { params }).then(r => r.data),
  unreadCount:  ()             => api.get('/notifications/unread-count/').then(r => r.data.data.unread_count),
  markRead:     (id)           => api.patch(`/notifications/${id}/read/`).then(r => r.data.data),
  markAllRead:  ()             => api.post('/notifications/mark-all-read/').then(r => r.data.data),
  remove:       (id)           => api.delete(`/notifications/${id}/`),
  create:       (data)         => api.post('/notifications/create/', data).then(r => r.data.data),
}
