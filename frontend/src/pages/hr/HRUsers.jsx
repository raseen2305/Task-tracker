import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search, UserPlus, Loader2, X, Eye, EyeOff,
  ShieldCheck, Users, Copy, CheckCheck,
} from 'lucide-react';
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

// HR can only create these two roles
const ALLOWED_ROLES = [
  {
    value: 'TAKER',
    label: 'Tasker',
    desc: 'Executes annotation tasks on Multimango',
    icon: <Users size={18} />,
    color: 'rgba(244,63,94,0.08)',
    border: 'rgba(244,63,94,0.3)',
    text: '#fb7185',
  },
  {
    value: 'QUALITY_REVIEWER',
    label: 'Quality Reviewer',
    desc: 'Reviews and approves submitted tasks',
    icon: <ShieldCheck size={18} />,
    color: 'rgba(245,158,11,0.08)',
    border: 'rgba(245,158,11,0.3)',
    text: '#fbbf24',
  },
];

const ALL_ROLES = ['CEO', 'HR', 'PROJECT_LEAD', 'QUALITY_REVIEWER', 'TAKER'];

function generatePassword() {
  const chars = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$';
  return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export default function HRUsers() {
  const qc = useQueryClient();
  const [search, setSearch]         = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showModal, setShowModal]   = useState(false);
  const [showPw, setShowPw]         = useState(false);
  const [copied, setCopied]         = useState(false);
  const [form, setForm] = useState({
    name: '', email: '', password: generatePassword(), role: 'TAKER',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['users', search, roleFilter],
    queryFn: () =>
      api.get('/users', { params: { search: search || undefined, role: roleFilter || undefined } })
         .then((r) => r.data.users),
  });

  const registerMutation = useMutation({
    mutationFn: (payload) => api.post('/auth/register', payload),
    onSuccess: (_, vars) => {
      toast.success(`${ROLE_LABELS[vars.role]} "${vars.name}" added successfully`);
      qc.invalidateQueries({ queryKey: ['users'] });
      closeModal();
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Registration failed'),
  });

  function closeModal() {
    setShowModal(false);
    setShowPw(false);
    setCopied(false);
    setForm({ name: '', email: '', password: generatePassword(), role: 'TAKER' });
  }

  function copyPassword() {
    navigator.clipboard.writeText(form.password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const users = data || [];
  const taskers = users.filter((u) => u.role === 'TAKER');
  const qrUsers = users.filter((u) => u.role === 'QUALITY_REVIEWER');

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        title="Team Management"
        subtitle={`${users.length} members · ${taskers.length} taskers · ${qrUsers.length} QRs`}
        actions={
          <button onClick={() => setShowModal(true)} className="btn-primary">
            <UserPlus size={14} />
            Add Member
          </button>
        }
      />

      {/* ── Quick stats ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 animate-fade-up" style={{ animationDelay: '0.05s' }}>
        {[
          { label: 'Taskers', count: taskers.length, color: '#fb7185', bg: 'rgba(244,63,94,0.08)', border: 'rgba(244,63,94,0.2)' },
          { label: 'Quality Reviewers', count: qrUsers.length, color: '#fbbf24', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)' },
        ].map(({ label, count, color, bg, border }) => (
          <div key={label} className="rounded-xl p-4 flex items-center gap-3"
               style={{ background: bg, border: `1px solid ${border}` }}>
            <p className="text-3xl font-bold" style={{ color }}>{count}</p>
            <p className="text-sm text-gray-400">{label}</p>
          </div>
        ))}
      </div>

      {/* ── Filters ──────────────────────────────────────────────────────── */}
      <div className="flex gap-3 flex-wrap animate-fade-up" style={{ animationDelay: '0.1s' }}>
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input className="input pl-9" placeholder="Search by name or email…"
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="input w-auto" value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}>
          <option value="">All roles</option>
          {ALL_ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
        </select>
      </div>

      {/* ── Users table ──────────────────────────────────────────────────── */}
      {isLoading ? (
        <LoadingSpinner className="py-12" />
      ) : users.length === 0 ? (
        <div className="card text-center py-12 text-gray-500">No users found.</div>
      ) : (
        <div className="card p-0 overflow-hidden animate-fade-up" style={{ animationDelay: '0.15s' }}>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-500 uppercase tracking-wide"
                  style={{ borderBottom: '1px solid #3d1f25' }}>
                <th className="text-left px-4 py-3">Name</th>
                <th className="text-left px-4 py-3">Email</th>
                <th className="text-left px-4 py-3">Role</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: '#3d1f25' }}>
              {users.map((u, i) => (
                <tr key={u.id} className="animate-fade-up"
                  style={{ animationDelay: `${i * 0.04}s`, transition: 'background 0.15s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#261519'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = ''; }}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                           style={{ background: 'rgba(225,29,72,0.12)', color: '#fb7185' }}>
                        {u.name?.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-white font-medium">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-400">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={`badge ${ROLE_COLORS[u.role] || 'bg-gray-500/20 text-gray-400'}`}>
                      {ROLE_LABELS[u.role]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge ${u.isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      {u.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Add Member Modal ─────────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop"
             style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}>
          <div className="w-full max-w-md modal-card"
               style={{ background: '#1e1115', border: '1px solid #3d1f25', borderRadius: '1.25rem', padding: '1.5rem',
                        boxShadow: '0 32px 80px rgba(0,0,0,0.5)' }}>

            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-semibold text-white">Add New Member</h2>
                <p className="text-xs text-gray-600 mt-0.5">Creates a login account saved to the database</p>
              </div>
              <button onClick={closeModal}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-500 hover:text-white transition-colors"
                style={{ background: '#261519' }}>
                <X size={15} />
              </button>
            </div>

            {/* Role selector cards */}
            <div className="grid grid-cols-2 gap-2 mb-5">
              {ALLOWED_ROLES.map((r) => (
                <button key={r.value} type="button"
                  onClick={() => setForm({ ...form, role: r.value })}
                  className="flex flex-col items-start gap-1.5 p-3 rounded-xl border text-left transition-all"
                  style={{
                    background: form.role === r.value ? r.color : '#261519',
                    borderColor: form.role === r.value ? r.border : '#3d1f25',
                    boxShadow: form.role === r.value ? `0 0 12px ${r.color}` : '',
                  }}>
                  <span style={{ color: form.role === r.value ? r.text : '#6b7280' }}>{r.icon}</span>
                  <span className="text-xs font-semibold" style={{ color: form.role === r.value ? '#fff' : '#9ca3af' }}>
                    {r.label}
                  </span>
                  <span className="text-[10px] text-gray-600 leading-tight">{r.desc}</span>
                </button>
              ))}
            </div>

            <form onSubmit={(e) => { e.preventDefault(); registerMutation.mutate(form); }}
                  className="space-y-3">

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Full Name</label>
                <input className="input" placeholder="e.g. Toshif Ahmed" value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Email Address</label>
                <input type="email" className="input" placeholder="user@example.com" value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-gray-400">Password</label>
                  <button type="button" onClick={() => setForm({ ...form, password: generatePassword() })}
                    className="text-[10px] text-gray-600 hover:text-gold-400 transition-colors">
                    ↻ Generate new
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    className="input pr-20"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required minLength={8}
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <button type="button" onClick={copyPassword}
                      className="p-1 rounded text-gray-500 hover:text-gold-400 transition-colors"
                      title="Copy password">
                      {copied ? <CheckCheck size={13} className="text-emerald-400" /> : <Copy size={13} />}
                    </button>
                    <button type="button" onClick={() => setShowPw(!showPw)}
                      className="p-1 rounded text-gray-500 hover:text-gray-300 transition-colors">
                      {showPw ? <EyeOff size={13} /> : <Eye size={13} />}
                    </button>
                  </div>
                </div>
                <p className="text-[10px] text-gray-600 mt-1">
                  Share this password with the user. They can change it after logging in.
                </p>
              </div>

              {/* Summary */}
              <div className="rounded-lg p-3 text-xs" style={{ background: '#261519', border: '1px solid #3d1f25' }}>
                <p className="text-gray-500 mb-1">Account summary</p>
                <p className="text-white">
                  <span className="text-gray-500">Name:</span> {form.name || '—'} &nbsp;·&nbsp;
                  <span className="text-gray-500">Role:</span>{' '}
                  <span style={{ color: ALLOWED_ROLES.find(r => r.value === form.role)?.text }}>
                    {ROLE_LABELS[form.role]}
                  </span>
                </p>
                <p className="text-gray-500 mt-0.5">{form.email || 'no email set'}</p>
              </div>

              <div className="flex gap-2 pt-1">
                <button type="submit" disabled={registerMutation.isPending}
                  className="btn-primary flex-1 justify-center py-2.5">
                  {registerMutation.isPending
                    ? <><Loader2 size={14} className="animate-spin" /> Creating account…</>
                    : <><UserPlus size={14} /> Create Account</>}
                </button>
                <button type="button" onClick={closeModal} className="btn-secondary px-4">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
