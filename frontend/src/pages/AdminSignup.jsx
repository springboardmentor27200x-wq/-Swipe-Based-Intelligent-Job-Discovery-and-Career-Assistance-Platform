import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

export default function AdminSignup() {
  const navigate = useNavigate();
  const { setTokenFromOAuth } = useAuth(); // reuses existing helper: sets token + loads user

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    admin_secret: "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const { data } = await api.post("/api/admin/signup", form);
      await setTokenFromOAuth(data.access_token);
      navigate("/admin-dashboard");
    } catch (err) {
      setError(err?.response?.data?.detail || "Could not create admin account.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#05050b] font-sans">
      {/* Ambient gradient background — matches Login.jsx / Signup.jsx style */}
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
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-8 flex items-center justify-center gap-2.5"
          >
            <div
              onClick={() => navigate("/home")}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 font-bold text-white shadow-lg shadow-fuchsia-500/30"
            >
              X
            </div>
            <span
              onClick={() => navigate("/home")}
              className="text-xl font-bold tracking-tight text-white"
            >
              Swipe
              <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">
                X
              </span>
            </span>
          </motion.div>

          <div className="relative rounded-3xl border border-white/10 bg-white/[0.04] p-8 shadow-2xl shadow-black/60 backdrop-blur-2xl sm:p-10">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px rounded-t-3xl bg-gradient-to-r from-transparent via-white/40 to-transparent" />

            <p className="mb-2 text-center text-xs font-semibold uppercase tracking-[0.2em] text-fuchsia-400/80">
              Restricted access
            </p>
            <h1 className="text-center text-3xl font-bold leading-tight text-white">
              Admin Sign Up
            </h1>
            <p className="mt-3 text-center text-sm leading-relaxed text-gray-400">
              Requires the admin secret key. This is not for job seekers or
              recruiters — use the regular Sign Up page instead.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
              <AnimatePresence mode="wait">
                {error && (
                  <motion.div
                    key="admin-signup-error"
                    initial={{ opacity: 0, y: -8, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    className="overflow-hidden"
                  >
                    <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                      {error}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-300">
                  Full name
                </label>
                <input
                  name="full_name"
                  required
                  value={form.full_name}
                  onChange={handleChange}
                  placeholder="Jane Doe"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none transition-colors focus:border-fuchsia-500/60 focus:ring-2 focus:ring-fuchsia-500/20"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-300">
                  Email address
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  value={form.email}
                  onChange={handleChange}
                  placeholder="admin@example.com"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none transition-colors focus:border-fuchsia-500/60 focus:ring-2 focus:ring-fuchsia-500/20"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-300">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  required
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none transition-colors focus:border-fuchsia-500/60 focus:ring-2 focus:ring-fuchsia-500/20"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-300">
                  Admin secret key
                </label>
                <input
                  type="password"
                  name="admin_secret"
                  required
                  value={form.admin_secret}
                  onChange={handleChange}
                  placeholder="Provided by your organization"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none transition-colors focus:border-fuchsia-500/60 focus:ring-2 focus:ring-fuchsia-500/20"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 py-3 text-sm font-semibold text-white shadow-lg shadow-fuchsia-600/25 transition-shadow hover:shadow-xl hover:shadow-fuchsia-600/40 disabled:opacity-60"
              >
                {submitting ? "Creating account…" : "Create Admin Account"}
              </button>
            </form>
          </div>

          <p className="mt-6 text-center text-sm text-gray-400">
            Already an admin?{" "}
            <Link
              to="/login"
              className="font-semibold text-transparent bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text hover:from-violet-300 hover:to-fuchsia-300"
            >
              Log in
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
