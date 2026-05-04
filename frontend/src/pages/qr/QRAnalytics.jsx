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

const DAYS_OPTIONS = [7, 14, 30];

const PIE_COLORS = {
  APPROVED:    '#10b981',
  SUBMITTED:   '#f59e0b',
  REJECTED:    '#e11d48',
  IN_PROGRESS: '#f43f5e',
  PENDING:     '#5a2d35',
  OVERDUE:     '#f97316',
};

export default function QRAnalytics() {
  const [days, setDays] = useState(7);

  const { data, isLoading } = useQuery({
    queryKey: ['qr-aht-report', days],
    queryFn: () => api.get(`/analytics/aht-report?days=${days}`).then((r) => r.data),
  });

  // Bar chart: avg AHT per tasker (anonymised — just first name)
  const barData = (data?.report || []).map((r) => ({
    name: r.taker.name?.split(' ')[0] || '?',
    avgAHT: Math.round((r.avgAhtSeconds || 0) / 60 * 10) / 10,
    tasks: r.taskCount,
  }));

  // Pie: status breakdown
  const pieData = (data?.statusBreakdown || []).map((s) => ({
    name: s.status.replace('_', ' '),
    value: s.count,
    color: PIE_COLORS[s.status] || '#6b7280',
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="QR Analytics"
        subtitle="Aggregate performance metrics — no individual task content"
        actions={
          <div className="flex gap-1">
            {DAYS_OPTIONS.map((d) => (
              <button key={d} onClick={() => setDays(d)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={{
                  background: days === d ? '#e11d48' : '#261519',
                  color: days === d ? '#fff' : '#9ca3af',
                  border: `1px solid ${days === d ? '#e11d48' : '#3d1f25'}`,
                }}>
                {d}d
              </button>
            ))}
          </div>
        }
      />

      {/* Overall KPIs */}
      {data?.overall && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-up" style={{ animationDelay: '0.05s' }}>
          {[
            { label: 'Total Tasks',   value: data.overall.totalTasks,                          color: '#fb7185', bg: 'rgba(244,63,94,0.08)',  border: 'rgba(244,63,94,0.2)',  accent: 'bg-rose-500' },
            { label: 'Avg AHT',       value: formatDuration(data.overall.avgAhtSeconds),        color: '#fbbf24', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)', accent: 'bg-gold-500' },
            { label: 'Approved',      value: data.statusBreakdown?.find(s=>s.status==='APPROVED')?.count ?? 0,  color: '#34d399', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)', accent: 'bg-emerald-500' },
            { label: 'Pending Review',value: data.statusBreakdown?.find(s=>s.status==='SUBMITTED')?.count ?? 0, color: '#f59e0b', bg: 'rgba(245,158,11,0.06)', border: 'rgba(245,158,11,0.15)', accent: 'bg-gold-600' },
          ].map(({ label, value, color, bg, border, accent }) => (
            <div key={label} className="rounded-xl overflow-hidden"
                 style={{ background: bg, border: `1px solid ${border}` }}>
              <div className={`h-0.5 w-full ${accent}`} />
              <div className="p-4">
                <p className="text-[10px] text-gray-600 uppercase tracking-wider mb-1">{label}</p>
                <p className="text-2xl font-bold tabular-nums" style={{ color }}>{value}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {isLoading ? (
        <LoadingSpinner className="py-12" />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-up" style={{ animationDelay: '0.15s' }}>

          {/* AHT bar chart */}
          <div className="card">
            <h2 className="text-sm font-semibold text-white mb-4">Avg AHT per Tasker (minutes)</h2>
            {barData.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">No data yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={barData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#3d1f25" />
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

          {/* Status pie */}
          <div className="card">
            <h2 className="text-sm font-semibold text-white mb-4">Task Status Distribution</h2>
            {pieData.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">No data yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={90}
                       paddingAngle={3} dataKey="value">
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: '#1e1115', border: '1px solid #3d1f25', borderRadius: 8 }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Legend formatter={(v) => <span style={{ color: '#9ca3af', fontSize: 11 }}>{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      )}

      {/* Tasker summary table — counts only, no response content */}
      {data?.report?.length > 0 && (
        <div className="card p-0 overflow-hidden animate-fade-up" style={{ animationDelay: '0.25s' }}>
          <div className="px-4 py-3" style={{ borderBottom: '1px solid #3d1f25' }}>
            <h2 className="text-sm font-semibold text-white">Tasker Summary</h2>
            <p className="text-xs text-gray-600 mt-0.5">Aggregate counts only — no task content shown</p>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-500 uppercase tracking-wide"
                  style={{ borderBottom: '1px solid #3d1f25' }}>
                <th className="text-left px-4 py-3">Tasker</th>
                <th className="text-left px-4 py-3">Tasks</th>
                <th className="text-left px-4 py-3">Avg AHT</th>
                <th className="text-left px-4 py-3">Best AHT</th>
                <th className="text-left px-4 py-3">Worst AHT</th>
              </tr>
            </thead>
            <tbody>
              {data.report.map((row, i) => (
                <tr key={row.taker.id}
                  style={{ borderBottom: '1px solid #3d1f25', transition: 'background 0.15s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#261519'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = ''; }}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold"
                           style={{ background: 'rgba(245,158,11,0.12)', color: '#fbbf24' }}>
                        {row.taker.name?.charAt(0)}
                      </div>
                      <span className="text-white text-xs font-medium">{row.taker.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{row.taskCount}</td>
                  <td className="px-4 py-3 text-xs font-medium" style={{ color: '#fb7185' }}>{formatDuration(row.avgAhtSeconds)}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: '#34d399' }}>{formatDuration(row.minAhtSeconds)}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: '#f97316' }}>{formatDuration(row.maxAhtSeconds)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
