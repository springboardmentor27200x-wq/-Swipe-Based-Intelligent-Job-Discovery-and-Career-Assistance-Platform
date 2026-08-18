import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { authService } from '../services/authService'
import { tokenStore } from '../services/api'

const AuthContext = createContext(null)

/**
 * Normalise the raw user object from the API so role helpers always exist
 * as plain boolean properties (since Django model @property methods don't
 * travel over JSON).
 */
function normaliseUser(raw) {
  if (!raw) return null
  return {
    ...raw,
    // Ensure these are always booleans regardless of API shape
    is_job_seeker: raw.role === 'job_seeker' || raw.is_job_seeker === true,
    is_recruiter:  raw.role === 'recruiter'  || raw.is_recruiter  === true,
    is_admin_user: raw.role === 'admin',
  }
}

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  const loadUser = useCallback(async () => {
    if (!tokenStore.getAccess()) { setLoading(false); return }
    try {
      const me = await authService.fetchMe()
      setUser(normaliseUser(me))
    } catch {
      tokenStore.clear()
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadUser() }, [loadUser])

  const register = async (payload) => {
    setError(null)
    const newUser = await authService.register(payload)
    setUser(normaliseUser(newUser))
    return newUser
  }

  const login = async (email, password) => {
    setError(null)
    const loggedInUser = await authService.login(email, password)
    setUser(normaliseUser(loggedInUser))
    return loggedInUser
  }

  const logout = async () => {
    await authService.logout()
    setUser(null)
  }

  const refreshUser = async () => {
    const me = await authService.fetchMe()
    const norm = normaliseUser(me)
    setUser(norm)
    return norm
  }

  const value = {
    user,
    loading,
    error,
    setError,
    isAuthenticated: !!user,
    register,
    login,
    logout,
    refreshUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
