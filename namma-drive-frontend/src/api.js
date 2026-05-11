import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  headers: { 'Content-Type': 'application/json' },
});

export const fuelStopAPI = {
  getAll: () => api.get('/api/fuel-stops'),
};

export const poiAPI = {
  getAll: (category) => api.get('/api/pois', { params: { category } }),
};

export const routeAPI = {
  save:       (data) => api.post('/api/routes/save', data),
  getHistory: ()     => api.get('/api/routes/history'),
  getById:    (id)   => api.get(`/api/routes/${id}`),
  delete:     (id)   => api.delete(`/api/routes/${id}`),
};

export const cityAPI = {
  getById: (id) => api.get(`/api/cities/${id}`),
};

export const userAPI = {
  sync: (data) => api.post('/api/users/sync', data),
};
