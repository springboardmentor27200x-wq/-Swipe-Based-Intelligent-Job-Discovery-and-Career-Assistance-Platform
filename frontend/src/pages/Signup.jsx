import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { motion, AnimatePresence } from "motion/react";

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

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    role: "job_seeker",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  // We already know the role — the user picked it in the form above,
  // so there's no need to fetch it back from the server like on Login.
  const redirectByRole = (role) => {
    if (role === "job_seeker" || role === "jobseeker") {
      navigate("/jobseeker-dashboard");
    } else if (role === "recruiter") {
      navigate("/recruiter-dashboard");
    } else {
      navigate("/dashboard"); // fallback, shouldn't normally happen
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (form.password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    setSubmitting(true);
    try {
      await signup(form.fullName, form.email, form.password, form.role);
      redirectByRole(form.role);
    } catch (err) {
      setError(
        err?.response?.data?.detail || "Couldn't create your account. Try again."
      );
    } finally {
      setSubmitting(false);
    }
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
              Get started
            </p>
            <h1 className="text-center text-3xl font-bold leading-tight text-white">
              Create your account
            </h1>
            <p className="mt-3 text-center text-sm leading-relaxed text-gray-400">
              Tell us a bit about you so we can tailor your swipe feed from
              day one.
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
                    key="signup-error"
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

              {/* Role selector */}
              <motion.div variants={fieldVariants}>
                <label className="mb-2 block text-sm font-medium text-gray-300">
                  I'm signing up as a
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: "job_seeker", label: "Job Seeker" },
                    { value: "recruiter", label: "Recruiter" },
                  ].map((option) => {
                    const active = form.role === option.value;
                    return (
                      <motion.button
                        type="button"
                        key={option.value}
                        onClick={() => setForm({ ...form, role: option.value })}
                        whileHover={{ y: -1 }}
                        whileTap={{ scale: 0.97 }}
                        className={`relative overflow-hidden rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors duration-200 ${
                          active
                            ? "border-transparent text-white"
                            : "border-white/10 bg-white/[0.03] text-gray-400 hover:border-white/20 hover:text-gray-200"
                        }`}
                      >
                        {active && (
                          <motion.span
                            layoutId="role-highlight"
                            className="absolute inset-0 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 shadow-md shadow-fuchsia-600/30"
                            transition={{ type: "spring", stiffness: 500, damping: 35 }}
                            style={{ zIndex: 0 }}
                          />
                        )}
                        <span className="relative z-10">{option.label}</span>
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>

              <motion.div variants={fieldVariants}>
                <label className="mb-1.5 block text-sm font-medium text-gray-300">
                  Full name
                </label>
                <motion.input
                  type="text"
                  name="fullName"
                  required
                  value={form.fullName}
                  onChange={handleChange}
                  placeholder="Jordan Rivera"
                  whileFocus={{ scale: 1.01 }}
                  transition={{ duration: 0.15 }}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none transition-colors focus:border-fuchsia-500/60 focus:ring-2 focus:ring-fuchsia-500/20"
                />
              </motion.div>

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
                <label className="mb-1.5 block text-sm font-medium text-gray-300">
                  Password
                </label>
                <motion.input
                  type="password"
                  name="password"
                  required
                  value={form.password}
                  onChange={handleChange}
                  placeholder="At least 8 characters"
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
                      Creating account…
                    </motion.span>
                  ) : (
                    <motion.span
                      key="idle"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      Create account
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            </motion.form>
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.4 }}
            className="mt-6 text-center text-sm text-gray-400"
          >
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-semibold text-transparent bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text hover:from-violet-300 hover:to-fuchsia-300"
            >
              Sign in
            </Link>
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}
