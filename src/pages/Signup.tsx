import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../components/AuthContext";
import { Mail, KeyRound, User, Briefcase, Compass, ShieldAlert, AlertCircle, Calendar, Phone, CheckCircle2, Eye, EyeOff } from "lucide-react";

export const Signup: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<"job_seeker" | "recruiter">("job_seeker");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Calculate age dynamically
  const calculateAge = (dob: string): number | null => {
    if (!dob) return null;
    const birth = new Date(dob);
    if (isNaN(birth.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const calculatedAge = calculateAge(dateOfBirth);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (calculatedAge !== null && calculatedAge < 18) {
      setError("Age Requirement: Candidates must be at least 18 years old to join SwipeX.");
      return;
    }

    setLoading(true);

    try {
      const newUser = await register(email, password, role, fullName, dateOfBirth, phone);
      if (newUser.role === "recruiter") {
        navigate("/dashboard");
      } else {
        navigate("/discovery");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Registration failed. Try a different email address.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 py-8">
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-xl overflow-hidden grid md:grid-cols-12 border border-slate-100">
        
        {/* Left column: Branding details */}
        <div className="md:col-span-5 bg-gradient-to-br from-indigo-700 via-indigo-800 to-indigo-900 p-8 text-white flex flex-col justify-between relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600 rounded-full blur-3xl opacity-40 transform translate-x-12 -translate-y-12"></div>
          
          <div>
            <div className="flex items-center space-x-2.5 mb-10">
              <div className="w-10 h-10 bg-white text-indigo-700 rounded-xl flex items-center justify-center font-black text-2xl shadow-md">
                S
              </div>
              <span className="font-sans font-bold text-xl tracking-tight">SwipeX</span>
            </div>
            
            <h2 className="text-3xl font-bold tracking-tight mb-4">
              Join the SwipeX Network Today
            </h2>
            <p className="text-indigo-200 text-sm leading-relaxed mb-6">
              Create your verified profile to unlock intelligent ATS scoring, domain-tailored hiring trend analytics, and direct recruiter swiping.
            </p>
          </div>

          <div className="space-y-4 my-6">
            <div className="p-4 bg-indigo-900/40 border border-indigo-700/50 rounded-xl">
              <span className="font-semibold block text-sm mb-1">💡 Profile Initial Badge</span>
              <span className="text-indigo-200 text-xs leading-relaxed">
                Your profile picture shows your capitalized username letter badge by default until you choose to upload a custom image or add an image URL.
              </span>
            </div>
            <div className="p-4 bg-indigo-900/40 border border-indigo-700/50 rounded-xl">
              <span className="font-semibold block text-sm mb-1">📄 Dynamic Resume Skill Extraction</span>
              <span className="text-indigo-200 text-xs leading-relaxed">
                Uploading your resume dynamically syncs your skills tags with exact keywords found in your document.
              </span>
            </div>
          </div>

          <p className="text-xs text-indigo-300/80 mt-6 font-mono">
            SwipeX AI Match Engine • 2026
          </p>
        </div>

        {/* Right column: Signup form */}
        <div className="md:col-span-7 p-8 md:p-12 flex flex-col justify-center">
          <div className="max-w-md w-full mx-auto">
            <h3 className="text-2xl font-bold text-slate-900 tracking-tight mb-2">
              Create Your Account
            </h3>
            <p className="text-slate-500 text-sm mb-6">
              Select your role, enter required verification details, and get started.
            </p>

            {error && (
              <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg flex items-start space-x-3 text-sm">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSignup} className="space-y-4" autoComplete="off">
              {/* Role Selection */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                  Choose Your Platform Role <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole("job_seeker")}
                    className={`py-3.5 px-4 rounded-xl border flex flex-col items-center justify-center text-center transition-all ${
                      role === "job_seeker"
                        ? "border-indigo-600 bg-indigo-50/50 text-indigo-700 shadow-xs"
                        : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100/50"
                    }`}
                  >
                    <Compass className="w-5 h-5 mb-1.5" />
                    <span className="text-xs font-bold block">Job Seeker</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole("recruiter")}
                    className={`py-3.5 px-4 rounded-xl border flex flex-col items-center justify-center text-center transition-all ${
                      role === "recruiter"
                        ? "border-indigo-600 bg-indigo-50/50 text-indigo-700 shadow-xs"
                        : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100/50"
                    }`}
                  >
                    <Briefcase className="w-5 h-5 mb-1.5" />
                    <span className="text-xs font-bold block">Recruiter</span>
                  </button>
                </div>
              </div>

              {/* Full Name (Mandatory) */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                  Full Name / Organization Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    autoComplete="name"
                    placeholder="E.g., Alex Rivera"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-none text-slate-800 text-sm transition-all"
                  />
                </div>
              </div>

              {/* Email Address (Mandatory) */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                  Email Address (Primary Contact) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    placeholder="you@example.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-none text-slate-800 text-sm transition-all"
                  />
                </div>
              </div>

              {/* Date of Birth (Mandatory & Age Verified) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Date of Birth <span className="text-rose-500">*</span>
                  </label>
                  {calculatedAge !== null && (
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-md flex items-center space-x-1 ${
                      calculatedAge >= 18 
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
                        : "bg-rose-50 text-rose-700 border border-rose-200"
                    }`}>
                      {calculatedAge >= 18 && <CheckCircle2 className="w-3 h-3 mr-1 inline text-emerald-600" />}
                      <span>Age: {calculatedAge} yrs {calculatedAge < 18 ? "(Min. 18+ required)" : "(Verified 18+)"}</span>
                    </span>
                  )}
                </div>
                <div className="relative">
                  <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    required
                    max={new Date().toISOString().split("T")[0]}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-none text-slate-800 text-sm transition-all"
                  />
                </div>
              </div>

              {/* Phone (Optional) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Phone Number
                  </label>
                  <span className="text-[11px] text-slate-400 font-medium">Optional</span>
                </div>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    autoComplete="tel"
                    placeholder="+1 (555) 019-2834"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-none text-slate-800 text-sm transition-all"
                  />
                </div>
              </div>

              {/* Password (Mandatory with Eye Toggle) */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                  Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    placeholder="Min. 8 characters"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-none text-slate-800 text-sm transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
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
                disabled={loading || (calculatedAge !== null && calculatedAge < 18)}
                className="w-full mt-2 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold rounded-xl text-sm transition-all shadow-md hover:shadow-lg flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <span>Create Account & Continue</span>
                )}
              </button>
            </form>

            <p className="text-center text-sm text-slate-500 mt-6">
              Already have an account?{" "}
              <Link to="/login" className="text-indigo-600 font-semibold hover:underline">
                Sign in instead
              </Link>
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};
