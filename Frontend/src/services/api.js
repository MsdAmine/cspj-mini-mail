import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5182/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token to every outgoing request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('cspj_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Global 401 handler: clear stale session and force re-login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid — wipe local session
      localStorage.removeItem('cspj_token');
      localStorage.removeItem('cspj_user');
      // Reload to let AuthContext redirect to Login
      window.location.reload();
    }
    return Promise.reject(error);
  }
);

export default api;
