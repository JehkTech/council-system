import axios from 'axios';

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  forgotPasswordOTP: (email) => api.post('/auth/forgot-password-otp', { email }),
  resetPasswordOTP: (email, otp, password) => api.post('/auth/reset-password-otp', { email, otp, password }),
};

export const servicesAPI = {
  getAll: () => api.get('/services'),
};

export const applicationsAPI = {
  getAll: () => api.get('/applications'),
  create: (data) => api.post('/applications', data),
  getTimeline: (id) => api.get(`/applications/${id}/timeline`),
};

export const adminAPI = {
  getAll: () => api.get('/admin/applications'),
  update: (id, data) => api.patch(`/admin/applications/${id}`, data),
};

export default api;
