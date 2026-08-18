import axios from "axios";

const api = axios.create({
  baseURL: "https://swipex-backend-m1o6.onrender.com/api/",
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;