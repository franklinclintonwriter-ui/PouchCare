import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ListTodo, CheckCircle2, Clock, AlertTriangle, Send, Filter, LayoutGrid, Table2 } from 'lucide-react';
import { useHeaderConfig } from '@/hooks/useHeaderConfig';
import { useMyTasks, useSubmitTask } from '@/api/tasks';
import { PageTransition } from '@/components/ui/PageTransition';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import { StatsRow } from '@/components/shared/StatsRow';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { toast } from 'sonner';
import type { Task } from '@/types/models';

type StatusFilter = 'all' | 'active' | 'blocked' | 'done';
type ViewMode = 'table' | 'cards';

export default function MyTasks() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<StatusFilter>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const { data: tasks = [], isLoading } = useMyTasks();
  const submitTask = useSubmitTask();

  const filtered = useMemo(() => {
    if (tab === 'all') return tasks;
    const statusMap: Record<string, string> = {
      active: 'IN_PROGRESS',
      blocked: 'BLOCKED',
      done: 'DONE',
    };
    return tasks.filter(t => t.status === statusMap[tab]);
  }, [tasks, tab]);

  const stats = useMemo(() => {
    const total = tasks.length;
    const active = tasks.filter(t => t.status === 'IN_PROGRESS').length;
    const blocked = tasks.filter(t => t.status === 'BLOCKED').length;
    const done = tasks.filter(t => t.status === 'DONE').length;
    return [
      { title: 'My Tasks', value: total, icon: <ListTodo />, iconBg: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
      { title: 'Active', value: active, icon: <Clock />, iconBg: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' },
      { title: 'Blocked', value: blocked, icon: <AlertTriangle />, iconBg: 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400' },
      { title: 'Completed', value: done, icon: <CheckCircle2 />, iconBg: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' },
    ];
  }, [tasks]);

  const headerConfig = useMemo(() => ({
    title: 'My Tasks',
    breadcrumbs: [{ label: 'Home', href: '/' }, { label: 'My Tasks' }],
    actions: [
      {
        type: 'toggle' as const,
        value: viewMode,
        onChange: (v: string) => setViewMode(v === 'cards' ? 'cards' : 'table'),
        options: [
          { value: 'table', label: 'Table', icon: Table2 },
          { value: 'cards', label: 'Cards', icon: LayoutGrid },
        ],
      },
      {
        type: 'filter' as const,
        label: 'Filter tasks by status',
        icon: Filter,
        options: [
          { label: 'Active', value: 'active' },
          { label: 'Blocked', value: 'blocked' },
          { label: 'Done', value: 'done' },
        ],
        value: tab === 'all' ? '' : tab,
        onChange: (value: string) => {
          if (value === '') setTab('all');
          else if (value === 'active' || value === 'blocked' || value === 'done') setTab(value);
        },
      },
    ],
  }), [tab, viewMode]);

  useHeaderConfig(headerConfig);

  const columns: Column<Task>[] = [
    {
      key: 'title',
      label: 'Title',
      sticky: true,
      render: (row) => (
        <span className="font-medium text-gray-900 dark:text-gray-100">{row.title}</span>
      ),
    },
    {
      key: 'projectName',
      label: 'Project',
      render: (row) => (
        <span className="text-gray-600 dark:text-gray-400">{row.projectName || '-'}</span>
      ),
    },
    {
      key: 'priority',
      label: 'Priority',
      render: (row) => <StatusBadge status={row.priority} size="sm" />,
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <StatusBadge status={row.status} size="sm" />,
    },
    {
      key: 'dueDate',
      label: 'Due Date',
      render: (row) => (
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {new Date(row.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
        </span>
      ),
    },
    {
      key: 'actions' as keyof Task,
      label: '',
      align: 'right',
      render: (row) => {
        if (row.status === 'IN_PROGRESS' && row.approvalStatus === 'WAITING') {
          return (
            <Button
              size="sm"
              variant="outline"
              className="h-9 w-full justify-center px-3 text-xs sm:h-7 sm:w-auto sm:px-2"
              isLoading={submitTask.isPending}
              icon={<Send />}
              onClick={(e) => {
                e.stopPropagation();
                submitTask.mutateAsync({ id: row.id })
                  .then(() => toast.success('Task submitted for review'))
                  .catch(() => toast.error('Failed to submit task'));
              }}
            >
              Submit
            </Button>
          );
        }
        return null;
      },
    },
  ];

  return (
    <PageTransition>
      <div className="space-y-6">
        <StatsRow items={stats} loading={isLoading} />

        {viewMode === 'table' ? (
          <DataTable
            columns={columns}
            data={filtered}
            isLoading={isLoading}
            onRowClick={(row) => navigate(`/tasks/${row.id}`)}
            emptyTitle="No tasks found"
            emptyDescription="You have no tasks in this category"
          />
        ) : (
          <div className="rounded-xl border border-gray-200/80 bg-white shadow-soft dark:border-gray-700/60 dark:bg-gray-800/80">
            {isLoading ? (
              <div className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3 lg:p-5">
                {Array.from({ length: 9 }).map((_, i) => (
                  <Skeleton key={i} className="h-44 rounded-xl" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <EmptyState
                icon={<ListTodo />}
                title="No tasks found"
                description="You have no tasks in this category"
                className="py-12"
              />
            ) : (
              <div className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3 lg:p-5">
                {filtered.map((task) => (
                  <Card
                    key={task.id}
                    hover
                    padding="md"
                    onClick={() => navigate(`/tasks/${task.id}`)}
                    className="min-h-[44px]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
                          {task.title}
                        </p>
                        <p className="mt-1 truncate text-xs text-gray-500 dark:text-gray-400">
                          {task.projectName || 'No project'}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <StatusBadge status={task.status} size="sm" />
                        <StatusBadge status={task.priority} size="sm" />
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-3 border-t border-gray-100 pt-4 dark:border-gray-700/60">
                      <span className="text-xs text-gray-500 dark:text-gray-400 tabular-nums">
                        {task.dueDate
                          ? new Date(task.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                          : 'No due date'}
                      </span>
                      {task.status === 'IN_PROGRESS' && task.approvalStatus === 'WAITING' ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-9 px-3 text-xs sm:h-7 sm:px-2"
                          isLoading={submitTask.isPending}
                          icon={<Send />}
                          onClick={(e) => {
                            e.stopPropagation();
                            submitTask.mutateAsync({ id: task.id })
                              .then(() => toast.success('Task submitted for review'))
                              .catch(() => toast.error('Failed to submit task'));
                          }}
                        >
                          Submit
                        </Button>
                      ) : null}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </PageTransition>
  );
}
