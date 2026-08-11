import { NavLink } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { 
  Zap, Search, Star, FileText, Briefcase, BarChart2, Bell, User, Building, Shield, ChevronLeft, LogOut
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function Sidebar() {
  const { user } = useSelector(s => s.auth);

  const getLinks = () => {
    const base = [
      { to: '/discover', icon: Zap, label: 'Discover' },
      { to: '/jobs', icon: Search, label: 'Browse Jobs' },
      { to: '/recommendations', icon: Star, label: 'Matches' },
      { to: '/resume', icon: FileText, label: 'Resume & ATS' },
      { to: '/applications', icon: Briefcase, label: 'Tracker' },
      { to: '/dashboard', icon: BarChart2, label: 'Dashboard' },
      { to: '/notifications', icon: Bell, label: 'Notifications' },
      { to: '/profile', icon: User, label: 'My Profile' }
    ];

    if (user?.role === 'recruiter') {
      base.push({ to: '/recruiter', icon: Building, label: 'Recruiter Panel' });
    } else if (user?.role === 'admin') {
      base.push({ to: '/recruiter', icon: Building, label: 'Recruiter Panel' });
      base.push({ to: '/admin', icon: Shield, label: 'Admin Portal' });
    }
    return base;
  };

  const links = getLinks();

  return (
    <aside className="w-64 border-r border-slate-200 bg-bg-secondary flex flex-col justify-between select-none h-screen shrink-0 sticky top-0">
      {/* Brand */}
      <div className="p-8 border-b border-slate-200 flex items-center justify-between">
        <NavLink to="/discover" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow-purple">
            <Zap className="w-5 h-5 text-white fill-white" />
          </div>
          <div>
            <span className="text-xl font-bold font-outfit text-text-primary tracking-wide">SwipeX</span>
            <span className="block text-[9px] uppercase font-bold tracking-widest text-secondary font-inter">CAREER AI</span>
          </div>
        </NavLink>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-8 overflow-y-auto space-y-1.5 scrollbar-thin">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => `
                flex items-center gap-4 px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-200 group
                ${isActive 
                  ? 'bg-gradient-button text-white shadow-glow-purple' 
                  : 'text-text-secondary hover:text-text-primary hover:bg-slate-50 border border-transparent hover:border-slate-200'
                }
              `}
            >
              {({ isActive }) => (
                <>
                  <Icon className={`w-5 h-5 shrink-0 transition-transform group-hover:scale-105 ${isActive ? 'text-white' : 'text-text-secondary group-hover:text-primary-light'}`} />
                  <span className="truncate">{link.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="absolute right-4 w-1.5 h-1.5 bg-white rounded-full"
                    />
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Sidebar Footer User Stats summary */}
      <div className="p-6 border-t border-slate-200 bg-slate-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center font-bold text-text-primary shadow-sm">
            {user?.full_name?.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-text-primary truncate">{user?.full_name}</p>
            <p className="text-[11px] text-text-secondary capitalize truncate">{user?.role?.replace('_', ' ')}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
