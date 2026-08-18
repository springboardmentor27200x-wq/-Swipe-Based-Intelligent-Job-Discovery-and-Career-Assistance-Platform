import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageShell from '../components/layout/PageShell'
import FormField from '../components/ui/FormField'
import Button from '../components/ui/Button'
import { companyService } from '../services/jobService'
import { extractErrorMessage } from '../services/api'

const COMPANY_TYPE_OPTS = [
  { value: 'mnc',         label: 'MNC' },
  { value: 'startup',     label: 'Startup' },
  { value: 'new_startup', label: 'Newly Founded Startup' },
  { value: 'enterprise',  label: 'Enterprise' },
  { value: 'sme',         label: 'SME' },
]
const SIZE_OPTS = [
  { value: '1-10',    label: '1–10 employees' },
  { value: '11-50',   label: '11–50 employees' },
  { value: '51-200',  label: '51–200 employees' },
  { value: '201-500', label: '201–500 employees' },
  { value: '501-1000',label: '501–1 000 employees' },
  { value: '1000+',   label: '1 000+ employees' },
]

const BLANK = {
  name: '', company_type: 'startup', industry: '',
  description: '', website: '', headquarters: '',
  company_size: '', founded_year: '', linkedin: '', twitter: '',
}

export default function CompanyProfilePage() {
  const navigate  = useNavigate()
  const [companies, setCompanies] = useState([])
  const [form, setForm]     = useState(BLANK)
  const [editId, setEditId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [msg, setMsg]       = useState('')
  const [error, setError]   = useState('')
  const [showForm, setShowForm] = useState(false)

  const load = () => {
    setLoading(true)
    // Use recruiter-specific endpoint that filters by ownership server-side
    companyService.myCompanies()
      .then(list => {
        setCompanies(list)
        // auto-show form if no companies yet
        if (list.length === 0) setShowForm(true)
      })
      .catch(() => setCompanies([]))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const upd = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }))

  const openCreate = () => {
    setForm(BLANK); setEditId(null); setShowForm(true); setMsg(''); setError('')
  }

  const openEdit = (company) => {
    setForm({
      name:         company.name,
      company_type: company.company_type || 'startup',
      industry:     company.industry || '',
      description:  company.description || '',
      website:      company.website || '',
      headquarters: company.headquarters || '',
      company_size: company.company_size || '',
      founded_year: company.founded_year || '',
      linkedin:     company.linkedin || '',
      twitter:      company.twitter || '',
    })
    setEditId(company.id); setShowForm(true); setMsg(''); setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true); setMsg(''); setError('')
    try {
      const payload = { ...form, founded_year: form.founded_year || null }
      if (editId) {
        await companyService.update(editId, payload)
        setMsg('Company updated successfully.')
      } else {
        await companyService.create(payload)
        setMsg('Company created! You can now post jobs.')
      }
      setShowForm(false)
      load()
    } catch (e) {
      setError(extractErrorMessage(e))
    } finally {
      setSaving(false)
    }
  }

  return (
    <PageShell>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-3xl font-semibold text-ink">Company Profiles</h1>
            <p className="text-slate text-sm mt-1">Manage the companies you recruit for</p>
          </div>
          {!showForm && (
            <Button variant="coral" onClick={openCreate}>+ New Company</Button>
          )}
        </div>

        {msg && (
          <div className="mb-4 rounded-xl bg-teal/10 px-4 py-3 text-sm text-teal flex items-center justify-between">
            <span>{msg}</span>
            <button onClick={() => navigate('/recruiter/jobs/new')}
              className="ml-4 font-medium underline text-teal hover:text-teal/80">
              Post a Job →
            </button>
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 rounded-full border-2 border-coral border-t-transparent animate-spin" />
          </div>
        )}

        {/* Existing companies */}
        {!loading && companies.length > 0 && (
          <div className="space-y-4 mb-8">
            {companies.map(company => (
              <div key={company.id} className="rounded-card border border-ink/8 bg-white p-5 shadow-card">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="font-display text-xl font-semibold text-ink">{company.name}</h2>
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {[
                        company.company_type?.replace(/_/g, ' '),
                        company.industry,
                        company.headquarters,
                        company.company_size,
                      ].filter(Boolean).map(t => (
                        <span key={t} className="rounded-full bg-sand px-2.5 py-0.5 text-xs text-slate capitalize">{t}</span>
                      ))}
                    </div>
                    {company.description && (
                      <p className="mt-2 text-sm text-slate/70 line-clamp-2">{company.description}</p>
                    )}
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => openEdit(company)}
                      className="rounded-xl border border-ink/10 px-4 py-2 text-sm text-slate hover:bg-sand">
                      Edit
                    </button>
                    <button onClick={() => navigate('/recruiter/jobs/new')}
                      className="rounded-xl bg-coral px-4 py-2 text-sm text-white hover:bg-coral/90">
                      Post Job
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Form */}
        {showForm && (
          <div className="rounded-card border border-ink/8 bg-white p-8 shadow-card">
            <h2 className="font-display text-xl font-semibold text-ink mb-6">
              {editId ? 'Edit Company' : 'Create Company Profile'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Company Name" id="name" value={form.name} onChange={upd('name')} required placeholder="Acme Technologies" />
                <FormField label="Company Type" id="company_type" as="select"
                  value={form.company_type} onChange={upd('company_type')} options={COMPANY_TYPE_OPTS} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Industry" id="industry" value={form.industry} onChange={upd('industry')} placeholder="Technology" />
                <FormField label="Headquarters" id="headquarters" value={form.headquarters} onChange={upd('headquarters')} placeholder="Bangalore, India" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Company Size" id="company_size" as="select"
                  value={form.company_size} onChange={upd('company_size')}
                  options={[{ value: '', label: '— Select —' }, ...SIZE_OPTS]} />
                <FormField label="Founded Year" id="founded_year" type="number"
                  value={form.founded_year} onChange={upd('founded_year')} placeholder="2020" />
              </div>
              <FormField label="Website" id="website" value={form.website} onChange={upd('website')} placeholder="https://acme.com" />
              <div className="grid grid-cols-2 gap-4">
                <FormField label="LinkedIn" id="linkedin" value={form.linkedin} onChange={upd('linkedin')} placeholder="https://linkedin.com/company/..." />
                <FormField label="Twitter / X" id="twitter" value={form.twitter} onChange={upd('twitter')} placeholder="https://twitter.com/..." />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-ink/80">About the Company</label>
                <textarea rows={4} value={form.description} onChange={upd('description')}
                  placeholder="What does your company do? What is the mission and culture?"
                  className="w-full rounded-xl border border-sand px-4 py-3 text-sm text-ink placeholder:text-slate/50 focus:outline-none focus:ring-2 focus:ring-coral/30 resize-none" />
              </div>
              {error && <div className="rounded-xl bg-coral/10 px-4 py-3 text-sm text-coral">{error}</div>}
              <div className="flex gap-3">
                <Button type="submit" variant="coral" full loading={saving}>
                  {editId ? 'Save Changes' : 'Create Company'}
                </Button>
                {companies.length > 0 && (
                  <button type="button" onClick={() => setShowForm(false)}
                    className="flex-1 rounded-xl border border-ink/15 py-3 text-sm font-medium text-slate hover:bg-sand">
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        )}

        {!loading && !showForm && companies.length === 0 && (
          <div className="py-16 text-center rounded-card border border-dashed border-ink/15">
            <div className="text-4xl mb-4">🏢</div>
            <p className="font-display text-xl text-ink">No company profile yet</p>
            <p className="mt-1 text-sm text-slate">Create a company profile before posting jobs.</p>
            <button onClick={openCreate}
              className="mt-4 rounded-xl bg-coral px-5 py-2.5 text-sm font-medium text-white">
              Create Company
            </button>
          </div>
        )}
      </div>
    </PageShell>
  )
}
