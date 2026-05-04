import { useQuery } from '@tanstack/react-query';
import { ListTodo, CheckCircle2, Clock, FolderKanban, ShieldCheck } from 'lucide-react';
import api from '../../lib/api.js';
import { useAuthStore } from '../../store/authStore.js';
import PageHeader from '../../components/PageHeader.jsx';
import StatCard from '../../components/StatCard.jsx';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';

export default function QRDashboard() {
  const { user } = useAuthStore();

  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => api.get('/analytics/dashboard').then((r) => r.data.stats),
    refetchInterval: 30_000,
  });

  const { data: batchesData, isLoading } = useQuery({
    queryKey: ['qr-batches'],
    queryFn: () => api.get('/batches/mine').then((r) => r.data.batches),
    refetchInterval: 30_000,
  });

  const myBatches = batchesData || [];
  const totalTaskers = myBatches.reduce((acc, b) =>
    acc + (b.members || []).filter((m) => m.user.role === 'TAKER').length, 0
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="QR Dashboard" subtitle={`Hello, ${user?.name}`} />

      {/* ── Stats ────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-up" style={{ animationDelay: '0.05s' }}>
        <StatCard label="Pending Review" value={stats?.pendingReview} icon={ListTodo}    color="gold" />
        <StatCard label="Total Tasks"    value={stats?.totalTasks}    icon={CheckCircle2} color="rose" />
        <StatCard label="Overdue"        value={stats?.overdueCount}  icon={Clock}        color="red" />
        <StatCard label="My Batches"     value={myBatches.length}     icon={FolderKanban} color="crimson" />
      </div>

      {/* ── My Batches ───────────────────────────────────────────────────── */}
      <div className="animate-fade-up" style={{ animationDelay: '0.15s' }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <ShieldCheck size={14} className="text-gold-400" />
            My Batches
          </h2>
          <span className="text-xs text-gray-600">{totalTaskers} tasker{totalTaskers !== 1 ? 's' : ''} total</span>
        </div>

        {isLoading ? (
          <LoadingSpinner className="py-8" />
        ) : myBatches.length === 0 ? (
          <div className="card text-center py-12 text-gray-500">
            No batches assigned yet. HR will assign you to a batch.
          </div>
        ) : (
          <div className="space-y-3">
            {myBatches.map((batch, bi) => {
              const taskers = (batch.members || []).filter((m) => m.user.role === 'TAKER');
              return (
                <div key={batch.id} className="card animate-fade-up"
                     style={{ animationDelay: `${bi * 0.08}s` }}>

                  {/* Batch header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0"
                           style={{ background: 'linear-gradient(135deg,#e11d48,#9f1239)',
                                    boxShadow: '0 3px 10px rgba(225,29,72,0.3)', color: '#fff' }}>
                        {bi + 1}
                      </div>
                      <div>
                        <h3 className="font-semibold text-white text-sm">{batch.name}</h3>
                        <p className="text-xs text-gray-600 mt-0.5">
                          {taskers.length} / 10 taskers
                        </p>
                      </div>
                    </div>
                    <span className={`badge text-xs ${batch.isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-500/20 text-gray-400'}`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      {batch.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  {/* Capacity bar */}
                  <div className="mb-4">
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#3d1f25' }}>
                      <div className="h-full rounded-full transition-all duration-500"
                           style={{
                             width: `${(taskers.length / 10) * 100}%`,
                             background: taskers.length >= 10 ? '#e11d48'
                                       : taskers.length >= 7  ? '#f59e0b' : '#10b981',
                           }} />
                    </div>
                  </div>

                  {/* Tasker grid */}
                  {taskers.length === 0 ? (
                    <p className="text-xs text-gray-600 text-center py-3">No taskers in this batch yet</p>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                      {taskers.map((m) => (
                        <div key={m.id}
                          className="flex items-center gap-2 p-2.5 rounded-xl transition-all"
                          style={{ background: '#261519', border: '1px solid #3d1f25' }}
                          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(245,158,11,0.3)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#3d1f25'; }}
                        >
                          <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                               style={{ background: 'rgba(245,158,11,0.12)', color: '#fbbf24' }}>
                            {m.user.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] font-medium text-white truncate">{m.user.name.split(' ')[0]}</p>
                            <p className="text-[9px] text-gray-600 truncate">{m.user.email.split('@')[0]}</p>
                          </div>
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

      {/* Nav hint */}
      <div className="card animate-fade-up" style={{ animationDelay: '0.3s' }}>
        <p className="text-sm text-gray-400">
          Go to <span className="text-gold-400 font-medium">Review Queue</span> to approve or reject submitted tasks.
          Tasks with QC issues are highlighted automatically.
        </p>
      </div>
    </div>
  );
}
