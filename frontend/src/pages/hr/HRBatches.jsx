import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus, X, Loader2, ChevronDown, ChevronUp,
  ShieldCheck, Users, UserMinus, Pencil, Trash2,
  CheckCircle2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api.js';
import PageHeader from '../../components/PageHeader.jsx';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';

// ── Helpers ───────────────────────────────────────────────────────────────────
function Avatar({ name, color = 'rose' }) {
  const styles = {
    rose: { background: 'rgba(225,29,72,0.12)', color: '#fb7185' },
    gold: { background: 'rgba(245,158,11,0.12)', color: '#fbbf24' },
  };
  return (
    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
         style={styles[color]}>
      {name?.charAt(0).toUpperCase()}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function HRBatches() {
  const qc = useQueryClient();

  const [expanded, setExpanded]       = useState({});
  const [showCreate, setShowCreate]   = useState(false);
  const [editBatch, setEditBatch]     = useState(null);   // batch object
  const [addModal, setAddModal]       = useState(null);   // batchId
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [createForm, setCreateForm]   = useState({ name: '', qrId: '' });
  const [selectedTaskers, setSelectedTaskers] = useState([]);

  // ── Queries ─────────────────────────────────────────────────────────────────
  const { data: batchesData, isLoading } = useQuery({
    queryKey: ['batches'],
    queryFn: () => api.get('/batches').then((r) => r.data.batches),
  });

  const { data: usersData } = useQuery({
    queryKey: ['users-for-batch'],
    queryFn: () => api.get('/users').then((r) => r.data.users),
  });

  const batches = batchesData || [];
  const qrUsers = (usersData || []).filter((u) => u.role === 'QUALITY_REVIEWER' && u.isActive);
  const taskers = (usersData || []).filter((u) => u.role === 'TAKER' && u.isActive);

  // ── Mutations ────────────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: (data) => api.post('/batches', data),
    onSuccess: () => {
      toast.success('Batch created!');
      qc.invalidateQueries({ queryKey: ['batches'] });
      setShowCreate(false);
      setCreateForm({ name: '', qrId: '' });
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to create batch'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.patch(`/batches/${id}`, data),
    onSuccess: () => {
      toast.success('Batch updated!');
      qc.invalidateQueries({ queryKey: ['batches'] });
      setEditBatch(null);
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to update'),
  });

  const addMembersMutation = useMutation({
    mutationFn: ({ batchId, userIds }) => api.post(`/batches/${batchId}/members`, { userIds }),
    onSuccess: () => {
      toast.success('Members added!');
      qc.invalidateQueries({ queryKey: ['batches'] });
      setAddModal(null);
      setSelectedTaskers([]);
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to add members'),
  });

  const removeMemberMutation = useMutation({
    mutationFn: ({ batchId, userId }) => api.delete(`/batches/${batchId}/members/${userId}`),
    onSuccess: () => {
      toast.success('Member removed');
      qc.invalidateQueries({ queryKey: ['batches'] });
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to remove'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/batches/${id}`),
    onSuccess: () => {
      toast.success('Batch deleted');
      qc.invalidateQueries({ queryKey: ['batches'] });
      setDeleteConfirm(null);
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to delete'),
  });

  // ── Helpers ──────────────────────────────────────────────────────────────────
  function toggleExpand(id) {
    setExpanded((p) => ({ ...p, [id]: !p[id] }));
  }

  function toggleTasker(id) {
    setSelectedTaskers((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);
  }

  // Taskers not yet in the batch
  function availableTaskers(batch) {
    const inBatch = new Set((batch.members || []).map((m) => m.userId));
    return taskers.filter((t) => !inBatch.has(t.id));
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        title="Batches"
        subtitle={`${batches.length} batch${batches.length !== 1 ? 'es' : ''} · 1 QR per batch · up to 10 taskers`}
        actions={
          <button onClick={() => setShowCreate(true)} className="btn-primary">
            <Plus size={14} /> New Batch
          </button>
        }
      />

      {/* ── Batch list ──────────────────────────────────────────────────── */}
      {isLoading ? (
        <LoadingSpinner className="py-12" />
      ) : batches.length === 0 ? (
        <div className="card text-center py-16">
          <Users size={32} className="mx-auto mb-3" style={{ color: '#3d1f25' }} />
          <p className="text-gray-500 font-medium">No batches yet</p>
          <p className="text-xs text-gray-600 mt-1">Create a batch, assign a QR, then add taskers</p>
        </div>
      ) : (
        <div className="space-y-4">
          {batches.map((batch, bi) => {
            const isOpen      = expanded[batch.id];
            const members     = batch.members || [];
            const memberCount = members.length;

            return (
              <div key={batch.id} className="card animate-fade-up"
                   style={{ animationDelay: `${bi * 0.07}s` }}>

                {/* ── Batch top bar ─────────────────────────────────────── */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0"
                       style={{ background: 'linear-gradient(135deg,#e11d48,#9f1239)',
                                boxShadow: '0 3px 10px rgba(225,29,72,0.3)', color: '#fff' }}>
                    {bi + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-white text-sm">{batch.name}</h3>
                      <span className={`badge text-xs ${batch.isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-500/20 text-gray-400'}`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        {batch.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-600 mt-0.5">{memberCount} / 10 taskers</p>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button onClick={() => { setAddModal(batch.id); setSelectedTaskers([]); }}
                      disabled={memberCount >= 10}
                      title={memberCount >= 10 ? 'Batch is full (10/10)' : 'Add taskers'}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-30"
                      style={{ background: 'rgba(225,29,72,0.1)', color: '#fb7185', border: '1px solid rgba(225,29,72,0.2)' }}>
                      <Plus size={12} /> Add
                    </button>
                    <button onClick={() => setEditBatch(batch)}
                      className="p-1.5 rounded-lg transition-all"
                      style={{ background: '#261519', color: '#9ca3af' }} title="Edit">
                      <Pencil size={13} />
                    </button>
                    <button onClick={() => setDeleteConfirm(batch)}
                      className="p-1.5 rounded-lg transition-all"
                      style={{ background: 'rgba(239,68,68,0.08)', color: '#f87171' }} title="Delete">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* ── Capacity bar ──────────────────────────────────────── */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-[10px] text-gray-600 mb-1">
                    <span>Capacity</span>
                    <span>{memberCount}/10</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#3d1f25' }}>
                    <div className="h-full rounded-full transition-all duration-500"
                         style={{
                           width: `${(memberCount / 10) * 100}%`,
                           background: memberCount >= 10 ? '#e11d48' : memberCount >= 7 ? '#f59e0b' : '#10b981',
                         }} />
                  </div>
                </div>

                {/* ── QR block with nested taskers ──────────────────────── */}
                <div className="rounded-xl overflow-hidden"
                     style={{ border: '1px solid rgba(245,158,11,0.25)', background: 'rgba(245,158,11,0.04)' }}>

                  {/* QR header */}
                  <div className="flex items-center gap-3 px-4 py-3"
                       style={{ borderBottom: memberCount > 0 ? '1px solid rgba(245,158,11,0.15)' : 'none' }}>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                         style={{ background: 'rgba(245,158,11,0.15)', color: '#fbbf24' }}>
                      {batch.qr?.name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <ShieldCheck size={12} className="text-gold-400 flex-shrink-0" />
                        <p className="text-xs font-semibold text-gold-400">{batch.qr?.name}</p>
                        <span className="text-[10px] text-gray-600">Quality Reviewer</span>
                      </div>
                      <p className="text-[10px] text-gray-600 mt-0.5">{batch.qr?.email}</p>
                    </div>
                    <button
                      onClick={() => toggleExpand(batch.id)}
                      className="flex items-center gap-1 text-[10px] text-gray-500 hover:text-gray-300 transition-colors"
                    >
                      {isOpen ? <><ChevronUp size={13} /> Hide</> : <><ChevronDown size={13} /> {memberCount} tasker{memberCount !== 1 ? 's' : ''}</>}
                    </button>
                  </div>

                  {/* Taskers nested under QR */}
                  {isOpen && (
                    <div className="px-4 py-3">
                      {memberCount === 0 ? (
                        <p className="text-xs text-gray-600 text-center py-2">
                          No taskers yet — click <span className="text-rose-400 font-medium">Add</span> above
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {members.map((m, mi) => (
                            <div key={m.id}
                              className="flex items-center gap-3 px-3 py-2.5 rounded-xl group animate-fade-up"
                              style={{ background: '#261519', border: '1px solid #3d1f25',
                                       animationDelay: `${mi * 0.04}s` }}>
                              {/* Tree connector */}
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <div className="w-px h-4 rounded" style={{ background: '#3d1f25' }} />
                                <div className="w-3 h-px rounded" style={{ background: '#3d1f25' }} />
                              </div>
                              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                                   style={{ background: 'rgba(225,29,72,0.12)', color: '#fb7185' }}>
                                {m.user.name.charAt(0).toUpperCase()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-white truncate">{m.user.name}</p>
                                <p className="text-[10px] text-gray-600 truncate">{m.user.email}</p>
                              </div>
                              <span className="text-[10px] text-gray-600 flex-shrink-0">Tasker</span>
                              <button
                                onClick={() => removeMemberMutation.mutate({ batchId: batch.id, userId: m.userId })}
                                className="opacity-0 group-hover:opacity-100 p-1 rounded transition-all flex-shrink-0"
                                style={{ color: '#f87171' }} title="Remove">
                                <UserMinus size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      {/* ── Create Batch Modal ───────────────────────────────────────────── */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop"
             style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}>
          <div className="w-full max-w-sm modal-card"
               style={{ background: '#1e1115', border: '1px solid #3d1f25', borderRadius: '1.25rem', padding: '1.5rem' }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-white">New Batch</h2>
              <button onClick={() => setShowCreate(false)} className="text-gray-500 hover:text-white"><X size={16} /></button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(createForm); }}
                  className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Batch Name</label>
                <input className="input" placeholder="e.g. Batch 1 — RLHF Alpha"
                  value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} required />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">
                  Assign Quality Reviewer <span className="text-rose-500">*</span>
                </label>
                <div className="space-y-1.5 max-h-44 overflow-y-auto">
                  {qrUsers.map((u) => (
                    <button key={u.id} type="button"
                      onClick={() => setCreateForm({ ...createForm, qrId: u.id })}
                      className="w-full flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all"
                      style={{
                        background: createForm.qrId === u.id ? 'rgba(245,158,11,0.1)' : '#261519',
                        borderColor: createForm.qrId === u.id ? 'rgba(245,158,11,0.4)' : '#3d1f25',
                      }}>
                      <Avatar name={u.name} color="gold" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-white truncate">{u.name}</p>
                        <p className="text-[10px] text-gray-600 truncate">{u.email}</p>
                      </div>
                      {createForm.qrId === u.id && <CheckCircle2 size={14} className="text-gold-400 flex-shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button type="submit" disabled={createMutation.isPending || !createForm.name || !createForm.qrId}
                  className="btn-primary flex-1 justify-center">
                  {createMutation.isPending ? <><Loader2 size={13} className="animate-spin" /> Creating…</> : 'Create Batch'}
                </button>
                <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary px-4">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Edit Batch Modal ─────────────────────────────────────────────── */}
      {editBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop"
             style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}>
          <div className="w-full max-w-sm modal-card"
               style={{ background: '#1e1115', border: '1px solid #3d1f25', borderRadius: '1.25rem', padding: '1.5rem' }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-white">Edit Batch</h2>
              <button onClick={() => setEditBatch(null)} className="text-gray-500 hover:text-white"><X size={16} /></button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              updateMutation.mutate({ id: editBatch.id, data: { name: editBatch.name, qrId: editBatch.qrId, isActive: editBatch.isActive } });
            }} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Batch Name</label>
                <input className="input" value={editBatch.name}
                  onChange={(e) => setEditBatch({ ...editBatch, name: e.target.value })} required />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Quality Reviewer</label>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {qrUsers.map((u) => (
                    <button key={u.id} type="button"
                      onClick={() => setEditBatch({ ...editBatch, qrId: u.id })}
                      className="w-full flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all"
                      style={{
                        background: editBatch.qrId === u.id ? 'rgba(245,158,11,0.1)' : '#261519',
                        borderColor: editBatch.qrId === u.id ? 'rgba(245,158,11,0.4)' : '#3d1f25',
                      }}>
                      <Avatar name={u.name} color="gold" />
                      <span className="text-xs text-white flex-1 truncate">{u.name}</span>
                      {editBatch.qrId === u.id && <CheckCircle2 size={14} className="text-gold-400" />}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="isActive" checked={editBatch.isActive}
                  onChange={(e) => setEditBatch({ ...editBatch, isActive: e.target.checked })}
                  className="accent-rose-500" />
                <label htmlFor="isActive" className="text-xs text-gray-400">Active batch</label>
              </div>
              <div className="flex gap-2 pt-1">
                <button type="submit" disabled={updateMutation.isPending} className="btn-primary flex-1 justify-center">
                  {updateMutation.isPending ? <><Loader2 size={13} className="animate-spin" /> Saving…</> : 'Save Changes'}
                </button>
                <button type="button" onClick={() => setEditBatch(null)} className="btn-secondary px-4">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Add Members Modal ────────────────────────────────────────────── */}
      {addModal && (() => {
        const batch = batches.find((b) => b.id === addModal);
        const available = batch ? availableTaskers(batch) : [];
        const slots = 10 - (batch?.members?.length || 0);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop"
               style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}>
            <div className="w-full max-w-md modal-card"
                 style={{ background: '#1e1115', border: '1px solid #3d1f25', borderRadius: '1.25rem', padding: '1.5rem' }}>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-base font-semibold text-white">Add Taskers</h2>
                <button onClick={() => setAddModal(null)} className="text-gray-500 hover:text-white"><X size={16} /></button>
              </div>
              <p className="text-xs text-gray-600 mb-4">
                {slots} slot{slots !== 1 ? 's' : ''} remaining · {selectedTaskers.length} selected
              </p>

              {available.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-6">
                  {slots === 0 ? 'Batch is full (10/10)' : 'All taskers are already in this batch'}
                </p>
              ) : (
                <div className="space-y-1.5 max-h-64 overflow-y-auto mb-4">
                  {available.map((u) => {
                    const isSelected = selectedTaskers.includes(u.id);
                    const atLimit = selectedTaskers.length >= slots && !isSelected;
                    return (
                      <label key={u.id}
                        className="flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all"
                        style={{
                          background: isSelected ? 'rgba(225,29,72,0.08)' : '#261519',
                          borderColor: isSelected ? 'rgba(225,29,72,0.35)' : '#3d1f25',
                          opacity: atLimit ? 0.4 : 1,
                        }}>
                        <input type="checkbox" checked={isSelected}
                          onChange={() => !atLimit && toggleTasker(u.id)}
                          className="accent-rose-500 flex-shrink-0" />
                        <Avatar name={u.name} color="rose" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-white truncate">{u.name}</p>
                          <p className="text-[10px] text-gray-600 truncate">{u.email}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => addMembersMutation.mutate({ batchId: addModal, userIds: selectedTaskers })}
                  disabled={addMembersMutation.isPending || selectedTaskers.length === 0}
                  className="btn-primary flex-1 justify-center">
                  {addMembersMutation.isPending
                    ? <><Loader2 size={13} className="animate-spin" /> Adding…</>
                    : `Add ${selectedTaskers.length || ''} Tasker${selectedTaskers.length !== 1 ? 's' : ''}`}
                </button>
                <button onClick={() => setAddModal(null)} className="btn-secondary px-4">Cancel</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Delete Confirm ───────────────────────────────────────────────── */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop"
             style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}>
          <div className="w-full max-w-sm modal-card text-center"
               style={{ background: '#1e1115', border: '1px solid #3d1f25', borderRadius: '1rem', padding: '1.5rem' }}>
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-3"
                 style={{ background: 'rgba(239,68,68,0.12)' }}>
              <Trash2 size={20} className="text-red-400" />
            </div>
            <h3 className="text-base font-semibold text-white mb-1">Delete "{deleteConfirm.name}"?</h3>
            <p className="text-xs text-gray-500 mb-5">All {deleteConfirm._count?.members || 0} member assignments will be removed.</p>
            <div className="flex gap-2">
              <button onClick={() => deleteMutation.mutate(deleteConfirm.id)}
                disabled={deleteMutation.isPending}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-white font-semibold text-sm"
                style={{ background: '#dc2626' }}>
                {deleteMutation.isPending ? <Loader2 size={13} className="animate-spin" /> : 'Delete'}
              </button>
              <button onClick={() => setDeleteConfirm(null)} className="btn-secondary flex-1 justify-center">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
