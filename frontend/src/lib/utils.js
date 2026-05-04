import { clsx } from 'clsx';

export function cn(...inputs) {
  return clsx(inputs);
}

export function formatDuration(seconds) {
  if (!seconds && seconds !== 0) return '—';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export function formatStopwatch(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export const STATUS_COLORS = {
  PENDING:     'bg-gray-500/20 text-gray-400',
  IN_PROGRESS: 'bg-rose-500/20 text-rose-400',
  SUBMITTED:   'bg-gold-500/20 text-gold-400',
  APPROVED:    'bg-emerald-500/20 text-emerald-400',
  REJECTED:    'bg-red-500/20 text-red-400',
  OVERDUE:     'bg-orange-500/20 text-orange-400',
};

export const ROLE_LABELS = {
  CEO:              'CEO',
  HR:               'HR',
  PROJECT_LEAD:     'Project Lead',
  QUALITY_REVIEWER: 'Quality Reviewer',
  TAKER:            'Tasker',
};
