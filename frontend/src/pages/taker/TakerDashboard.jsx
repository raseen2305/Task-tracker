import { useState, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Play, Send, LogIn, LogOut, CheckSquare, Clock, TrendingUp,
  AlertTriangle, Loader2, Search, FolderOpen, SquareCheckBig,
  ChevronDown, Plus, SpellCheck, CheckCheck, X, ChevronRight,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api.js';
import { useAuthStore } from '../../store/authStore.js';
import StatusBadge from '../../components/StatusBadge.jsx';
import QCBadge from '../../components/QCBadge.jsx';
import OnboardingModal from '../../components/OnboardingModal.jsx';
import { formatStopwatch, formatDuration } from '../../lib/utils.js';

// ── Punch clock hook ──────────────────────────────────────────────────────────
function usePunchClock() {
  const [punchedIn, setPunchedIn] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('ethara_punch')); } catch { return null; }
  });
  const punchIn  = () => { const e = { time: new Date().toISOString() }; sessionStorage.setItem('ethara_punch', JSON.stringify(e)); setPunchedIn(e); };
  const punchOut = () => { sessionStorage.removeItem('ethara_punch'); setPunchedIn(null); };
  return { punchedIn, punchIn, punchOut };
}

// ── Inline grammar suggestion component ──────────────────────────────────────
function GrammarSuggestions({ issues, text, onAccept, onDismiss, onAcceptAll }) {
  if (!issues || issues.length === 0) return null;
  return (
    <div className="rounded-xl border border-gold-500/30 bg-surface-800 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-surface-500">
        <span className="text-xs font-semibold text-gold-400 flex items-center gap-1.5">
          <SpellCheck size={13} />
          {issues.length} suggestion{issues.length !== 1 ? 's' : ''} found
        </span>
        <button
          onClick={onAcceptAll}
          className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors"
        >
          <CheckCheck size={12} /> Accept all
        </button>
      </div>
      <div className="divide-y divide-surface-500 max-h-56 overflow-y-auto">
        {issues.map((issue, i) => {
          const original = text.slice(issue.offset, issue.offset + issue.length);
          return (
            <div key={i} className="px-4 py-3 flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-400 mb-1">{issue.message}</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 text-xs font-mono line-through">
                    {original}
                  </span>
                  {issue.replacements.length > 0 && (
                    <>
                      <ChevronRight size={11} className="text-gray-600" />
                      <div className="flex gap-1 flex-wrap">
                        {issue.replacements.slice(0, 3).map((r, ri) => (
                          <button
                            key={ri}
                            onClick={() => onAccept(issue, r)}
                            className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300
                                       text-xs font-mono hover:bg-emerald-500/40 transition-colors"
                          >
                            {r}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
                {issue.category && (
                  <span className="text-[10px] text-gray-600 mt-1 block">{issue.category}</span>
                )}
              </div>
              <button
                onClick={() => onDismiss(i)}
                className="text-gray-600 hover:text-gray-400 flex-shrink-0 mt-0.5 transition-colors"
                aria-label="Dismiss suggestion"
              >
                <X size={13} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main dashboard ────────────────────────────────────────────────────────────
export default function TakerDashboard() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const { punchedIn, punchIn, punchOut } = usePunchClock();

  const [activeTask, setActiveTask]           = useState(null);
  const [elapsed, setElapsed]                 = useState(0);
  const [sessionElapsed, setSessionElapsed]   = useState(0);
  const [taskId, setTaskId]                   = useState('');
  const [prompt, setPrompt]                   = useState('');
  const [response, setResponse]               = useState('');
  const [selectedProject, setSelectedProject] = useState('');
  const [submitting, setSubmitting]           = useState(false);
  const [projectSearch, setProjectSearch]     = useState('');
  const [selectedProjects, setSelectedProjects] = useState([]);

  // Grammar check state
  const [grammarIssues, setGrammarIssues]     = useState([]);
  const [grammarScore, setGrammarScore]       = useState(null);
  const [checkingGrammar, setCheckingGrammar] = useState(false);
  const [grammarChecked, setGrammarChecked]   = useState(false);

  const timerRef = useRef(null);

  const { data: projectsData } = useQuery({
    queryKey: ['my-projects'],
    queryFn: () => api.get('/projects').then((r) => r.data.projects),
  });
  const { data: historyData } = useQuery({
    queryKey: ['task-history'],
    queryFn: () => api.get('/tasks/history/5-days').then((r) => r.data.tasks),
  });

  // Check if tasker has been onboarded (has project memberships)
  const { data: onboardingData, refetch: refetchOnboarding } = useQuery({
    queryKey: ['onboarding-status'],
    queryFn: () => api.get('/tasks/onboarding-status').then((r) => r.data),
  });
  const needsOnboarding = onboardingData?.onboarded === false;

  // Task timer
  useEffect(() => {
    if (activeTask) {
      const base = activeTask.startedAt
        ? Math.floor((Date.now() - new Date(activeTask.startedAt)) / 1000) : 0;
      setElapsed(base);
      timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    } else {
      clearInterval(timerRef.current);
      setElapsed(0);
    }
    return () => clearInterval(timerRef.current);
  }, [activeTask]);

  // Session timer
  useEffect(() => {
    if (!punchedIn) { setSessionElapsed(0); return; }
    const tick = () => setSessionElapsed(Math.floor((Date.now() - new Date(punchedIn.time)) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [punchedIn]);

  // Reset grammar state when response changes
  useEffect(() => {
    setGrammarChecked(false);
    setGrammarIssues([]);
    setGrammarScore(null);
  }, [response]);

  async function handleStartTask() {
    if (!punchedIn) return toast.error('You must punch in before starting tasks');
    if (!selectedProject) return toast.error('Select a project first');
    try {
      const { data } = await api.post('/tasks/start', { projectId: selectedProject });
      setActiveTask(data.task);
      data.resumed
        ? toast('Resumed your in-progress task', { icon: '⏱️' })
        : toast.success('Task started!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to start task');
    }
  }

  async function handleCheckGrammar() {
    if (!response.trim()) return toast.error('Write your response first');
    setCheckingGrammar(true);
    try {
      const { data } = await api.post('/tasks/check-grammar', { text: response });
      setGrammarIssues(data.issues || []);
      setGrammarScore(data.score);
      setGrammarChecked(true);
      if (data.skipped) {
        toast('Grammar service unavailable — you can still submit', { icon: 'ℹ️' });
      } else if (data.issues.length === 0) {
        toast.success('No grammar issues found!');
      } else {
        toast(`${data.issues.length} suggestion${data.issues.length !== 1 ? 's' : ''} found`, { icon: '📝' });
      }
    } catch (err) {
      toast.error('Grammar check failed');
    } finally {
      setCheckingGrammar(false);
    }
  }

  // Accept a single suggestion — replace the text at the issue's offset
  function handleAcceptSuggestion(issue, replacement) {
    const before = response.slice(0, issue.offset);
    const after  = response.slice(issue.offset + issue.length);
    const newText = before + replacement + after;
    setResponse(newText);
    // Remove this issue and shift offsets of subsequent issues
    const delta = replacement.length - issue.length;
    setGrammarIssues((prev) =>
      prev
        .filter((iss) => iss.offset !== issue.offset)
        .map((iss) => iss.offset > issue.offset ? { ...iss, offset: iss.offset + delta } : iss)
    );
    toast.success(`Replaced with "${replacement}"`);
  }

  // Accept all — apply replacements from last to first to preserve offsets
  function handleAcceptAll() {
    const sorted = [...grammarIssues]
      .filter((iss) => iss.replacements.length > 0)
      .sort((a, b) => b.offset - a.offset);
    let text = response;
    for (const iss of sorted) {
      text = text.slice(0, iss.offset) + iss.replacements[0] + text.slice(iss.offset + iss.length);
    }
    setResponse(text);
    setGrammarIssues([]);
    toast.success('All suggestions applied');
  }

  function handleDismissSuggestion(index) {
    setGrammarIssues((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit() {
    if (!response.trim()) return toast.error('Response cannot be empty');
    setSubmitting(true);
    try {
      const { data } = await api.post('/tasks/submit', {
        taskId: activeTask.id,
        response,
        prompt: prompt || undefined,
      });
      setActiveTask(null);
      setResponse('');
      setPrompt('');
      setGrammarIssues([]);
      setGrammarScore(null);
      setGrammarChecked(false);
      qc.invalidateQueries({ queryKey: ['task-history'] });
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] });
      data.qc.passed
        ? toast.success(`Submitted! QC: ${data.qc.score}%`)
        : toast(`Submitted with QC warnings (${data.qc.score}%)`, { icon: '⚠️' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  }

  const projects       = projectsData || [];
  const todayTasks     = (historyData || []).filter(
    (t) => new Date(t.createdAt).toDateString() === new Date().toDateString()
  );
  const totalTimeToday = todayTasks.reduce((a, t) => a + (t.ahtSeconds || 0), 0);
  const avgAht         = todayTasks.length ? Math.round(totalTimeToday / todayTasks.length) : 0;
  const completedToday = todayTasks.filter((t) => ['APPROVED', 'SUBMITTED'].includes(t.status)).length;
  const isOverdue      = elapsed > 300;
  const activeProject  = projects.find((p) => p.id === selectedProject) || projects[0];
  const filteredProjects = projects.filter((p) =>
    p.name.toLowerCase().includes(projectSearch.toLowerCase())
  );

  function toggleProjectSelect(id) {
    setSelectedProjects((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  return (
    <div className="space-y-5 pb-8 animate-fade-in">

      {/* ── First-time onboarding modal ───────────────────────────────────── */}
      {needsOnboarding && (
        <OnboardingModal
          onComplete={() => {
            refetchOnboarding();
            qc.invalidateQueries({ queryKey: ['my-projects'] });
          }}
        />
      )}

      {/* ── Punch-in warning ──────────────────────────────────────────────── */}
      {!punchedIn && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl border text-sm"
          style={{ background: 'rgba(245,158,11,0.06)', borderColor: 'rgba(245,158,11,0.25)', color: '#fbbf24' }}>
          <AlertTriangle size={15} className="flex-shrink-0" />
          You haven't punched in yet. You must punch in before starting tasks.
        </div>
      )}

      {/* ── Hero: clock + punch ───────────────────────────────────────────── */}
      <div className="bg-surface-700 rounded-2xl border border-surface-500 p-6 shadow-xl shadow-black/30 animate-fade-up stagger-1">
        <div className="flex flex-col lg:flex-row lg:items-center gap-6">
          <div className="flex-1">
            <p className="text-[10px] text-gray-600 uppercase tracking-[0.15em] mb-1.5">
              {activeTask ? 'Task Running' : punchedIn ? 'Session Active' : 'Ready to Start'}
            </p>
            <div className={`text-5xl font-mono font-bold tabular-nums tracking-tight leading-none transition-all duration-500 ${
              isOverdue ? 'text-orange-400' : activeTask ? 'text-rose-400' : punchedIn ? 'text-gold-400' : 'text-surface-500'
            } ${activeTask ? 'animate-glow-rose' : punchedIn ? 'animate-glow-gold' : ''}`}>
              {activeTask ? formatStopwatch(elapsed) : punchedIn ? formatStopwatch(sessionElapsed) : '00 : 00 : 00'}
            </div>
          </div>

          <div className="flex gap-3">
            {[
              { label: 'Punch In',  icon: <LogIn size={10} />,  value: punchedIn ? new Date(punchedIn.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '–', sub: punchedIn ? new Date(punchedIn.time).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }) : 'N/A' },
              { label: 'Punch Out', icon: <LogOut size={10} />, value: '–', sub: new Date().toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }) },
            ].map(({ label, icon, value, sub }) => (
              <div key={label} className="bg-surface-600 rounded-xl px-4 py-3 min-w-[130px] border border-surface-500">
                <div className="flex items-center gap-1.5 text-[10px] text-gray-600 uppercase tracking-wider mb-1.5">{icon} {label}</div>
                <p className="text-sm font-semibold text-white">{value}</p>
                <p className="text-xs text-gray-600 mt-0.5">{sub}</p>
              </div>
            ))}
          </div>

          {!punchedIn ? (
            <button onClick={punchIn}
              className="flex items-center gap-2 px-7 py-3 rounded-xl bg-rose-600 text-white font-semibold text-sm transition-all shadow-lg shadow-rose-900/40"
              style={{ '--tw-shadow-color': 'rgba(159,18,57,0.4)' }}>
              <Play size={15} fill="currentColor" /> Punch In
            </button>
          ) : (
            <button onClick={() => { if (activeTask) return toast.error('Finish your active task first'); punchOut(); toast('Punched out. Good work!', { icon: '👋' }); }}
              className="flex items-center gap-2 px-7 py-3 rounded-xl border border-rose-500/30 text-rose-400 font-semibold text-sm transition-all"
              style={{ background: '#261519' }}>
              <LogOut size={15} /> Punch Out
            </button>
          )}
        </div>

        {activeProject && (
          <div className="flex gap-8 mt-5 pt-4 border-t border-surface-500 text-xs">
            <div><p className="text-[10px] text-gray-600 uppercase tracking-wider mb-0.5">Project Lead</p><p className="text-white font-medium">{activeProject.lead?.name || '—'}</p></div>
            <div><p className="text-[10px] text-gray-600 uppercase tracking-wider mb-0.5">Quality Reviewer</p><p className="text-white font-medium">{activeProject.qr?.name || '—'}</p></div>
          </div>
        )}
      </div>

      {/* ── Stat cards ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Tasks Completed', value: completedToday, accent: 'bg-rose-500',  glow: 'rgba(225,29,72,0.18)',  icon: <CheckSquare size={17} className="text-gray-600" />, delay: '0.1s' },
          { label: 'Total Time',      value: totalTimeToday > 0 ? `${Math.floor(totalTimeToday / 60)}m` : '0m', accent: 'bg-gold-500', glow: 'rgba(245,158,11,0.18)', icon: <Clock size={17} className="text-gray-600" />, delay: '0.17s' },
          { label: 'Avg Task Time',   value: avgAht > 0 ? `${Math.floor(avgAht / 60)}m` : '0m', sub: 'AHT', accent: 'bg-rose-700', glow: 'rgba(159,18,57,0.2)', icon: <TrendingUp size={17} className="text-gray-600" />, delay: '0.24s' },
        ].map(({ label, value, sub, accent, glow, icon, delay }) => (
          <div key={label}
            className="bg-surface-700 rounded-xl border border-surface-500 overflow-hidden
                       animate-fade-up cursor-default group"
            style={{
              animationDelay: delay,
              transition: 'transform 0.25s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.25s, border-color 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)';
              e.currentTarget.style.boxShadow = `0 8px 28px ${glow}`;
              e.currentTarget.style.borderColor = '#5a2d35';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = '';
              e.currentTarget.style.boxShadow = '';
              e.currentTarget.style.borderColor = '';
            }}
          >
            <div className={`h-0.5 w-full ${accent} transition-all duration-300 group-hover:h-[2px]`} />
            <div className="p-4 flex items-start justify-between">
              <div>
                <p className="text-[10px] text-gray-600 uppercase tracking-wider mb-2">{label}</p>
                <p className="text-3xl font-bold text-white tabular-nums">{value}</p>
                {sub && <p className="text-xs text-gray-600 mt-1">{sub}</p>}
              </div>
              <div className="transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
                {icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Start New Task + Today's Task Log ─────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* ── Start New Task panel ─────────────────────────────────────────── */}
        <div className="bg-surface-700 rounded-2xl border border-surface-500 p-5 animate-fade-up"
             style={{ animationDelay: '0.28s' }}>
          <h2 className="flex items-center gap-2 text-sm font-semibold text-white mb-4">
            <Play size={13} className="text-rose-400" />
            {activeTask ? 'Task In Progress' : 'Start New Task'}
          </h2>

          {!punchedIn && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg border text-xs mb-4"
              style={{ background: 'rgba(244,63,94,0.08)', borderColor: 'rgba(244,63,94,0.25)', color: '#fb7185' }}>
              <AlertTriangle size={12} /> You must punch in before starting tasks
            </div>
          )}

          {!activeTask ? (
            /* ── Pre-start form ─────────────────────────────────────────── */
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">
                  Task ID <span className="text-rose-500">*</span>
                </label>
                <input className="input" placeholder="Enter Task ID" value={taskId}
                  onChange={(e) => setTaskId(e.target.value)} />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-gray-500">Project</label>
                  <button className="text-xs flex items-center gap-1 transition-colors" style={{ color: '#fbbf24' }}>
                    <Plus size={11} /> Request Project
                  </button>
                </div>
                <div className="relative">
                  <select className="input appearance-none pr-8" value={selectedProject}
                    onChange={(e) => setSelectedProject(e.target.value)}>
                    <option value="">Select project…</option>
                    {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                  <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none" />
                </div>
              </div>
              <button onClick={handleStartTask} disabled={!punchedIn || !selectedProject}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-rose-600 text-white font-semibold text-sm transition-all disabled:opacity-30 disabled:cursor-not-allowed">
                <Play size={13} fill="currentColor" /> Start Task
              </button>
            </div>
          ) : (
            /* ── Active task form ───────────────────────────────────────── */
            <div className="space-y-3">

              {/* Timer bar */}
              <div className="flex items-center justify-between p-3 rounded-xl border border-surface-500"
                   style={{
                     background: '#261519',
                     boxShadow: isOverdue
                       ? '0 0 16px rgba(249,115,22,0.25)'
                       : '0 0 16px rgba(225,29,72,0.2)',
                     borderColor: isOverdue ? 'rgba(249,115,22,0.4)' : 'rgba(225,29,72,0.3)',
                     transition: 'box-shadow 0.5s, border-color 0.5s',
                   }}>
                <span className={`text-2xl font-mono font-bold tabular-nums ${isOverdue ? 'text-orange-400' : 'text-rose-400'}`}>
                  {formatStopwatch(elapsed)}
                </span>
                {isOverdue && (
                  <span className="badge text-xs animate-bounce-subtle" style={{ background: 'rgba(249,115,22,0.15)', color: '#fb923c' }}>
                    <AlertTriangle size={10} /> Overdue
                  </span>
                )}
              </div>

              {/* Multimango Prompt */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">
                  Multimango Prompt
                  <span className="text-gray-600 font-normal ml-1">(paste the task prompt here)</span>
                </label>
                <textarea
                  className="input min-h-[80px] resize-y text-xs leading-relaxed"
                  placeholder="Paste the prompt from Multimango here…"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                />
              </div>

              {/* Response */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">
                  Your Response <span className="text-rose-500">*</span>
                </label>
                <textarea
                  className="input min-h-[130px] resize-y font-mono text-xs leading-relaxed"
                  placeholder="Write or paste your annotated response here…"
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                />
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[10px] text-gray-600">{response.length} characters</span>
                  {grammarChecked && grammarScore !== null && (
                    <span className={`text-[10px] font-medium ${grammarScore >= 70 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      QC Score: {grammarScore}%
                    </span>
                  )}
                </div>
              </div>

              {/* Grammar suggestions panel */}
              {grammarChecked && (
                <GrammarSuggestions
                  issues={grammarIssues}
                  text={response}
                  onAccept={handleAcceptSuggestion}
                  onDismiss={handleDismissSuggestion}
                  onAcceptAll={handleAcceptAll}
                />
              )}

              {/* Action buttons */}
              <div className="flex gap-2 pt-1">
                {/* Grammar check button */}
                <button
                  onClick={handleCheckGrammar}
                  disabled={checkingGrammar || !response.trim()}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ borderColor: 'rgba(245,158,11,0.35)', color: '#fbbf24', background: 'rgba(245,158,11,0.08)' }}
                >
                  {checkingGrammar
                    ? <><Loader2 size={12} className="animate-spin" /> Checking…</>
                    : <><SpellCheck size={12} /> Check Grammar</>}
                </button>

                {/* Submit */}
                <button
                  onClick={handleSubmit}
                  disabled={submitting || !response.trim()}
                  className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-rose-600 text-white font-semibold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {submitting
                    ? <><Loader2 size={13} className="animate-spin" /> Submitting…</>
                    : <><Send size={13} /> Submit Task</>}
                </button>

                {/* Cancel */}
                <button
                  onClick={() => { setActiveTask(null); setResponse(''); setPrompt(''); setGrammarIssues([]); setGrammarChecked(false); }}
                  className="btn-secondary px-3 text-xs"
                >
                  <X size={13} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Today's Task Log ─────────────────────────────────────────────── */}
        <div className="bg-surface-700 rounded-2xl border border-surface-500 p-5 animate-fade-up"
             style={{ animationDelay: '0.34s' }}>
          <h2 className="text-sm font-semibold text-white mb-4">Today's Task Log</h2>
          {todayTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <SquareCheckBig size={30} className="text-surface-500 mb-3" />
              <p className="text-sm font-medium text-gray-500">No tasks logged yet</p>
              <p className="text-xs text-gray-600 mt-1">Start a task to begin tracking</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {todayTasks.map((task, i) => (
                <div key={task.id}
                  className="flex items-center gap-3 p-3 rounded-xl border border-surface-500 text-xs animate-fade-up"
                  style={{ background: '#261519', animationDelay: `${i * 0.06}s`,
                           transition: 'transform 0.2s, box-shadow 0.2s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateX(3px)'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(225,29,72,0.1)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
                >
                  <StatusBadge status={task.status} />
                  <span className="text-gray-300 flex-1 truncate font-medium">{task.project?.name}</span>
                  {task.ahtSeconds && (
                    <span className="text-gray-600 flex items-center gap-1"><Clock size={10} /> {formatDuration(task.ahtSeconds)}</span>
                  )}
                  {task.qcScore !== null && task.qcScore !== undefined && (
                    <QCBadge score={task.qcScore} issueCount={task.qcIssues?.length || 0} />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── My Projects grid ──────────────────────────────────────────────── */}
      <div className="bg-surface-700 rounded-2xl border border-surface-500 p-5 animate-fade-up"
           style={{ animationDelay: '0.4s' }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
            <FolderOpen size={14} className="text-gold-400" />
            My Projects
          </h2>
          <span className="text-xs text-gray-600">{selectedProjects.length} selected</span>
        </div>
        <div className="relative mb-3">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
          <input className="input pl-9 text-sm" placeholder="Search projects..." value={projectSearch}
            onChange={(e) => setProjectSearch(e.target.value)} />
        </div>
        {filteredProjects.length === 0 ? (
          <p className="text-sm text-gray-600 text-center py-6">No projects found.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {filteredProjects.map((p, i) => {
              const isSelected = selectedProjects.includes(p.id);
              return (
                <label key={p.id}
                  className="flex items-start gap-3 p-3 rounded-xl border cursor-pointer animate-fade-up"
                  style={{
                    background: isSelected ? 'rgba(244,63,94,0.08)' : '#261519',
                    borderColor: isSelected ? 'rgba(244,63,94,0.35)' : '#3d1f25',
                    animationDelay: `${i * 0.05}s`,
                    transition: 'transform 0.2s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.2s, background 0.2s, border-color 0.2s',
                  }}
                  onMouseEnter={(e) => { if (!isSelected) { e.currentTarget.style.borderColor = '#5a2d35'; e.currentTarget.style.transform = 'scale(1.02)'; } }}
                  onMouseLeave={(e) => { if (!isSelected) { e.currentTarget.style.borderColor = '#3d1f25'; e.currentTarget.style.transform = ''; } }}
                >
                  <input type="checkbox" checked={isSelected} onChange={() => toggleProjectSelect(p.id)}
                    className="mt-0.5 flex-shrink-0 accent-rose-500" />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-white truncate">{p.name}</p>
                    <p className="text-xs text-gray-600 mt-0.5">{p.description || 'Non Stem'}</p>
                  </div>
                </label>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
