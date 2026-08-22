import axios, { AxiosRequestConfig, InternalAxiosRequestConfig } from "axios";

// Base API instance
export const api = axios.create({
  baseURL: (import.meta as any).env?.VITE_API_URL || "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Helper functions for Token management in localStorage
export const getAccessToken = () => localStorage.getItem("swipex_access_token");
export const getRefreshToken = () => localStorage.getItem("swipex_refresh_token");

export const setTokens = (accessToken: string, refreshToken: string) => {
  localStorage.setItem("swipex_access_token", accessToken);
  localStorage.setItem("swipex_refresh_token", refreshToken);
};

export const clearTokens = () => {
  localStorage.removeItem("swipex_access_token");
  localStorage.removeItem("swipex_refresh_token");
  localStorage.removeItem("swipex_user");
};

// Request Interceptor: Automatically attach JWT access token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Handle 401 Unauthorized errors and attempt Token Refresh
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (token) {
      prom.resolve(token);
    } else {
      prom.reject(error);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Guard: Avoid loop on refresh endpoint or when request has already been retried
    if (
      (error.response?.status === 401 || error.response?.status === 403) &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/login") &&
      !originalRequest.url?.includes("/register") &&
      !originalRequest.url?.includes("/token/refresh")
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = getRefreshToken();

      if (!refreshToken) {
        clearTokens();
        // Redirect to login if in window scope and not already on auth page
        if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login") && !window.location.pathname.startsWith("/signup")) {
          window.location.href = "/login?session_expired=true";
        }
        return Promise.reject(error);
      }

      try {
        // Direct axios call to avoid request interceptor locks
        const response = await axios.post("/api/token/refresh", {
          refreshToken,
        });

        const { accessToken } = response.data;
        
        // Update stored tokens
        setTokens(accessToken, refreshToken);

        // Process stored queue of pending requests
        processQueue(null, accessToken);
        isRefreshing = false;

        // Resubmit original failed request
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        isRefreshing = false;
        clearTokens();
        
        if (typeof window !== "undefined") {
          window.location.href = "/login?session_expired=true";
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
