import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ListTodo, AlertTriangle, CheckCircle2, Loader2, CircleDot, Flag, Plus, Paperclip, LayoutGrid, Table2, Bot, Sparkles, Target, Zap, X, UserCheck } from 'lucide-react';
import { useHeaderConfig } from '@/hooks/useHeaderConfig';
import { usePermission } from '@/hooks/usePermission';
import { useBulkAssignTasks, useCreateTask, useTasks, useTaskMeta, useUploadTaskAttachments } from '@/api/tasks';
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
import { Card } from '@/components/ui/Card';
import { Pagination } from '@/components/ui/Pagination';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import type { Task } from '@/types/models';
import { TASK_CATEGORIES } from '@/constants/taskCategories';
import { toast } from 'sonner';

type ViewMode = 'table' | 'cards';

export default function TaskList() {
  const navigate = useNavigate();
  const perm = usePermission();
  const canCreate = perm.can('task.create');
  const canAssign = perm.can('task.assign');
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [approvalStatus, setApprovalStatus] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const [page, setPage] = useState(1);
  const [sortField, setSortField] = useState('');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkAssignedManagerId, setBulkAssignedManagerId] = useState('');
  const [bulkAssignedMemberId, setBulkAssignedMemberId] = useState('');
  const [openCreate, setOpenCreate] = useState(false);
  const [aiPlan, setAiPlan] = useState<Record<string, string | string[] | null> | null>(null);
  const [aiPlanLoading, setAiPlanLoading] = useState(false);
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
  const bulkAssignTasks = useBulkAssignTasks();
  const uploadAttachments = useUploadTaskAttachments();

  const { data: taskMeta } = useTaskMeta();
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

  const managerOptions = useMemo(
    () => branchManagers.map((manager) => ({ value: manager.id, label: manager.name })),
    [branchManagers],
  );

  const specialistOptions = useMemo(
    () => specialists.map((member) => ({ value: member.id, label: member.name })),
    [specialists],
  );

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

  const resetBulkAssign = useCallback(() => {
    setBulkAssignedManagerId('');
    setBulkAssignedMemberId('');
    setSelectedIds(new Set());
  }, []);

  const { data, isLoading } = useTasks({
    q: search || undefined,
    status: status || undefined,
    priority: priority || undefined,
    approvalStatus: approvalStatus || undefined,
    category: categoryFilter || undefined,
    branch: branchFilter || undefined,
    page,
    limit: 20,
    sortBy: sortField || undefined,
    sortDir: sortField ? sortDir : undefined,
  });

  const tasks = data?.data ?? [];
  const meta = data?.meta;

  const runBulkAssign = useCallback(async () => {
    if (selectedIds.size === 0) return;
    if (!bulkAssignedManagerId && !bulkAssignedMemberId) {
      toast.error('Select a manager or assignee first');
      return;
    }
    try {
      const result = await bulkAssignTasks.mutateAsync({
        ids: Array.from(selectedIds),
        assignedManagerId: bulkAssignedManagerId || undefined,
        assignedMemberId: bulkAssignedMemberId || undefined,
      });
      const failed = result.total - result.okCount;
      if (failed === 0) {
        toast.success(`${result.okCount} task(s) reassigned`);
      } else {
        toast.warning(`${result.okCount} reassigned, ${failed} skipped`);
      }
      resetBulkAssign();
    } catch (error: any) {
      toast.error(error?.response?.data?.error ?? 'Bulk assignment failed');
    }
  }, [bulkAssignTasks, bulkAssignedManagerId, bulkAssignedMemberId, resetBulkAssign, selectedIds]);

  const handleAiPlan = useCallback(async () => {
    if (aiPlanLoading) return;
    setAiPlanLoading(true);
    try {
      const { default: apiClient } = await import('@/api/client');
      const { data: res } = await apiClient.post('/ai/task/my-pending');
      setAiPlan((res as any).plan ?? null);
    } catch {
      setAiPlan({ error: 'AI daily plan unavailable — check provider configuration.' });
    } finally {
      setAiPlanLoading(false);
    }
  }, [aiPlanLoading]);

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
      {
        type: 'button' as const,
        label: 'AI Plan',
        icon: Bot,
        variant: 'secondary' as const,
        isLoading: aiPlanLoading,
        onClick: handleAiPlan,
      },
      {
        type: 'toggle' as const,
        value: viewMode,
        onChange: (v: string) => setViewMode(v === 'cards' ? 'cards' : 'table'),
        options: [
          { value: 'table', label: 'Table', icon: Table2 },
          { value: 'cards', label: 'Cards', icon: LayoutGrid },
        ],
      },
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
  }), [search, status, priority, approvalStatus, categoryFilter, branchFilter, canCreate, viewMode, aiPlanLoading, handleAiPlan]);

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

        {aiPlan && (
          <div className="relative overflow-hidden rounded-2xl border border-primary-200/80 bg-gradient-to-br from-primary-50/60 via-white to-violet-50/30 p-5 shadow-sm dark:border-primary-800/40 dark:from-primary-950/30 dark:via-gray-900/50 dark:to-violet-950/20">
            <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-primary-500 to-violet-500" aria-hidden />
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2 pl-2">
                <Sparkles className="h-4.5 w-4.5 text-primary-600 dark:text-primary-400" />
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">AI Daily Plan</h3>
              </div>
              <button onClick={() => setAiPlan(null)} className="rounded-lg p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <X className="h-4 w-4" />
              </button>
            </div>
            {'error' in aiPlan ? (
              <p className="mt-2 pl-2 text-sm text-amber-700 dark:text-amber-300">{String(aiPlan.error)}</p>
            ) : (
              <div className="mt-3 space-y-3 pl-2">
                {aiPlan.summary && (
                    <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">{String(aiPlan.summary ?? '')}</p>
                )}
                {Array.isArray(aiPlan.today_focus) && (aiPlan.today_focus as string[]).length > 0 && (
                  <div>
                    <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      <Target className="h-3 w-3 text-amber-500" /> Focus today
                    </p>
                    <ul className="mt-1.5 space-y-1">
                      {(aiPlan.today_focus as string[]).map((f, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-gray-700 dark:text-gray-300">
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                          {typeof f === 'string' ? f : JSON.stringify(f)}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {aiPlan.overdue_alert && (
                  <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50/60 px-3 py-2 dark:border-rose-800/40 dark:bg-rose-950/20">
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-500" />
                    <p className="text-xs text-rose-800 dark:text-rose-200">{String(aiPlan.overdue_alert ?? '')}</p>
                  </div>
                )}
                {Array.isArray(aiPlan.quick_wins) && (aiPlan.quick_wins as string[]).length > 0 && (
                  <div>
                    <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      <Zap className="h-3 w-3 text-emerald-500" /> Quick wins
                    </p>
                    <ul className="mt-1 space-y-0.5">
                      {(aiPlan.quick_wins as string[]).map((w, i) => (
                        <li key={i} className="text-xs text-gray-600 dark:text-gray-400">• {typeof w === 'string' ? w : JSON.stringify(w)}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {aiPlan.recommendation && (
                  <p className="rounded-lg bg-primary-50/50 px-3 py-2 text-xs font-medium text-primary-700 dark:bg-primary-950/20 dark:text-primary-300">
                    {String(aiPlan.recommendation ?? '')}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {canAssign && selectedIds.size > 0 && (
          <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-primary-200/80 bg-primary-50/80 p-4 dark:border-primary-900/40 dark:bg-primary-950/20">
            <div className="min-w-[140px] text-sm font-medium text-primary-700 dark:text-primary-300">
              {selectedIds.size} selected
            </div>
            <div className="min-w-[220px] flex-1">
              <Select
                value={bulkAssignedManagerId}
                onChange={(e) => setBulkAssignedManagerId(e.target.value)}
                options={managerOptions}
                placeholder="Assign manager"
              />
            </div>
            <div className="min-w-[220px] flex-1">
              <Select
                value={bulkAssignedMemberId}
                onChange={(e) => setBulkAssignedMemberId(e.target.value)}
                options={specialistOptions}
                placeholder="Assign staff"
              />
            </div>
            <Button
              size="sm"
              onClick={runBulkAssign}
              disabled={bulkAssignTasks.isPending || (!bulkAssignedManagerId && !bulkAssignedMemberId)}
            >
              <UserCheck className="mr-1.5 h-4 w-4" /> Apply assignment
            </Button>
            <Button size="sm" variant="ghost" onClick={resetBulkAssign}>
              <X className="mr-1.5 h-4 w-4" /> Clear
            </Button>
          </div>
        )}

        <div className="grid gap-3 rounded-2xl border border-gray-200/80 bg-white p-4 shadow-soft dark:border-gray-700/60 dark:bg-gray-800/80 md:grid-cols-2 xl:grid-cols-4">
          <Select
            value={approvalStatus}
            onChange={(e) => setApprovalStatus(e.target.value)}
            options={[
              { value: 'WAITING', label: 'Waiting for submission' },
              { value: 'SUBMITTED', label: 'Submitted by staff' },
              { value: 'APPROVED_MGR', label: 'Approved by manager' },
              { value: 'REJECTED_MGR', label: 'Rejected by manager' },
              { value: 'ESCALATED', label: 'Escalated to CEO' },
              { value: 'VERIFIED', label: 'Completed and verified' },
            ]}
            placeholder="Approval status"
          />
          <Select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            options={(taskMeta?.categories ?? []).map((value) => ({ value, label: value }))}
            placeholder="Category"
          />
          <Select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            options={(taskMeta?.branches ?? []).map((branch) => ({ value: branch.name, label: branch.name }))}
            placeholder="Branch"
          />
          <Button
            variant="outline"
            onClick={() => {
              setApprovalStatus('');
              setCategoryFilter('');
              setBranchFilter('');
              setStatus('');
              setPriority('');
              setSearch('');
              setPage(1);
            }}
          >
            Reset filters
          </Button>
        </div>

        {viewMode === 'table' ? (
          <DataTable
            columns={columns}
            data={tasks}
            isLoading={isLoading}
            selectable={canAssign}
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
            getRowId={(row) => row.id}
            onRowClick={(row) => navigate(`/tasks/${row.id}`)}
            sortField={sortField}
            sortDirection={sortDir}
            onSort={handleSort}
            pagination={meta}
            onPageChange={setPage}
            emptyTitle="No tasks found"
            emptyDescription="Try adjusting your filters"
          />
        ) : (
          <div className="rounded-xl border border-gray-200/80 bg-white shadow-soft dark:border-gray-700/60 dark:bg-gray-800/80">
            {isLoading ? (
              <div className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3 lg:p-5">
                {Array.from({ length: 9 }).map((_, i) => (
                  <Skeleton key={i} className="h-44 rounded-xl" />
                ))}
              </div>
            ) : tasks.length === 0 ? (
              <EmptyState
                icon={<ListTodo />}
                title="No tasks found"
                description="Try adjusting your filters"
                className="py-12"
              />
            ) : (
              <>
                <div className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3 lg:p-5">
                  {tasks.map((task) => (
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
                            {task.projectName || 'No project'}{task.tags?.[0] ? ` · ${task.tags[0]}` : ''}
                          </p>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-1">
                          <StatusBadge status={task.status} size="sm" />
                          <StatusBadge status={task.priority} size="sm" />
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-between gap-3 border-t border-gray-100 pt-4 dark:border-gray-700/60">
                        <div className="flex min-w-0 items-center gap-2">
                          <Avatar name={task.assigneeName} src={task.assigneeAvatar} size="xs" />
                          <span className="truncate text-xs font-medium text-gray-700 dark:text-gray-300">
                            {task.assigneeName || 'Unassigned'}
                          </span>
                        </div>
                        <span className="shrink-0 text-xs text-gray-500 dark:text-gray-400 tabular-nums">
                          {task.dueDate
                            ? new Date(task.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                            : 'No due date'}
                        </span>
                      </div>
                    </Card>
                  ))}
                </div>

                {meta && meta.totalPages > 0 ? (
                  <div className="border-t border-gray-100 px-4 py-3 dark:border-gray-700/60 lg:px-5">
                    <Pagination
                      currentPage={meta.page}
                      totalPages={meta.totalPages}
                      total={meta.total}
                      onPageChange={setPage}
                    />
                  </div>
                ) : null}
              </>
            )}
          </div>
        )}

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
