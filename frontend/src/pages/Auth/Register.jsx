import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User as UserIcon, Briefcase, Zap, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { registerUser } from '../../store/authSlice';
import Button from '../../components/UI/Button.jsx';
import toast from 'react-hot-toast';

export default function Register() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('job_seeker'); // job_seeker, recruiter
  const { isLoading } = useSelector(s => s.auth);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!fullName || !email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    dispatch(registerUser({ full_name: fullName, email, password, role }))
      .unwrap()
      .then((result) => {
        toast.success("Registration successful!");
        navigate(result.user?.role === 'recruiter' ? '/recruiter' : '/discover');
      })
      .catch((err) => {
        toast.error(err || "Registration failed. Email might already exist.");
      });
  };

  return (
    <div className="relative min-h-screen bg-bg-primary flex items-center justify-center p-6 overflow-hidden select-none">
      {/* Background Blobs */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-primary/[0.07] blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 rounded-full bg-secondary/[0.06] blur-[100px] pointer-events-none" />

      {/* Brand logo at top */}
      <div className="absolute top-12 left-1/2 -translate-x-1/2 text-center pointer-events-none">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow-purple">
            <Zap className="w-5 h-5 text-white fill-white" />
          </div>
          <span className="text-2xl font-bold font-outfit text-text-primary tracking-wide">SwipeX</span>
        </div>
        <p className="text-xs text-text-secondary uppercase tracking-widest font-bold">Discover Careers Through AI</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md glass-card rounded-xl3 p-8 border border-slate-200 relative z-10"
      >
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold font-outfit text-text-primary">Create Account</h2>
          <p className="text-sm text-text-secondary mt-2">Get started with swipe-based job discovery</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-2">Full Name</label>
            <div className="relative">
              <input
                type="text"
                required
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="John Doe"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all duration-200"
              />
              <UserIcon className="absolute left-4 top-3.5 w-4 h-4 text-text-secondary" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-2">Email Address</label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all duration-200"
              />
              <Mail className="absolute left-4 top-3.5 w-4 h-4 text-text-secondary" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-2">Password</label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all duration-200"
              />
              <Lock className="absolute left-4 top-3.5 w-4 h-4 text-text-secondary" />
            </div>
          </div>

          {/* Role Picker Card Selectors */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-2">Join As</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setRole('job_seeker')}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border text-center transition-all duration-200 ${
                  role === 'job_seeker'
                    ? 'border-primary bg-primary/[0.06] shadow-glow-purple text-primary'
                    : 'border-slate-200 bg-slate-50 text-text-secondary hover:bg-slate-100'
                }`}
              >
                <UserIcon className="w-5 h-5 mb-2 text-primary" />
                <span className="text-sm font-semibold">Job Seeker</span>
                <span className="text-[10px] opacity-70 mt-1">Browse and apply for jobs</span>
              </button>

              <button
                type="button"
                onClick={() => setRole('recruiter')}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border text-center transition-all duration-200 ${
                  role === 'recruiter'
                    ? 'border-secondary bg-secondary/[0.06] shadow-glow-cyan text-secondary'
                    : 'border-slate-200 bg-slate-50 text-text-secondary hover:bg-slate-100'
                }`}
              >
                <Briefcase className="w-5 h-5 mb-2 text-secondary" />
                <span className="text-sm font-semibold">Recruiter</span>
                <span className="text-[10px] opacity-70 mt-1">Post openings & review talent</span>
              </button>
            </div>
          </div>

          <Button
            type="submit"
            isLoading={isLoading}
            fullWidth
            size="lg"
            className="mt-2"
            iconRight={<ArrowRight className="w-4 h-4" />}
          >
            Create Account
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-text-secondary">
          Already have an account?{' '}
          <Link to="/login" className="text-primary hover:text-primary-light font-semibold transition-colors">
            Sign In Here
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
