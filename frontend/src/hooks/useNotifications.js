import { useState, useEffect, useCallback, useRef } from 'react'
import { notificationService } from '../services/notificationService'

const POLL_INTERVAL_MS = 30000

export function useNotifications({ poll = true } = {}) {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount]     = useState(0)
  const [loading, setLoading]             = useState(true)
  const timerRef = useRef(null)

  const load = useCallback(async () => {
    try {
      const result = await notificationService.list({ limit: 30 })
      setNotifications(result.data || [])
      setUnreadCount(result.unread_count ?? 0)
    } catch {
      setNotifications([])
    } finally {
      setLoading(false)
    }
  }, [])

  const refreshUnreadCount = useCallback(async () => {
    try { setUnreadCount(await notificationService.unreadCount()) }
    catch { /* noop */ }
  }, [])

  useEffect(() => {
    load()
    if (poll) {
      timerRef.current = setInterval(refreshUnreadCount, POLL_INTERVAL_MS)
      return () => clearInterval(timerRef.current)
    }
  }, [load, refreshUnreadCount, poll])

  const markRead = useCallback(async (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
    setUnreadCount(c => Math.max(0, c - 1))
    try { await notificationService.markRead(id) } catch { load() }
  }, [load])

  const markAllRead = useCallback(async () => {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    setUnreadCount(0)
    try { await notificationService.markAllRead() } catch { load() }
  }, [load])

  const remove = useCallback(async (id) => {
    const wasUnread = notifications.find(n => n.id === id)?.is_read === false
    setNotifications(prev => prev.filter(n => n.id !== id))
    if (wasUnread) setUnreadCount(c => Math.max(0, c - 1))
    try { await notificationService.remove(id) } catch { load() }
  }, [notifications, load])

  return { notifications, unreadCount, loading, reload: load, markRead, markAllRead, remove }
}
