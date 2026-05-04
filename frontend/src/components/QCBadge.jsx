import { cn } from '../lib/utils.js';
import { ShieldCheck, ShieldAlert, ShieldOff } from 'lucide-react';

export default function QCBadge({ score, issueCount }) {
  if (score === null || score === undefined) {
    return (
      <span className="badge bg-gray-500/20 text-gray-500">
        <ShieldOff size={11} /> QC Skipped
      </span>
    );
  }
  const passed = score >= 70;
  return (
    <span className={cn('badge', passed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400')}>
      {passed ? <ShieldCheck size={11} /> : <ShieldAlert size={11} />}
      QC {score}% · {issueCount} issue{issueCount !== 1 ? 's' : ''}
    </span>
  );
}
