import { useAuth } from "../context/AuthContext";
import { motion } from "motion/react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const roleLabels = {
  job_seeker: "Job Seeker",
  recruiter: "Recruiter",
  admin: "Admin",
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
  },
};

export default function Dashboard() {
   const { user, logout } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (user?.role === "job_seeker" || user?.role === "jobseeker") {
      navigate("/jobseeker-dashboard", { replace: true });
    } else if (user?.role === "recruiter") {
      navigate("/recruiter-dashboard", { replace: true });
    }
  }, [user, navigate]);


  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#05050b] font-sans">
      {/* Ambient gradient background — matches Login */}
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

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 flex items-center justify-between border-b border-white/10 bg-white/[0.02] px-6 py-4 backdrop-blur-xl sm:px-12"
      >
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 font-bold text-white shadow-lg shadow-fuchsia-500/30">
            X
          </div>
          <span className="text-lg font-bold tracking-tight text-white">
            Swipe
            <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">
              X
            </span>
          </span>
        </div>
        <motion.button
          onClick={logout}
          whileHover={{ y: -1, backgroundColor: "rgba(255,255,255,0.06)" }}
          whileTap={{ scale: 0.97 }}
          className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-medium text-gray-300 transition-colors"
        >
          Log out
        </motion.button>
      </motion.header>

      {/* Main content */}
      <main className="relative z-10 mx-auto max-w-3xl px-6 py-16 sm:px-12">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.p
            variants={itemVariants}
            className="text-xs font-semibold uppercase tracking-[0.2em] text-fuchsia-400/80"
          >
            Module 1 · Authentication
          </motion.p>

          <motion.h1
            variants={itemVariants}
            className="mt-2 text-3xl font-bold leading-tight text-white"
          >
            Welcome, {user?.full_name?.split(" ")[0]} 👋
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="mt-3 text-sm leading-relaxed text-gray-400"
          >
            You're signed in as a{" "}
            <span className="font-semibold text-white">
              {roleLabels[user?.role]}
            </span>
            . This confirms JWT auth, role-based access, and session handling
            are all working end to end.
          </motion.p>

          {/* Account details card */}
          <motion.div
            variants={itemVariants}
            className="relative mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-8 shadow-2xl shadow-black/60 backdrop-blur-2xl"
          >
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px rounded-t-3xl bg-gradient-to-r from-transparent via-white/40 to-transparent" />

            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400">
              Account details
            </h2>

            <dl className="mt-5 divide-y divide-white/10">
              <div className="flex items-center justify-between py-3.5">
                <dt className="text-sm text-gray-500">Full name</dt>
                <dd className="text-sm font-medium text-white">
                  {user?.full_name}
                </dd>
              </div>
              <div className="flex items-center justify-between py-3.5">
                <dt className="text-sm text-gray-500">Email</dt>
                <dd className="text-sm font-medium text-white">
                  {user?.email}
                </dd>
              </div>
              <div className="flex items-center justify-between py-3.5">
                <dt className="text-sm text-gray-500">Role</dt>
                <dd className="inline-flex items-center rounded-full border border-fuchsia-500/30 bg-fuchsia-500/10 px-2.5 py-1 text-xs font-semibold text-fuchsia-300">
                  {roleLabels[user?.role]}
                </dd>
              </div>
              <div className="flex items-center justify-between py-3.5">
                <dt className="text-sm text-gray-500">Account status</dt>
                <dd className="flex items-center gap-1.5 text-sm font-medium text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                  {user?.is_active ? "Active" : "Disabled"}
                </dd>
              </div>
            </dl>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}
