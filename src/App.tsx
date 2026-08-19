import React from "react";
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation, useNavigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./components/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";

// Pages
import { Login } from "./pages/Login";
import { Signup } from "./pages/Signup";
import { Discovery } from "./pages/Discovery";
import { Dashboard } from "./pages/Dashboard";
import { ProfilePage } from "./pages/Profile";
import { Companies } from "./pages/Companies";
import { RecommendationsPage } from "./pages/Recommendations";
import { ApplicationsPage } from "./pages/Applications";

// Icons
import { UserAvatar } from "./components/UserAvatar";
import { NotificationCenter } from "./components/NotificationCenter";
import { Compass, Briefcase, LogOut, UserCircle, Sparkles, Building } from "lucide-react";


// Smart Root Redirector
const RootRedirector: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Redirect based on active system role
  if (user.role === "recruiter") {
    return <Navigate to="/dashboard" replace />;
  } else {
    return <Navigate to="/discovery" replace />;
  }
};

// UI Navigation Layout Shell Wrapper
const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await logout();
    navigate("/login");
  };

  // Hide header shell on login/signup pages
  const isAuthPage = ["/login", "/signup"].includes(location.pathname);

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      
      {/* Platform Adaptive Header Rail */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          
          {/* Logo Brand */}
          <div className="flex items-center space-x-2.5">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-9 h-9 bg-indigo-600 text-white rounded-xl flex items-center justify-center font-black text-xl shadow-md">
                S
              </div>
              <span className="font-extrabold text-lg text-slate-900 tracking-tight">SwipeX</span>
            </Link>
            
            {/* System Tag */}
            <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-700 text-[10px] font-bold rounded-md font-mono hidden sm:inline-block">
              JWT Enterprise Auth
            </span>
          </div>

          {/* Dynamic links based on active user Role */}
          {user && (
            <nav className="hidden md:flex items-center space-x-1">
              
              {user.role === "job_seeker" && (
                <>
                  <Link
                    to="/discovery"
                    className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
                      location.pathname === "/discovery" 
                        ? "bg-indigo-50 text-indigo-700" 
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                  >
                    <Compass className="w-4 h-4" />
                    <span>Swipe Deck</span>
                  </Link>

                  <Link
                    to="/recommendations"
                    className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
                      location.pathname === "/recommendations" 
                        ? "bg-indigo-50 text-indigo-700" 
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                  >
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    <span>My Recommendations</span>
                  </Link>

                  <Link
                    to="/applications"
                    className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
                      location.pathname === "/applications" 
                        ? "bg-indigo-50 text-indigo-700" 
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                  >
                    <Briefcase className="w-4 h-4 text-indigo-600" />
                    <span>My Applications</span>
                  </Link>

                  <Link
                    to="/companies"
                    className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
                      location.pathname === "/companies" 
                        ? "bg-indigo-50 text-indigo-700" 
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                  >
                    <Building className="w-4 h-4" />
                    <span>Companies</span>
                  </Link>
                </>
              )}

              {user.role === "recruiter" && (
                <Link
                  to="/dashboard"
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
                    location.pathname === "/dashboard" 
                      ? "bg-indigo-50 text-indigo-700" 
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  <Briefcase className="w-4 h-4" />
                  <span>Recruiter Dashboard</span>
                </Link>
              )}

              <Link
                to="/profile"
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
                  location.pathname === "/profile" 
                    ? "bg-indigo-50 text-indigo-700" 
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <UserCircle className="w-4 h-4" />
                <span>My Profile</span>
              </Link>
            </nav>
          )}

          {/* Account profile menu & LogOut */}
          <div className="flex items-center space-x-3">
            {user ? (
              <>
                <NotificationCenter />
                
                <div className="flex items-center space-x-3 border-l border-slate-100 pl-3">
                  <div className="text-right hidden sm:block">
                    <span className="block text-xs font-extrabold text-slate-800 leading-tight">
                      {user.profile?.fullName || "Professional"}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 capitalize">
                      {user.role.replace("_", " ")}
                    </span>
                  </div>
                  
                  <UserAvatar
                    avatarUrl={user.profile?.avatarUrl}
                    name={user.profile?.fullName}
                    email={user.email}
                    className="w-9 h-9"
                    onClick={() => navigate("/profile")}
                  />

                  <button
                    onClick={handleSignOut}
                    className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-rose-500 rounded-lg transition-all"
                    title="Sign Out Session"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              <Link
                to="/login"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
              >
                Sign In
              </Link>
            )}
          </div>

        </div>
      </header>

      {/* Main Container Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer System Credits */}
      <footer className="bg-white border-t border-slate-100 mt-auto py-5">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 font-mono">
          <span>SwipeX Career Matching Platform Foundations • 2026</span>
          <div className="flex items-center space-x-3.5 mt-2 sm:mt-0">
            <span>SQLite Simulated DB Engine</span>
            <span>•</span>
            <span>JWT Session Tokens</span>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppLayout>
          <Routes>
            {/* Auth Endpoints */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            {/* Role-Based Protected Endpoints */}
            <Route
              path="/discovery"
              element={
                <ProtectedRoute allowedRoles={["job_seeker"]}>
                  <Discovery />
                </ProtectedRoute>
              }
            />

            <Route
              path="/recommendations"
              element={
                <ProtectedRoute allowedRoles={["job_seeker"]}>
                  <RecommendationsPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/applications"
              element={
                <ProtectedRoute allowedRoles={["job_seeker"]}>
                  <ApplicationsPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/companies"
              element={
                <ProtectedRoute allowedRoles={["job_seeker"]}>
                  <Companies />
                </ProtectedRoute>
              }
            />

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute allowedRoles={["recruiter"]}>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />

            {/* Smart Root Redirector */}
            <Route path="/" element={<RootRedirector />} />

            {/* Fallback Catch-all routing */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppLayout>
      </AuthProvider>
    </BrowserRouter>
  );
}
