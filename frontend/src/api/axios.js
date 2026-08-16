import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Attach the JWT to every outgoing request if the user is logged in.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("swipex_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// --- Auto-refresh on 401 ---
let isRefreshing = false;
let pendingQueue = [];

const flushQueue = (newToken) => {
  pendingQueue.forEach(({ resolve, reject }) =>
    newToken ? resolve(newToken) : reject(new Error("refresh failed"))
  );
  pendingQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isAuthRoute = originalRequest?.url?.includes("/api/auth/");

    if (error.response?.status !== 401 || isAuthRoute || originalRequest._retry) {
      return Promise.reject(error);
    }

    const refreshToken = localStorage.getItem("swipex_refresh_token");
    if (!refreshToken) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingQueue.push({ resolve, reject });
      }).then((newToken) => {
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      });
    }

    isRefreshing = true;
    try {
      const { data } = await axios.post(`${API_BASE_URL}/api/auth/refresh`, {
        refresh_token: refreshToken,
      });
      localStorage.setItem("swipex_token", data.access_token);
      localStorage.setItem("swipex_refresh_token", data.refresh_token);
      flushQueue(data.access_token);
      originalRequest.headers.Authorization = `Bearer ${data.access_token}`;
      return api(originalRequest);
    } catch (refreshErr) {
      flushQueue(null);
      localStorage.removeItem("swipex_token");
      localStorage.removeItem("swipex_refresh_token");
      window.location.href = "/login";
      return Promise.reject(refreshErr);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;