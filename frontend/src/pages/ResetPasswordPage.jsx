import React, { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import PageShell from '../components/layout/PageShell'
import FormField from '../components/ui/FormField'
import Button from '../components/ui/Button'
import { authService } from '../services/authService'
import { extractErrorMessage } from '../services/api'

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token') || ''

  const [newPassword, setNewPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (newPassword !== confirm) {
      setError('Passwords do not match.')
      return
    }
    if (!token) {
      setError('This reset link is missing its token. Please request a new one.')
      return
    }

    setLoading(true)
    try {
      await authService.confirmPasswordReset({
        token,
        new_password: newPassword,
        new_password_confirm: confirm,
      })
      setDone(true)
      setTimeout(() => navigate('/login'), 2000)
    } catch (err) {
      setError(extractErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageShell narrow>
      <div className="rounded-card border border-ink/8 bg-white p-8 shadow-card">
        <h1 className="font-display text-3xl font-semibold text-ink">Set a new password</h1>

        {done ? (
          <div className="mt-8 rounded-xl bg-teal/10 px-4 py-4 text-sm text-teal">
            Password reset. Redirecting you to log in…
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <FormField label="New password" id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required autoComplete="new-password" />
            <FormField label="Confirm new password" id="confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required autoComplete="new-password" />
            {error && <div className="rounded-xl bg-coral/10 px-4 py-3 text-sm text-coral">{error}</div>}
            <Button type="submit" variant="coral" full loading={loading}>
              Reset password
            </Button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-slate">
          <Link to="/login" className="font-medium text-ink hover:text-coral">
            Back to log in
          </Link>
        </p>
      </div>
    </PageShell>
  )
}
