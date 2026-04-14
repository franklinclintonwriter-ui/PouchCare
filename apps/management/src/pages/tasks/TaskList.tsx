import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ListTodo, AlertTriangle, CheckCircle2, Loader2, CircleDot, Flag, Plus, Paperclip } from 'lucide-react';
import { useHeaderConfig } from '@/hooks/useHeaderConfig';
import { usePermission } from '@/hooks/usePermission';
import { useCreateTask, useTasks, useTaskMeta, useUploadTaskAttachments } from '@/api/tasks';
import { useStaffList } from '@/api/staff';
import { PageTransition } from '@/components/ui/PageTransition';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Avatar } from '@/components/ui/Avatar';
import { StatsRow } from '@/components/shared/StatsRow';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import type { Task } from '@/types/models';
import { TASK_CATEGORIES } from '@/constants/taskCategories';
import { toast } from 'sonner';

export default function TaskList() {
  const navigate = useNavigate();
  const perm = usePermission();
  const canCreate = perm.isManager;
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [page, setPage] = useState(1);
  const [sortField, setSortField] = useState('');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [openCreate, setOpenCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [taskPriority, setTaskPriority] = useState('MEDIUM');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [category, setCategory] = useState('');
  const [branchId, setBranchId] = useState('');
  const [assignedManagerId, setAssignedManagerId] = useState('');
  const [assignedMemberId, setAssignedMemberId] = useState('');
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const createTask = useCreateTask();
  const uploadAttachments = useUploadTaskAttachments();

  const { data: taskMeta } = useTaskMeta({ enabled: openCreate && canCreate });
  const { data: staffRows } = useStaffList(
    { limit: 400 },
    { enabled: openCreate && canCreate },
  );

  const branches = taskMeta?.branches ?? [];
  const selectedBranchName = useMemo(
    () => branches.find((b) => b.id === branchId)?.name ?? '',
    [branches, branchId],
  );

  const branchManagers = useMemo(
    () => (staffRows?.data ?? []).filter((s) => s.systemRole === 'BRANCH_MANAGER'),
    [staffRows?.data],
  );

  const specialists = useMemo(() => {
    const all = staffRows?.data ?? [];
    return all.filter((s) => {
      if (s.systemRole !== 'STAFF' && s.systemRole !== 'INTERN') return false;
      if (selectedBranchName && s.branch && s.branch !== selectedBranchName) return false;
      return true;
    });
  }, [staffRows?.data, selectedBranchName]);

  const resetCreateForm = useCallback(() => {
    setTitle('');
    setTaskPriority('MEDIUM');
    setDescription('');
    setDueDate('');
    setCategory('');
    setBranchId('');
    setAssignedManagerId('');
    setAssignedMemberId('');
    setPendingFiles([]);
  }, []);

  const { data, isLoading } = useTasks({
    q: search || undefined,
    status: status || undefined,
    priority: priority || undefined,
    page,
    limit: 20,
    sortBy: sortField || undefined,
    sortDir: sortField ? sortDir : undefined,
  });

  const tasks = data?.data ?? [];
  const meta = data?.meta;

  const { data: statsPage } = useTasks({ limit: 100, page: 1 });
  const allTasks = statsPage?.data ?? [];

  const stats = useMemo(() => {
    const total = meta?.total ?? 0;
    const inProgress = allTasks.filter((t) => t.status === 'IN_PROGRESS').length;
    const blocked = allTasks.filter((t) => t.status === 'BLOCKED').length;
    const done = allTasks.filter((t) => t.status === 'DONE').length;
    return [
      { title: 'Total Tasks', value: total, icon: <ListTodo />, iconBg: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
      { title: 'In Progress', value: inProgress, icon: <Loader2 />, iconBg: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' },
      { title: 'Blocked', value: blocked, icon: <AlertTriangle />, iconBg: 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400' },
      { title: 'Completed', value: done, icon: <CheckCircle2 />, iconBg: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' },
    ];
  }, [allTasks, meta]);

  const headerConfig = useMemo(() => ({
    title: 'Tasks',
    breadcrumbs: [{ label: 'Home', href: '/' }, { label: 'Tasks' }],
    actions: [
      ...(canCreate
        ? [{ type: 'button' as const, label: 'New Task', icon: Plus, onClick: () => setOpenCreate(true) }]
        : []),
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
  }), [search, status, priority, canCreate]);

  useHeaderConfig(headerConfig);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
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
      key: 'tags',
      label: 'Category',
      render: (row) => (
        <span className="text-gray-600 dark:text-gray-400 text-xs">
          {row.tags?.[0] || '—'}
        </span>
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
          onClose={() => {
            setOpenCreate(false);
            resetCreateForm();
          }}
          title="Create task"
          description="Set category, branch routing, optional branch manager and specialist. Add reference files after basics are saved."
          size="lg"
          footer={(
            <>
              <Button variant="outline" size="sm" onClick={() => { setOpenCreate(false); resetCreateForm(); }}>Cancel</Button>
              <Button
                size="sm"
                isLoading={createTask.isPending || uploadAttachments.isPending}
                onClick={async () => {
                  if (!title.trim()) return toast.error('Title is required');
                  try {
                    const payload = {
                      title: title.trim(),
                      priority: taskPriority,
                      notes: description.trim() || undefined,
                      deadline: dueDate || undefined,
                    } as const;
                    const finalPayload = {
                      ...payload,
                      ...(category && { category }),
                      ...(selectedBranchName && { assignedBranch: selectedBranchName }),
                      ...(assignedManagerId && { assignedManagerId }),
                      ...(assignedMemberId && { assignedMemberId }),
                    };

                    const created = await createTask.mutateAsync(finalPayload);
                    const taskId = created?.id;
                    if (taskId && pendingFiles.length > 0) {
                      await uploadAttachments.mutateAsync({ taskId, files: pendingFiles });
                    }
                    toast.success('Task created');
                    setOpenCreate(false);
                    resetCreateForm();
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
          <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
            <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
            <Textarea label="Description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Scope, acceptance criteria, links…" />
            <div className="grid gap-3 sm:grid-cols-2">
              <Select
                label="Category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                options={[
                  { label: 'Select category', value: '' },
                  ...TASK_CATEGORIES.map((c) => ({ label: c, value: c })),
                ]}
              />
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
            <div className="grid gap-3 sm:grid-cols-2">
              <Select
                label="Branch (routing)"
                value={branchId}
                onChange={(e) => {
                  setBranchId(e.target.value);
                  setAssignedMemberId('');
                }}
                options={[
                  { label: 'Company-wide / TBD', value: '' },
                  ...branches.map((b) => ({ label: b.name + (b.city ? ` — ${b.city}` : ''), value: b.id })),
                ]}
              />
              <Input type="date" label="Due date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
            <Select
              label="Branch manager (optional)"
              value={assignedManagerId}
              onChange={(e) => setAssignedManagerId(e.target.value)}
              options={[
                { label: 'None yet', value: '' },
                ...branchManagers.map((m) => ({ label: `${m.name} (${m.branch || '—'})`, value: m.id })),
              ]}
            />
            <Select
              label="Assign specialist (optional)"
              value={assignedMemberId}
              onChange={(e) => setAssignedMemberId(e.target.value)}
              options={[
                { label: 'Unassigned — manager will assign', value: '' },
                ...specialists.map((s) => ({
                  label: `${s.name} (${s.systemRole})${s.branch ? ` · ${s.branch}` : ''}`,
                  value: s.id,
                })),
              ]}
            />
            <div className="rounded-lg border border-dashed border-gray-200 p-3 dark:border-gray-600">
              <label className="flex cursor-pointer flex-col gap-1 text-sm text-gray-600 dark:text-gray-300">
                <span className="flex items-center gap-2 font-medium text-gray-800 dark:text-gray-100">
                  <Paperclip className="h-4 w-4" />
                  Attach files
                </span>
                <span className="text-xs text-gray-500">Documents upload after the task is created (max 10 files).</span>
                <input
                  type="file"
                  multiple
                  className="mt-1 text-xs file:mr-2 file:rounded file:border-0 file:bg-primary-50 file:px-2 file:py-1 dark:file:bg-primary-900/40"
                  onChange={(e) => setPendingFiles(Array.from(e.target.files ?? []))}
                />
              </label>
              {pendingFiles.length > 0 && (
                <ul className="mt-2 list-inside list-disc text-xs text-gray-500">
                  {pendingFiles.map((f) => (
                    <li key={f.name + f.size}>{f.name}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </Modal>
      </div>
    </PageTransition>
  );
}
