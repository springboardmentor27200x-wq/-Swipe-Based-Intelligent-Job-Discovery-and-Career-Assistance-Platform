import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../store/AuthContext'

/**
 * Wraps a route requiring authentication.
 * allowedRoles: array of role strings e.g. ['job_seeker'] or ['recruiter']
 * Uses user.role (string from API) NOT user.is_job_seeker (Django model property)
 */
export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading, isAuthenticated } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper">
        <div className="h-8 w-8 rounded-full border-2 border-coral border-t-transparent animate-spin" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Role check uses user.role string (e.g. 'job_seeker', 'recruiter', 'admin')
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}
