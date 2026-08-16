import { createContext, useContext, useEffect, useState } from "react";
import api from "../api/axios";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadCurrentUser = async () => {
    const token = localStorage.getItem("swipex_token");
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const { data } = await api.get("/api/auth/me");
      setUser(data);
    } catch (err) {
      localStorage.removeItem("swipex_token");
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCurrentUser();
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post("/api/auth/login", { email, password });
    localStorage.setItem("swipex_token", data.access_token);
    localStorage.setItem("swipex_refresh_token", data.refresh_token);
    setUser(data.user);
    return data.user;
  };

  const signup = async (fullName, email, password, role) => {
    const { data } = await api.post("/api/auth/signup", {
      full_name: fullName,
      email,
      password,
      role,
    });
    localStorage.setItem("swipex_token", data.access_token);
    localStorage.setItem("swipex_refresh_token", data.refresh_token);
    setUser(data.user);
    return data.user;
  };

  const setTokenFromOAuth = async (token, refreshToken) => {
    localStorage.setItem("swipex_token", token);
    if (refreshToken) {
      localStorage.setItem("swipex_refresh_token", refreshToken);
    }
    await loadCurrentUser();
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem("swipex_refresh_token");
    if (refreshToken) {
      try {
        await api.post("/api/auth/logout", { refresh_token: refreshToken });
      } catch (_) {
        // token already invalid/expired — fine, we're clearing local state anyway
      }
    }
    localStorage.removeItem("swipex_token");
    localStorage.removeItem("swipex_refresh_token");
    setUser(null);
  };

  const logoutAllDevices = async () => {
    await api.post("/api/auth/logout-all");
    localStorage.removeItem("swipex_token");
    localStorage.removeItem("swipex_refresh_token");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, signup, logout, logoutAllDevices, setTokenFromOAuth }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
