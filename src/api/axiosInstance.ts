import axios from 'axios';
import { store } from '../redux/store';

export const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Enable sending cookies with requests
});

export const source_api = axios.create({
  baseURL: '/sourcing',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Enable sending cookies with requests
});

// Flag to prevent multiple simultaneous refresh attempts
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

const onRefreshed = (token: string) => {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
};

const addRefreshSubscriber = (callback: (token: string) => void) => {
  refreshSubscribers.push(callback);
};

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

// Handle token refresh and 401 responses
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and we haven't already tried to refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (isRefreshing) {
        // Wait for the refresh to complete, then retry
        return new Promise((resolve) => {
          addRefreshSubscriber((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(api(originalRequest));
          });
        });
      }

      isRefreshing = true;

      try {
        // Call the refresh endpoint
        const refreshResponse = await api.post('/auth/refresh');
        const { access_token } = refreshResponse.data;

        // Update Redux store with new token
        store.dispatch({
          type: 'auth/loginSuccess',
          payload: {
            access_token,
            token_type: 'bearer',
            refresh_token: '', // Refresh token is in HTTP-only cookie
          },
        });

        isRefreshing = false;
        onRefreshed(access_token);

        // Retry the original request with new token
        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return api(originalRequest);
      } catch (refreshError) {
        isRefreshing = false;
        refreshSubscribers = [];

        // Refresh failed, logout the user
        store.dispatch({ type: 'auth/logout' });
        return Promise.reject(refreshError);
      }
    }

    // For other 401 errors or different status codes
    if (error.response?.status === 401) {
      store.dispatch({ type: 'auth/logout' });
    }

    return Promise.reject(error);
  }
);

// Backward-compatible exports used across the codebase.
export const apiClient = api;
export default api;
