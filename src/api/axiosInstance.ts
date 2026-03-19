import axios from 'axios';
import { store } from '../redux/store';

export const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});
export const source_api = axios.create({
  baseURL: '/sourcing',
  headers: {
    'Content-Type': 'application/json',
  },
});
// Attach access token to every request
api.interceptors.request.use(
  (config) => {
    const state = store.getState();
    const token = state.auth.accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle 401 globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      store.dispatch({ type: 'auth/logout' });
    }
    return Promise.reject(error);
  }
);

// Backward-compatible exports used across the codebase.
export const apiClient = api;
export default api;
