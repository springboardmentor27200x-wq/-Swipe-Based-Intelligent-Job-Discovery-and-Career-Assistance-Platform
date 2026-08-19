import React, { createContext, useContext, useState, useEffect } from "react";
import { User, AuthResponse } from "../types";
import { api, setTokens, clearTokens, getAccessToken } from "../services/api";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (email: string, password: string, role: string, fullName: string, dateOfBirth?: string, phone?: string) => Promise<User>;
  logout: () => Promise<void>;
  simulateOAuth: (provider: "google" | "github", email: string, fullName: string) => Promise<User>;
  updateUserProfile: (profileData: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Attempt session restoration on mount
    const savedUser = localStorage.getItem("swipex_user");
    const token = getAccessToken();

    if (savedUser && token) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (err) {
        clearTokens();
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.post<AuthResponse>("/login", { email, password });
    const { accessToken, refreshToken, user: loggedUser } = res.data;
    setTokens(accessToken, refreshToken);
    localStorage.setItem("swipex_user", JSON.stringify(loggedUser));
    setUser(loggedUser);
    return loggedUser;
  };

  const register = async (email: string, password: string, role: string, fullName: string, dateOfBirth?: string, phone?: string) => {
    const res = await api.post<AuthResponse>("/register", { email, password, role, fullName, dateOfBirth, phone });
    const { accessToken, refreshToken, user: registeredUser } = res.data;
    setTokens(accessToken, refreshToken);
    localStorage.setItem("swipex_user", JSON.stringify(registeredUser));
    setUser(registeredUser);
    return registeredUser;
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem("swipex_refresh_token");
    try {
      await api.post("/logout", { refreshToken });
    } catch (err) {
      console.warn("Logout request failed on server, cleaning local state anyway", err);
    } finally {
      clearTokens();
      setUser(null);
    }
  };

  const simulateOAuth = async (provider: "google" | "github", email: string, fullName: string) => {
    const res = await api.post<AuthResponse>("/auth/oauth-placeholder", {
      provider,
      email,
      fullName
    });
    const { accessToken, refreshToken, user: oauthUser } = res.data;
    setTokens(accessToken, refreshToken);
    localStorage.setItem("swipex_user", JSON.stringify(oauthUser));
    setUser(oauthUser);
    return oauthUser;
  };

  const updateUserProfile = async (profileData: any) => {
    const res = await api.put("/profile", profileData);
    if (user) {
      const updatedUser = { ...user, profile: res.data };
      localStorage.setItem("swipex_user", JSON.stringify(updatedUser));
      setUser(updatedUser);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        simulateOAuth,
        updateUserProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
