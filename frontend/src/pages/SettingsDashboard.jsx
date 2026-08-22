import React, { useState } from 'react';
import { 
  Settings, Lock, Bell, Sparkles, Eye, Shield, 
  Check, Info, Loader2, Save, Cpu
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import PageTransition from '../components/PageTransition';
import { motion } from 'framer-motion';

export default function SettingsDashboard() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);

  // Security Form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Notifications State
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [pushAlerts, setPushAlerts] = useState(true);
  const [mobileAlerts, setMobileAlerts] = useState(false);

  // Theme Preset
  const [activeTheme, setActiveTheme] = useState('classic');

  const handleSecuritySave = (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      showToast('Please fill all password fields.', 'warning');
      return;
    }
    if (newPassword.length < 8) {
      showToast('New password must be at least 8 characters long.', 'warning');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('Passwords do not match.', 'error');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showToast('Security credentials updated successfully!', 'success');
    }, 1200);
  };

  const handlePreferencesSave = () => {
    showToast('Notification preference rules saved!', 'success');
  };

  return (
    <PageTransition className="max-w-6xl mx-auto px-6 py-12 space-y-10 relative z-10 text-slate-800 text-left">
      
      {/* Background spotlights: Indigo + Blue Theme for Settings */}
      <div className="absolute top-[10%] left-[20%] w-[420px] h-[420px] bg-gradient-to-tr from-blue-500/5 via-indigo-500/5 to-transparent rounded-full blur-[125px] -z-10 pointer-events-none" />
      <div className="absolute bottom-[20%] right-[20%] w-[380px] h-[380px] bg-gradient-to-tr from-indigo-500/5 via-blue-500/5 to-transparent rounded-full blur-[125px] -z-10 pointer-events-none" />

      {/* Header bar */}
      <div className="border-b border-slate-200 pb-6">
        <h1 className="text-3xl font-black tracking-tight flex items-center gap-2">
          <Settings className="text-blue-600" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Settings Console</span>
        </h1>
        <p className="text-slate-500 text-xs mt-1.5 font-semibold">Customize security protocols, notification pipelines, and visual themes.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: Theme preview & configuration (1 col) */}
        <div className="space-y-6">
          <div className="p-[1px] rounded-3xl bg-slate-200/50 shadow-sm">
            <div className="bg-white p-6 rounded-[23px] space-y-6 border border-slate-200/80 shadow-md">
              
              <div>
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  <Sparkles size={14} className="text-blue-600" /> Themes Preset Preview
                </h3>
                <p className="text-[10px] text-slate-400 font-extrabold uppercase mt-1">Configure layout visuals</p>
              </div>

              <div className="space-y-3">
                {[
                  { id: 'classic', label: 'Classic Light Slate', color: 'from-blue-100 to-indigo-100' },
                  { id: 'cyan', label: 'Pulsing Cyber Cyan', color: 'from-blue-200 to-cyan-200' },
                  { id: 'emerald', label: 'Matrix Neon Emerald', color: 'from-emerald-200 to-teal-200' }
                ].map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => { setActiveTheme(theme.id); showToast(`Applied ${theme.label} preset!`, 'success'); }}
                    className={`w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer ${
                      activeTheme === theme.id 
                        ? 'border-blue-200 bg-blue-50/50 shadow-sm' 
                        : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3 truncate">
                      <div className={`w-6 h-6 rounded-full bg-gradient-to-tr ${theme.color} border border-slate-200 shrink-0`} />
                      <span className="text-xs font-bold text-slate-700">{theme.label}</span>
                    </div>
                    {activeTheme === theme.id && <Check size={14} className="text-blue-600" />}
                  </button>
                ))}
              </div>

            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Password & Security, Notifications forms (2 cols) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Account Security Form */}
          <div className="p-[1px] rounded-3xl bg-slate-200/50 shadow-sm">
            <div className="bg-white p-6 sm:p-8 rounded-[23px] space-y-6 border border-slate-200/80 shadow-md">
              
              <div className="flex items-center space-x-3 border-b border-slate-100 pb-4">
                <div className="p-2 rounded-xl bg-blue-50 border border-blue-100 text-blue-600">
                  <Lock size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800 leading-none">Account Security</h3>
                  <p className="text-[10px] text-slate-400 font-extrabold uppercase mt-1.5 leading-none">Update password credentials</p>
                </div>
              </div>

              <form onSubmit={handleSecuritySave} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-slate-550 text-[10px] font-extrabold uppercase tracking-widest">Current Password</label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-xl py-3 px-4 text-slate-800 text-xs outline-none font-semibold transition-all"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-slate-550 text-[10px] font-extrabold uppercase tracking-widest">New Password</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min. 8 characters"
                      className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-xl py-3 px-4 text-slate-800 text-xs outline-none font-semibold transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-slate-550 text-[10px] font-extrabold uppercase tracking-widest">Confirm New Password</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-xl py-3 px-4 text-slate-800 text-xs outline-none font-semibold transition-all"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-blue-500/10 active:scale-95 flex items-center space-x-1.5 cursor-pointer border border-transparent"
                  >
                    {loading ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <>
                        <Save size={14} />
                        <span>Save Password</span>
                      </>
                    )}
                  </button>
                </div>
              </form>

            </div>
          </div>

          {/* Notification Preferences */}
          <div className="p-[1px] rounded-3xl bg-slate-200/50 shadow-sm">
            <div className="bg-white p-6 sm:p-8 rounded-[23px] space-y-6 border border-slate-200/80 shadow-md">
              
              <div className="flex items-center space-x-3 border-b border-slate-100 pb-4">
                <div className="p-2 rounded-xl bg-blue-50 border border-blue-100 text-blue-600">
                  <Bell size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800 leading-none">Notification Preferences</h3>
                  <p className="text-[10px] text-slate-400 font-extrabold uppercase mt-1.5 leading-none">Control system notification channels</p>
                </div>
              </div>

              <div className="space-y-4 text-xs font-semibold text-slate-500">
                <label className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer hover:border-slate-300 transition-all shadow-sm">
                  <div className="space-y-0.5">
                    <span className="text-slate-800 block font-bold">Email Alerts</span>
                    <span className="text-xxs text-slate-500 block">Weekly matching updates, ATS suggestions, recruiter messages</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={emailAlerts}
                    onChange={(e) => setEmailAlerts(e.target.checked)}
                    className="rounded border-slate-300 bg-white text-blue-600 focus:ring-blue-500/20 w-4 h-4 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-205 cursor-pointer hover:border-slate-300 transition-all shadow-sm">
                  <div className="space-y-0.5">
                    <span className="text-slate-800 block font-bold">Web Push Notifications</span>
                    <span className="text-xxs text-slate-500 block">Immediate live matches, recruiter message pings, meeting requests</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={pushAlerts}
                    onChange={(e) => setPushAlerts(e.target.checked)}
                    className="rounded border-slate-300 bg-white text-blue-600 focus:ring-blue-500/20 w-4 h-4 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-205 cursor-pointer hover:border-slate-300 transition-all shadow-sm">
                  <div className="space-y-0.5">
                    <span className="text-slate-800 block font-bold">Mobile SMS Reminders</span>
                    <span className="text-xxs text-slate-500 block">Scheduled interview alerts sent to mobile contact line</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={mobileAlerts}
                    onChange={(e) => setMobileAlerts(e.target.checked)}
                    className="rounded border-slate-300 bg-white text-blue-600 focus:ring-blue-500/20 w-4 h-4 cursor-pointer"
                  />
                </label>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={handlePreferencesSave}
                    className="px-6 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-650 hover:from-blue-500 hover:to-indigo-600 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-blue-500/10 active:scale-95 flex items-center space-x-1.5 cursor-pointer border border-transparent"
                  >
                    <Save size={14} />
                    <span>Save Preferences</span>
                  </button>
                </div>
              </div>

            </div>
          </div>

        </div>

      </div>
    </PageTransition>
  );
}
