import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus, X, Loader2, Pencil, FileText, Upload,
  CheckCircle2, Clock, ShieldCheck, Users, Trash2,
  ChevronDown, ExternalLink,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api.js';
import PageHeader from '../../components/PageHeader.jsx';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';
import { formatDuration } from '../../lib/utils.js';

const STATUS_COLORS = {
  ACTIVE:    { badge: 'bg-rose-500/20 text-rose-400',    dot: '#f43f5e' },
  PAUSED:    { badge: 'bg-gold-500/20 text-gold-400',    dot: '#f59e0b' },
  COMPLETED: { badge: 'bg-emerald-500/20 text-emerald-400', dot: '#10b981' },
  ARCHIVED:  { badge: 'bg-gray-500/20 text-gray-400',    dot: '#6b7280' },
};

export default function LeadProjects() {
  const qc = useQueryClient();

  const [showCreate, setShowCreate] = useState(false);
  const [editProject, setEditProject] = useState(null);
  const [sopModal, setSopModal]     = useState(null); // project
  const [sopText, setSopText]       = useState('');
  const [sopFile, setSopFile]       = useState(null);
  const [expanded, setExpanded]     = useState({});

  const [form, setForm] = useState({
    name: '', description: '', expectedAhtSecs: 300, qrId: '',
  });

  const { data: projectsData, isLoading } = useQuery({
    queryKey: ['lead-projects'],
    queryFn: () => api.get('/projects').then((r) => r.data.projects),
  });

  const { data: usersData } = useQuery({
    queryKey: ['users-for-project'],
    queryFn: () => api.get('/users').then((r) => r.data.users),
  });

  const qrUsers = (usersData || []).filter((u) => u.role === 'QUALITY_REVIEWER' && u.isActive);
  const projects = projectsData || [];

  const createMutation = useMutation({
    mutationFn: (payload) => api.post('/projects', payload),
    onSuccess: () => {
      toast.success('Project created!');
      qc.invalidateQueries({ queryKey: ['lead-projects'] });
      setShowCreate(false);
      setForm({ name: '', description: '', expectedAhtSecs: 300, qrId: '' });
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to create'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.patch(`/projects/${id}`, data),
    onSuccess: () => {
      toast.success('Project updated!');
      qc.invalidateQueries({ queryKey: ['lead-projects'] });
      setEditProject(null);
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to update'),
  });

  // SOP is stored as project description for now (can be extended to file storage)
  const sopMutation = useMutation({
    mutationFn: ({ id, sop }) => api.patch(`/projects/${id}`, { description: sop }),
    onSuccess: () => {
      toast.success('SOP updated!');
      qc.invalidateQueries({ queryKey: ['lead-projects'] });
      setSopModal(null);
      setSopText('');
      setSopFile(null);
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to save SOP'),
  });

  function openSop(project) {
    setSopModal(project);
    setSopText(project.description || '');
    setSopFile(null);
  }

  function handleSopFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 500_000) return toast.error('File too large (max 500KB)');
    const reader = new FileReader();
    reader.onload = (ev) => setSopText(ev.target.result);
    reader.readAsText(file);
    setSopFile(file.name);
  }

  function toggleExpand(id) {
    setExpanded((p) => ({ ...p, [id]: !p[id] }));
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        title="Projects"
        subtitle={`${projects.length} project${projects.length !== 1 ? 's' : ''}`}
        actions={
          <button onClick={() => setShowCreate(true)} className="btn-primary">
            <Plus size={14} /> New Project
          </button>
        }
      />

      {isLoading ? (
        <LoadingSpinner className="py-12" />
      ) : projects.length === 0 ? (
        <div className="card text-center py-16 text-gray-500">
          No projects yet. Create your first project above.
        </div>
      ) : (
        <div className="space-y-3">
          {projects.map((p, pi) => {
            const sc      = STATUS_COLORS[p.status] || STATUS_COLORS.ACTIVE;
            const taskers = (p.members || []).filter((m) => m.user.role === 'TAKER');
            const isOpen  = expanded[p.id];
            const hasSop  = !!p.description;

            return (
              <div key={p.id} className="card animate-fade-up"
                   style={{ animationDelay: `${pi * 0.06}s` }}>

                {/* Project header */}
                <div className="flex items-start gap-4">
                  <button onClick={() => toggleExpand(p.id)} className="flex-1 text-left min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-semibold text-white text-sm">{p.name}</h3>
                      <span className={`badge text-xs ${sc.badge}`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current" style={{ background: sc.dot }} />
                        {p.status}
                      </span>
                      {hasSop && (
                        <span className="badge text-xs bg-blue-500/20 text-blue-400">
                          <FileText size={9} /> SOP
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-600">
                      {p.qr && (
                        <span className="flex items-center gap-1">
                          <ShieldCheck size={10} className="text-gold-400" />
                          {p.qr.name}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Users size={10} /> {taskers.length} taskers
                      </span>
                      <span className="flex items-center gap-1">
                        <CheckCircle2 size={10} /> {p._count?.tasks || 0} tasks
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={10} /> {formatDuration(p.expectedAhtSecs)} AHT
                      </span>
                    </div>
                  </button>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button onClick={() => openSop(p)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all"
                      style={{ background: 'rgba(59,130,246,0.1)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.2)' }}
                      title="Edit SOP">
                      <FileText size={12} /> SOP
                    </button>
                    <button onClick={() => { setEditProject({ ...p }); }}
                      className="p-1.5 rounded-lg transition-all"
                      style={{ background: '#261519', color: '#9ca3af' }} title="Edit project">
                      <Pencil size={13} />
                    </button>
                    <button onClick={() => toggleExpand(p.id)}
                      className="p-1.5 rounded-lg transition-all"
                      style={{ background: '#261519', color: '#9ca3af' }}>
                      <ChevronDown size={13} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* Expanded: SOP preview + tasker list */}
                {isOpen && (
                  <div className="mt-4 pt-4 space-y-4" style={{ borderTop: '1px solid #3d1f25' }}>

                    {/* SOP preview */}
                    {p.description && (
                      <div className="rounded-xl p-4"
                           style={{ background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.15)' }}>
                        <div className="flex items-center gap-2 mb-2">
                          <FileText size={12} className="text-blue-400" />
                          <p className="text-xs font-semibold text-blue-400">Standard Operating Procedure</p>
                        </div>
                        <p className="text-xs text-gray-400 leading-relaxed whitespace-pre-wrap line-clamp-6">
                          {p.description}
                        </p>
                        <button onClick={() => openSop(p)}
                          className="mt-2 text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors">
                          <ExternalLink size={10} /> Edit SOP
                        </button>
                      </div>
                    )}

                    {/* Tasker list */}
                    {taskers.length > 0 && (
                      <div>
                        <p className="text-[10px] text-gray-600 uppercase tracking-wider mb-2">Taskers</p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                          {taskers.map((m) => (
                            <div key={m.user.id}
                              className="flex items-center gap-2 p-2.5 rounded-xl"
                              style={{ background: '#261519', border: '1px solid #3d1f25' }}>
                              <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                                   style={{ background: 'rgba(225,29,72,0.12)', color: '#fb7185' }}>
                                {m.user.name.charAt(0).toUpperCase()}
                              </div>
                              <p className="text-[10px] text-white truncate">{m.user.name.split(' ')[0]}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Create Project Modal ─────────────────────────────────────────── */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop"
             style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}>
          <div className="w-full max-w-md modal-card"
               style={{ background: '#1e1115', border: '1px solid #3d1f25', borderRadius: '1.25rem', padding: '1.5rem' }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-white">New Project</h2>
              <button onClick={() => setShowCreate(false)} className="text-gray-500 hover:text-white"><X size={16} /></button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(form); }} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Project Name <span className="text-rose-500">*</span></label>
                <input className="input" placeholder="e.g. RLHF Batch Beta"
                  value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">SOP / Description</label>
                <textarea className="input min-h-[80px]" placeholder="Paste the Standard Operating Procedure here…"
                  value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Expected AHT (seconds)</label>
                <input type="number" className="input" min={30} value={form.expectedAhtSecs}
                  onChange={(e) => setForm({ ...form, expectedAhtSecs: Number(e.target.value) })} />
                <p className="text-[10px] text-gray-600 mt-1">Default 300s = 5 min</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Quality Reviewer</label>
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  <label className="flex items-center gap-2 p-2 rounded-lg cursor-pointer"
                         style={{ background: !form.qrId ? 'rgba(225,29,72,0.08)' : '#261519', border: '1px solid #3d1f25' }}>
                    <input type="radio" name="qr" value="" checked={!form.qrId}
                      onChange={() => setForm({ ...form, qrId: '' })} className="accent-rose-500" />
                    <span className="text-xs text-gray-500">None (assign later)</span>
                  </label>
                  {qrUsers.map((u) => (
                    <label key={u.id} className="flex items-center gap-2.5 p-2.5 rounded-xl cursor-pointer transition-all"
                           style={{ background: form.qrId === u.id ? 'rgba(245,158,11,0.08)' : '#261519',
                                    border: `1px solid ${form.qrId === u.id ? 'rgba(245,158,11,0.35)' : '#3d1f25'}` }}>
                      <input type="radio" name="qr" value={u.id} checked={form.qrId === u.id}
                        onChange={() => setForm({ ...form, qrId: u.id })} className="accent-rose-500" />
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold"
                           style={{ background: 'rgba(245,158,11,0.12)', color: '#fbbf24' }}>
                        {u.name.charAt(0)}
                      </div>
                      <span className="text-xs text-white">{u.name}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button type="submit" disabled={createMutation.isPending || !form.name}
                  className="btn-primary flex-1 justify-center">
                  {createMutation.isPending ? <><Loader2 size={13} className="animate-spin" /> Creating…</> : 'Create Project'}
                </button>
                <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary px-4">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Edit Project Modal ───────────────────────────────────────────── */}
      {editProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop"
             style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}>
          <div className="w-full max-w-md modal-card"
               style={{ background: '#1e1115', border: '1px solid #3d1f25', borderRadius: '1.25rem', padding: '1.5rem' }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-white">Edit Project</h2>
              <button onClick={() => setEditProject(null)} className="text-gray-500 hover:text-white"><X size={16} /></button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              updateMutation.mutate({ id: editProject.id, data: {
                name: editProject.name,
                expectedAhtSecs: editProject.expectedAhtSecs,
                status: editProject.status,
                qrId: editProject.qrId || undefined,
              }});
            }} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Project Name</label>
                <input className="input" value={editProject.name}
                  onChange={(e) => setEditProject({ ...editProject, name: e.target.value })} required />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Status</label>
                <select className="input" value={editProject.status}
                  onChange={(e) => setEditProject({ ...editProject, status: e.target.value })}>
                  {['ACTIVE','PAUSED','COMPLETED','ARCHIVED'].map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Expected AHT (seconds)</label>
                <input type="number" className="input" min={30} value={editProject.expectedAhtSecs}
                  onChange={(e) => setEditProject({ ...editProject, expectedAhtSecs: Number(e.target.value) })} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Quality Reviewer</label>
                <select className="input" value={editProject.qrId || ''}
                  onChange={(e) => setEditProject({ ...editProject, qrId: e.target.value || null })}>
                  <option value="">None</option>
                  {qrUsers.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
              <div className="flex gap-2 pt-1">
                <button type="submit" disabled={updateMutation.isPending} className="btn-primary flex-1 justify-center">
                  {updateMutation.isPending ? <><Loader2 size={13} className="animate-spin" /> Saving…</> : 'Save Changes'}
                </button>
                <button type="button" onClick={() => setEditProject(null)} className="btn-secondary px-4">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── SOP Modal ───────────────────────────────────────────────────── */}
      {sopModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop"
             style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}>
          <div className="w-full max-w-2xl modal-card flex flex-col"
               style={{ background: '#1e1115', border: '1px solid #3d1f25', borderRadius: '1.25rem',
                        maxHeight: '85vh' }}>
            <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: '1px solid #3d1f25' }}>
              <FileText size={16} className="text-blue-400" />
              <div className="flex-1">
                <h2 className="text-base font-semibold text-white">SOP — {sopModal.name}</h2>
                <p className="text-xs text-gray-600">Standard Operating Procedure for this project</p>
              </div>
              <button onClick={() => setSopModal(null)} className="text-gray-500 hover:text-white"><X size={16} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* File upload */}
              <div className="flex items-center gap-3 p-3 rounded-xl"
                   style={{ background: '#261519', border: '1px dashed #3d1f25' }}>
                <Upload size={14} className="text-gray-500" />
                <label className="flex-1 cursor-pointer">
                  <span className="text-xs text-gray-500">
                    {sopFile ? `📄 ${sopFile}` : 'Upload a .txt or .md file to auto-fill below'}
                  </span>
                  <input type="file" accept=".txt,.md" className="hidden" onChange={handleSopFile} />
                </label>
              </div>

              {/* Text editor */}
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">
                  SOP Content <span className="text-gray-600">(markdown supported)</span>
                </label>
                <textarea
                  className="input font-mono text-xs leading-relaxed"
                  style={{ minHeight: '280px', resize: 'vertical' }}
                  placeholder={`# Project SOP\n\n## Objective\n...\n\n## Steps\n1. ...\n2. ...\n\n## Quality Standards\n...`}
                  value={sopText}
                  onChange={(e) => setSopText(e.target.value)}
                />
                <p className="text-[10px] text-gray-600 mt-1">{sopText.length} characters</p>
              </div>
            </div>

            <div className="flex gap-2 px-5 py-4" style={{ borderTop: '1px solid #3d1f25' }}>
              <button
                onClick={() => sopMutation.mutate({ id: sopModal.id, sop: sopText })}
                disabled={sopMutation.isPending}
                className="btn-primary flex-1 justify-center">
                {sopMutation.isPending ? <><Loader2 size={13} className="animate-spin" /> Saving…</> : 'Save SOP'}
              </button>
              <button onClick={() => setSopModal(null)} className="btn-secondary px-4">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
