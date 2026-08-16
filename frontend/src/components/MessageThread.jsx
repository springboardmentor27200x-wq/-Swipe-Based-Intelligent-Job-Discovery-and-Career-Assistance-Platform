import React, { useEffect, useRef, useState } from "react";
import api from "../api/axios";
import { Send, Trash2, X } from "lucide-react";

export default function MessageThread({ endpointBase, resourcePath, applicationId, title, subtitle, onClose }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  const fetchMessages = async () => {
    try {
      const { data } = await api.get(`${endpointBase}/${resourcePath}/${applicationId}/messages`);
      setMessages(data);
    } catch (err) {
      console.error("Failed to load messages:", err);
    }
  };

  useEffect(() => { fetchMessages(); }, [applicationId]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const handleSend = async () => {
    if (!text.trim()) return;
    setSending(true);
    try {
      await api.post(`${endpointBase}/${resourcePath}/${applicationId}/messages`, { body: text });
      setText("");
      fetchMessages();
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setSending(false);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    setMessages((prev) => prev.filter((m) => m.id !== messageId));
    try {
      await api.delete(`${endpointBase}/${resourcePath}/${applicationId}/messages/${messageId}`);
    } catch (err) {
      console.error("Failed to delete message:", err);
      fetchMessages();
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm("Clear this entire conversation? This can't be undone.")) return;
    setMessages([]);
    try {
      await api.delete(`${endpointBase}/${resourcePath}/${applicationId}/messages`);
    } catch (err) {
      console.error("Failed to clear conversation:", err);
      fetchMessages();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-[#0E1016] border border-white/10 rounded-2xl shadow-2xl flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">{title}</p>
            {subtitle && <p className="text-xs text-slate-500 truncate">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {messages.length > 0 && (
              <button onClick={handleClearAll} className="text-[11px] text-rose-300 hover:text-rose-200 flex items-center gap-1">
                <Trash2 className="h-3.5 w-3.5" /> Clear all
              </button>
            )}
            <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden px-5 py-4 space-y-3 no-scrollbar">
          {messages.length === 0 && <p className="text-xs text-slate-500">No messages yet — say hello.</p>}
          {messages.map((m) => (
            <div key={m.id} className={`flex ${m.is_mine ? "justify-end" : "justify-start"}`}>
              <div className={`group relative max-w-[80%] rounded-lg px-3 py-2 text-sm break-words whitespace-pre-wrap ${m.is_mine ? "bg-violet-500/20 text-violet-100" : "bg-white/5 text-slate-200"}`}>
                {!m.is_mine && <p className="text-[10px] text-slate-500 mb-0.5">{m.sender_name}</p>}
                {m.body}
                {m.is_mine && (
                  <button
                    onClick={() => handleDeleteMessage(m.id)}
                    className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-rose-500/90 text-white items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hidden group-hover:flex"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        <div className="flex gap-2 px-5 py-4 border-t border-white/10">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleSend())}
            placeholder="Type a message..."
            className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-500/50"
          />
          <button onClick={handleSend} disabled={sending} className="shrink-0 px-3 rounded-lg bg-gradient-to-r from-violet-500 to-fuchsia-500 disabled:opacity-60">
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}