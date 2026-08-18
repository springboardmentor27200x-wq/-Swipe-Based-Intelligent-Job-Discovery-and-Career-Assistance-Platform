import React, { useEffect, useState } from 'react'
import PageShell from '../components/layout/PageShell'
import FormField from '../components/ui/FormField'
import Button from '../components/ui/Button'
import ResumeManager from '../components/resume/ResumeManager'
import { useAuth } from '../store/AuthContext'
import { api, extractErrorMessage } from '../services/api'

export default function ProfilePage() {
  const { user, refreshUser } = useAuth()
  const isRecruiter = user.role === 'recruiter'
  const endpoint = isRecruiter ? '/users/recruiter-profile/' : '/users/profile/'

  const [basics, setBasics] = useState({ first_name: user.first_name, last_name: user.last_name })
  const [extra, setExtra] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    api.get(endpoint).then(({ data }) => {
      setExtra(data.data)
      setLoading(false)
    })
  }, [endpoint])

  const updateBasics = (key) => (e) => setBasics((f) => ({ ...f, [key]: e.target.value }))
  const updateExtra = (key) => (e) => setExtra((f) => ({ ...f, [key]: e.target.value }))

  const handleSave = async (e) => {
    e.preventDefault()
    setMessage('')
    setError('')
    setSaving(true)
    try {
      await api.patch('/users/me/', basics)
      await api.patch(endpoint, extra)
      await refreshUser()
      setMessage('Profile updated.')
    } catch (err) {
      setError(extractErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <PageShell narrow>
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 rounded-full border-2 border-coral border-t-transparent animate-spin" />
        </div>
      </PageShell>
    )
  }

  return (
    <PageShell narrow>
      <div className="rounded-card border border-ink/8 bg-white p-8 shadow-card">
        <h1 className="font-display text-3xl font-semibold text-ink">Profile settings</h1>
        <p className="mt-1 text-sm text-slate">{user.email}</p>

        <form onSubmit={handleSave} className="mt-8 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="First name" id="first_name" value={basics.first_name} onChange={updateBasics('first_name')} />
            <FormField label="Last name" id="last_name" value={basics.last_name} onChange={updateBasics('last_name')} />
          </div>

          {isRecruiter ? (
            <>
              <FormField label="Company name" id="company_name" value={extra.company_name || ''} onChange={updateExtra('company_name')} required />
              <FormField label="Designation" id="designation" value={extra.designation || ''} onChange={updateExtra('designation')} />
              <FormField label="Industry" id="industry" value={extra.industry || ''} onChange={updateExtra('industry')} />
              <FormField label="Company website" id="company_website" value={extra.company_website || ''} onChange={updateExtra('company_website')} />
            </>
          ) : (
            <>
              <FormField label="Headline" id="headline" value={extra.headline || ''} onChange={updateExtra('headline')} placeholder="e.g. Full Stack Developer" />
              <FormField label="Location" id="location" value={extra.location || ''} onChange={updateExtra('location')} placeholder="City, Country" />
              <FormField label="Bio" id="bio" value={extra.bio || ''} onChange={updateExtra('bio')} />
              <FormField label="LinkedIn" id="linkedin" value={extra.linkedin || ''} onChange={updateExtra('linkedin')} />
              <FormField label="GitHub" id="github" value={extra.github || ''} onChange={updateExtra('github')} />
            </>
          )}

          {message && <div className="rounded-xl bg-teal/10 px-4 py-3 text-sm text-teal">{message}</div>}
          {error && <div className="rounded-xl bg-coral/10 px-4 py-3 text-sm text-coral">{error}</div>}

          <Button type="submit" variant="coral" full loading={saving}>
            Save changes
          </Button>
        </form>
      </div>

      {!isRecruiter && (
        <div className="mt-6">
          <ResumeManager />
        </div>
      )}
    </PageShell>
  )
}
