import React, { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../components/AuthContext";
import { KeyRound, Mail, AlertCircle, Compass, Briefcase, Eye, EyeOff, Sparkles, Building2, UserCheck, ChevronDown, ChevronUp } from "lucide-react";

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const queryParams = new URLSearchParams(location.search);
  const sessionExpired = queryParams.get("session_expired") === "true";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const trimmedEmail = email.trim().toLowerCase();
      const loggedUser = await login(trimmedEmail, password);
      // Route based on user role
      if (loggedUser.role === "recruiter") {
        navigate("/dashboard");
      } else {
        navigate("/discovery");
      }
    } catch (err: any) {
      console.error("Login failed:", err);
      setError(err.response?.data?.message || err.message || "Invalid credentials. Please check your email and password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-xl overflow-hidden grid md:grid-cols-12 border border-slate-100">
        
        {/* Left column: Visual branding & details */}
        <div className="md:col-span-5 bg-gradient-to-br from-indigo-700 via-indigo-800 to-indigo-900 p-8 text-white flex flex-col justify-between relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600 rounded-full blur-3xl opacity-40 transform translate-x-12 -translate-y-12"></div>
          
          <div>
            <div className="flex items-center space-x-2.5 mb-8">
              <div className="w-10 h-10 bg-white text-indigo-700 rounded-xl flex items-center justify-center font-black text-2xl shadow-md">
                S
              </div>
              <span className="font-sans font-bold text-xl tracking-tight">SwipeX</span>
            </div>
            
            <h2 className="text-2xl font-bold tracking-tight mb-3">
              Your Next Big Opportunity Awaits
            </h2>
            <p className="text-indigo-200 text-sm leading-relaxed mb-6">
              Welcome to SwipeX. Our platform connects top talent directly with leading recruiters through a seamless and intuitive experience. Discover your perfect match without the noise.
            </p>
          </div>

          <div className="space-y-3.5 my-3">
            <div className="flex items-start space-x-3 text-sm bg-white/10 p-3 rounded-xl backdrop-blur-sm">
              <Sparkles className="w-5 h-5 text-indigo-300 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block font-medium">Smart Recommendations</strong>
                <span className="text-indigo-200 text-xs">Our system suggests the most relevant roles and candidates tailored for you.</span>
              </div>
            </div>

            <div className="flex items-start space-x-3 text-sm bg-white/10 p-3 rounded-xl backdrop-blur-sm">
              <UserCheck className="w-5 h-5 text-indigo-300 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block font-medium">Direct Connections</strong>
                <span className="text-indigo-200 text-xs">Bypass the middleman. Connect instantly when there's a mutual interest.</span>
              </div>
            </div>
          </div>

          <p className="text-xs text-indigo-300/80 mt-6 font-mono">
            SwipeX System • 2026
          </p>
        </div>

        {/* Right column: Login form */}
        <div className="md:col-span-7 p-6 md:p-10 flex flex-col justify-center overflow-y-auto max-h-[90vh]">
          <div className="max-w-md w-full mx-auto">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
                Welcome back
              </h3>
            </div>
            
            <p className="text-slate-500 text-sm mb-6">
              Sign in with your email and password to access your account.
            </p>

            {sessionExpired && (
              <div className="mb-4 p-3.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg flex items-start space-x-3 text-sm">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <span>Your session has expired. Please sign in again to continue.</span>
              </div>
            )}

            {error && (
              <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg flex items-start space-x-3 text-sm">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-3.5" autoComplete="off">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    placeholder="Enter your email"
                    className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-none text-slate-800 text-sm transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Password
                  </label>
                </div>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    className="w-full pl-11 pr-11 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-none text-slate-800 text-sm transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold rounded-xl text-sm transition-all shadow-md hover:shadow-lg flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <span>Sign In</span>
                )}
              </button>
            </form>

            <p className="text-center text-sm text-slate-500 mt-6">
              Don't have an account?{" "}
              <Link to="/signup" className="text-indigo-600 font-semibold hover:underline">
                Create one now
              </Link>
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};
