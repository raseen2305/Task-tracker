import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Calendar, Filter } from 'lucide-react';
import api from '../../lib/api.js';
import PageHeader from '../../components/PageHeader.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import QCBadge from '../../components/QCBadge.jsx';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';
import { formatDuration } from '../../lib/utils.js';

const STATUSES = ['ALL', 'PENDING', 'IN_PROGRESS', 'SUBMITTED', 'APPROVED', 'REJECTED', 'OVERDUE'];

export default function TakerTasks() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const { data, isLoading } = useQuery({
    queryKey: ['task-history'],
    queryFn: () => api.get('/tasks/history/5-days').then((r) => r.data.tasks),
  });

  const tasks = (data || []).filter((t) => {
    const matchStatus = statusFilter === 'ALL' || t.status === statusFilter;
    const matchSearch = !search || t.project?.name?.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  return (
    <div className="space-y-5">
      <PageHeader title="My Tasks" subtitle="Last 5 days of task history" />

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            className="input pl-9"
            placeholder="Search by project…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-1 flex-wrap">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                statusFilter === s
                  ? 'bg-rose-600 text-white'
                  : 'bg-surface-600 text-gray-400 hover:text-white border border-surface-500'
              }`}
            >
              {s === 'ALL' ? 'All' : s.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <LoadingSpinner className="py-12" />
      ) : tasks.length === 0 ? (
        <div className="card text-center py-12 text-gray-500">
          No tasks found for the selected filters.
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-500 text-xs text-gray-500 uppercase tracking-wide">
                <th className="text-left px-4 py-3">Project</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">AHT</th>
                <th className="text-left px-4 py-3">QC Score</th>
                <th className="text-left px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-500">
              {tasks.map((task) => (
                <tr key={task.id} className="hover:bg-surface-600 transition-colors">
                  <td className="px-4 py-3 text-white font-medium">{task.project?.name}</td>
                  <td className="px-4 py-3"><StatusBadge status={task.status} /></td>
                  <td className="px-4 py-3 text-gray-400">
                    {task.ahtSeconds ? formatDuration(task.ahtSeconds) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    {task.qcScore !== null && task.qcScore !== undefined ? (
                      <QCBadge score={task.qcScore} issueCount={task.qcIssues?.length || 0} />
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {new Date(task.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
