import { useQuery } from '@tanstack/react-query';
import {
  Users, FolderKanban, CheckCircle2, Clock,
  AlertTriangle, TrendingUp,
} from 'lucide-react';
import api from '../../lib/api.js';
import { useAuthStore } from '../../store/authStore.js';
import PageHeader from '../../components/PageHeader.jsx';
import StatCard from '../../components/StatCard.jsx';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';
import { formatDuration } from '../../lib/utils.js';

export default function HRDashboard() {
  const { user } = useAuthStore();

  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => api.get('/analytics/dashboard').then((r) => r.data.stats),
  });

  const { data: ahtData, isLoading: ahtLoading } = useQuery({
    queryKey: ['aht-report'],
    queryFn: () => api.get('/analytics/aht-report?days=7').then((r) => r.data),
  });

  const { data: projectsData } = useQuery({
    queryKey: ['all-projects'],
    queryFn: () => api.get('/projects').then((r) => r.data.projects),
  });

  const projects = projectsData || [];
  const topTaskers = ahtData?.report?.slice(0, 5) || [];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="HR Dashboard"
        subtitle="Team-wide performance overview"
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-up" style={{ animationDelay: '0.05s' }}>
        <StatCard label="Total Tasks" value={stats?.totalTasks} icon={CheckCircle2} color="rose" />
        <StatCard label="Projects" value={stats?.projectCount} icon={FolderKanban} color="gold" />
        <StatCard label="Pending Review" value={stats?.pendingReview} icon={Clock} color="yellow" />
        <StatCard label="Overdue" value={stats?.overdueCount} icon={AlertTriangle} color="red" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-up" style={{ animationDelay: '0.15s' }}>
        {/* AHT Leaderboard */}
        <div className="card">
          <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp size={15} className="text-rose-400" />
            AHT Leaderboard (7 days)
          </h2>
          {ahtLoading ? (
            <LoadingSpinner className="py-8" />
          ) : topTaskers.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-6">No data yet</p>
          ) : (
            <div className="space-y-2">
              {topTaskers.map((row, i) => (
                <div key={row.taker.id}
                  className="flex items-center gap-3 p-2.5 rounded-lg animate-fade-up"
                  style={{ background: '#261519', animationDelay: `${i * 0.07}s`,
                           transition: 'transform 0.2s, box-shadow 0.2s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateX(4px)'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(225,29,72,0.12)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
                >
                  <span className="text-xs font-bold text-gray-600 w-5 text-center">{i + 1}</span>
                  <div className="w-7 h-7 rounded-full bg-rose-500/20 flex items-center justify-center text-rose-400 text-xs font-bold">
                    {row.taker.name?.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium truncate">{row.taker.name}</p>
                    <p className="text-xs text-gray-500">{row.taskCount} tasks</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-rose-400">{formatDuration(row.avgAhtSeconds)}</p>
                    <p className="text-xs text-gray-600">avg AHT</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Active Projects */}
        <div className="card">
          <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <FolderKanban size={15} className="text-gold-400" />
            Active Projects
          </h2>
          {projects.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-6">No projects yet</p>
          ) : (
            <div className="space-y-2">
              {projects.slice(0, 6).map((p) => (
                <div key={p.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-surface-600">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium truncate">{p.name}</p>
                    <p className="text-xs text-gray-500">
                      {p.members?.length || 0} takers · {p._count?.tasks || 0} tasks
                    </p>
                  </div>
                  <span className={`badge text-xs ${
                    p.status === 'ACTIVE'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-gray-500/20 text-gray-400'
                  }`}>
                    {p.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Status breakdown */}
      {ahtData?.statusBreakdown && (
        <div className="card">
          <h2 className="text-sm font-semibold text-white mb-4">Task Status Breakdown (7 days)</h2>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {ahtData.statusBreakdown.map((s) => (
              <div key={s.status} className="text-center p-3 rounded-lg bg-surface-600">
                <p className="text-xl font-bold text-white">{s.count}</p>
                <p className="text-xs text-gray-500 mt-0.5">{s.status.replace('_', ' ')}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
