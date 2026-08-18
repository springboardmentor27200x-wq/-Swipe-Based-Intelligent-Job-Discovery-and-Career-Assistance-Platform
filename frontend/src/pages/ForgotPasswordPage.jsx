import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import PageShell from '../components/layout/PageShell'
import FormField from '../components/ui/FormField'
import Button from '../components/ui/Button'
import { authService } from '../services/authService'
import { extractErrorMessage } from '../services/api'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await authService.requestPasswordReset(email)
      setSent(true)
    } catch (err) {
      setError(extractErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageShell narrow>
      <div className="rounded-card border border-ink/8 bg-white p-8 shadow-card">
        <h1 className="font-display text-3xl font-semibold text-ink">Reset your password</h1>
        <p className="mt-1 text-sm text-slate">We'll email you a link to set a new one.</p>

        {sent ? (
          <div className="mt-8 rounded-xl bg-teal/10 px-4 py-4 text-sm text-teal">
            If an account exists for {email}, a reset link is on its way.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <FormField label="Email" id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
            {error && <div className="rounded-xl bg-coral/10 px-4 py-3 text-sm text-coral">{error}</div>}
            <Button type="submit" variant="coral" full loading={loading}>
              Send reset link
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
