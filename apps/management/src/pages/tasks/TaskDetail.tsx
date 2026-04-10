import { useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, FolderOpen, User, Clock, Send, CheckCircle2, XCircle, ShieldCheck, Star, Trash2 } from 'lucide-react';
import { useHeaderConfig } from '@/hooks/useHeaderConfig';
import { useAddTaskComment, useTask, useSubmitTask, useApproveTask, useRejectTask, useVerifyTask, useRateTask, useDeleteTask } from '@/api/tasks';
import { PageTransition } from '@/components/ui/PageTransition';
import { Card, CardContent } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Avatar } from '@/components/ui/Avatar';
import { Tabs } from '@/components/ui/Tabs';
import { Skeleton } from '@/components/ui/Skeleton';
import { Badge } from '@/components/ui/Badge';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { usePermission } from '@/hooks/usePermission';
import { toast } from 'sonner';
import type { Task } from '@/types/models';

type TaskComment = { id: string; authorName: string; content: string; createdAt: string };

export default function TaskDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: task, isLoading } = useTask(id!);
  const perm = usePermission();
  const addComment = useAddTaskComment();
  const submitTask = useSubmitTask();
  const approveTask = useApproveTask();
  const rejectTask = useRejectTask();
  const verifyTask = useVerifyTask();
  const rateTask = useRateTask();
  const deleteTask = useDeleteTask();

  const [tab, setTab] = useState('details');
  const [comment, setComment] = useState('');
  const [actionNote, setActionNote] = useState('');
  const [actionType, setActionType] = useState<'submit' | 'approve' | 'reject' | null>(null);
  const [rateOpen, setRateOpen] = useState(false);
  const [rating, setRating] = useState(3);
  const [rateNote, setRateNote] = useState('');
  const [verifyConfirm, setVerifyConfirm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const isManager = perm.isCEO || perm.isOps || perm.isManager;
  const taskId = id!;

  const handleAction = useCallback(async () => {
    if (!actionType) return;
    try {
      if (actionType === 'submit') {
        await submitTask.mutateAsync({ id: taskId, note: actionNote || undefined });
        toast.success('Task submitted for review');
      } else if (actionType === 'approve') {
        await approveTask.mutateAsync({ id: taskId, note: actionNote || undefined });
        toast.success('Task approved');
      } else if (actionType === 'reject') {
        await rejectTask.mutateAsync({ id: taskId, note: actionNote || undefined });
        toast.success('Task rejected');
      }
      setActionType(null);
      setActionNote('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Action failed');
    }
  }, [actionType, taskId, actionNote, submitTask, approveTask, rejectTask]);

  const handleVerify = useCallback(async () => {
    try {
      await verifyTask.mutateAsync(taskId);
      toast.success('Task verified');
      setVerifyConfirm(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed');
    }
  }, [taskId, verifyTask]);

  const handleRate = useCallback(async () => {
    try {
      await rateTask.mutateAsync({ id: taskId, rating, note: rateNote || undefined });
      toast.success('Task rated');
      setRateOpen(false);
      setRateNote('');
      setRating(3);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed');
    }
  }, [taskId, rating, rateNote, rateTask]);

  const handleDelete = useCallback(async () => {
    try {
      await deleteTask.mutateAsync(taskId);
      toast.success('Task deleted');
      navigate('/tasks');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete');
    }
  }, [taskId, deleteTask, navigate]);

  const headerActions = useMemo(() => {
    if (!task) return [];
    const acts = [];
    if (task.status === 'IN_PROGRESS' && task.approvalStatus === 'WAITING') {
      acts.push({ type: 'button' as const, label: 'Submit', icon: Send, variant: 'outline' as const, onClick: () => setActionType('submit') });
    }
    if (isManager && task.approvalStatus === 'SUBMITTED') {
      acts.push({ type: 'button' as const, label: 'Approve', icon: CheckCircle2, variant: 'outline' as const, onClick: () => setActionType('approve') });
      acts.push({ type: 'button' as const, label: 'Reject', icon: XCircle, variant: 'danger' as const, onClick: () => setActionType('reject') });
    }
    if (isManager && task.approvalStatus === 'APPROVED_MGR') {
      acts.push({ type: 'button' as const, label: 'Verify', icon: ShieldCheck, onClick: () => setVerifyConfirm(true) });
    }
    if (perm.isCEO && task.approvalStatus === 'VERIFIED') {
      acts.push({ type: 'button' as const, label: 'Rate', icon: Star, variant: 'outline' as const, onClick: () => setRateOpen(true) });
    }
    return acts;
  }, [task, isManager, perm.isCEO]);

  useHeaderConfig(useMemo(() => ({
    title: task?.title ?? 'Task',
    breadcrumbs: [
      { label: 'Tasks', href: '/tasks' },
      { label: task?.title ?? '...' },
    ],
    actions: headerActions,
  }), [task?.title, headerActions]));

  if (isLoading) {
    return (
      <PageTransition>
        <div className="space-y-6">
          <Card>
            <div className="space-y-4">
              <Skeleton className="h-5 w-48" />
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-5 w-24" />
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </PageTransition>
    );
  }

  if (!task) {
    return (
      <PageTransition>
        <div className="flex items-center justify-center py-20 text-gray-500 dark:text-gray-400">
          Task not found
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Task info card */}
        <Card>
          <div className="flex flex-wrap items-start gap-4">
            <div className="flex items-center gap-3">
              <StatusBadge status={task.status} />
              <StatusBadge status={task.priority} />
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-50 p-2 dark:bg-blue-900/30">
                <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Assignee</p>
                <div className="mt-0.5 flex items-center gap-1.5">
                  <Avatar name={task.assigneeName} src={task.assigneeAvatar} size="xs" />
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{task.assigneeName}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-purple-50 p-2 dark:bg-purple-900/30">
                <FolderOpen className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Project</p>
                <p className="mt-0.5 text-sm font-medium text-gray-900 dark:text-gray-100">{task.projectName || '-'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-amber-50 p-2 dark:bg-amber-900/30">
                <Calendar className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Due Date</p>
                <p className="mt-0.5 text-sm font-medium text-gray-900 dark:text-gray-100">
                  {new Date(task.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-emerald-50 p-2 dark:bg-emerald-900/30">
                <Clock className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Created</p>
                <p className="mt-0.5 text-sm font-medium text-gray-900 dark:text-gray-100">
                  {new Date(task.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Tabs section */}
        <Tabs
          tabs={[
            { label: 'Details', value: 'details' },
            { label: 'Activity', value: 'activity' },
          ]}
          value={tab}
          onChange={setTab}
        />

        {tab === 'details' && (
          <Card>
            <CardContent className="mt-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">Description</p>
              <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                {task.description || 'No description provided.'}
              </p>

              {task.tags.length > 0 && (
                <div className="mt-5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Tags</p>
                  <div className="flex flex-wrap gap-1.5">
                    {task.tags.map(tag => (
                      <Badge key={tag} variant="primary" size="sm">{tag}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {tab === 'activity' && (
          <Card>
            <CardContent className="mt-0 space-y-4">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Timeline</p>
                <div className="rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-500 dark:bg-gray-900/40 dark:text-gray-400">
                  Created {new Date(task.createdAt).toLocaleString()}
                </div>
                {((task as Task & { comments?: TaskComment[] }).comments ?? []).map((c) => (
                  <div key={c.id} className="rounded-lg border border-gray-200 p-3 text-sm dark:border-gray-700">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-gray-900 dark:text-gray-100">{c.authorName}</span>
                      <span className="text-xs text-gray-400">{new Date(c.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="mt-1 text-gray-600 dark:text-gray-300">{c.content}</p>
                  </div>
                ))}
              </div>
              <div className="space-y-2 border-t border-gray-100 pt-3 dark:border-gray-700/40">
                <Textarea
                  label="Add comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Write a comment..."
                  rows={2}
                />
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    isLoading={addComment.isPending}
                    onClick={async () => {
                      if (!comment.trim()) return;
                      try {
                        await addComment.mutateAsync({ taskId: task.id, content: comment.trim() });
                        setComment('');
                        toast.success('Comment added');
                      } catch (err) {
                        toast.error(err instanceof Error ? err.message : 'Failed to comment');
                      }
                    }}
                  >
                    Post Comment
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Action modal (submit / approve / reject) */}
      <Modal
        isOpen={!!actionType}
        onClose={() => { setActionType(null); setActionNote(''); }}
        title={actionType === 'submit' ? 'Submit Task' : actionType === 'approve' ? 'Approve Task' : 'Reject Task'}
        description={actionType === 'submit' ? 'Submit this task for review.' : actionType === 'approve' ? 'Approve this completed task.' : 'Reject and return this task for rework.'}
        footer={
          <>
            <Button variant="ghost" onClick={() => { setActionType(null); setActionNote(''); }}>Cancel</Button>
            <Button
              variant={actionType === 'reject' ? 'danger' : undefined}
              isLoading={submitTask.isPending || approveTask.isPending || rejectTask.isPending}
              onClick={handleAction}
            >
              {actionType === 'submit' ? 'Submit' : actionType === 'approve' ? 'Approve' : 'Reject'}
            </Button>
          </>
        }
      >
        <Textarea
          label="Note (optional)"
          placeholder="Add a note..."
          rows={3}
          value={actionNote}
          onChange={(e) => setActionNote(e.target.value)}
        />
      </Modal>

      {/* Verify confirm */}
      <ConfirmDialog
        isOpen={verifyConfirm}
        onClose={() => setVerifyConfirm(false)}
        title="Verify Task"
        message="Mark this task as fully verified? This confirms quality of delivery."
        confirmLabel="Verify"
        isLoading={verifyTask.isPending}
        onConfirm={handleVerify}
      />

      {/* Rate modal */}
      <Modal
        isOpen={rateOpen}
        onClose={() => setRateOpen(false)}
        title="Rate Task"
        footer={
          <>
            <Button variant="ghost" onClick={() => setRateOpen(false)}>Cancel</Button>
            <Button isLoading={rateTask.isPending} onClick={handleRate}>Submit Rating</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Rating (1–5)</p>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(n)}
                  className={`flex h-10 w-10 items-center justify-center rounded-lg border text-sm font-semibold transition-colors ${
                    rating >= n
                      ? 'border-amber-400 bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                      : 'border-gray-200 text-gray-400 hover:border-gray-300 dark:border-gray-700'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
          <Textarea
            label="Feedback (optional)"
            placeholder="Add feedback for the assignee..."
            rows={3}
            value={rateNote}
            onChange={(e) => setRateNote(e.target.value)}
          />
        </div>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={deleteConfirm}
        onClose={() => setDeleteConfirm(false)}
        title="Delete Task"
        message={`Delete "${task?.title}"? This cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        isLoading={deleteTask.isPending}
        onConfirm={handleDelete}
      />

      {/* Delete button in page (for managers) */}
      {isManager && task && (
        <div className="pt-6 border-t dark:border-gray-700">
          <Button
            variant="ghost"
            size="sm"
            className="text-red-500 hover:text-red-600"
            onClick={() => setDeleteConfirm(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Task
          </Button>
        </div>
      )}
    </PageTransition>
  );
}
