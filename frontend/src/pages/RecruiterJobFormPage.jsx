import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import PageShell from '../components/layout/PageShell'
import FormField from '../components/ui/FormField'
import Button from '../components/ui/Button'
import { jobService, companyService } from '../services/jobService'
import { extractErrorMessage } from '../services/api'

const BLANK = {
  company: '',
  title: '',
  description: '',
  requirements: '',
  benefits: '',
  required_skill_names: '',
  preferred_skill_names: '',
  salary_min: '',
  salary_max: '',
  salary_visible: true,
  job_type: 'full_time',
  work_mode: 'onsite',
  experience_level: 'junior',
  location: '',
  openings: 1,
  deadline: '',
  is_fresher_friendly: false,
  status: 'draft',
}

const JOB_TYPE_OPTS = [
  { value: 'full_time',  label: 'Full-Time' },
  { value: 'part_time',  label: 'Part-Time' },
  { value: 'contract',   label: 'Contract' },
  { value: 'internship', label: 'Internship' },
  { value: 'freelance',  label: 'Freelance' },
]
const WORK_MODE_OPTS = [
  { value: 'remote', label: 'Remote' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'onsite', label: 'On-site' },
]
const EXP_OPTS = [
  { value: 'fresher', label: 'Fresher (0 yrs)' },
  { value: 'junior',  label: 'Junior (1–3 yrs)' },
  { value: 'mid',     label: 'Mid-Level (3–6 yrs)' },
  { value: 'senior',  label: 'Senior (6–10 yrs)' },
  { value: 'lead',    label: 'Lead (10+ yrs)' },
]
const STATUS_OPTS = [
  { value: 'draft',     label: 'Draft' },
  { value: 'published', label: 'Published' },
]

export default function RecruiterJobFormPage() {
  const { id }    = useParams()        // undefined = create mode
  const isEdit    = Boolean(id)
  const navigate  = useNavigate()

  const [form, setForm]       = useState(BLANK)
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState('')

  // Load companies for dropdown
  useEffect(() => {
    companyService.myCompanies().then(list => {
      setCompanies(list)
      if (!isEdit && list.length > 0) setForm(f => ({ ...f, company: list[0].id }))
    })
  }, [])

  // Load existing job in edit mode
  useEffect(() => {
    if (!isEdit) return
    jobService.recruiterJobDetail(id).then(job => {
      setForm({
        company:              job.company,
        title:                job.title,
        description:          job.description,
        requirements:         job.requirements || '',
        benefits:             job.benefits || '',
        required_skill_names: (job.skills_required || []).map(s => s.name).join(', '),
        preferred_skill_names:(job.skills_preferred || []).map(s => s.name).join(', '),
        salary_min:           job.salary_min || '',
        salary_max:           job.salary_max || '',
        salary_visible:       job.salary_visible,
        job_type:             job.job_type,
        work_mode:            job.work_mode,
        experience_level:     job.experience_level,
        location:             job.location || '',
        openings:             job.openings,
        deadline:             job.deadline || '',
        is_fresher_friendly:  job.is_fresher_friendly,
        status:               job.status,
      })
    }).finally(() => setLoading(false))
  }, [id, isEdit])

  const upd = (key) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm(f => ({ ...f, [key]: val }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(''); setSaving(true)
    try {
      const payload = {
        ...form,
        required_skill_names:  form.required_skill_names.split(',').map(s => s.trim()).filter(Boolean),
        preferred_skill_names: form.preferred_skill_names.split(',').map(s => s.trim()).filter(Boolean),
        salary_min: form.salary_min || null,
        salary_max: form.salary_max || null,
        deadline:   form.deadline || null,
      }
      if (isEdit) {
        await jobService.updateJob(id, payload)
      } else {
        await jobService.createJob(payload)
      }
      navigate('/recruiter/jobs')
    } catch (e) {
      setError(extractErrorMessage(e))
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <PageShell narrow>
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 rounded-full border-2 border-coral border-t-transparent animate-spin" />
      </div>
    </PageShell>
  )

  const companyOpts = companies.map(c => ({ value: c.id, label: c.name }))

  return (
    <PageShell>
      <div className="max-w-2xl mx-auto">
        <h1 className="font-display text-3xl font-semibold text-ink mb-8">
          {isEdit ? 'Edit Job' : 'Post a New Job'}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Company */}
          <div className="rounded-card border border-ink/8 bg-white p-6 shadow-card space-y-5">
            <h2 className="font-display text-lg font-semibold text-ink">Company & Title</h2>

            {companyOpts.length === 0 ? (
              <div className="rounded-xl bg-amber-50 p-4 text-sm text-amber-700">
                You need to create a company profile first.{' '}
                <a href="/recruiter/company" className="underline font-medium">Create company →</a>
              </div>
            ) : (
              <FormField label="Company" id="company" as="select"
                value={form.company} onChange={upd('company')}
                options={companyOpts} required />
            )}

            <FormField label="Job Title" id="title"
              value={form.title} onChange={upd('title')}
              placeholder="e.g. Senior Backend Engineer" required />

            <div className="grid grid-cols-2 gap-4">
              <FormField label="Status" id="status" as="select"
                value={form.status} onChange={upd('status')}
                options={STATUS_OPTS} />
              <FormField label="Openings" id="openings" type="number"
                value={form.openings} onChange={upd('openings')} />
            </div>
          </div>

          {/* Description */}
          <div className="rounded-card border border-ink/8 bg-white p-6 shadow-card space-y-5">
            <h2 className="font-display text-lg font-semibold text-ink">Description</h2>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-ink/80">
                Job Description <span className="text-coral">*</span>
              </label>
              <textarea id="description" rows={5} required
                value={form.description} onChange={upd('description')}
                placeholder="Describe the role, responsibilities, and what a typical day looks like…"
                className="w-full rounded-xl border border-sand px-4 py-3 text-sm text-ink placeholder:text-slate/50 focus:outline-none focus:ring-2 focus:ring-coral/30 resize-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-ink/80">Requirements</label>
              <textarea id="requirements" rows={4}
                value={form.requirements} onChange={upd('requirements')}
                placeholder="List qualifications, experience, or certifications required…"
                className="w-full rounded-xl border border-sand px-4 py-3 text-sm text-ink placeholder:text-slate/50 focus:outline-none focus:ring-2 focus:ring-coral/30 resize-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-ink/80">Benefits</label>
              <textarea id="benefits" rows={3}
                value={form.benefits} onChange={upd('benefits')}
                placeholder="Health insurance, flexible hours, ESOPs…"
                className="w-full rounded-xl border border-sand px-4 py-3 text-sm text-ink placeholder:text-slate/50 focus:outline-none focus:ring-2 focus:ring-coral/30 resize-none"
              />
            </div>
          </div>

          {/* Skills */}
          <div className="rounded-card border border-ink/8 bg-white p-6 shadow-card space-y-5">
            <h2 className="font-display text-lg font-semibold text-ink">Skills</h2>
            <FormField label="Required Skills (comma-separated)" id="required_skill_names"
              value={form.required_skill_names} onChange={upd('required_skill_names')}
              placeholder="Python, Django, PostgreSQL, Docker" />
            <FormField label="Preferred Skills (comma-separated)" id="preferred_skill_names"
              value={form.preferred_skill_names} onChange={upd('preferred_skill_names')}
              placeholder="Kubernetes, AWS, Redis" />
          </div>

          {/* Classification */}
          <div className="rounded-card border border-ink/8 bg-white p-6 shadow-card space-y-5">
            <h2 className="font-display text-lg font-semibold text-ink">Role Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Job Type" id="job_type" as="select"
                value={form.job_type} onChange={upd('job_type')} options={JOB_TYPE_OPTS} />
              <FormField label="Work Mode" id="work_mode" as="select"
                value={form.work_mode} onChange={upd('work_mode')} options={WORK_MODE_OPTS} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Experience Level" id="experience_level" as="select"
                value={form.experience_level} onChange={upd('experience_level')} options={EXP_OPTS} />
              <FormField label="Location" id="location"
                value={form.location} onChange={upd('location')} placeholder="Bangalore / Remote" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Deadline" id="deadline" type="date"
                value={form.deadline} onChange={upd('deadline')} />
              <div className="flex items-center gap-3 pt-6">
                <input type="checkbox" id="is_fresher_friendly"
                  checked={form.is_fresher_friendly} onChange={upd('is_fresher_friendly')}
                  className="accent-coral" />
                <label htmlFor="is_fresher_friendly" className="text-sm text-ink">Fresher-friendly</label>
              </div>
            </div>
          </div>

          {/* Salary */}
          <div className="rounded-card border border-ink/8 bg-white p-6 shadow-card space-y-5">
            <h2 className="font-display text-lg font-semibold text-ink">Compensation</h2>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Min Salary (₹/year)" id="salary_min" type="number"
                value={form.salary_min} onChange={upd('salary_min')} placeholder="600000" />
              <FormField label="Max Salary (₹/year)" id="salary_max" type="number"
                value={form.salary_max} onChange={upd('salary_max')} placeholder="1200000" />
            </div>
            <div className="flex items-center gap-3">
              <input type="checkbox" id="salary_visible"
                checked={form.salary_visible} onChange={upd('salary_visible')}
                className="accent-coral" />
              <label htmlFor="salary_visible" className="text-sm text-ink">Show salary publicly</label>
            </div>
          </div>

          {error && (
            <div className="rounded-xl bg-coral/10 px-4 py-3 text-sm text-coral">{error}</div>
          )}

          <div className="flex gap-3">
            <Button type="submit" variant="coral" full loading={saving}>
              {isEdit ? 'Save Changes' : 'Post Job'}
            </Button>
            <button type="button" onClick={() => navigate('/recruiter/jobs')}
              className="flex-1 rounded-xl border border-ink/15 py-3 text-sm font-medium text-slate hover:bg-sand">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </PageShell>
  )
}
