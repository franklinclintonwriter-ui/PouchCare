import { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Calendar, FolderOpen, User, Clock } from 'lucide-react';
import { useHeaderConfig } from '@/hooks/useHeaderConfig';
import { useAddTaskComment, useTask } from '@/api/tasks';
import { PageTransition } from '@/components/ui/PageTransition';
import { Card, CardContent } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Avatar } from '@/components/ui/Avatar';
import { Tabs } from '@/components/ui/Tabs';
import { Skeleton } from '@/components/ui/Skeleton';
import { Badge } from '@/components/ui/Badge';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';

export default function TaskDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: task, isLoading } = useTask(id!);
  const addComment = useAddTaskComment();
  const [tab, setTab] = useState('details');
  const [comment, setComment] = useState('');

  const headerConfig = useMemo(() => ({
    title: task?.title ?? 'Task',
    breadcrumbs: [
      { label: 'Home', href: '/' },
      { label: 'Tasks', href: '/tasks' },
      { label: task?.title ?? '...' },
    ],
    actions: [],
  }), [task?.title]);

  useHeaderConfig(headerConfig);

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
            <CardContent className="mt-0">
              <div className="flex flex-col items-center justify-center py-10 text-gray-400 dark:text-gray-500">
                <Clock className="h-8 w-8 mb-2" />
                <p className="text-sm">Activity timeline</p>
              </div>
              <div className="space-y-2">
                <p className="text-xs text-gray-500">Created: {new Date(task.createdAt).toLocaleString()}</p>
                {((task as any).comments ?? []).map((c: any) => (
                  <div key={c.id} className="rounded-lg border border-gray-200 p-2 text-sm dark:border-gray-700">
                    <p className="font-medium">{c.authorName}</p>
                    <p>{c.content}</p>
                  </div>
                ))}
              </div>
              <div className="mt-3 space-y-2">
                <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Add comment..." />
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
    </PageTransition>
  );
}
