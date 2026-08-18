import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import PageShell from '../components/layout/PageShell'
import FormField from '../components/ui/FormField'
import Button from '../components/ui/Button'
import { useAuth } from '../store/AuthContext'
import { extractErrorMessage } from '../services/api'

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      const dest = location.state?.from?.pathname || '/dashboard'
      navigate(dest, { replace: true })
    } catch (err) {
      setError(extractErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageShell narrow>
      <div className="rounded-card border border-ink/8 bg-white p-8 shadow-card">
        <h1 className="font-display text-3xl font-semibold text-ink">Welcome back</h1>
        <p className="mt-1 text-sm text-slate">Log in to keep swiping toward your next role.</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <FormField
            label="Email"
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          <FormField
            label="Password"
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />

          <div className="flex justify-end">
            <Link to="/forgot-password" className="text-sm font-medium text-slate hover:text-coral">
              Forgot password?
            </Link>
          </div>

          {error && <div className="rounded-xl bg-coral/10 px-4 py-3 text-sm text-coral">{error}</div>}

          <Button type="submit" variant="coral" full loading={loading}>
            Log in
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate">
          New to SwipeX?{' '}
          <Link to="/register" className="font-medium text-ink hover:text-coral">
            Create an account
          </Link>
        </p>
      </div>
    </PageShell>
  )
}
