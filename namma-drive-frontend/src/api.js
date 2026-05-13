import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000' : ''),
  headers: { 'Content-Type': 'application/json' },
});

// Add JWT token to requests if it exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses (token expired) — clear stored credentials but
// do NOT hard-redirect; let the app handle navigation via React state.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
    }
    return Promise.reject(error);
  }
);

// Auth endpoints (local JWT auth)
export const authAPI = {
  register: (data) => api.post('/api/auth/register', data),
  login: (data) => api.post('/api/auth/login', data),
  me: () => api.get('/api/auth/me'),
};

export const fuelStopAPI = {
  getAll: () => api.get('/api/fuel-stops'),
};

export const poiAPI = {
  getAll: (category) => api.get('/api/pois', { params: { category } }),
  nearRoute: (data) => api.post('/api/pois/near-route', data),
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
