import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Users, Briefcase, Building2, Zap, UserCheck, UserX, Award } from 'lucide-react';
import toast from 'react-hot-toast';
import adminService from '../../services/adminService.js';
import { getInitials, timeAgo } from '../../utils/helpers.js';

export default function AdminPage() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [statsRes, usersRes] = await Promise.all([
        adminService.getStats(),
        adminService.getUsers(),
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data);
    } catch (err) {
      toast.error('Failed to load admin data.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleChange = async (userId, role) => {
    try {
      await adminService.changeRole(userId, role);
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role } : u)));
      toast.success('Role updated.');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update role.');
    }
  };

  const handleDeactivate = async (userId) => {
    try {
      await adminService.deactivateUser(userId);
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, is_active: false } : u)));
      toast.success('User deactivated.');
    } catch (err) {
      toast.error('Failed to deactivate user.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[70vh]">
        <div className="w-12 h-12 rounded-full border-4 border-t-primary border-slate-200 animate-spin" />
        <p className="text-xs text-text-secondary mt-4 font-medium">Loading admin portal...</p>
      </div>
    );
  }

  const statCards = [
    { label: 'Total Users', value: stats?.total_users ?? 0, icon: Users, color: 'text-primary bg-primary/10 border-primary/20' },
    { label: 'Job Seekers', value: stats?.job_seekers ?? 0, icon: UserCheck, color: 'text-secondary bg-secondary/10 border-secondary/20' },
    { label: 'Recruiters', value: stats?.recruiters ?? 0, icon: Building2, color: 'text-accent bg-accent/10 border-accent/20' },
    { label: 'Active Jobs', value: stats?.active_jobs ?? 0, icon: Briefcase, color: 'text-success bg-success/10 border-success/20' },
    { label: 'Total Applications', value: stats?.total_applications ?? 0, icon: Award, color: 'text-primary bg-primary/10 border-primary/20' },
    { label: 'Total Swipes', value: stats?.total_swipes ?? 0, icon: Zap, color: 'text-danger bg-danger/10 border-danger/20' },
  ];

  return (
    <div className="flex-1 max-w-6xl mx-auto space-y-6 pb-16 animate-fade-in font-inter">
      <div>
        <h1 className="text-2xl font-bold font-outfit text-text-primary flex items-center gap-2">
          <Shield className="w-6 h-6 text-primary" /> Admin Portal
        </h1>
        <p className="text-sm text-text-secondary mt-1">Platform-wide oversight and user management.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-card rounded-xl border border-slate-200 p-5 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-text-secondary tracking-wider">{card.label}</span>
                <p className="text-xl font-bold font-outfit text-text-primary mt-1">{card.value}</p>
              </div>
              <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${card.color}`}>
                <Icon className="w-5 h-5" />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* User management table */}
      <div className="glass-card rounded-2xl border border-slate-200 p-6">
        <h2 className="text-lg font-bold font-outfit text-text-primary flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-primary" /> Manage Users
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase text-text-secondary tracking-wider border-b border-slate-200">
                <th className="pb-3 pr-4 font-semibold">User</th>
                <th className="pb-3 pr-4 font-semibold">Role</th>
                <th className="pb-3 pr-4 font-semibold">Status</th>
                <th className="pb-3 pr-4 font-semibold">Joined</th>
                <th className="pb-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-slate-200 last:border-0">
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-xs font-bold text-text-primary shrink-0">
                        {getInitials(u.full_name)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-text-primary truncate">{u.full_name}</p>
                        <p className="text-xs text-text-secondary truncate">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 pr-4">
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      className="input-glass !w-auto !py-1.5 text-xs capitalize"
                    >
                      <option value="job_seeker">Job Seeker</option>
                      <option value="recruiter">Recruiter</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="py-3 pr-4">
                    <span className={`badge ${u.is_active ? 'bg-success/15 text-success border-success/20' : 'bg-danger/15 text-danger border-danger/20'}`}>
                      {u.is_active ? 'Active' : 'Deactivated'}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-text-secondary text-xs">{timeAgo(u.created_at)}</td>
                  <td className="py-3">
                    {u.is_active && (
                      <button
                        onClick={() => handleDeactivate(u.id)}
                        className="flex items-center gap-1 text-xs font-medium text-danger hover:opacity-80"
                      >
                        <UserX className="w-3.5 h-3.5" /> Deactivate
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
