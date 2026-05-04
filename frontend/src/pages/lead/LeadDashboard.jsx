import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  FolderKanban, CheckCircle2, Clock, AlertTriangle,
  ShieldCheck, ChevronRight, ChevronDown, Users,
  FileText, X, TrendingUp,
} from 'lucide-react';
import api from '../../lib/api.js';
import { useAuthStore } from '../../store/authStore.js';
import PageHeader from '../../components/PageHeader.jsx';
import StatCard from '../../components/StatCard.jsx';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import { formatDuration } from '../../lib/utils.js';

// ── Tasker prompt drawer ──────────────────────────────────────────────────────
function TaskerDrawer({ tasker, projectId, onClose }) {
  const { data, isLoading } = useQuery({
    queryKey: ['tasker-prompts', tasker.id, projectId],
    queryFn: () =>
      api.get('/tasks/history/5-days', { params: { takerId: tasker.id } })
         .then((r) => r.data.tasks),
    enabled: !!tasker,
  });

  const tasks = (data || []).filter((t) => t.prompt || t.response);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
         style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}
         onClick={onClose}>
      <div className="w-full max-w-2xl max-h-[80vh] flex flex-col rounded-2xl overflow-hidden animate-scale-in"
           style={{ background: '#1e1115', border: '1px solid #3d1f25' }}
           onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: '1px solid #3d1f25' }}>
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold"
               style={{ background: 'rgba(225,29,72,0.15)', color: '#fb7185' }}>
            {tasker.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-white">{tasker.name}</p>
            <p className="text-xs text-gray-600">{tasker.email} · Last 5 days</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Task list */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {isLoading ? (
            <LoadingSpinner className="py-8" />
          ) : tasks.length === 0 ? (
            <div className="text-center py-12">
              <FileText size={28} className="mx-auto mb-2" style={{ color: '#3d1f25' }} />
              <p className="text-sm text-gray-500">No tasks with prompts yet</p>
            </div>
          ) : (
            tasks.map((task, i) => (
              <div key={task.id} className="rounded-xl overflow-hidden animate-fade-up"
                   style={{ border: '1px solid #3d1f25', animationDelay: `${i * 0.05}s` }}>
                {/* Task meta */}
                <div className="flex items-center gap-3 px-4 py-2.5"
                     style={{ background: '#261519', borderBottom: '1px solid #3d1f25' }}>
                  <StatusBadge status={task.status} />
                  <span className="text-xs text-gray-500 flex-1">{task.project?.name}</span>
                  {task.ahtSeconds && (
                    <span className="text-xs text-gray-600 flex items-center gap-1">
                      <Clock size={10} /> {formatDuration(task.ahtSeconds)}
                    </span>
                  )}
                  <span className="text-[10px] text-gray-600">
                    {new Date(task.createdAt).toLocaleDateString()}
                  </span>
                </div>

                {/* Prompt */}
                {task.prompt && (
                  <div className="px-4 py-3" style={{ borderBottom: task.response ? '1px solid #3d1f25' : 'none' }}>
                    <p className="text-[10px] text-gray-600 uppercase tracking-wider mb-1.5">Prompt</p>
                    <p className="text-xs text-gray-300 leading-relaxed whitespace-pre-wrap">{task.prompt}</p>
                  </div>
                )}

                {/* Response */}
                {task.response && (
                  <div className="px-4 py-3">
                    <p className="text-[10px] text-gray-600 uppercase tracking-wider mb-1.5">Response</p>
                    <p className="text-xs text-gray-400 leading-relaxed whitespace-pre-wrap line-clamp-4">
                      {task.response}
                    </p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main dashboard ────────────────────────────────────────────────────────────
export default function LeadDashboard() {
  const { user } = useAuthStore();
  const [expandedQR, setExpandedQR] = useState({});
  const [selectedTasker, setSelectedTasker] = useState(null); // { id, name, email }

  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => api.get('/analytics/dashboard').then((r) => r.data.stats),
  });

  const { data: projectsData, isLoading } = useQuery({
    queryKey: ['lead-projects'],
    queryFn: () => api.get('/projects').then((r) => r.data.projects),
  });

  const { data: ahtData } = useQuery({
    queryKey: ['lead-aht', 7],
    queryFn: () => api.get('/analytics/aht-report?days=7').then((r) => r.data),
  });

  const projects = projectsData || [];

  // Build QR → { taskers, taskCount, approvedCount } map across all projects
  const qrMap = {};
  for (const p of projects) {
    if (!p.qr) continue;
    const qrId = p.qr.id;
    if (!qrMap[qrId]) {
      qrMap[qrId] = { qr: p.qr, taskers: [], taskCount: 0, approvedCount: 0, projects: [] };
    }
    qrMap[qrId].projects.push(p.name);
    qrMap[qrId].taskCount += p._count?.tasks || 0;
    const taskers = (p.members || []).filter((m) => m.user.role === 'TAKER');
    for (const t of taskers) {
      if (!qrMap[qrId].taskers.find((x) => x.id === t.user.id)) {
        qrMap[qrId].taskers.push(t.user);
      }
    }
  }
  const qrGroups = Object.values(qrMap);

  function toggleQR(id) {
    setExpandedQR((p) => ({ ...p, [id]: !p[id] }));
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Project Lead Dashboard" subtitle={`Hello, ${user?.name}`} />

      {/* ── Stats ────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-up" style={{ animationDelay: '0.05s' }}>
        <StatCard label="My Projects"    value={stats?.projectCount}  icon={FolderKanban}  color="rose" />
        <StatCard label="Total Tasks"    value={stats?.totalTasks}    icon={CheckCircle2}  color="gold" />
        <StatCard label="Pending Review" value={stats?.pendingReview} icon={Clock}         color="yellow" />
        <StatCard label="Overdue"        value={stats?.overdueCount}  icon={AlertTriangle} color="red" />
      </div>

      {/* ── QR Progress Overview ─────────────────────────────────────────── */}
      <div className="animate-fade-up" style={{ animationDelay: '0.15s' }}>
        <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <ShieldCheck size={14} className="text-gold-400" />
          QR Progress Overview
          <span className="text-xs text-gray-600 font-normal">— click a QR to see their taskers</span>
        </h2>

        {isLoading ? (
          <LoadingSpinner className="py-8" />
        ) : qrGroups.length === 0 ? (
          <div className="card text-center py-12 text-gray-500">
            No QRs assigned yet. Create a project and assign a QR from the Projects page.
          </div>
        ) : (
          <div className="space-y-3">
            {qrGroups.map((group, gi) => {
              const qrId   = group.qr.id;
              const isOpen = expandedQR[qrId];

              // AHT data for this QR's taskers
              const ahtRows = (ahtData?.report || []).filter((r) =>
                group.taskers.some((t) => t.id === r.taker.id)
              );
              const avgAht = ahtRows.length
                ? Math.round(ahtRows.reduce((a, r) => a + r.avgAhtSeconds, 0) / ahtRows.length)
                : null;

              // Progress: tasks done vs total
              const progressPct = group.taskCount > 0
                ? Math.min(100, Math.round((group.approvedCount / group.taskCount) * 100))
                : 0;

              return (
                <div key={qrId} className="card animate-fade-up"
                     style={{ animationDelay: `${gi * 0.07}s` }}>

                  {/* QR row — clickable */}
                  <button onClick={() => toggleQR(qrId)}
                    className="w-full flex items-center gap-4 text-left">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                         style={{ background: 'rgba(245,158,11,0.15)', color: '#fbbf24',
                                  border: '1px solid rgba(245,158,11,0.3)' }}>
                      {group.qr.name.charAt(0).toUpperCase()}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-semibold text-white">{group.qr.name}</p>
                        <span className="text-[10px] text-gray-600">Quality Reviewer</span>
                      </div>
                      {/* Progress bar */}
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: '#3d1f25' }}>
                          <div className="h-full rounded-full transition-all duration-700"
                               style={{ width: `${progressPct}%`, background: '#10b981' }} />
                        </div>
                        <span className="text-[10px] text-gray-600 flex-shrink-0">{group.taskCount} tasks</span>
                      </div>
                    </div>

                    {/* Mini stats */}
                    <div className="flex items-center gap-4 text-xs flex-shrink-0">
                      <div className="text-center">
                        <p className="font-semibold text-white">{group.taskers.length}</p>
                        <p className="text-[10px] text-gray-600">taskers</p>
                      </div>
                      {avgAht && (
                        <div className="text-center">
                          <p className="font-semibold" style={{ color: '#fb7185' }}>{formatDuration(avgAht)}</p>
                          <p className="text-[10px] text-gray-600">avg AHT</p>
                        </div>
                      )}
                    </div>

                    {isOpen
                      ? <ChevronDown size={15} className="text-gray-500 flex-shrink-0" />
                      : <ChevronRight size={15} className="text-gray-500 flex-shrink-0" />}
                  </button>

                  {/* Expanded: tasker list */}
                  {isOpen && (
                    <div className="mt-4 pt-4" style={{ borderTop: '1px solid #3d1f25' }}>
                      <p className="text-[10px] text-gray-600 uppercase tracking-wider mb-3">
                        Taskers — click to view prompts
                      </p>
                      {group.taskers.length === 0 ? (
                        <p className="text-xs text-gray-600 text-center py-3">No taskers yet</p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                          {group.taskers.map((tasker, ti) => {
                            const taskerAht = ahtRows.find((r) => r.taker.id === tasker.id);
                            return (
                              <button key={tasker.id}
                                onClick={() => setSelectedTasker(tasker)}
                                className="flex items-center gap-2.5 p-3 rounded-xl text-left transition-all group animate-fade-up"
                                style={{ background: '#261519', border: '1px solid #3d1f25',
                                         animationDelay: `${ti * 0.04}s` }}
                                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(225,29,72,0.35)'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(225,29,72,0.1)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#3d1f25'; e.currentTarget.style.boxShadow = ''; }}>
                                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                                     style={{ background: 'rgba(225,29,72,0.12)', color: '#fb7185' }}>
                                  {tasker.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium text-white truncate">{tasker.name}</p>
                                  {taskerAht && (
                                    <p className="text-[10px] flex items-center gap-1 mt-0.5" style={{ color: '#fb7185' }}>
                                      <TrendingUp size={9} /> {formatDuration(taskerAht.avgAhtSeconds)} avg
                                    </p>
                                  )}
                                </div>
                                <FileText size={13} className="text-gray-600 group-hover:text-rose-400 transition-colors flex-shrink-0" />
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Tasker prompt drawer */}
      {selectedTasker && (
        <TaskerDrawer
          tasker={selectedTasker}
          onClose={() => setSelectedTasker(null)}
        />
      )}
    </div>
  );
}
