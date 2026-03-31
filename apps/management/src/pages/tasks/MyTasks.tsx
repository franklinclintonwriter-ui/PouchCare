import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ListTodo, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { useHeaderConfig } from '@/hooks/useHeaderConfig';
import { useMyTasks } from '@/api/tasks';
import { PageTransition } from '@/components/ui/PageTransition';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { StatsRow } from '@/components/shared/StatsRow';
import { Tabs } from '@/components/ui/Tabs';
import type { Task } from '@/types/models';

export default function MyTasks() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('all');
  const { data: tasks = [], isLoading } = useMyTasks();

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

  const tabItems = useMemo(() => [
    { label: 'All', value: 'all', count: tasks.length },
    { label: 'Active', value: 'active', count: tasks.filter(t => t.status === 'IN_PROGRESS').length },
    { label: 'Blocked', value: 'blocked', count: tasks.filter(t => t.status === 'BLOCKED').length },
    { label: 'Done', value: 'done', count: tasks.filter(t => t.status === 'DONE').length },
  ], [tasks]);

  const headerConfig = useMemo(() => ({
    title: 'My Tasks',
    breadcrumbs: [{ label: 'Home', href: '/' }, { label: 'My Tasks' }],
    actions: [],
  }), []);

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
  ];

  return (
    <PageTransition>
      <div className="space-y-6">
        <StatsRow items={stats} loading={isLoading} />

        <Tabs tabs={tabItems} value={tab} onChange={setTab} />

        <DataTable
          columns={columns}
          data={filtered}
          isLoading={isLoading}
          onRowClick={(row) => navigate(`/tasks/${row.id}`)}
          emptyTitle="No tasks found"
          emptyDescription="You have no tasks in this category"
        />
      </div>
    </PageTransition>
  );
}
