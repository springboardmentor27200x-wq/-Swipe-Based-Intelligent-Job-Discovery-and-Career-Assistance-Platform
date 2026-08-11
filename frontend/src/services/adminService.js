import api from './api.js';

const adminService = {
  getStats: () => api.get('/admin/stats'),
  getUsers: () => api.get('/admin/users'),
  changeRole: (userId, role) => api.put(`/admin/users/${userId}/role`, { role }),
  deactivateUser: (userId) => api.delete(`/admin/users/${userId}`),
};

export default adminService;
