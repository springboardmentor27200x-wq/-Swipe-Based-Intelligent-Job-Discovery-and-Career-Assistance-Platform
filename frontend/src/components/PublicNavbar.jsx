import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

export default function PublicNavbar() {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  return (
    <div className="w-full sticky top-4 z-50 px-4 sm:px-6">
      <nav className="max-w-6xl mx-auto rounded-full border border-slate-200/80 bg-white/70 backdrop-blur-2xl px-6 py-3.5 shadow-xl shadow-slate-100/50 flex items-center justify-between transition-all duration-300">
        {/* Logo */}
        <Link to="/" className="flex items-center space-x-2.5 group">
          <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-md shadow-blue-500/10 group-hover:scale-105 transition-transform duration-300">
            <Sparkles size={16} className="text-white animate-pulse" />
          </div>
          <span className="text-xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-650">
            SwipeX
          </span>
        </Link>

        {/* Center Public Links */}
        <div className="hidden md:flex items-center space-x-6 font-bold text-xs uppercase tracking-wider text-slate-500">
          <a href="/#features" className="hover:text-blue-600 transition-colors">Features</a>
          <Link to="/pricing" className={`hover:text-blue-600 transition-colors ${isActive('/pricing') ? 'text-blue-600 font-black' : ''}`}>Pricing</Link>
          <Link to="/about" className={`hover:text-blue-600 transition-colors ${isActive('/about') ? 'text-blue-600 font-black' : ''}`}>About</Link>
          <Link to="/contact" className={`hover:text-blue-600 transition-colors ${isActive('/contact') ? 'text-blue-600 font-black' : ''}`}>Contact</Link>
        </div>

        {/* Action Buttons (Right) */}
        <div className="flex items-center space-x-2.5">
          <Link
            to="/login"
            className="px-5 py-2 border border-slate-200/80 bg-white hover:bg-slate-50 text-slate-600 hover:text-blue-605 font-extrabold text-xs rounded-full transition-all text-center uppercase tracking-wider shadow-sm"
          >
            Login
          </Link>
          <Link
            to="/register"
            className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-extrabold text-xs rounded-full transition-all text-center shadow-lg shadow-blue-500/20 uppercase tracking-wider"
          >
            Sign Up
          </Link>
        </div>
      </nav>
    </div>
  );
}
