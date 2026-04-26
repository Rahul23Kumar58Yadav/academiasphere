// src/services/api.js
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5000/api/v1";

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,     // ← This makes cookies work across ports
  timeout: 15000,
});

// Optional: nice logging in development
api.interceptors.request.use((config) => {
  console.log(`🔄 ${config.method?.toUpperCase()} ${config.url}`);
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        // Try refresh
        await axios.post(`${API_URL}/auth/refresh`, {}, { withCredentials: true });
        return api(originalRequest);
      } catch (refreshError) {
        console.error("Token refresh failed");
        window.location.href = "/login?expired=true";
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default api;