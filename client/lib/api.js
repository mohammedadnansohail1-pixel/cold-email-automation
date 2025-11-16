import axios from 'axios';

const API_URL = process.env.API_URL || 'http://localhost:3001';

// Create axios instance
const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const auth = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getCurrentUser: () => api.get('/auth/me'),
};

// Companies API
export const companies = {
  getAll: (params) => api.get('/companies', { params }),
  getOne: (id) => api.get(`/companies/${id}`),
  create: (data) => api.post('/companies', data),
  update: (id, data) => api.put(`/companies/${id}`, data),
  delete: (id) => api.delete(`/companies/${id}`),
  getStats: () => api.get('/companies/stats'),
};

// Contacts API
export const contacts = {
  getAll: (params) => api.get('/contacts', { params }),
  getOne: (id) => api.get(`/contacts/${id}`),
  create: (data) => api.post('/contacts', data),
  update: (id, data) => api.put(`/contacts/${id}`, data),
  delete: (id) => api.delete(`/contacts/${id}`),
  bulkImport: (contacts) => api.post('/contacts/bulk', { contacts }),
  optOut: (id, data) => api.post(`/contacts/${id}/opt-out`, data),
};

// Campaigns API
export const campaigns = {
  getAll: (params) => api.get('/campaigns', { params }),
  getOne: (id) => api.get(`/campaigns/${id}`),
  create: (data) => api.post('/campaigns', data),
  update: (id, data) => api.put(`/campaigns/${id}`, data),
  delete: (id) => api.delete(`/campaigns/${id}`),
  addContacts: (id, contactIds) => api.post(`/campaigns/${id}/contacts`, { contact_ids: contactIds }),
  start: (id) => api.post(`/campaigns/${id}/start`),
  pause: (id) => api.post(`/campaigns/${id}/pause`),
  getAnalytics: (id) => api.get(`/campaigns/${id}/analytics`),
};

// AI API
export const ai = {
  generateEmail: (data) => api.post('/ai/generate-email', data),
  generateSubjectVariations: (data) => api.post('/ai/generate-subject-variations', data),
  analyzeCompany: (companyId) => api.post('/ai/analyze-company', { company_id: companyId }),
  classifyReply: (replyText) => api.post('/ai/classify-reply', { reply_text: replyText }),
};

// Analytics API
export const analytics = {
  getDashboard: () => api.get('/analytics/dashboard'),
};

export default api;
