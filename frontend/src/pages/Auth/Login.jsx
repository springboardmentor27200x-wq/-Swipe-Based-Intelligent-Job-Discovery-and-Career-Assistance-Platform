import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Zap, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { loginUser } from '../../store/authSlice';
import Button from '../../components/UI/Button.jsx';
import toast from 'react-hot-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { isLoading } = useSelector(s => s.auth);
  
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const getHomeRoute = (role) => {
    if (role === 'recruiter') return '/recruiter';
    if (role === 'admin') return '/admin';
    return '/discover';
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter email and password");
      return;
    }
    
    dispatch(loginUser({ email, password }))
      .unwrap()
      .then((result) => {
        toast.success("Successfully logged in!");
        navigate(getHomeRoute(result.user?.role));
      })
      .catch((err) => {
        toast.error(err || "Login failed. Please check credentials.");
      });
  };

  const handleQuickLogin = (demoEmail) => {
    setEmail(demoEmail);
    setPassword('demo123');
    dispatch(loginUser({ email: demoEmail, password: 'demo123' }))
      .unwrap()
      .then((result) => {
        toast.success("Quick login successful!");
        navigate(getHomeRoute(result.user?.role));
      })
      .catch((err) => {
        toast.error(err || "Login failed.");
      });
  };

  return (
    <div className="relative min-h-screen bg-bg-primary flex items-center justify-center p-6 overflow-hidden select-none">
      {/* Background Blobs */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-primary/[0.07] blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 rounded-full bg-secondary/[0.06] blur-[100px] pointer-events-none" />

      {/* Floating Sparkles Mock */}
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
          <h2 className="text-2xl font-bold font-outfit text-text-primary">Sign In</h2>
          <p className="text-sm text-text-secondary mt-2">Access your personalized candidate portal</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
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

          <Button
            type="submit"
            isLoading={isLoading}
            fullWidth
            size="lg"
            iconRight={<ArrowRight className="w-4 h-4" />}
          >
            Login
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-text-secondary">
          Don't have an account?{' '}
          <Link to="/register" className="text-primary hover:text-primary-light font-semibold transition-colors">
            Register Here
          </Link>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-200">
          <p className="text-center text-xs font-bold uppercase tracking-wider text-text-muted mb-4">Quick Demo Logins</p>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleQuickLogin('jobseeker@swipex.com')}
              className="px-2 py-2.5 text-[10px] font-bold rounded-lg border border-slate-200 hover:border-primary/40 bg-slate-50 hover:bg-primary/5 text-text-primary transition-all duration-200"
            >
              Candidate
            </button>
            <button
              onClick={() => handleQuickLogin('recruiter@swipex.com')}
              className="px-2 py-2.5 text-[10px] font-bold rounded-lg border border-slate-200 hover:border-secondary/40 bg-slate-50 hover:bg-secondary/5 text-text-primary transition-all duration-200"
            >
              Recruiter
            </button>
            <button
              onClick={() => handleQuickLogin('admin@swipex.com')}
              className="px-2 py-2.5 text-[10px] font-bold rounded-lg border border-slate-200 hover:border-accent/40 bg-slate-50 hover:bg-accent/5 text-text-primary transition-all duration-200"
            >
              Admin
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
