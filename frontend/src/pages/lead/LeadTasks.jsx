import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import api from '../../lib/api.js';
import PageHeader from '../../components/PageHeader.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import QCBadge from '../../components/QCBadge.jsx';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';
import { formatDuration } from '../../lib/utils.js';

export default function LeadTasks() {
  const [search, setSearch] = useState('');

  // Get all tasks across lead's projects via history endpoint
  // In a real app you'd have a dedicated endpoint; we reuse analytics
  const { data: projectsData, isLoading } = useQuery({
    queryKey: ['lead-projects-with-tasks'],
    queryFn: () => api.get('/projects').then((r) => r.data.projects),
  });

  const allTasks = (projectsData || []).flatMap((p) =>
    (p.tasks || []).map((t) => ({ ...t, projectName: p.name }))
  );

  const filtered = allTasks.filter((t) =>
    !search || t.projectName?.toLowerCase().includes(search.toLowerCase()) ||
    t.taker?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      <PageHeader title="All Tasks" subtitle="Across your projects" />

      <div className="relative max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          className="input pl-9"
          placeholder="Search by project or tasker…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <LoadingSpinner className="py-12" />
      ) : filtered.length === 0 ? (
        <div className="card text-center py-12 text-gray-500">No tasks found.</div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-500 text-xs text-gray-500 uppercase tracking-wide">
                <th className="text-left px-4 py-3">Project</th>
                <th className="text-left px-4 py-3">Tasker</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">AHT</th>
                <th className="text-left px-4 py-3">QC</th>
                <th className="text-left px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-500">
              {filtered.map((task) => (
                <tr key={task.id} className="hover:bg-surface-600 transition-colors">
                  <td className="px-4 py-3 text-white font-medium">{task.projectName}</td>
                  <td className="px-4 py-3 text-gray-400">{task.taker?.name || '—'}</td>
                  <td className="px-4 py-3"><StatusBadge status={task.status} /></td>
                  <td className="px-4 py-3 text-gray-400">{task.ahtSeconds ? formatDuration(task.ahtSeconds) : '—'}</td>
                  <td className="px-4 py-3">
                    {task.qcScore !== null && task.qcScore !== undefined
                      ? <QCBadge score={task.qcScore} issueCount={task.qcIssues?.length || 0} />
                      : '—'}
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
