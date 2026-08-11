import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import {
  User, Mail, MapPin, Briefcase, GraduationCap, Linkedin, Github, Globe,
  Plus, X, Lock, Shield, Save,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { updateUserProfile } from '../../store/authSlice.js';
import authService from '../../services/authService.js';
import Button from '../../components/UI/Button.jsx';
import { getInitials } from '../../utils/helpers.js';

export default function ProfilePage() {
  const dispatch = useDispatch();
  const { user, isLoading } = useSelector((s) => s.auth);

  const [form, setForm] = useState({
    full_name: user?.full_name || '',
    title: user?.title || '',
    location: user?.location || '',
    bio: user?.bio || '',
    experience_years: user?.experience_years || 0,
    education: user?.education || '',
    linkedin_url: user?.linkedin_url || '',
    github_url: user?.github_url || '',
    portfolio_url: user?.portfolio_url || '',
  });
  const [skills, setSkills] = useState(user?.skills || []);
  const [skillInput, setSkillInput] = useState('');

  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [isPwSubmitting, setIsPwSubmitting] = useState(false);

  const handleChange = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const addSkill = () => {
    const val = skillInput.trim();
    if (val && !skills.includes(val)) {
      setSkills([...skills, val]);
    }
    setSkillInput('');
  };

  const removeSkill = (skill) => setSkills(skills.filter((s) => s !== skill));

  const handleSave = (e) => {
    e.preventDefault();
    dispatch(updateUserProfile({ ...form, experience_years: Number(form.experience_years) || 0, skills }))
      .unwrap()
      .then(() => toast.success('Profile updated successfully!'))
      .catch((err) => toast.error(err || 'Failed to update profile.'));
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (pwForm.new_password.length < 6) {
      toast.error('New password must be at least 6 characters.');
      return;
    }
    if (pwForm.new_password !== pwForm.confirm_password) {
      toast.error('New passwords do not match.');
      return;
    }
    setIsPwSubmitting(true);
    try {
      await authService.changePassword({
        current_password: pwForm.current_password,
        new_password: pwForm.new_password,
      });
      toast.success('Password changed successfully!');
      setPwForm({ current_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to change password.');
    } finally {
      setIsPwSubmitting(false);
    }
  };

  return (
    <div className="flex-1 max-w-5xl mx-auto space-y-6 pb-16 animate-fade-in font-inter">
      {/* Header Card */}
      <div className="glass-card rounded-2xl border border-slate-200 p-8 flex items-center gap-6 shadow-card">
        <div className="w-20 h-20 rounded-2xl bg-gradient-primary flex items-center justify-center text-2xl font-bold text-white shadow-glow-purple shrink-0">
          {getInitials(user?.full_name)}
        </div>
        <div className="min-w-0">
          <h1 className="text-2xl font-bold font-outfit text-text-primary truncate">{user?.full_name}</h1>
          <p className="text-sm text-text-secondary flex items-center gap-1.5 mt-1">
            <Mail className="w-3.5 h-3.5" /> {user?.email}
          </p>
          <span className="inline-flex items-center gap-1.5 mt-2 badge bg-primary/10 text-primary border border-primary/20 capitalize">
            <Shield className="w-3 h-3" /> {user?.role?.replace('_', ' ')}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Details Form */}
        <form onSubmit={handleSave} className="lg:col-span-2 glass-card rounded-2xl border border-slate-200 p-8 space-y-5">
          <h2 className="text-lg font-bold font-outfit text-text-primary flex items-center gap-2">
            <User className="w-5 h-5 text-primary" /> Profile Details
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-text-secondary mb-1.5 block">Full Name</label>
              <input className="input-glass" value={form.full_name} onChange={handleChange('full_name')} placeholder="Your full name" />
            </div>
            <div>
              <label className="text-xs font-semibold text-text-secondary mb-1.5 block flex items-center gap-1">
                <Briefcase className="w-3.5 h-3.5" /> Job Title
              </label>
              <input className="input-glass" value={form.title} onChange={handleChange('title')} placeholder="e.g. Frontend Developer" />
            </div>
            <div>
              <label className="text-xs font-semibold text-text-secondary mb-1.5 block flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" /> Location
              </label>
              <input className="input-glass" value={form.location} onChange={handleChange('location')} placeholder="City, Country" />
            </div>
            <div>
              <label className="text-xs font-semibold text-text-secondary mb-1.5 block">Years of Experience</label>
              <input type="number" min="0" className="input-glass" value={form.experience_years} onChange={handleChange('experience_years')} />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-text-secondary mb-1.5 block">Bio</label>
            <textarea rows={3} className="input-glass resize-none" value={form.bio} onChange={handleChange('bio')} placeholder="Tell us about yourself..." />
          </div>

          <div>
            <label className="text-xs font-semibold text-text-secondary mb-1.5 block flex items-center gap-1">
              <GraduationCap className="w-3.5 h-3.5" /> Education
            </label>
            <input className="input-glass" value={form.education} onChange={handleChange('education')} placeholder="e.g. B.Tech Computer Science" />
          </div>

          {/* Skills */}
          <div>
            <label className="text-xs font-semibold text-text-secondary mb-1.5 block">Skills</label>
            <div className="flex gap-2 mb-2">
              <input
                className="input-glass"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }}
                placeholder="Add a skill and press Enter"
              />
              <Button type="button" variant="secondary" size="md" onClick={addSkill} icon={<Plus className="w-4 h-4" />} />
            </div>
            <div className="flex flex-wrap gap-2">
              {skills.map((skill) => (
                <span key={skill} className="badge bg-primary/10 text-primary border border-primary/20">
                  {skill}
                  <button type="button" onClick={() => removeSkill(skill)} className="ml-1 hover:text-danger">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              {skills.length === 0 && <span className="text-xs text-text-muted">No skills added yet.</span>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-text-secondary mb-1.5 block flex items-center gap-1">
                <Linkedin className="w-3.5 h-3.5" /> LinkedIn
              </label>
              <input className="input-glass" value={form.linkedin_url} onChange={handleChange('linkedin_url')} placeholder="https://linkedin.com/in/..." />
            </div>
            <div>
              <label className="text-xs font-semibold text-text-secondary mb-1.5 block flex items-center gap-1">
                <Github className="w-3.5 h-3.5" /> GitHub
              </label>
              <input className="input-glass" value={form.github_url} onChange={handleChange('github_url')} placeholder="https://github.com/..." />
            </div>
            <div>
              <label className="text-xs font-semibold text-text-secondary mb-1.5 block flex items-center gap-1">
                <Globe className="w-3.5 h-3.5" /> Portfolio
              </label>
              <input className="input-glass" value={form.portfolio_url} onChange={handleChange('portfolio_url')} placeholder="https://..." />
            </div>
          </div>

          <Button type="submit" variant="primary" isLoading={isLoading} icon={<Save className="w-4 h-4" />}>
            Save Changes
          </Button>
        </form>

        {/* Change Password */}
        <form onSubmit={handlePasswordChange} className="glass-card rounded-2xl border border-slate-200 p-8 space-y-4 h-fit">
          <h2 className="text-lg font-bold font-outfit text-text-primary flex items-center gap-2">
            <Lock className="w-5 h-5 text-secondary" /> Change Password
          </h2>
          <div>
            <label className="text-xs font-semibold text-text-secondary mb-1.5 block">Current Password</label>
            <input
              type="password"
              className="input-glass"
              value={pwForm.current_password}
              onChange={(e) => setPwForm((f) => ({ ...f, current_password: e.target.value }))}
              placeholder="••••••••"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-text-secondary mb-1.5 block">New Password</label>
            <input
              type="password"
              className="input-glass"
              value={pwForm.new_password}
              onChange={(e) => setPwForm((f) => ({ ...f, new_password: e.target.value }))}
              placeholder="••••••••"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-text-secondary mb-1.5 block">Confirm New Password</label>
            <input
              type="password"
              className="input-glass"
              value={pwForm.confirm_password}
              onChange={(e) => setPwForm((f) => ({ ...f, confirm_password: e.target.value }))}
              placeholder="••••••••"
            />
          </div>
          <Button type="submit" variant="secondary" fullWidth isLoading={isPwSubmitting} icon={<Lock className="w-4 h-4" />}>
            Update Password
          </Button>
        </form>
      </div>
    </div>
  );
}
