import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import api from '../../lib/api.js';
import PageHeader from '../../components/PageHeader.jsx';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';
import { formatDuration } from '../../lib/utils.js';

const PIE_COLORS = {
  APPROVED:    '#10b981',
  SUBMITTED:   '#f59e0b',
  REJECTED:    '#e11d48',
  IN_PROGRESS: '#f43f5e',
  PENDING:     '#5a2d35',
  OVERDUE:     '#f97316',
};

const DAYS_OPTIONS = [7, 14, 30, 90];

export default function HRAnalytics() {
  const [days, setDays] = useState(30);

  const { data, isLoading } = useQuery({
    queryKey: ['aht-report', days],
    queryFn: () => api.get(`/analytics/aht-report?days=${days}`).then((r) => r.data),
  });

  const barData = (data?.report || []).map((r) => ({
    name: r.taker.name?.split(' ')[0] || 'Unknown',
    avgAHT: Math.round((r.avgAhtSeconds || 0) / 60 * 10) / 10,
    tasks: r.taskCount,
  }));

  const pieData = (data?.statusBreakdown || []).map((s) => ({
    name: s.status.replace('_', ' '),
    value: s.count,
    color: PIE_COLORS[s.status] || '#6b7280',
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="AHT Analytics"
        subtitle="Average Handling Time & task performance"
        actions={
          <div className="flex gap-1">
            {DAYS_OPTIONS.map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  days === d ? 'bg-rose-600 text-white' : 'bg-surface-600 text-gray-400 border border-surface-500 hover:text-white'
                }`}
              >
                {d}d
              </button>
            ))}
          </div>
        }
      />

      {/* Overall stats */}
      {data?.overall && (
        <div className="grid grid-cols-2 gap-4">
          <div className="card text-center">
            <p className="text-3xl font-bold text-rose-400">{formatDuration(data.overall.avgAhtSeconds)}</p>
            <p className="text-xs text-gray-500 mt-1">Team Average AHT</p>
          </div>
          <div className="card text-center">
            <p className="text-3xl font-bold text-white">{data.overall.totalTasks}</p>
            <p className="text-xs text-gray-500 mt-1">Total Tasks ({days} days)</p>
          </div>
        </div>
      )}

      {isLoading ? (
        <LoadingSpinner className="py-12" />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* AHT Bar Chart */}
          <div className="card">
            <h2 className="text-sm font-semibold text-white mb-4">Avg AHT per Tasker (minutes)</h2>
            {barData.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">No data</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={barData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#30363d" />
                  <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ background: '#1e1115', border: '1px solid #3d1f25', borderRadius: 8 }}
                    labelStyle={{ color: '#fff' }}
                    itemStyle={{ color: '#e11d48' }}
                    formatter={(v) => [`${v} min`, 'Avg AHT']}
                  />
                  <Bar dataKey="avgAHT" fill="#e11d48" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Status Pie Chart */}
          <div className="card">
            <h2 className="text-sm font-semibold text-white mb-4">Task Status Distribution</h2>
            {pieData.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">No data</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: '#1e1115', border: '1px solid #3d1f25', borderRadius: 8 }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Legend
                    formatter={(value) => <span style={{ color: '#9ca3af', fontSize: 11 }}>{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      )}

      {/* Per-taker table */}
      {data?.report?.length > 0 && (
        <div className="card p-0 overflow-hidden">
          <div className="px-4 py-3 border-b border-surface-500">
            <h2 className="text-sm font-semibold text-white">Per-Tasker Breakdown</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-500 text-xs text-gray-500 uppercase tracking-wide">
                <th className="text-left px-4 py-3">Tasker</th>
                <th className="text-left px-4 py-3">Tasks</th>
                <th className="text-left px-4 py-3">Avg AHT</th>
                <th className="text-left px-4 py-3">Min AHT</th>
                <th className="text-left px-4 py-3">Max AHT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-500">
              {data.report.map((row) => (
                <tr key={row.taker.id} className="hover:bg-surface-600 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-rose-500/20 flex items-center justify-center text-rose-400 text-xs font-bold">
                        {row.taker.name?.charAt(0)}
                      </div>
                      <div>
                        <p className="text-white font-medium">{row.taker.name}</p>
                        <p className="text-xs text-gray-500">{row.taker.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-400">{row.taskCount}</td>
                  <td className="px-4 py-3 text-rose-400 font-medium">{formatDuration(row.avgAhtSeconds)}</td>
                  <td className="px-4 py-3 text-emerald-400">{formatDuration(row.minAhtSeconds)}</td>
                  <td className="px-4 py-3 text-orange-400">{formatDuration(row.maxAhtSeconds)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
