import React from 'react'

const WORK_MODES      = ['remote', 'hybrid', 'onsite']
const JOB_TYPES       = ['full_time', 'part_time', 'contract', 'internship', 'freelance']
const EXPERIENCE      = ['fresher', 'junior', 'mid', 'senior', 'lead']
const COMPANY_TYPES   = ['mnc', 'startup', 'new_startup', 'enterprise', 'sme']
const COMPETITION     = ['low', 'medium', 'high']

function Chip({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3 py-1 text-xs font-medium transition capitalize ${
        active ? 'bg-coral text-white' : 'bg-sand text-slate hover:bg-sand/80'
      }`}
    >
      {label.replace('_', ' ')}
    </button>
  )
}

export default function JobFilters({ filters, onChange, onClear }) {
  const toggle = (key, value) => {
    onChange({ ...filters, [key]: filters[key] === value ? '' : value })
  }

  const hasFilters = Object.values(filters).some(v => v && v !== '')

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-base font-semibold text-ink">Filters</h3>
        {hasFilters && (
          <button onClick={onClear} className="text-xs text-coral hover:underline">
            Clear all
          </button>
        )}
      </div>

      {/* Work mode */}
      <div>
        <p className="text-xs font-medium text-slate mb-2 uppercase tracking-wide">Work Mode</p>
        <div className="flex flex-wrap gap-1.5">
          {WORK_MODES.map(m => (
            <Chip key={m} label={m} active={filters.work_mode === m} onClick={() => toggle('work_mode', m)} />
          ))}
        </div>
      </div>

      {/* Job type */}
      <div>
        <p className="text-xs font-medium text-slate mb-2 uppercase tracking-wide">Job Type</p>
        <div className="flex flex-wrap gap-1.5">
          {JOB_TYPES.map(t => (
            <Chip key={t} label={t} active={filters.job_type === t} onClick={() => toggle('job_type', t)} />
          ))}
        </div>
      </div>

      {/* Experience */}
      <div>
        <p className="text-xs font-medium text-slate mb-2 uppercase tracking-wide">Experience</p>
        <div className="flex flex-wrap gap-1.5">
          {EXPERIENCE.map(e => (
            <Chip key={e} label={e} active={filters.experience_level === e} onClick={() => toggle('experience_level', e)} />
          ))}
        </div>
      </div>

      {/* Company type */}
      <div>
        <p className="text-xs font-medium text-slate mb-2 uppercase tracking-wide">Company Type</p>
        <div className="flex flex-wrap gap-1.5">
          {COMPANY_TYPES.map(c => (
            <Chip key={c} label={c} active={filters.company_type === c} onClick={() => toggle('company_type', c)} />
          ))}
        </div>
      </div>

      {/* Competition */}
      <div>
        <p className="text-xs font-medium text-slate mb-2 uppercase tracking-wide">Competition</p>
        <div className="flex flex-wrap gap-1.5">
          {COMPETITION.map(c => (
            <Chip key={c} label={c} active={filters.competition_level === c} onClick={() => toggle('competition_level', c)} />
          ))}
        </div>
      </div>

      {/* Quick toggles */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-slate mb-2 uppercase tracking-wide">Quick Filters</p>
        {[
          { key: 'fresher_friendly', label: 'Fresher Friendly' },
          { key: 'low_competition',  label: 'Low Competition' },
          { key: 'recently_posted',  label: 'Recently Posted (7d)' },
        ].map(({ key, label }) => (
          <label key={key} className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={!!filters[key]}
              onChange={(e) => onChange({ ...filters, [key]: e.target.checked ? 'true' : '' })}
              className="accent-coral"
            />
            <span className="text-sm text-ink">{label}</span>
          </label>
        ))}
      </div>

      {/* Location */}
      <div>
        <p className="text-xs font-medium text-slate mb-2 uppercase tracking-wide">Location</p>
        <input
          type="text"
          value={filters.location || ''}
          onChange={(e) => onChange({ ...filters, location: e.target.value })}
          placeholder="e.g. Bangalore"
          className="w-full rounded-xl border border-sand px-3 py-2 text-sm text-ink placeholder:text-slate/50 focus:outline-none focus:ring-2 focus:ring-coral/30"
        />
      </div>
    </div>
  )
}
