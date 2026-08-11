import api from './api.js';

const companyService = {
  getAll: (params = {}) => api.get('/companies/', { params }),
  getById: (id) => api.get(`/companies/${id}`),
  create: (data) => api.post('/companies/', data),
};

export default companyService;
