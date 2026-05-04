import { Users, Clock, CheckCircle2, Flame } from 'lucide-react';
import { cn, formatDuration } from '../lib/utils.js';

const STATUS_PILL = {
  ACTIVE:    { cls: 'bg-rose-500/20 text-rose-400 border-rose-500/30',     dot: '#f43f5e' },
  PAUSED:    { cls: 'bg-gold-500/20 text-gold-400 border-gold-500/30',     dot: '#f59e0b' },
  COMPLETED: { cls: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', dot: '#10b981' },
  ARCHIVED:  { cls: 'bg-gray-500/20 text-gray-400 border-gray-500/30',     dot: '#6b7280' },
};

export default function ProjectCard({ project, onClick }) {
  const memberCount = project.members?.length ?? 0;
  const taskCount   = project._count?.tasks ?? 0;
  const pill        = STATUS_PILL[project.status] || STATUS_PILL.ACTIVE;

  return (
    <button onClick={onClick}
      className="card text-left group w-full relative overflow-hidden
                 hover:scale-[1.02] hover:-translate-y-1 active:scale-[0.99]"
      style={{ transition: 'transform 0.25s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.25s, border-color 0.2s' }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'rgba(225,29,72,0.4)';
        e.currentTarget.style.boxShadow   = '0 8px 32px rgba(225,29,72,0.12)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = '';
        e.currentTarget.style.boxShadow   = '';
      }}>

      {/* Subtle gradient sweep on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-xl"
           style={{ background: 'linear-gradient(135deg, rgba(225,29,72,0.04) 0%, transparent 60%)' }} />

      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center
                        transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6"
             style={{ background: 'rgba(225,29,72,0.1)', border: '1px solid rgba(225,29,72,0.2)' }}>
          <Flame size={17} className="text-rose-400" />
        </div>
        <span className={cn('badge border', pill.cls)}>
          <span className="w-1.5 h-1.5 rounded-full animate-pulse-slow" style={{ background: pill.dot }} />
          {project.status === 'ACTIVE' ? 'Live' : project.status}
        </span>
      </div>

      {/* Title */}
      <h3 className="font-semibold text-white text-sm mb-1 transition-colors duration-200 group-hover:text-rose-300">
        {project.name}
      </h3>
      {project.description && (
        <p className="text-xs text-gray-600 mb-3 line-clamp-2">{project.description}</p>
      )}

      {/* Meta */}
      <div className="space-y-1 text-xs text-gray-600">
        {project.lead && <div className="flex gap-1.5"><span>PL:</span><span className="text-gray-400">{project.lead.name}</span></div>}
        {project.qr   && <div className="flex gap-1.5"><span>QR:</span><span className="text-gray-400">{project.qr.name}</span></div>}
      </div>

      {/* Footer */}
      <div className="flex items-center gap-4 mt-4 pt-3 text-xs text-gray-600"
           style={{ borderTop: '1px solid #3d1f25' }}>
        <span className="flex items-center gap-1"><Users size={11} /> {memberCount} taskers</span>
        <span className="flex items-center gap-1"><CheckCircle2 size={11} /> {taskCount} tasks</span>
        <span className="flex items-center gap-1"><Clock size={11} /> {formatDuration(project.expectedAhtSecs)}</span>
      </div>
    </button>
  );
}
