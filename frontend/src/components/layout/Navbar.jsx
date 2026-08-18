import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../store/AuthContext'
import RoleBadge from '../ui/RoleBadge'
import NotificationBell from '../notifications/NotificationBell'

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()
  const [open, setOpen] = useState(false)

  const handleLogout = async () => {
    setOpen(false)
    await logout()
    navigate('/login')
  }

  const active = (path) =>
    location.pathname === path || location.pathname.startsWith(path + '/')
      ? 'bg-ink text-paper'
      : 'text-slate hover:text-ink hover:bg-sand/60'

  const isSeeker    = user?.role === 'job_seeker'
  const isRecruiter = user?.role === 'recruiter'

  return (
    <header className="sticky top-0 z-40 border-b border-ink/8 bg-paper/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        {/* Logo */}
        <Link to="/" className="font-display text-2xl font-semibold tracking-tight text-ink">
          Swipe<span className="text-coral">X</span>
        </Link>

        {/* Desktop nav */}
        {isAuthenticated && (
          <nav className="hidden md:flex items-center gap-1">
            {isSeeker && (
              <>
                <Link to="/jobs"         className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${active('/jobs')}`}>Discover</Link>
                <Link to="/jobs/saved"   className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${active('/jobs/saved')}`}>Saved</Link>
                <Link to="/jobs/applied" className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${active('/jobs/applied')}`}>Applications</Link>
              </>
            )}
            {isRecruiter && (
              <>
                <Link to="/recruiter/jobs"     className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${active('/recruiter/jobs')}`}>My Jobs</Link>
                <Link to="/recruiter/jobs/new" className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${active('/recruiter/jobs/new')}`}>Post Job</Link>
                <Link to="/recruiter/company"  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${active('/recruiter/company')}`}>Company</Link>
              </>
            )}
          </nav>
        )}

        {/* Right */}
        {isAuthenticated ? (
          <div className="relative flex items-center gap-3">
            <NotificationBell />
            <span className="hidden text-sm text-slate sm:inline">{user.full_name || user.email}</span>
            <RoleBadge role={user.role} />
            <button
              onClick={() => setOpen(v => !v)}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-ink text-sm font-semibold text-paper"
            >
              {(user.first_name || user.email || 'U')[0].toUpperCase()}
            </button>

            {open && (
              <div
                className="absolute right-0 top-12 w-52 rounded-card border border-ink/8 bg-white py-2 shadow-card"
                onMouseLeave={() => setOpen(false)}
              >
                <Link to="/dashboard"     className="block px-4 py-2 text-sm text-ink hover:bg-sand/60" onClick={() => setOpen(false)}>Dashboard</Link>
                <Link to="/notifications" className="block px-4 py-2 text-sm text-ink hover:bg-sand/60" onClick={() => setOpen(false)}>Notifications</Link>
                <Link to="/profile"       className="block px-4 py-2 text-sm text-ink hover:bg-sand/60" onClick={() => setOpen(false)}>Profile Settings</Link>
                <div className="my-1 border-t border-ink/8" />
                {isSeeker && (
                  <>
                    <Link to="/jobs"         className="block px-4 py-2 text-sm text-ink hover:bg-sand/60" onClick={() => setOpen(false)}>Browse Jobs</Link>
                    <Link to="/jobs/saved"   className="block px-4 py-2 text-sm text-ink hover:bg-sand/60" onClick={() => setOpen(false)}>Saved Jobs</Link>
                    <Link to="/jobs/applied" className="block px-4 py-2 text-sm text-ink hover:bg-sand/60" onClick={() => setOpen(false)}>My Applications</Link>
                    <div className="my-1 border-t border-ink/8" />
                  </>
                )}
                {isRecruiter && (
                  <>
                    <Link to="/recruiter/jobs"     className="block px-4 py-2 text-sm text-ink hover:bg-sand/60" onClick={() => setOpen(false)}>My Jobs</Link>
                    <Link to="/recruiter/jobs/new" className="block px-4 py-2 text-sm text-ink hover:bg-sand/60" onClick={() => setOpen(false)}>Post a Job</Link>
                    <Link to="/recruiter/company"  className="block px-4 py-2 text-sm text-ink hover:bg-sand/60" onClick={() => setOpen(false)}>Company Profile</Link>
                    <div className="my-1 border-t border-ink/8" />
                  </>
                )}
                <button onClick={handleLogout} className="block w-full px-4 py-2 text-left text-sm text-coral hover:bg-sand/60">
                  Log out
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link to="/login"    className="text-sm font-medium text-ink hover:text-coral">Log in</Link>
            <Link to="/register" className="rounded-xl bg-ink px-4 py-2 text-sm font-medium text-paper hover:bg-ink/90">Get started</Link>
          </div>
        )}
      </div>
    </header>
  )
}
