import { cn, STATUS_COLORS } from '../lib/utils.js';

export default function StatusBadge({ status, className }) {
  return (
    <span className={cn('badge', STATUS_COLORS[status] || 'bg-gray-500/20 text-gray-400', className)}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {status?.replace('_', ' ')}
    </span>
  );
}
