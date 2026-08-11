import { useEffect, useState } from 'react';
import { Bell, Check, Trash2, ShieldAlert, Sparkles, Briefcase, Mail, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import Button from '../../components/UI/Button.jsx';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('all'); // all, unread
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get('/notifications/');
      setNotifications(data);
    } catch (err) {
      toast.error("Failed to load notifications.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (err) {
      // fail silently
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      toast.success("All marked as read.");
    } catch (err) {
      toast.error("Action failed.");
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n.id !== id));
      toast.success("Notification deleted.");
    } catch (err) {
      toast.error("Delete failed.");
    }
  };

  const getNotifIcon = (type) => {
    switch (type) {
      case 'match': return { icon: Sparkles, color: 'text-accent bg-accent/10 border-accent/20' };
      case 'application': return { icon: Briefcase, color: 'text-primary bg-primary/10 border-primary/20' };
      case 'alert': return { icon: Bell, color: 'text-secondary bg-secondary/10 border-secondary/20' };
      default: return { icon: Info, color: 'text-text-secondary bg-slate-50 border-slate-200' };
    }
  };

  const filteredNotifs = filter === 'all' 
    ? notifications 
    : notifications.filter(n => !n.is_read);

  return (
    <div className="flex-1 max-w-2xl mx-auto space-y-6 pb-16 select-none animate-fade-in">
      
      {/* HEADER */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-bold font-outfit text-text-primary flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" /> Notifications & Alerts
          </h2>
          <p className="text-xs text-text-secondary mt-1">Stay updated with matches, statuses, and opportunities.</p>
        </div>

        {notifications.some(n => !n.is_read) && (
          <Button
            onClick={handleMarkAllRead}
            variant="outline"
            size="xs"
            icon={<Check className="w-3.5 h-3.5" />}
          >
            Mark all read
          </Button>
        )}
      </div>

      {/* FILTER TABS */}
      <div className="flex gap-2 border-b border-slate-200 pb-1">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
            filter === 'all' 
              ? 'text-primary font-bold border-b-2 border-primary' 
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          All Alerts ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
            filter === 'unread' 
              ? 'text-primary font-bold border-b-2 border-primary' 
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          Unread ({notifications.filter(n => !n.is_read).length})
        </button>
      </div>

      {/* LIST */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map(i => (
            <div key={i} className="h-16 glass-card rounded-xl border border-slate-200 animate-pulse" />
          ))}
        </div>
      ) : filteredNotifs.length === 0 ? (
        <div className="glass-card rounded-xl3 p-12 border border-slate-200 text-center">
          <Bell className="w-8 h-8 text-text-muted mx-auto mb-3" />
          <h3 className="text-base font-bold text-text-primary font-outfit">All caught up!</h3>
          <p className="text-xs text-text-secondary mt-2">You don't have any new alerts at this time.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotifs.map((n) => {
            const spec = getNotifIcon(n.type);
            const Icon = spec.icon;
            return (
              <div
                key={n.id}
                onClick={() => !n.is_read && handleMarkRead(n.id)}
                className={`p-4 rounded-xl border flex items-start gap-4 transition-all duration-200 ${
                  n.is_read 
                    ? 'border-slate-200 bg-slate-50 hover:bg-slate-50' 
                    : 'border-primary/20 bg-primary/5 hover:bg-primary/10 shadow-sm'
                }`}
              >
                
                {/* Colored icon box */}
                <div className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 ${spec.color}`}>
                  <Icon className="w-4 h-4" />
                </div>

                {/* Details */}
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center justify-between gap-4">
                    <h4 className="font-semibold text-text-primary text-xs truncate">{n.title}</h4>
                    <span className="text-[10px] text-text-muted shrink-0">
                      {formatDistanceToNow(new Date(n.created_at))} ago
                    </span>
                  </div>
                  
                  <p className="text-xs text-text-secondary leading-relaxed">{n.message}</p>
                </div>

                {/* Actions */}
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(n.id); }}
                  className="p-1.5 rounded-lg text-text-secondary hover:text-danger hover:bg-danger/10 shrink-0 self-center"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
