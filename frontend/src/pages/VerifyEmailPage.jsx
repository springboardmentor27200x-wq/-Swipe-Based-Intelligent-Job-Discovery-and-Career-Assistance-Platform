import React, { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import PageShell from '../components/layout/PageShell'
import { authService } from '../services/authService'
import { extractErrorMessage } from '../services/api'

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const [status, setStatus] = useState('pending') // pending | success | error
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('This verification link is missing its token.')
      return
    }
    authService
      .verifyEmail(token)
      .then(() => {
        setStatus('success')
        setMessage('Your email has been verified.')
      })
      .catch((err) => {
        setStatus('error')
        setMessage(extractErrorMessage(err))
      })
  }, [token])

  return (
    <PageShell narrow>
      <div className="rounded-card border border-ink/8 bg-white p-8 text-center shadow-card">
        {status === 'pending' && (
          <>
            <div className="mx-auto mb-4 h-8 w-8 rounded-full border-2 border-coral border-t-transparent animate-spin" />
            <p className="text-slate">Verifying your email…</p>
          </>
        )}
        {status === 'success' && (
          <>
            <h1 className="font-display text-2xl font-semibold text-teal">Email verified</h1>
            <p className="mt-2 text-slate">{message}</p>
          </>
        )}
        {status === 'error' && (
          <>
            <h1 className="font-display text-2xl font-semibold text-coral">Verification failed</h1>
            <p className="mt-2 text-slate">{message}</p>
          </>
        )}
        <Link to="/dashboard" className="mt-6 inline-block font-medium text-ink hover:text-coral">
          Go to dashboard →
        </Link>
      </div>
    </PageShell>
  )
}
