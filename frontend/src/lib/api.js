import axios from 'axios';
import { useAuthStore } from '../store/authStore.js';

const api = axios.create({
  baseURL: '/api',
  timeout: 15_000,
});

// Attach JWT to every request
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally — but NOT on the login endpoint itself
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const isAuthEndpoint = err.config?.url?.includes('/auth/');
    if (err.response?.status === 401 && !isAuthEndpoint) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
