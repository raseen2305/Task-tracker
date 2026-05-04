import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ShieldCheck, CheckCircle2, XCircle, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import api from '../../lib/api.js';
import PageHeader from '../../components/PageHeader.jsx';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import { formatDuration } from '../../lib/utils.js';

export default function LeadQRMonitor() {
  const [expanded, setExpanded] = useState({});

  const { data: projectsData, isLoading } = useQuery({
    queryKey: ['lead-projects-monitor'],
    queryFn: () => api.get('/projects').then((r) => r.data.projects),
    refetchInterval: 30_000,
  });

  // Fetch reviewed tasks (approved + rejected) for each project
  const { data: tasksData } = useQuery({
    queryKey: ['lead-reviewed-tasks'],
    queryFn: () => api.get('/tasks/reviewed').then((r) => r.data.tasks),
    refetchInterval: 30_000,
  });

  const projects = projectsData || [];
  const reviewedTasks = tasksData || [];

  // Group tasks by QR reviewer
  const byQR = {};
  for (const task of reviewedTasks) {
    const qrName = task.reviewer?.name || 'Unassigned';
    const qrId   = task.reviewerId || 'none';
    if (!byQR[qrId]) byQR[qrId] = { name: qrName, tasks: [] };
    byQR[qrId].tasks.push(task);
  }

  const qrGroups = Object.entries(byQR);

  // Stats
  const totalReviewed = reviewedTasks.length;
  const totalApproved = reviewedTasks.filter((t) => t.status === 'APPROVED').length;
  const totalRejected = reviewedTasks.filter((t) => t.status === 'REJECTED').length;
  const approvalRate  = totalReviewed > 0 ? Math.round((totalApproved / totalReviewed) * 100) : 0;

  function toggle(id) {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="QR Monitor"
        subtitle="Track Quality Reviewer performance — approved and rejected tasks"
      />

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-up" style={{ animationDelay: '0.05s' }}>
        {[
          { label: 'Total Reviewed', value: totalReviewed, color: '#fb7185', bg: 'rgba(244,63,94,0.08)', border: 'rgba(244,63,94,0.2)', accent: 'bg-rose-500' },
          { label: 'Approved',       value: totalApproved, color: '#34d399', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)', accent: 'bg-emerald-500' },
          { label: 'Rejected',       value: totalRejected, color: '#f87171', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)', accent: 'bg-red-500' },
          { label: 'Approval Rate',  value: `${approvalRate}%`, color: '#fbbf24', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)', accent: 'bg-gold-500' },
        ].map(({ label, value, color, bg, border, accent }) => (
          <div key={label} className="rounded-xl overflow-hidden"
               style={{ background: bg, border: `1px solid ${border}` }}>
            <div className={`h-0.5 w-full ${accent}`} />
            <div className="p-4">
              <p className="text-[10px] text-gray-600 uppercase tracking-wider mb-1">{label}</p>
              <p className="text-2xl font-bold" style={{ color }}>{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Per-QR breakdown */}
      <div className="animate-fade-up" style={{ animationDelay: '0.15s' }}>
        <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <ShieldCheck size={14} className="text-gold-400" />
          Per Quality Reviewer
        </h2>

        {isLoading ? (
          <LoadingSpinner className="py-8" />
        ) : qrGroups.length === 0 ? (
          <div className="card text-center py-12 text-gray-500">
            No reviewed tasks yet. QR activity will appear here once they start approving or rejecting tasks.
          </div>
        ) : (
          <div className="space-y-3">
            {qrGroups.map(([qrId, group], i) => {
              const approved = group.tasks.filter((t) => t.status === 'APPROVED').length;
              const rejected = group.tasks.filter((t) => t.status === 'REJECTED').length;
              const rate     = group.tasks.length > 0 ? Math.round((approved / group.tasks.length) * 100) : 0;
              const isOpen   = expanded[qrId];

              return (
                <div key={qrId} className="card animate-fade-up"
                     style={{ animationDelay: `${i * 0.07}s` }}>
                  {/* QR header row */}
                  <button
                    onClick={() => toggle(qrId)}
                    className="w-full flex items-center gap-4 text-left"
                  >
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                         style={{ background: 'rgba(245,158,11,0.12)', color: '#fbbf24' }}>
                      {group.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white">{group.name}</p>
                      <p className="text-xs text-gray-600">{group.tasks.length} tasks reviewed</p>
                    </div>

                    {/* Mini stats */}
                    <div className="flex items-center gap-3 text-xs">
                      <span className="flex items-center gap-1 text-emerald-400">
                        <CheckCircle2 size={12} /> {approved}
                      </span>
                      <span className="flex items-center gap-1 text-red-400">
                        <XCircle size={12} /> {rejected}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                            style={{ background: rate >= 70 ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                                     color: rate >= 70 ? '#34d399' : '#f87171' }}>
                        {rate}% approval
                      </span>
                    </div>

                    {isOpen ? <ChevronUp size={14} className="text-gray-500 flex-shrink-0" />
                             : <ChevronDown size={14} className="text-gray-500 flex-shrink-0" />}
                  </button>

                  {/* Expanded task list */}
                  {isOpen && (
                    <div className="mt-4 pt-4 space-y-2" style={{ borderTop: '1px solid #3d1f25' }}>
                      <div className="grid grid-cols-4 text-[10px] text-gray-600 uppercase tracking-wider px-2 mb-1">
                        <span>Project</span>
                        <span>Tasker</span>
                        <span>Status</span>
                        <span>AHT</span>
                      </div>
                      {group.tasks.map((task) => (
                        <div key={task.id}
                          className="grid grid-cols-4 items-center gap-2 px-2 py-2 rounded-lg text-xs"
                          style={{ background: '#261519' }}>
                          <span className="text-gray-300 truncate">{task.project?.name || '—'}</span>
                          <span className="text-gray-400 truncate">{task.taker?.name || '—'}</span>
                          <StatusBadge status={task.status} />
                          <span className="text-gray-500 flex items-center gap-1">
                            <Clock size={10} />
                            {task.ahtSeconds ? formatDuration(task.ahtSeconds) : '—'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
