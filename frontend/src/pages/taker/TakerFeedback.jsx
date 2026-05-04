import { useQuery } from '@tanstack/react-query';
import { MessageSquareWarning, Tag } from 'lucide-react';
import api from '../../lib/api.js';
import PageHeader from '../../components/PageHeader.jsx';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';
import QCBadge from '../../components/QCBadge.jsx';

export default function TakerFeedback() {
  const { data, isLoading } = useQuery({
    queryKey: ['my-feedback'],
    queryFn: () => api.get('/tasks/feedback').then((r) => r.data.tasks),
  });

  const tasks = data || [];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Feedback"
        subtitle="Rejected tasks with reviewer comments"
      />

      {isLoading ? (
        <LoadingSpinner className="py-12" />
      ) : tasks.length === 0 ? (
        <div className="card text-center py-12">
          <MessageSquareWarning size={32} className="text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500">No rejected tasks. Keep up the great work!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {tasks.map((task) => (
            <div key={task.id} className="card border-l-4 border-l-red-500">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold text-white text-sm">{task.project?.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {new Date(task.updatedAt).toLocaleDateString('en-US', {
                      weekday: 'short', month: 'short', day: 'numeric',
                    })}
                  </p>
                </div>
                {task.qcScore !== null && task.qcScore !== undefined && (
                  <QCBadge score={task.qcScore} issueCount={task.qcIssues?.length || 0} />
                )}
              </div>

              {/* Reviewer comment */}
              {task.feedback && (
                <div className="bg-surface-600 rounded-lg p-3 mb-3">
                  <p className="text-xs font-medium text-gray-400 mb-1">Reviewer Comment</p>
                  <p className="text-sm text-white">{task.feedback.comment}</p>

                  {task.feedback.errorTags?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {task.feedback.errorTags.map((tag) => (
                        <span key={tag} className="badge bg-red-500/20 text-red-400">
                          <Tag size={10} />
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* QC Issues */}
              {task.qcIssues?.length > 0 && (
                <details className="text-xs">
                  <summary className="text-gray-500 cursor-pointer hover:text-gray-300 select-none">
                    {task.qcIssues.length} grammar/spelling issue{task.qcIssues.length !== 1 ? 's' : ''} detected
                  </summary>
                  <div className="mt-2 space-y-1.5 pl-3 border-l border-surface-500">
                    {task.qcIssues.slice(0, 5).map((issue, i) => (
                      <div key={i} className="text-gray-400">
                        <span className="text-red-400">{issue.shortMessage || issue.message}</span>
                        {issue.replacements?.length > 0 && (
                          <span className="text-gray-600"> → {issue.replacements.join(', ')}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </details>
              )}

              {/* Response preview */}
              {task.response && (
                <details className="mt-2 text-xs">
                  <summary className="text-gray-500 cursor-pointer hover:text-gray-300 select-none">
                    View submitted response
                  </summary>
                  <pre className="mt-2 p-3 bg-surface-600 rounded-lg text-gray-400 whitespace-pre-wrap font-mono text-xs overflow-auto max-h-40">
                    {task.response}
                  </pre>
                </details>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
