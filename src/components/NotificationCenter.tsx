import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { NotificationItem } from "../types";
import { 
  Bell, Check, Sparkles, Heart, Briefcase, Zap, 
  Clock, ShieldAlert, ArrowRight, X, ExternalLink
} from "lucide-react";

export const NotificationCenter: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    try {
      const res = await api.get<{ notifications: NotificationItem[]; unreadCount: number }>("/notifications");
      if (res.data) {
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000); // Polling every 15s for live alerts
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markAsRead = async (id: string, link?: string) => {
    try {
      await api.post(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      if (link) {
        setIsOpen(false);
        navigate(link);
      }
    } catch (err) {
      console.error("Failed to mark notification as read", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      setLoading(true);
      await api.post("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to mark all notifications read", err);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (type: NotificationItem["type"]) => {
    switch (type) {
      case "mutual_match":
        return <Heart className="w-4 h-4 text-rose-500" />;
      case "high_match":
        return <Sparkles className="w-4 h-4 text-indigo-600" />;
      case "low_competition":
        return <Zap className="w-4 h-4 text-amber-500" />;
      case "application_status":
        return <Briefcase className="w-4 h-4 text-emerald-600" />;
      default:
        return <Bell className="w-4 h-4 text-blue-500" />;
    }
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const diffMins = Math.floor((Date.now() - d.getTime()) / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-slate-100 transition-all focus:outline-none"
        title="Notifications & Match Alerts"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-600 text-white font-extrabold text-[9px] items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          </span>
        )}
      </button>

      {/* Notification Dropdown Drawer */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200/90 z-50 overflow-hidden font-sans animate-in fade-in slide-in-from-top-2 duration-150">
          
          {/* Header */}
          <div className="px-4 py-3.5 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bell className="w-4 h-4 text-indigo-400" />
              <span className="font-extrabold text-xs uppercase tracking-wider">SwipeX Alert Center</span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 bg-rose-500 text-white text-[10px] font-black rounded-full">
                  {unreadCount} New
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                disabled={loading}
                className="text-[11px] font-bold text-indigo-300 hover:text-white transition-all flex items-center space-x-1"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Mark All Read</span>
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-600">No alerts right now</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  You'll be notified of new mutual matches, high ATS scores, and recruiter reviews here.
                </p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => markAsRead(n.id, n.link)}
                  className={`p-3.5 hover:bg-slate-50 transition-all cursor-pointer flex items-start space-x-3 ${
                    !n.isRead ? "bg-indigo-50/40" : ""
                  }`}
                >
                  <div className="p-2 rounded-xl bg-white border border-slate-200/80 shadow-xs shrink-0 mt-0.5">
                    {getIcon(n.type)}
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className={`text-xs tracking-tight truncate ${!n.isRead ? "font-black text-slate-900" : "font-bold text-slate-700"}`}>
                        {n.title}
                      </h4>
                      <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                        {formatTime(n.created_at)}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-600 leading-snug line-clamp-2">
                      {n.message}
                    </p>

                    {n.badge && (
                      <span className="inline-block px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-700 font-extrabold text-[9px] uppercase tracking-wider rounded-md mt-1">
                        {n.badge}
                      </span>
                    )}
                  </div>

                  {!n.isRead && (
                    <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0 mt-2" />
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer View Details */}
          <div className="p-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 px-4">
            <span className="text-[10px] font-mono text-slate-400">Multi-Channel Alerts Active</span>
            <button
              onClick={() => {
                setIsOpen(false);
                navigate("/applications");
              }}
              className="text-xs font-extrabold text-indigo-600 hover:text-indigo-800 flex items-center space-x-1"
            >
              <span>Application Hub</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      )}
    </div>
  );
};
