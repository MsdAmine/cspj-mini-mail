import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5182/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Global 401 handler: clear stale session and force re-login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const url = error.config?.url || '';
      // Don't reload on auth routes so that the login form can show the error
      if (!url.includes('/auth/')) {
        // Session expired or invalid — wipe local user data
        localStorage.removeItem('cspj_user');
        // Reload to let AuthContext redirect to Login
        window.location.reload();
      }
    }
    return Promise.reject(error);
  }
);

export default api;
