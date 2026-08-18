import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import PageShell from '../components/layout/PageShell'
import FormField from '../components/ui/FormField'
import Button from '../components/ui/Button'
import { useAuth } from '../store/AuthContext'
import { extractErrorMessage } from '../services/api'

const ROLE_OPTIONS = [
  { value: 'job_seeker', label: 'Job Seeker — I want to find a job' },
  { value: 'recruiter', label: 'Recruiter — I want to hire' },
]

export default function RegisterPage() {
  const navigate = useNavigate()
  const { register } = useAuth()

  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    password_confirm: '',
    role: 'job_seeker',
    company_name: '',
  })
  const [errors, setErrors] = useState({})
  const [submitError, setSubmitError] = useState('')
  const [loading, setLoading] = useState(false)

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const validate = () => {
    const next = {}
    if (!form.first_name.trim()) next.first_name = 'Required'
    if (!form.email.trim()) next.email = 'Required'
    if (form.password.length < 8) next.password = 'At least 8 characters'
    if (form.password !== form.password_confirm) next.password_confirm = 'Passwords do not match'
    if (form.role === 'recruiter' && !form.company_name.trim()) next.company_name = 'Required for recruiters'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitError('')
    if (!validate()) return

    setLoading(true)
    try {
      await register(form)
      navigate('/dashboard')
    } catch (err) {
      setSubmitError(extractErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageShell narrow>
      <div className="rounded-card border border-ink/8 bg-white p-8 shadow-card">
        <h1 className="font-display text-3xl font-semibold text-ink">Create your account</h1>
        <p className="mt-1 text-sm text-slate">Start discovering roles or candidates in minutes.</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="First name" id="first_name" value={form.first_name} onChange={update('first_name')} error={errors.first_name} required />
            <FormField label="Last name" id="last_name" value={form.last_name} onChange={update('last_name')} />
          </div>

          <FormField label="Email" id="email" type="email" value={form.email} onChange={update('email')} error={errors.email} required autoComplete="email" />

          <FormField label="I am a..." id="role" as="select" value={form.role} onChange={update('role')} options={ROLE_OPTIONS} />

          {form.role === 'recruiter' && (
            <FormField label="Company name" id="company_name" value={form.company_name} onChange={update('company_name')} error={errors.company_name} required />
          )}

          <FormField label="Password" id="password" type="password" value={form.password} onChange={update('password')} error={errors.password} required autoComplete="new-password" />
          <FormField label="Confirm password" id="password_confirm" type="password" value={form.password_confirm} onChange={update('password_confirm')} error={errors.password_confirm} required autoComplete="new-password" />

          {submitError && (
            <div className="rounded-xl bg-coral/10 px-4 py-3 text-sm text-coral">{submitError}</div>
          )}

          <Button type="submit" variant="coral" full loading={loading}>
            Create account
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-ink hover:text-coral">
            Log in
          </Link>
        </p>
      </div>
    </PageShell>
  )
}
