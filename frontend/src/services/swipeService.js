import api from './api.js';

const swipeService = {
  swipe: (jobId, action) => {
    const direction = action === 'skip' ? 'left' : 'right';
    return api.post('/swipe/', { job_id: jobId, direction, action });
  },
  getHistory: () => api.get('/swipe/history'),
  getStats: () => api.get('/swipe/stats'),
};

export default swipeService;
