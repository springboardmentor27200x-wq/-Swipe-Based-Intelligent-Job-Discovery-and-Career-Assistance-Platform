import React, { useEffect, useState } from 'react';
import { Bell, Trash2, CheckCircle2, Clock, Inbox, Check } from 'lucide-react';
import api from '../utils/api';
import PageTransition from '../components/PageTransition';
import { useToast } from '../context/ToastContext';

const formatRelativeTime = (dateString) => {
  try {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays}d ago`;
  } catch (e) {
    return 'Recently';
  }
};

export default function Notifications() {
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const { showToast } = useToast();

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/notifications/');
      setNotifications(response.data.results || response.data);
    } catch (err) {
      console.error("Failed to load notifications:", err);
      showToast("Could not retrieve notifications.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markAsRead = async (id) => {
    try {
      await api.post(`/notifications/${id}/read/`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      showToast("Notification marked as read.", "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to mark notification as read.", "error");
    }
  };

  const markAllAsRead = async () => {
    if (notifications.filter(n => !n.is_read).length === 0) return;
    try {
      await api.post('/notifications/read-all/');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      showToast("All notifications marked as read.", "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to mark all as read.", "error");
    }
  };

  const deleteNotification = async (id) => {
    try {
      await api.delete(`/notifications/${id}/delete/`);
      setNotifications(prev => prev.filter(n => n.id !== id));
      showToast("Notification deleted.", "info");
    } catch (err) {
      console.error(err);
      showToast("Failed to delete notification.", "error");
    }
  };

  if (loading) {
    return (
      <PageTransition className="max-w-4xl mx-auto px-6 py-12 flex flex-col items-center justify-center space-y-4">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-4 border-slate-900" />
          <div className="absolute inset-0 rounded-full border-4 border-t-transparent border-l-violet-500 animate-spin" />
        </div>
        <span className="text-slate-450 text-xs font-bold uppercase tracking-wider animate-pulse">Loading notifications...</span>
      </PageTransition>
    );
  }

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <PageTransition className="max-w-4xl mx-auto px-6 py-12 space-y-8 relative z-10 text-white text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black tracking-tight">Notifications</h1>
            {unreadCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-violet-600/20 text-violet-400 border border-violet-500/20">
                {unreadCount} Unread
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 font-semibold">
            Manage alerts and notifications about your applications, messages, and matches.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 border border-white/10 hover:border-violet-500/30 text-slate-200 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer shadow-md self-start sm:self-auto"
          >
            <CheckCircle2 size={12} className="text-violet-400" />
            <span>Mark all as read</span>
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="p-16 rounded-[24px] bg-slate-900/40 border border-dashed border-white/10 text-center flex flex-col items-center justify-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-950 border border-white/5 flex items-center justify-center text-slate-500 shadow-md">
            <Inbox size={20} />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-black text-white uppercase tracking-wider">No notifications yet</h3>
            <p className="text-[11px] text-slate-500 font-semibold">We will let you know when recruiter activity occurs.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              className={`p-5 rounded-[24px] border transition-all flex items-start gap-4 shadow-xl relative overflow-hidden group ${
                notif.is_read
                  ? 'bg-slate-900/20 border-white/5 opacity-75'
                  : 'bg-gradient-to-r from-violet-650/10 to-transparent border-violet-500/20 shadow-violet-500/5'
              }`}
            >
              <div className={`p-2.5 rounded-xl border shrink-0 ${
                notif.is_read 
                  ? 'bg-slate-950 border-white/5 text-slate-500' 
                  : 'bg-violet-600/20 border-violet-500/30 text-violet-400 shadow-md animate-pulse'
              }`}>
                <Bell size={16} />
              </div>

              <div className="min-w-0 flex-1 space-y-1.5 pt-0.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-extrabold text-white block">
                    {notif.title || "Alert"}
                  </span>
                  {!notif.is_read && (
                    <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-ping" />
                  )}
                </div>
                <p className={`text-[11px] leading-relaxed font-semibold ${notif.is_read ? 'text-slate-400' : 'text-slate-200'}`}>
                  {notif.message}
                </p>
                <div className="flex items-center gap-2 text-[9px] text-slate-500 font-bold uppercase tracking-wider">
                  <Clock size={10} />
                  <span>{formatRelativeTime(notif.created_at)}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {!notif.is_read && (
                  <button
                    onClick={() => markAsRead(notif.id)}
                    className="p-2 rounded-lg bg-slate-950 border border-white/5 text-slate-400 hover:text-white hover:border-violet-500/30 transition-all cursor-pointer"
                    title="Mark as Read"
                  >
                    <Check size={12} />
                  </button>
                )}
                <button
                  onClick={() => deleteNotification(notif.id)}
                  className="p-2 rounded-lg bg-slate-950 border border-white/5 text-slate-400 hover:text-rose-455 hover:border-rose-500/30 transition-all cursor-pointer"
                  title="Delete Notification"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </PageTransition>
  );
}
