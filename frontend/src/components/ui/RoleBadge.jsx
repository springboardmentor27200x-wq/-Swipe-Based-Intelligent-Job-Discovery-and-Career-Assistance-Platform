import React from 'react'

const ROLE_STYLES = {
  job_seeker: { label: 'Job Seeker', bg: 'bg-teal/10', text: 'text-teal' },
  recruiter: { label: 'Recruiter', bg: 'bg-coral/10', text: 'text-coral' },
  admin: { label: 'Admin', bg: 'bg-ink/10', text: 'text-ink' },
}

export default function RoleBadge({ role }) {
  const style = ROLE_STYLES[role] || ROLE_STYLES.job_seeker
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${style.bg} ${style.text}`}>
      {style.label}
    </span>
  )
}
