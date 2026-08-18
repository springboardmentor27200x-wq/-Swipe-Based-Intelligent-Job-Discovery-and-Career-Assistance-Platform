import React from 'react'
import { Link } from 'react-router-dom'

const TYPE_ICONS = {
  new_job: '💼',
  startup_hiring: '🚀',
  high_match: '🎯',
  low_competition: '🌱',
  resume_reminder: '📄',
  saved_job_reminder: '♥',
  application_status: '📋',
  shortlisted: '⭐',
  interview_scheduled: '🗓️',
  new_application: '📥',
  candidate_shortlist_suggestion: '🌟',
  job_expiration_reminder: '⏰',
  system: '🔔',
}

function timeAgo(iso) {
  const diffMs = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

export default function NotificationItem({ notification, onRead, onRemove, compact = false }) {
  const icon = TYPE_ICONS[notification.type] || '🔔'

  const content = (
    <div
      className={`flex gap-3 px-4 py-3 transition-colors ${
        notification.is_read ? '' : 'bg-coral/5'
      } hover:bg-sand/60`}
    >
      <span className="text-lg flex-shrink-0 leading-none mt-0.5">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className={`text-sm ${notification.is_read ? 'text-ink/80' : 'text-ink font-medium'}`}>
          {notification.title}
        </p>
        {notification.message && (
          <p className="text-xs text-slate mt-0.5 line-clamp-2">{notification.message}</p>
        )}
        <p className="text-[11px] text-slate/60 mt-1">{timeAgo(notification.created_at)}</p>
      </div>
      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        {!notification.is_read && (
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onRead?.(notification.id) }}
            className="h-2 w-2 rounded-full bg-coral"
            title="Mark as read"
          />
        )}
        {!compact && onRemove && (
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onRemove(notification.id) }}
            className="text-slate/40 hover:text-coral text-xs"
            title="Delete"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  )

  if (notification.link) {
    return (
      <Link
        to={notification.link}
        onClick={() => !notification.is_read && onRead?.(notification.id)}
        className="block"
      >
        {content}
      </Link>
    )
  }
  return <div onClick={() => !notification.is_read && onRead?.(notification.id)} className="cursor-pointer">{content}</div>
}
