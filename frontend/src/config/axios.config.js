// src/config/axios.config.js
import axios from 'axios';

const API_BASE    = import.meta.env.VITE_API_URL    ?? 'http://localhost:5000/api/v1';
const UPLOAD_BASE = import.meta.env.VITE_UPLOAD_URL ?? 'http://localhost:5000/api/uploads';

// ── Main API ──────────────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// Track if a refresh is already in-flight so parallel 401s don't each
// trigger their own refresh call.
let isRefreshing = false;
let failedQueue  = [];   // requests waiting for the refresh to complete

const processQueue = (error) => {
  failedQueue.forEach(({ resolve, reject }) =>
    error ? reject(error) : resolve()
  );
  failedQueue = [];
};

const redirectToLogin = () => {
  if (!window.location.pathname.includes('/login')) {
    window.location.href = '/login';
  }
};

api.interceptors.response.use(
  (response) => response,

  async (error) => {
    const original = error.config;

    // Not a 401, or already retried → just reject
    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error);
    }

    // Never retry the refresh or login endpoints themselves
    if (
      original.url?.includes('/auth/refresh') ||
      original.url?.includes('/auth/login')
    ) {
      redirectToLogin();
      return Promise.reject(error);
    }

    // Another refresh already in-flight → queue this request
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then(() => api(original))
        .catch((err) => Promise.reject(err));
    }

    // ── Attempt silent token refresh ─────────────────────────────────────
    original._retry = true;
    isRefreshing    = true;

    try {
      await axios.post(
        `${API_BASE}/auth/refresh`,
        {},
        { withCredentials: true }
      );
      processQueue(null);          // unblock queued requests
      return api(original);        // retry the original failed request
    } catch (refreshErr) {
      processQueue(refreshErr);    // reject all queued requests
      redirectToLogin();
      return Promise.reject(refreshErr);
    } finally {
      isRefreshing = false;
    }
  }
);

// ── Upload API ────────────────────────────────────────────────────────────────
export const uploadApi = axios.create({
  baseURL: UPLOAD_BASE,
  withCredentials: true,
  timeout: 30000,
});

uploadApi.interceptors.request.use(
  (config) => {
    config.withCredentials = true;
    // Let axios set the correct multipart boundary automatically
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Upload API uses the same simple redirect on 401 (no retry needed for uploads)
uploadApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) redirectToLogin();
    return Promise.reject(error);
  }
);

export default api;