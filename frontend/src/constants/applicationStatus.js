// Shared across Milestone 4 components (StatusTimeline, dashboards, application
// history). Mirrors apps.jobs.models.JobApplication.Status on the backend.

export const PIPELINE_ORDER = [
  'pending', 'reviewed', 'shortlisted',
  'interview_scheduled', 'interview_completed', 'offered', 'accepted',
]

export const STATUS_LABELS = {
  pending:              'Applied',
  reviewed:             'Resume Reviewed',
  shortlisted:          'Shortlisted',
  interview_scheduled:  'Interview Scheduled',
  interview_completed:  'Interview Completed',
  offered:              'Offered',
  accepted:             'Accepted',
  rejected:             'Rejected',
  withdrawn:            'Withdrawn',
}

export const STATUS_STYLES = {
  pending:              'bg-sand text-slate',
  reviewed:             'bg-blue-50 text-blue-700',
  shortlisted:          'bg-teal/10 text-teal',
  interview_scheduled:  'bg-purple-50 text-purple-700',
  interview_completed:  'bg-purple-100 text-purple-800',
  offered:              'bg-green-50 text-green-700',
  accepted:             'bg-green-100 text-green-800',
  rejected:             'bg-coral/10 text-coral',
  withdrawn:            'bg-gray-100 text-gray-500',
}

export const STATUS_DOT = {
  pending:              'bg-slate',
  reviewed:             'bg-blue-500',
  shortlisted:          'bg-teal',
  interview_scheduled:  'bg-purple-500',
  interview_completed:  'bg-purple-700',
  offered:              'bg-green-500',
  accepted:             'bg-green-700',
  rejected:             'bg-coral',
  withdrawn:            'bg-gray-400',
}

export function isTerminal(status) {
  return status === 'rejected' || status === 'withdrawn' || status === 'accepted'
}
