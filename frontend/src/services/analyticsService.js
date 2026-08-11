import api from './api.js';

const analyticsService = {
  getOverview: () => api.get('/analytics/overview'),
  getApplicationStats: () => api.get('/analytics/application-stats'),
  getSkillGaps: () => api.get('/analytics/skill-gaps'),
  getActivity: () => api.get('/analytics/activity'),
};

export default analyticsService;
