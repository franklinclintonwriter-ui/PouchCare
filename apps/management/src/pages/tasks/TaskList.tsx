import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ListTodo, AlertTriangle, CheckCircle2, Loader2, CircleDot, Flag, Plus } from 'lucide-react';
import { useHeaderConfig } from '@/hooks/useHeaderConfig';
import { useCreateTask, useTasks } from '@/api/tasks';
import { PageTransition } from '@/components/ui/PageTransition';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Avatar } from '@/components/ui/Avatar';
import { StatsRow } from '@/components/shared/StatsRow';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import type { Task } from '@/types/models';
import { toast } from 'sonner';

export default function TaskList() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [page, setPage] = useState(1);
  const [sortField, setSortField] = useState('');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [openCreate, setOpenCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [taskPriority, setTaskPriority] = useState('MEDIUM');
  const createTask = useCreateTask();

  const { data, isLoading } = useTasks({
    q: search || undefined,
    status: status || undefined,
    priority: priority || undefined,
    page,
    limit: 20,
  });

  const tasks = data?.data ?? [];
  const meta = data?.meta;

  const stats = useMemo(() => {
    const total = meta?.total ?? 0;
    const inProgress = tasks.filter(t => t.status === 'IN_PROGRESS').length;
    const blocked = tasks.filter(t => t.status === 'BLOCKED').length;
    const done = tasks.filter(t => t.status === 'DONE').length;
    return [
      { title: 'Total Tasks', value: total, icon: <ListTodo />, iconBg: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
      { title: 'In Progress', value: inProgress, icon: <Loader2 />, iconBg: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' },
      { title: 'Blocked', value: blocked, icon: <AlertTriangle />, iconBg: 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400' },
      { title: 'Completed', value: done, icon: <CheckCircle2 />, iconBg: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' },
    ];
  }, [tasks, meta]);

  const headerConfig = useMemo(() => ({
    title: 'Tasks',
    breadcrumbs: [{ label: 'Home', href: '/' }, { label: 'Tasks' }],
    actions: [
      { type: 'button' as const, label: 'New Task', icon: Plus, onClick: () => setOpenCreate(true) },
      { type: 'search' as const, placeholder: 'Search tasks...', value: search, onChange: setSearch },
      {
        type: 'filter' as const,
        label: 'Status',
        icon: CircleDot,
        options: [
          { label: 'All Status', value: '' },
          { label: 'Not Started', value: 'NOT_STARTED' },
          { label: 'In Progress', value: 'IN_PROGRESS' },
          { label: 'Blocked', value: 'BLOCKED' },
          { label: 'Review', value: 'REVIEW' },
          { label: 'Done', value: 'DONE' },
        ],
        value: status,
        onChange: setStatus,
      },
      {
        type: 'filter' as const,
        label: 'Priority',
        icon: Flag,
        options: [
          { label: 'All Priority', value: '' },
          { label: 'Critical', value: 'CRITICAL' },
          { label: 'High', value: 'HIGH' },
          { label: 'Medium', value: 'MEDIUM' },
          { label: 'Low', value: 'LOW' },
        ],
        value: priority,
        onChange: setPriority,
      },
    ],
  }), [search, status, priority]);

  useHeaderConfig(headerConfig);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const columns: Column<Task>[] = [
    {
      key: 'title',
      label: 'Title',
      sortable: true,
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
      key: 'assigneeName',
      label: 'Assignee',
      render: (row) => (
        <div className="flex items-center gap-2">
          <Avatar name={row.assigneeName} src={row.assigneeAvatar} size="xs" />
          <span className="text-sm">{row.assigneeName}</span>
        </div>
      ),
    },
    {
      key: 'priority',
      label: 'Priority',
      sortable: true,
      render: (row) => <StatusBadge status={row.priority} size="sm" />,
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (row) => <StatusBadge status={row.status} size="sm" />,
    },
    {
      key: 'dueDate',
      label: 'Due Date',
      sortable: true,
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

        <DataTable
          columns={columns}
          data={tasks}
          isLoading={isLoading}
          onRowClick={(row) => navigate(`/tasks/${row.id}`)}
          sortField={sortField}
          sortDirection={sortDir}
          onSort={handleSort}
          pagination={meta}
          onPageChange={setPage}
          emptyTitle="No tasks found"
          emptyDescription="Try adjusting your filters"
        />

        <Modal
          isOpen={openCreate}
          onClose={() => setOpenCreate(false)}
          title="Create Task"
          footer={(
            <>
              <Button variant="outline" size="sm" onClick={() => setOpenCreate(false)}>Cancel</Button>
              <Button
                size="sm"
                isLoading={createTask.isPending}
                onClick={async () => {
                  if (!title.trim()) return toast.error('Title is required');
                  try {
                    await createTask.mutateAsync({ title: title.trim(), priority: taskPriority });
                    toast.success('Task created');
                    setTitle('');
                    setTaskPriority('MEDIUM');
                    setOpenCreate(false);
                  } catch (err) {
                    toast.error(err instanceof Error ? err.message : 'Failed to create task');
                  }
                }}
              >
                Create
              </Button>
            </>
          )}
        >
          <div className="space-y-3">
            <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
            <Select
              label="Priority"
              value={taskPriority}
              onChange={(e) => setTaskPriority(e.target.value)}
              options={[
                { label: 'Critical', value: 'CRITICAL' },
                { label: 'High', value: 'HIGH' },
                { label: 'Medium', value: 'MEDIUM' },
                { label: 'Low', value: 'LOW' },
              ]}
            />
          </div>
        </Modal>
      </div>
    </PageTransition>
  );
}
