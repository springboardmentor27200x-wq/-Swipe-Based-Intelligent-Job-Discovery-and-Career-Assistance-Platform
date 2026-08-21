import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { 
  Send, Loader2, User, Briefcase, MapPin, 
  Clock, Check, CheckCheck, Smile, Phone, Video, 
  Info, AlertCircle, MessageSquare, ArrowLeft, Sparkles, AlertTriangle, Cpu
} from 'lucide-react';
import api from '../utils/api';
import PageTransition from '../components/PageTransition';
import { motion, AnimatePresence } from 'framer-motion';

export default function ChatPanel() {
  const navigate = useNavigate();
  const { user, token } = useSelector(state => state.auth);
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState('');
  
  // Real-time states
  const [isOpponentTyping, setIsOpponentTyping] = useState(false);
  const [wsError, setWsError] = useState('');
  
  const socketRef = useRef(null);
  const chatEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Load chat rooms list
  const fetchRooms = async () => {
    setLoadingRooms(true);
    try {
      const response = await api.get('/chat/rooms/');
      setRooms(response.data.results || response.data);
    } catch (err) {
      setError('Failed to fetch inbox chat rooms.');
    } finally {
      setLoadingRooms(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  // Scroll to bottom of message thread
  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpponentTyping]);

  // Load message history and open WebSocket connection on room change
  const selectRoom = async (room) => {
    setSelectedRoom(room);
    setMessages([]);
    setIsOpponentTyping(false);
    setWsError('');
    setLoadingMessages(true);
    
    // Close existing WebSocket if open
    if (socketRef.current) {
      socketRef.current.close();
    }

    try {
      const response = await api.get(`/chat/rooms/${room.id}/messages/`);
      setMessages(response.data.results || response.data);
      
      // Trigger read receipt call to clear unread counts on backend
      await api.post(`/chat/rooms/${room.id}/read/`);
      // Update local rooms unread counts to 0
      setRooms(prev => prev.map(r => r.id === room.id ? { ...r, unread_count: 0 } : r));

      // Setup WebSocket connection
      let socketUrl;
      const wsBase = import.meta.env.VITE_WS_BASE_URL;
      if (wsBase) {
        socketUrl = `${wsBase}/ws/chat/${room.id}/?token=${token}`;
      } else {
        const apiBase = import.meta.env.VITE_API_BASE_URL;
        if (apiBase && apiBase.startsWith('http')) {
          const urlObj = new URL(apiBase);
          const wsScheme = urlObj.protocol === 'https:' ? 'wss' : 'ws';
          socketUrl = `${wsScheme}://${urlObj.host}/ws/chat/${room.id}/?token=${token}`;
        } else {
          const wsScheme = window.location.protocol === 'https:' ? 'wss' : 'ws';
          const wsHost = window.location.host.includes('localhost') || window.location.host.includes('127.0.0.1')
            ? window.location.host.replace('5173', '8000')
            : window.location.host;
          socketUrl = `${wsScheme}://${wsHost}/ws/chat/${room.id}/?token=${token}`;
        }
      }

      const socket = new WebSocket(socketUrl);
      socketRef.current = socket;

      socket.onopen = () => {
        console.log('Chat WS connection established successfully.');
      };

      socket.onmessage = (e) => {
        const data = JSON.parse(e.data);
        if (data.type === 'chat_message') {
          // Append new incoming message
          setMessages(prev => [...prev, data.message]);
          // Send read receipt if active room
          api.post(`/chat/rooms/${room.id}/read/`).catch(() => {});
        } else if (data.type === 'typing') {
          if (data.user_id !== user.id) {
            setIsOpponentTyping(data.is_typing);
          }
        }
      };

      socket.onclose = (e) => {
        console.log('Chat WS connection closed.', e);
      };

      socket.onerror = () => {
        setWsError('Real-time websocket pipeline offline. Standard REST queries are active.');
      };

    } catch (err) {
      setError('Failed to load message log history.');
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, []);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !socketRef.current) return;

    // Send typing stop signal
    socketRef.current.send(JSON.stringify({
      type: 'typing',
      is_typing: false
    }));

    // Send chat text message payload
    socketRef.current.send(JSON.stringify({
      type: 'chat_message',
      message: newMessage.trim()
    }));

    setNewMessage('');
  };

  const handleTypingKeydown = () => {
    if (!socketRef.current) return;

    // Send typing start signal
    socketRef.current.send(JSON.stringify({
      type: 'typing',
      is_typing: true
    }));

    // Reset typing timer
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      if (socketRef.current) {
        socketRef.current.send(JSON.stringify({
          type: 'typing',
          is_typing: false
        }));
      }
    }, 2000);
  };

  const getOpponentDetails = (room) => {
    if (user.role === 'job_seeker') {
      return {
        name: room.recruiter_name || 'Recruiter',
        sub: room.company_name || 'Hiring Team'
      };
    } else {
      return {
        name: room.seeker_name || 'Candidate',
        sub: 'Job Seeker Application'
      };
    }
  };

  const insertAiPrompt = (promptType) => {
    let text = "";
    if (promptType === 'cover') {
      text = "Hi, I have generated an AI cover letter from my SwipeX dashboard: [Insert Cover Letter Here]";
    } else if (promptType === 'salary') {
      text = "Could you share the salary range and benefits for this position?";
    } else if (promptType === 'stack') {
      text = "What tech stack and engineering standards do you prioritize in this team?";
    }
    setNewMessage(text);
  };

  return (
    <PageTransition className="max-w-7xl mx-auto px-6 py-12 space-y-10 relative z-10 text-slate-800">
      
      {/* Background spotlights: Indigo + Blue Theme for Messages Page */}
      <div className="absolute top-[10%] left-[20%] w-[420px] h-[420px] bg-gradient-to-tr from-blue-500/5 via-indigo-500/5 to-transparent rounded-full blur-[125px] -z-10 pointer-events-none" />
      <div className="absolute bottom-[20%] right-[20%] w-[380px] h-[380px] bg-gradient-to-tr from-indigo-500/5 via-blue-500/5 to-transparent rounded-full blur-[125px] -z-10 pointer-events-none" />

      {/* Upper header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-200 pb-8 text-left">
        <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-2">
            <Cpu className="text-blue-600" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Messages Inbox</span>
          </h1>
          <p className="text-slate-500 text-xs mt-1.5 font-semibold">Communicate with recruiters, schedule follow-ups, and review matches.</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-100 text-rose-605 text-xs font-semibold rounded-2xl flex items-center space-x-3 text-left">
          <AlertCircle size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main chat UI */}
      <div className="grid lg:grid-cols-3 gap-8 h-[650px]">
        
        {/* Left Column: Inbox directory list */}
        <div className={`lg:col-span-1 p-[1px] rounded-3xl bg-slate-200/50 shadow-sm h-full ${
          selectedRoom ? 'hidden lg:block' : 'block'
        }`}>
          <div className="bg-white p-6 rounded-[23px] h-full overflow-y-auto space-y-4 border border-slate-200/80 text-left shadow-md">
            <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider pb-3 border-b border-slate-100">Conversations</h2>
            
            {loadingRooms ? (
              <div className="flex justify-center py-20">
                <Loader2 size={20} className="animate-spin text-blue-600" />
              </div>
            ) : rooms.length === 0 ? (
              <p className="text-slate-400 text-xxs font-bold text-center py-10">No active message channels found.</p>
            ) : (
              <div className="space-y-2">
                {rooms.map((room) => {
                  const details = getOpponentDetails(room);
                  const isSelected = selectedRoom?.id === room.id;
                  return (
                    <button
                      key={room.id}
                      onClick={() => selectRoom(room)}
                      className={`w-full flex items-center space-x-3.5 p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                        isSelected 
                          ? 'border-blue-200 bg-blue-50/50 shadow-sm' 
                          : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-blue-600 font-black text-xs relative shrink-0">
                        {details.name.charAt(0).toUpperCase()}
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-white" />
                      </div>
                      <div className="min-w-0 flex-grow">
                        <div className="flex justify-between items-start">
                          <h4 className="text-xs font-black text-slate-800 truncate leading-none">{details.name}</h4>
                          {room.unread_count > 0 && (
                            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse shrink-0 ml-1.5" />
                          )}
                        </div>
                        <p className="text-slate-400 text-[9px] font-bold uppercase tracking-widest mt-1.5 leading-none truncate">{details.sub}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Active Conversation Log */}
        <div className={`lg:col-span-2 p-[1px] rounded-3xl bg-slate-200/50 shadow-sm h-full flex flex-col ${
          !selectedRoom ? 'hidden lg:flex' : 'flex'
        }`}>
          <div className="bg-white rounded-[23px] border border-slate-200 h-full flex flex-col overflow-hidden relative shadow-md">
            {selectedRoom ? (
              <>
                {/* Active Chat Header */}
                <div className="p-4 bg-slate-50 border-b border-slate-150 flex items-center justify-between">
                  <div className="flex items-center space-x-3 text-left">
                    <button
                      onClick={() => setSelectedRoom(null)}
                      className="lg:hidden text-slate-500 hover:text-blue-600 p-1.5 rounded-lg border border-slate-200 shadow-sm transition-colors cursor-pointer bg-white"
                      title="Back to inbox"
                    >
                      <ArrowLeft size={16} />
                    </button>
                    <div className="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center text-blue-600 font-black text-xs relative shrink-0">
                      {getOpponentDetails(selectedRoom).name.charAt(0).toUpperCase()}
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white shadow-[0_0_8px_#10b981]" />
                    </div>
                    <div>
                      <h3 className="text-xs font-black text-slate-800 flex items-center gap-1.5 leading-none">
                        <span>{getOpponentDetails(selectedRoom).name}</span>
                      </h3>
                      <p className="text-slate-405 text-[9px] font-bold uppercase tracking-widest mt-1.5 leading-none">{getOpponentDetails(selectedRoom).sub}</p>
                    </div>
                  </div>

                  {/* Communication Room Actions */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => navigate('/calendar')}
                      className="p-2.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-550 hover:text-blue-600 rounded-xl transition-all cursor-pointer shadow-sm"
                      title="Schedule Interview"
                    >
                      <Clock size={15} />
                    </button>
                    <button
                      onClick={() => navigate(`/call/room-${selectedRoom.id}`)}
                      className="p-2.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-550 hover:text-blue-600 rounded-xl transition-all cursor-pointer shadow-sm"
                      title="Join Video Room"
                    >
                      <Video size={15} />
                    </button>
                  </div>
                </div>

                {/* Chat Thread Messages Area */}
                <div className="flex-grow overflow-y-auto p-4 sm:p-6 space-y-5">
                  {wsError && (
                    <div className="p-3.5 bg-rose-50 border border-rose-100 text-rose-600 text-xxs rounded-xl text-center flex items-center justify-center space-x-2 font-bold">
                      <AlertTriangle size={14} />
                      <span>{wsError}</span>
                    </div>
                  )}

                  {loadingMessages ? (
                    <div className="flex justify-center py-10">
                      <Loader2 size={20} className="animate-spin text-blue-600" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center py-16 space-y-3">
                      <MessageSquare size={24} className="mx-auto text-slate-400" />
                      <p className="text-slate-550 text-xxs font-bold">No messages yet. Send a note to kickstart the conversation!</p>
                    </div>
                  ) : (
                    messages.map((m) => {
                      const isMe = m.sender === user.id;
                      return (
                        <div 
                          key={m.id} 
                          className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-fade-in`}
                        >
                          <div className="max-w-[70%] space-y-1 text-left">
                            <div className={`px-4.5 py-3 rounded-2xl text-xs leading-relaxed font-semibold shadow-sm ${
                              isMe 
                                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-tr-none' 
                                : 'bg-slate-100 text-slate-800 rounded-tl-none border border-slate-200'
                            }`}>
                              <p className="whitespace-pre-wrap">{m.content}</p>
                            </div>
                            <div className={`flex items-center space-x-1.5 text-[9px] text-slate-500 font-bold uppercase tracking-wider ${
                              isMe ? 'justify-end' : 'justify-start'
                            }`}>
                              <span>{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              {isMe && (
                                m.is_read ? <CheckCheck size={12} className="text-blue-600" /> : <Check size={12} />
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}

                  {isOpponentTyping && (
                    <div className="flex justify-start">
                      <div className="bg-slate-100 px-4.5 py-3 rounded-2xl rounded-tl-none flex items-center space-x-1.5 border border-slate-200">
                        <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
                        <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                        <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                      </div>
                    </div>
                  )}
                  
                  <div ref={chatEndRef} />
                </div>

                {/* AI prompt templates panel - Redesign item */}
                <div className="px-4 py-2 border-t border-slate-150 bg-slate-50 flex flex-wrap gap-2 items-center text-xs font-bold text-slate-500">
                  <span className="text-[9px] text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Sparkles size={11} className="text-blue-600" /> AI Prompts:
                  </span>
                  <button 
                    type="button" 
                    onClick={() => insertAiPrompt('cover')}
                    className="px-2.5 py-1 rounded bg-white border border-slate-205 hover:border-blue-500/35 hover:text-blue-600 text-xxs font-extrabold cursor-pointer text-slate-600"
                  >
                    📝 Cover Letter
                  </button>
                  <button 
                    type="button" 
                    onClick={() => insertAiPrompt('salary')}
                    className="px-2.5 py-1 rounded bg-white border border-slate-205 hover:border-blue-500/35 hover:text-blue-600 text-xxs font-extrabold cursor-pointer text-slate-600"
                  >
                    💰 Ask Salary
                  </button>
                  <button 
                    type="button" 
                    onClick={() => insertAiPrompt('stack')}
                    className="px-2.5 py-1 rounded bg-white border border-slate-205 hover:border-blue-500/35 hover:text-blue-600 text-xxs font-extrabold cursor-pointer text-slate-600"
                  >
                    🛠️ Tech Stack
                  </button>
                </div>

                {/* Compose Message Box Form */}
                <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-200 bg-slate-50/50 flex items-center gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => { setNewMessage(e.target.value); handleTypingKeydown(); }}
                    placeholder="Type your message here..."
                    className="flex-grow bg-white border border-slate-200 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 rounded-2xl py-3.5 px-4 text-xs text-slate-800 outline-none transition-all placeholder-slate-400 font-semibold"
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="p-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl transition-all shadow-md shadow-blue-500/10 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed shrink-0 cursor-pointer border border-transparent"
                    title="Send Message"
                  >
                    <Send size={15} />
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-grow flex flex-col items-center justify-center text-center p-8 space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500 shadow-inner">
                  <MessageSquare size={24} className="text-blue-600 animate-pulse" />
                </div>
                <div>
                  <p className="text-slate-805 font-black text-sm">Select a Conversation</p>
                  <p className="text-slate-500 text-xs mt-1.5 font-semibold">Open a match channel from the directory list to start messaging.</p>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </PageTransition>
  );
}
