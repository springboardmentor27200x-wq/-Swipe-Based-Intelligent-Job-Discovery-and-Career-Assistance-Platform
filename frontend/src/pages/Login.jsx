import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { motion, AnimatePresence } from "motion/react";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.07,
      delayChildren: 0.05,
    },
  },
};

const fieldVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
  },
};

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  // ---------------------------------------------------------------------
  // Role-based navigation helpers
  // ---------------------------------------------------------------------

  // Works out the logged-in user's role from whatever login() gave us.
  // Falls back to GET /api/auth/me if login() doesn't return the role
  // directly, so this keeps working even if AuthContext.login() only
  // returns a token (or nothing at all).
  const resolveUserRole = async (loginResult) => {
    // Case 1: login() already resolves with a user object containing role.
    if (loginResult?.role) return loginResult.role;
    if (loginResult?.user?.role) return loginResult.user.role;

    // Case 2: fetch the current user from the backend as a fallback.
    try {
      const token = localStorage.getItem("swipex_token");
      const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: "include", // in case auth is cookie/session based
      });
      if (res.ok) {
        const data = await res.json();
        return data?.role || data?.user?.role || null;
      }
    } catch {
      // network/parse errors are ignored — we just fall through to null
    }
    return null;
  };

  const redirectByRole = (role) => {
    if (role === "jobseeker" || role === "job_seeker") {
      navigate("/jobseeker-dashboard");
    } else if (role === "recruiter") {
      navigate("/recruiter-dashboard");
    } else if (role === "admin") {
      navigate("/admin-dashboard");
    } else {
      // unknown/no role resolved — safe fallback, keeps old behavior
      navigate("/dashboard");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const loginResult = await login(form.email, form.password);
      const role = await resolveUserRole(loginResult);
      redirectByRole(role);
    } catch (err) {
      setError(
        err?.response?.data?.detail || "Incorrect email or password. Try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${API_BASE_URL}/api/auth/google/login`;
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#05050b] font-sans">
      {/* Ambient gradient background */}
      <div className="pointer-events-none absolute inset-0">
        <motion.div
          animate={{ opacity: [0.5, 0.8, 0.5], scale: [1, 1.08, 1] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-40 -left-32 h-[30rem] w-[30rem] rounded-full bg-violet-600/30 blur-[120px]"
        />
        <motion.div
          animate={{ opacity: [0.4, 0.7, 0.4], scale: [1.05, 1, 1.05] }}
          transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-40 -right-32 h-[32rem] w-[32rem] rounded-full bg-fuchsia-600/25 blur-[130px]"
        />
        <motion.div
          animate={{ opacity: [0.3, 0.55, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute top-1/3 left-1/2 h-[26rem] w-[26rem] -translate-x-1/2 rounded-full bg-indigo-600/20 blur-[140px]"
        />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)",
            backgroundSize: "32px 32px",
          }}
        />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl items-center justify-center px-6 py-12 sm:px-12">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-md"
        >
          {/* Brand mark */}
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-8 flex items-center justify-center gap-2.5"
          >
            <div onClick={()=>navigate("/home")} className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 font-bold text-white shadow-lg shadow-fuchsia-500/30">
              X
            </div>
            <span onClick={()=>navigate("/home")} className="text-xl font-bold tracking-tight text-white">
              Swipe
              <span onClick={()=>navigate("/home")} className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">
                X
              </span>
            </span>
          </motion.div>

          {/* Card */}
          <div className="relative rounded-3xl border border-white/10 bg-white/[0.04] p-8 shadow-2xl shadow-black/60 backdrop-blur-2xl sm:p-10">
            {/* subtle top gradient hairline */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px rounded-t-3xl bg-gradient-to-r from-transparent via-white/40 to-transparent" />

            <p className="mb-2 text-center text-xs font-semibold uppercase tracking-[0.2em] text-fuchsia-400/80">
              Welcome back
            </p>
            <h1 className="text-center text-3xl font-bold leading-tight text-white">
              Sign in to SwipeX
            </h1>
            <p className="mt-3 text-center text-sm leading-relaxed text-gray-400">
              Pick up where you left off and keep swiping through your
              matches.
            </p>

            <motion.form
              onSubmit={handleSubmit}
              className="mt-8 space-y-4"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <AnimatePresence mode="wait">
                {error && (
                  <motion.div
                    key="login-error"
                    initial={{ opacity: 0, y: -8, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    className="overflow-hidden"
                  >
                    <motion.div
                      initial={{ x: 0 }}
                      animate={{ x: [0, -6, 6, -4, 4, 0] }}
                      transition={{ duration: 0.4, ease: "easeInOut" }}
                      className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
                    >
                      {error}
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.div variants={fieldVariants}>
                <label className="mb-1.5 block text-sm font-medium text-gray-300">
                  Email address
                </label>
                <motion.input
                  type="email"
                  name="email"
                  required
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  whileFocus={{ scale: 1.01 }}
                  transition={{ duration: 0.15 }}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none transition-colors focus:border-fuchsia-500/60 focus:ring-2 focus:ring-fuchsia-500/20"
                />
              </motion.div>

              <motion.div variants={fieldVariants}>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="block text-sm font-medium text-gray-300">
                    Password
                  </label>
                  <a
                    href="#"
                    className="text-xs font-medium text-gray-500 transition-colors hover:text-fuchsia-400"
                  >
                    Forgot password?
                  </a>
                </div>
                <motion.input
                  type="password"
                  name="password"
                  required
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  whileFocus={{ scale: 1.01 }}
                  transition={{ duration: 0.15 }}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none transition-colors focus:border-fuchsia-500/60 focus:ring-2 focus:ring-fuchsia-500/20"
                />
              </motion.div>

              <motion.button
                type="submit"
                disabled={submitting}
                variants={fieldVariants}
                whileHover={{ scale: submitting ? 1 : 1.015 }}
                whileTap={{ scale: submitting ? 1 : 0.98 }}
                transition={{ duration: 0.15 }}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 py-3 text-sm font-semibold text-white shadow-lg shadow-fuchsia-600/25 transition-shadow hover:shadow-xl hover:shadow-fuchsia-600/40 disabled:opacity-60"
              >
                <AnimatePresence mode="wait" initial={false}>
                  {submitting ? (
                    <motion.span
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-2"
                    >
                      <motion.span
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                        className="h-3.5 w-3.5 rounded-full border-2 border-white/40 border-t-white"
                      />
                      Signing in…
                    </motion.span>
                  ) : (
                    <motion.span
                      key="idle"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      Sign in
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            </motion.form>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35, duration: 0.4 }}
              className="my-6 flex items-center gap-3"
            >
              <div className="h-px flex-1 bg-white/10" />
              <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
                or
              </span>
              <div className="h-px flex-1 bg-white/10" />
            </motion.div>

            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.35 }}
              whileHover={{ y: -1, backgroundColor: "rgba(255,255,255,0.06)" }}
              whileTap={{ scale: 0.98 }}
              onClick={handleGoogleLogin}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] py-2.5 text-sm font-medium text-white transition-colors"
            >
              <GoogleIcon />
              Continue with Google
            </motion.button>
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.4 }}
            className="mt-6 text-center text-sm text-gray-400"
          >
            New to SwipeX?{" "}
            <Link
              to="/signup"
              className="font-semibold text-transparent bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text hover:from-violet-300 hover:to-fuchsia-300"
            >
              Create an account
            </Link>
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.85-.08-1.66-.22-2.44H12v4.63h6.44c-.28 1.5-1.13 2.77-2.4 3.62v3h3.87c2.27-2.09 3.58-5.17 3.58-8.81z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.07 7.95-2.92l-3.87-3c-1.08.72-2.45 1.15-4.08 1.15-3.13 0-5.79-2.12-6.74-4.96H1.27v3.11C3.25 21.3 7.31 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.26 14.27a7.2 7.2 0 010-4.54V6.62H1.27a12 12 0 000 10.76l3.99-3.11z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.7 1.27 6.62l3.99 3.11C6.21 6.87 8.87 4.75 12 4.75z"
      />
    </svg>
  );
}
