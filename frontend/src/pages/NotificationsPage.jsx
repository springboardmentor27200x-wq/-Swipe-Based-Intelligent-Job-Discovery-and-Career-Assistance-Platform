import React, { useState } from 'react'
import PageShell from '../components/layout/PageShell'
import NotificationItem from '../components/notifications/NotificationItem'
import { useNotifications } from '../hooks/useNotifications'

const FILTERS = [
  { key: 'all',    label: 'All' },
  { key: 'unread', label: 'Unread' },
]

export default function NotificationsPage() {
  const { notifications, unreadCount, loading, markRead, markAllRead, remove } = useNotifications({ poll: false })
  const [filter, setFilter] = useState('all')

  const visible = filter === 'unread' ? notifications.filter(n => !n.is_read) : notifications

  return (
    <PageShell narrow>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink">Notifications</h1>
          <p className="text-slate text-sm mt-1">
            {loading ? 'Loading…' : `${unreadCount} unread of ${notifications.length}`}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="rounded-xl border border-ink/10 px-4 py-2 text-sm font-medium text-ink hover:bg-sand/60 transition"
          >
            Mark all read
          </button>
        )}
      </div>

      <div className="flex gap-2 mb-5">
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              filter === f.key ? 'bg-ink text-paper' : 'bg-sand/60 text-slate hover:bg-sand'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 rounded-full border-2 border-coral border-t-transparent animate-spin" />
        </div>
      )}

      {!loading && visible.length === 0 && (
        <div className="py-16 text-center rounded-card border border-dashed border-ink/15">
          <p className="text-4xl mb-3">🔔</p>
          <p className="font-display text-xl text-ink">
            {filter === 'unread' ? "You're all caught up" : 'No notifications yet'}
          </p>
          <p className="mt-1 text-sm text-slate">
            We'll let you know about new job matches, application updates, and more.
          </p>
        </div>
      )}

      {!loading && visible.length > 0 && (
        <div className="rounded-card border border-ink/8 bg-white shadow-card divide-y divide-ink/5 overflow-hidden">
          {visible.map(n => (
            <NotificationItem key={n.id} notification={n} onRead={markRead} onRemove={remove} />
          ))}
        </div>
      )}
    </PageShell>
  )
}
