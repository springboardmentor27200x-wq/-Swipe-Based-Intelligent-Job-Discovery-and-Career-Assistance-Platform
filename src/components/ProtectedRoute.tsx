import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

interface ProtectedRouteProps {
  children: React.ReactElement;
  allowedRoles?: Array<"job_seeker" | "recruiter">;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
}) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium text-sm animate-pulse">
            Authenticating SwipeX Session...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    // Unauthenticated user redirected to /login with history memory
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Authenticated but unauthorized: auto-redirect to correct dashboard based on real role
    if (user.role === "job_seeker") {
      return <Navigate to="/discovery" replace />;
    } else if (user.role === "recruiter") {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
};
