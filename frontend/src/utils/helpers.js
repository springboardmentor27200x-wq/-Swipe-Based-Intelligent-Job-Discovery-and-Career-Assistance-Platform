import { formatDistanceToNow, format } from 'date-fns';

// ─── Date / Time ────────────────────────────────────────────────────────────────

export const timeAgo = (dateString) => {
  try {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  } catch {
    return 'recently';
  }
};

export const formatDate = (dateString, fmt = 'MMM d, yyyy') => {
  try {
    return format(new Date(dateString), fmt);
  } catch {
    return dateString || '—';
  }
};

// ─── String Helpers ─────────────────────────────────────────────────────────────

export const getInitials = (name = '') => {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';
};

export const truncate = (str, maxLength = 100) => {
  if (!str) return '';
  return str.length > maxLength ? `${str.slice(0, maxLength)}…` : str;
};

export const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export const slugify = (str) => {
  return str.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
};

// ─── Number Helpers ─────────────────────────────────────────────────────────────

export const formatSalary = (min, max, currency = '$') => {
  if (!min && !max) return 'Salary not disclosed';
  const fmt = (n) => {
    if (n >= 100000) return `${(n / 100000).toFixed(1)}L`;
    if (n >= 1000) return `${(n / 1000).toFixed(0)}K`;
    return n;
  };
  if (!max) return `${currency}${fmt(min)}+`;
  if (!min) return `Up to ${currency}${fmt(max)}`;
  return `${currency}${fmt(min)} – ${currency}${fmt(max)}`;
};

export const formatNumber = (num) => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num?.toString() || '0';
};

export const clampPercent = (val) => Math.min(100, Math.max(0, val || 0));

// ─── Color Helpers ──────────────────────────────────────────────────────────────

export const getScoreColor = (score) => {
  if (score >= 80) return { text: '#10b981', bg: 'rgba(16,185,129,0.15)', label: 'Excellent' };
  if (score >= 60) return { text: '#f59e0b', bg: 'rgba(245,158,11,0.15)', label: 'Good' };
  if (score >= 40) return { text: '#06b6d4', bg: 'rgba(6,182,212,0.15)', label: 'Fair' };
  return { text: '#94a3b8', bg: 'rgba(148,163,184,0.1)', label: 'Partial' };
};

export const getCompetitionConfig = (level) => {
  switch (level?.toLowerCase()) {
    case 'low':
      return { color: '#10b981', bg: 'rgba(16,185,129,0.15)', label: 'Low Competition', icon: '🟢' };
    case 'medium':
      return { color: '#f59e0b', bg: 'rgba(245,158,11,0.15)', label: 'Medium Competition', icon: '🟡' };
    case 'high':
      return { color: '#f43f5e', bg: 'rgba(244,63,94,0.15)', label: 'High Competition', icon: '🔴' };
    default:
      return { color: '#94a3b8', bg: 'rgba(148,163,184,0.1)', label: 'Unknown', icon: '⚪' };
  }
};

export const getCompanyTypeGradient = (type) => {
  switch (type?.toLowerCase()) {
    case 'mnc':
      return 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)';
    case 'startup':
      return 'linear-gradient(135deg, #06b6d4 0%, #0284c7 100%)';
    case 'new startup':
    case 'new_startup':
      return 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
    default:
      return 'linear-gradient(135deg, #8b5cf6 0%, #06b6d4 100%)';
  }
};

export const getCompanyTypeColor = (type) => {
  switch (type?.toLowerCase()) {
    case 'mnc': return '#4f46e5';
    case 'startup': return '#0891b2';
    case 'new startup':
    case 'new_startup': return '#d97706';
    default: return '#4f46e5';
  }
};

export const getStatusConfig = (status) => {
  const configs = {
    saved: { color: '#0891b2', bg: 'rgba(8,145,178,0.1)', label: 'Saved' },
    applied: { color: '#4f46e5', bg: 'rgba(79,70,229,0.1)', label: 'Applied' },
    shortlisted: { color: '#d97706', bg: 'rgba(217,119,6,0.1)', label: 'Shortlisted' },
    interview: { color: '#059669', bg: 'rgba(5,150,105,0.1)', label: 'Interview' },
    offered: { color: '#0f766e', bg: 'rgba(15,118,110,0.1)', label: 'Offered' },
    rejected: { color: '#dc2626', bg: 'rgba(220,38,38,0.1)', label: 'Rejected' },
  };
  return configs[status?.toLowerCase()] || configs.applied;
};

// ─── Skill Tags ─────────────────────────────────────────────────────────────────

export const SKILL_COLORS = [
  'rgba(79,70,229,0.12)',
  'rgba(8,145,178,0.12)',
  'rgba(217,119,6,0.12)',
  'rgba(5,150,105,0.12)',
  'rgba(220,38,38,0.12)',
];

export const getSkillColor = (skill) => {
  const idx = skill.charCodeAt(0) % SKILL_COLORS.length;
  return SKILL_COLORS[idx];
};

// ─── Validation ─────────────────────────────────────────────────────────────────

export const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export const isStrongPassword = (password) => password?.length >= 6;
