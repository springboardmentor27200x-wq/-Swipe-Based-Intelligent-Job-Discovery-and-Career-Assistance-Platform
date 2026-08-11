import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { Bell, Search, LogOut, User as UserIcon, Shield, Briefcase, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { logout } from '../../store/authSlice';
import api from '../../services/api';

export default function Navbar() {
  const { user } = useSelector(s => s.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);

  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('discover')) return 'Discover Jobs';
    if (path.includes('jobs')) return 'Search & Filter';
    if (path.includes('recommendations')) return 'AI Recommendations';
    if (path.includes('resume')) return 'Resume Hub & ATS';
    if (path.includes('applications')) return 'Application Tracker';
    if (path.includes('dashboard')) return 'Career Analytics';
    if (path.includes('notifications')) return 'Alerts & Notifications';
    if (path.includes('profile')) return 'My Profile';
    if (path.includes('recruiter')) return 'Recruiter Portal';
    if (path.includes('admin')) return 'Platform Administration';
    return 'SwipeX';
  };

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const { data } = await api.get('/notifications/unread-count');
        setUnreadCount(data.count);
      } catch (err) {
        // fail silently
      }
    };
    if (user) {
      fetchUnread();
      const interval = setInterval(fetchUnread, 30000); // 30s poll
      return () => clearInterval(interval);
    }
  }, [user]);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <header className="h-20 border-b border-slate-200 bg-white/80 backdrop-blur-glass px-8 flex items-center justify-between sticky top-0 z-40 select-none">
      {/* Title */}
      <div>
        <h1 className="text-xl font-semibold font-outfit text-text-primary tracking-wide">
          {getPageTitle()}
        </h1>
        <p className="text-xs text-text-secondary">
          Welcome back, <span className="text-primary font-medium">{user?.full_name}</span>
        </p>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-6">
        {/* Search Input Mock */}
        <div className="relative hidden md:block w-64">
          <input
            type="text"
            placeholder="Search everything..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-10 pr-4 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all duration-200"
          />
          <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-text-secondary" />
        </div>

        {/* Notifications Icon */}
        <button
          onClick={() => navigate('/notifications')}
          className="relative p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-text-secondary hover:text-text-primary hover:bg-slate-100 transition-all duration-200"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-danger rounded-full animate-pulse shadow-glow-red" />
          )}
        </button>

        {/* User Info & Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-3 p-1.5 pr-3.5 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-all duration-200"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center text-sm font-bold text-white shadow-sm shrink-0">
              {user?.full_name?.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm font-medium text-text-primary hidden sm:block">
              {user?.full_name?.split(' ')[0]}
            </span>
          </button>

          <AnimatePresence>
            {showDropdown && (
              <>
                {/* Click outside overlay */}
                <div className="fixed inset-0 z-30" onClick={() => setShowDropdown(false)} />

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2.5 w-56 rounded-xl border border-slate-200 bg-bg-secondary p-2 shadow-card backdrop-blur-glass z-40"
                >
                  <div className="px-3.5 py-2.5 border-b border-slate-200 mb-1.5">
                    <p className="text-xs text-text-secondary">Signed in as</p>
                    <p className="text-sm font-semibold text-text-primary truncate">{user?.email}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-bold rounded bg-primary/20 text-primary-light uppercase tracking-wider">
                      {user?.role?.replace('_', ' ')}
                    </span>
                  </div>

                  <button
                    onClick={() => { setShowDropdown(false); navigate('/profile'); }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-slate-50 rounded-lg transition-colors"
                  >
                    <UserIcon className="w-4 h-4" />
                    <span>My Profile</span>
                  </button>

                  {user?.role === 'recruiter' && (
                    <button
                      onClick={() => { setShowDropdown(false); navigate('/recruiter'); }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-slate-50 rounded-lg transition-colors"
                    >
                      <Briefcase className="w-4 h-4" />
                      <span>Recruiter Panel</span>
                    </button>
                  )}

                  {user?.role === 'admin' && (
                    <button
                      onClick={() => { setShowDropdown(false); navigate('/admin'); }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-slate-50 rounded-lg transition-colors"
                    >
                      <Shield className="w-4 h-4" />
                      <span>Admin Panel</span>
                    </button>
                  )}

                  <hr className="border-slate-200 my-1.5" />

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-danger hover:bg-danger/10 rounded-lg transition-colors font-medium"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
