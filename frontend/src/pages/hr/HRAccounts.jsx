import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, ShieldOff, ShieldCheck, UserX, UserCheck, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api.js';
import PageHeader from '../../components/PageHeader.jsx';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';
import { ROLE_LABELS } from '../../lib/utils.js';

const ROLE_COLORS = {
  CEO:              'bg-rose-500/20 text-rose-400',
  HR:               'bg-gold-500/20 text-gold-400',
  PROJECT_LEAD:     'bg-rose-700/20 text-rose-300',
  QUALITY_REVIEWER: 'bg-gold-700/20 text-gold-300',
  TAKER:            'bg-surface-500/60 text-gray-400',
};

export default function HRAccounts() {
  const qc = useQueryClient();
  const [search, setSearch]         = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [confirm, setConfirm]       = useState(null); // { userId, action, name }

  const { data, isLoading } = useQuery({
    queryKey: ['accounts', search, roleFilter],
    queryFn: () =>
      api.get('/users', { params: { search: search || undefined, role: roleFilter || undefined } })
         .then((r) => r.data.users),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ userId, isActive }) =>
      isActive
        ? api.delete(`/users/${userId}`)           // deactivate
        : api.patch(`/users/${userId}`, { isActive: true }), // reactivate
    onSuccess: (_, vars) => {
      toast.success(vars.isActive ? 'Account deactivated' : 'Account reactivated');
      qc.invalidateQueries({ queryKey: ['accounts'] });
      qc.invalidateQueries({ queryKey: ['users'] });
      setConfirm(null);
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Action failed'),
  });

  const users = data || [];
  const active   = users.filter((u) => u.isActive).length;
  const inactive = users.filter((u) => !u.isActive).length;

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        title="Account Control"
        subtitle="Grant, revoke, or block user access"
      />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 animate-fade-up" style={{ animationDelay: '0.05s' }}>
        <div className="rounded-xl p-4 flex items-center gap-3"
             style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)' }}>
          <ShieldCheck size={18} className="text-emerald-400" />
          <div>
            <p className="text-2xl font-bold text-emerald-400">{active}</p>
            <p className="text-xs text-gray-500">Active accounts</p>
          </div>
        </div>
        <div className="rounded-xl p-4 flex items-center gap-3"
             style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)' }}>
          <ShieldOff size={18} className="text-red-400" />
          <div>
            <p className="text-2xl font-bold text-red-400">{inactive}</p>
            <p className="text-xs text-gray-500">Deactivated accounts</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap animate-fade-up" style={{ animationDelay: '0.1s' }}>
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input className="input pl-9" placeholder="Search by name or email…"
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="input w-auto" value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}>
          <option value="">All roles</option>
          {['TAKER','QUALITY_REVIEWER','PROJECT_LEAD','HR','CEO'].map((r) => (
            <option key={r} value={r}>{ROLE_LABELS[r]}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      {isLoading ? (
        <LoadingSpinner className="py-12" />
      ) : (
        <div className="card p-0 overflow-hidden animate-fade-up" style={{ animationDelay: '0.15s' }}>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-500 uppercase tracking-wide"
                  style={{ borderBottom: '1px solid #3d1f25' }}>
                <th className="text-left px-4 py-3">User</th>
                <th className="text-left px-4 py-3">Role</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Joined</th>
                <th className="text-right px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => (
                <tr key={u.id} className="animate-fade-up"
                  style={{ borderBottom: '1px solid #3d1f25', animationDelay: `${i * 0.04}s`, transition: 'background 0.15s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#261519'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = ''; }}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                           style={{ background: u.isActive ? 'rgba(225,29,72,0.12)' : 'rgba(100,100,100,0.12)',
                                    color: u.isActive ? '#fb7185' : '#6b7280' }}>
                        {u.name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className={`font-medium text-xs ${u.isActive ? 'text-white' : 'text-gray-500 line-through'}`}>
                          {u.name}
                        </p>
                        <p className="text-[10px] text-gray-600">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge ${ROLE_COLORS[u.role] || 'bg-gray-500/20 text-gray-400'}`}>
                      {ROLE_LABELS[u.role]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge ${u.isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      {u.isActive ? 'Active' : 'Blocked'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {/* Don't allow blocking CEO/HR */}
                    {['CEO', 'HR'].includes(u.role) ? (
                      <span className="text-xs text-gray-600">Protected</span>
                    ) : (
                      <button
                        onClick={() => setConfirm({ userId: u.id, isActive: u.isActive, name: u.name })}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ml-auto"
                        style={{
                          background: u.isActive ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
                          color: u.isActive ? '#f87171' : '#34d399',
                          border: `1px solid ${u.isActive ? 'rgba(239,68,68,0.25)' : 'rgba(16,185,129,0.25)'}`,
                        }}>
                        {u.isActive
                          ? <><UserX size={12} /> Block</>
                          : <><UserCheck size={12} /> Restore</>}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Confirm dialog */}
      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop"
             style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}>
          <div className="w-full max-w-sm modal-card"
               style={{ background: '#1e1115', border: '1px solid #3d1f25', borderRadius: '1rem', padding: '1.5rem' }}>
            <div className="text-center mb-5">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-3"
                   style={{ background: confirm.isActive ? 'rgba(239,68,68,0.12)' : 'rgba(16,185,129,0.12)' }}>
                {confirm.isActive
                  ? <UserX size={22} className="text-red-400" />
                  : <UserCheck size={22} className="text-emerald-400" />}
              </div>
              <h3 className="text-base font-semibold text-white">
                {confirm.isActive ? 'Block Account' : 'Restore Account'}
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                {confirm.isActive
                  ? `"${confirm.name}" will lose access immediately.`
                  : `"${confirm.name}" will regain full access.`}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => toggleMutation.mutate({ userId: confirm.userId, isActive: confirm.isActive })}
                disabled={toggleMutation.isPending}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-white font-semibold text-sm transition-all"
                style={{ background: confirm.isActive ? '#dc2626' : '#059669' }}>
                {toggleMutation.isPending
                  ? <Loader2 size={14} className="animate-spin" />
                  : confirm.isActive ? 'Yes, Block' : 'Yes, Restore'}
              </button>
              <button onClick={() => setConfirm(null)} className="btn-secondary flex-1 justify-center">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
