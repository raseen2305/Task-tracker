import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle2, XCircle, ChevronDown, ChevronUp,
  ShieldAlert, Loader2, Tag, Clock,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api.js';
import PageHeader from '../../components/PageHeader.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import QCBadge from '../../components/QCBadge.jsx';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';
import { formatDuration } from '../../lib/utils.js';

const ERROR_TAG_OPTIONS = ['grammar', 'spelling', 'factual', 'formatting', 'incomplete', 'off-topic'];

export default function QRReview() {
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState(null);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectForm, setRejectForm] = useState({ comment: '', errorTags: [] });

  // Fetch submitted tasks directly from the dedicated endpoint
  const { data: queueData, isLoading } = useQuery({
    queryKey: ['submitted-tasks'],
    queryFn: () => api.get('/tasks/submitted').then((r) => r.data.tasks),
    refetchInterval: 30_000, // auto-refresh every 30s
  });

  const submittedTasks = (queueData || []).map((t) => ({
    ...t,
    projectName: t.project?.name,
  }));

  const approveMutation = useMutation({
    mutationFn: (id) => api.patch(`/tasks/${id}/approve`),
    onSuccess: () => {
      toast.success('Task approved!');
      qc.invalidateQueries({ queryKey: ['submitted-tasks'] });
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to approve'),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, payload }) => api.patch(`/tasks/${id}/reject`, payload),
    onSuccess: () => {
      toast.success('Task rejected with feedback');
      qc.invalidateQueries({ queryKey: ['submitted-tasks'] });
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] });
      setRejectModal(null);
      setRejectForm({ comment: '', errorTags: [] });
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to reject'),
  });

  function toggleTag(tag) {
    setRejectForm((f) => ({
      ...f,
      errorTags: f.errorTags.includes(tag)
        ? f.errorTags.filter((t) => t !== tag)
        : [...f.errorTags, tag],
    }));
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        title="Review Queue"
        subtitle={`${submittedTasks.length} task${submittedTasks.length !== 1 ? 's' : ''} awaiting review`}
      />

      {isLoading ? (
        <LoadingSpinner className="py-12" />
      ) : submittedTasks.length === 0 ? (
        <div className="card text-center py-12">
          <CheckCircle2 size={32} className="text-emerald-400 mx-auto mb-3" />
          <p className="text-gray-400 font-medium">All caught up!</p>
          <p className="text-sm text-gray-500 mt-1">No tasks pending review.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {submittedTasks.map((task, i) => {
            const isExpanded = expanded === task.id;
            const hasQcIssues = task.qcScore !== null && task.qcScore < 70;

            return (
              <div
                key={task.id}
                className={`card border animate-fade-up ${hasQcIssues ? 'border-gold-500/30' : 'border-surface-500'}`}
                style={{ animationDelay: `${i * 0.07}s`, transition: 'box-shadow 0.2s, border-color 0.2s' }}
                onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 4px 24px rgba(225,29,72,0.1)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.boxShadow = ''; }}
              >
                {/* Header row */}
                <div className="flex items-center gap-3">
                  {hasQcIssues && (
                    <ShieldAlert size={16} className="text-yellow-400 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-white">{task.projectName}</span>
                      <StatusBadge status={task.status} />
                      {task.qcScore !== null && task.qcScore !== undefined && (
                        <QCBadge score={task.qcScore} issueCount={task.qcIssues?.length || 0} />
                      )}
                      {task.isOverdue && (
                        <span className="badge bg-orange-500/20 text-orange-400">
                          <Clock size={10} /> Overdue
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Tasker: {task.taker?.name} ·
                      AHT: {task.ahtSeconds ? formatDuration(task.ahtSeconds) : '—'} ·
                      {new Date(task.submittedAt || task.updatedAt).toLocaleString()}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => approveMutation.mutate(task.id)}
                      disabled={approveMutation.isPending}
                      className="btn-primary py-1.5 px-3 text-xs"
                      aria-label="Approve task"
                    >
                      <CheckCircle2 size={13} />
                      Approve
                    </button>
                    <button
                      onClick={() => setRejectModal(task.id)}
                      className="btn-danger py-1.5 px-3 text-xs"
                      aria-label="Reject task"
                    >
                      <XCircle size={13} />
                      Reject
                    </button>
                    <button
                      onClick={() => setExpanded(isExpanded ? null : task.id)}
                      className="btn-secondary py-1.5 px-2"
                      aria-label={isExpanded ? 'Collapse' : 'Expand'}
                    >
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  </div>
                </div>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="mt-4 space-y-3 border-t border-surface-500 pt-4">
                    {/* Response */}
                    <div>
                      <p className="text-xs font-medium text-gray-400 mb-1.5">Submitted Response</p>
                      <pre className="bg-surface-600 rounded-lg p-3 text-xs text-gray-300 whitespace-pre-wrap font-mono overflow-auto max-h-48">
                        {task.response || 'No response text'}
                      </pre>
                    </div>

                    {/* QC Issues */}
                    {task.qcIssues?.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-gray-400 mb-1.5">
                          QC Issues ({task.qcIssues.length})
                        </p>
                        <div className="space-y-1.5">
                          {task.qcIssues.slice(0, 8).map((issue, i) => (
                            <div key={i} className="flex items-start gap-2 text-xs p-2 bg-surface-600 rounded">
                              <span className="text-gold-400 font-medium flex-shrink-0">{issue.category || 'Issue'}</span>
                              <span className="text-gray-400">{issue.message}</span>
                              {issue.replacements?.length > 0 && (
                                <span className="text-emerald-400 ml-auto flex-shrink-0">
                                  → {issue.replacements.join(', ')}
                                </span>
                              )}
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

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 modal-backdrop">
          <div className="card w-full max-w-md modal-card">
            <h2 className="text-lg font-semibold text-white mb-4">Reject Task</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">
                  Feedback Comment <span className="text-red-400">*</span>
                </label>
                <textarea
                  className="input min-h-[100px]"
                  placeholder="Explain what needs to be corrected…"
                  value={rejectForm.comment}
                  onChange={(e) => setRejectForm({ ...rejectForm, comment: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-2">Error Tags</label>
                <div className="flex flex-wrap gap-2">
                  {ERROR_TAG_OPTIONS.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`badge cursor-pointer transition-all ${
                        rejectForm.errorTags.includes(tag)
                          ? 'bg-red-500/30 text-red-300 border border-red-500/50'
                          : 'bg-surface-600 text-gray-400 border border-surface-500 hover:text-white'
                      }`}
                    >
                      <Tag size={10} />
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => rejectMutation.mutate({ id: rejectModal, payload: rejectForm })}
                  disabled={rejectMutation.isPending || !rejectForm.comment.trim()}
                  className="btn-danger flex-1 justify-center"
                >
                  {rejectMutation.isPending ? <><Loader2 size={14} className="animate-spin" /> Rejecting…</> : 'Confirm Reject'}
                </button>
                <button onClick={() => setRejectModal(null)} className="btn-secondary">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


