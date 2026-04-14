import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderKanban, Pause, CheckCircle2, Loader2, CircleDot, Plus, LayoutGrid, Table2, Calendar, DollarSign, Users } from 'lucide-react';
import { useHeaderConfig } from '@/hooks/useHeaderConfig';
import { useCreateProject, useProjects } from '@/api/projects';
import { PageTransition } from '@/components/ui/PageTransition';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Avatar } from '@/components/ui/Avatar';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { StatsRow } from '@/components/shared/StatsRow';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Pagination } from '@/components/ui/Pagination';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import type { Project } from '@/types/models';
import { toast } from 'sonner';
import { useCurrency } from '@/hooks/useCurrency';

type ViewMode = 'table' | 'cards';

export default function ProjectList() {
  const { formatCurrency } = useCurrency();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [sortField, setSortField] = useState('');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [openCreate, setOpenCreate] = useState(false);
  const [name, setName] = useState('');
  const [clientName, setClientName] = useState('');
  const [budget, setBudget] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const createProject = useCreateProject();

  const { data, isLoading } = useProjects({
    q: search || undefined,
    status: status || undefined,
    page,
    limit: 20,
    sortBy: sortField || undefined,
    sortDir: sortField ? sortDir : undefined,
  });

  const projects = data?.data ?? [];
  const meta = data?.meta;

  // Fetch all projects for accurate stats (not just paginated page)
  const { data: allData } = useProjects({});
  const allProjects = allData?.data ?? [];

  const stats = useMemo(() => {
    const total = meta?.total ?? 0;
    const active = allProjects.filter(p => p.status === 'IN_PROGRESS').length;
    const onHold = allProjects.filter(p => p.status === 'ON_HOLD').length;
    const delivered = allProjects.filter(p => p.status === 'DELIVERED').length;
    return [
      { title: 'Total Projects', value: total, icon: <FolderKanban />, iconBg: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
      { title: 'Active', value: active, icon: <Loader2 />, iconBg: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' },
      { title: 'On Hold', value: onHold, icon: <Pause />, iconBg: 'bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' },
      { title: 'Delivered', value: delivered, icon: <CheckCircle2 />, iconBg: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' },
    ];
  }, [allProjects, meta]);

  const headerConfig = useMemo(() => ({
    title: 'Projects',
    breadcrumbs: [{ label: 'Home', href: '/' }, { label: 'Projects' }],
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
      { type: 'button' as const, label: 'New Project', icon: Plus, onClick: () => setOpenCreate(true) },
      { type: 'search' as const, placeholder: 'Search projects...', value: search, onChange: setSearch },
      {
        type: 'filter' as const,
        label: 'Status',
        icon: CircleDot,
        options: [
          { label: 'All Status', value: '' },
          { label: 'Pending', value: 'PENDING' },
          { label: 'In Progress', value: 'IN_PROGRESS' },
          { label: 'Review', value: 'REVIEW' },
          { label: 'Delivered', value: 'DELIVERED' },
          { label: 'On Hold', value: 'ON_HOLD' },
          { label: 'Cancelled', value: 'CANCELLED' },
        ],
        value: status,
        onChange: setStatus,
      },
    ],
  }), [search, status, viewMode]);

  useHeaderConfig(headerConfig);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const columns: Column<Project>[] = [
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      sticky: true,
      render: (row) => (
        <span className="font-medium text-gray-900 dark:text-gray-100">{row.name}</span>
      ),
    },
    {
      key: 'clientName',
      label: 'Client',
      render: (row) => (
        <span className="text-gray-600 dark:text-gray-400">{row.clientName}</span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (row) => <StatusBadge status={row.status} size="sm" />,
    },
    {
      key: 'progress',
      label: 'Progress',
      width: '140px',
      render: (row) => (
        <ProgressBar value={row.progress} showLabel size="sm" />
      ),
    },
    {
      key: 'team',
      label: 'Team',
      render: (row) => (
        <div className="flex -space-x-2">
          {row.teamMembers.slice(0, 3).map(member => (
            <Avatar key={member.id} name={member.name} src={member.avatarUrl} size="xs" />
          ))}
          {row.teamMembers.length > 3 && (
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-[10px] font-medium text-gray-600 ring-2 ring-white dark:bg-gray-700 dark:text-gray-300 dark:ring-gray-800">
              +{row.teamMembers.length - 3}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'dueDate',
      label: 'Due Date',
      sortable: true,
      render: (row) => (
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {row.dueDate
            ? new Date(row.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
            : 'Not set'}
        </span>
      ),
    },
    {
      key: 'budget',
      label: 'Budget',
      align: 'right',
      render: (row) => (
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {formatCurrency(row.budget)}
        </span>
      ),
    },
  ];

  return (
    <PageTransition>
      <div className="space-y-6">
        <StatsRow items={stats} loading={isLoading} />

        {viewMode === 'table' ? (
          <DataTable
            columns={columns}
            data={projects}
            isLoading={isLoading}
            onRowClick={(row) => navigate(`/projects/${row.id}`)}
            sortField={sortField}
            sortDirection={sortDir}
            onSort={handleSort}
            pagination={meta}
            onPageChange={setPage}
            emptyTitle="No projects found"
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
            ) : projects.length === 0 ? (
              <EmptyState
                icon={<FolderKanban />}
                title="No projects found"
                description="Try adjusting your filters"
                className="py-12"
              />
            ) : (
              <>
                <div className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3 lg:p-5">
                  {projects.map((project) => (
                    <Card
                      key={project.id}
                      hover
                      padding="md"
                      onClick={() => navigate(`/projects/${project.id}`)}
                      className="min-h-[44px]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
                            {project.name}
                          </p>
                          <p className="mt-1 truncate text-xs text-gray-500 dark:text-gray-400">
                            {project.clientName || 'No client'}
                          </p>
                        </div>
                        <StatusBadge status={project.status} size="sm" />
                      </div>

                      <div className="mt-4">
                        <ProgressBar value={project.progress} showLabel size="sm" />
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3 border-t border-gray-100 pt-4 text-xs dark:border-gray-700/60">
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                          <Calendar className="h-3.5 w-3.5" aria-hidden />
                          <span className="truncate">
                            {project.dueDate
                              ? new Date(project.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                              : 'No due date'}
                          </span>
                        </div>
                        <div className="flex items-center justify-end gap-2 text-gray-700 dark:text-gray-300">
                          <DollarSign className="h-3.5 w-3.5 text-gray-400" aria-hidden />
                          <span className="font-medium tabular-nums">
                            {formatCurrency(project.budget)}
                          </span>
                        </div>
                        <div className="col-span-2 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                            <Users className="h-3.5 w-3.5" aria-hidden />
                            <span className="text-xs">
                              {project.teamMembers.length} member{project.teamMembers.length === 1 ? '' : 's'}
                            </span>
                          </div>
                          <div className="flex -space-x-2">
                            {project.teamMembers.slice(0, 4).map((m) => (
                              <Avatar key={m.id} name={m.name} src={m.avatarUrl} size="xs" />
                            ))}
                            {project.teamMembers.length > 4 ? (
                              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-[10px] font-medium text-gray-600 ring-2 ring-white dark:bg-gray-700 dark:text-gray-300 dark:ring-gray-800">
                                +{project.teamMembers.length - 4}
                              </div>
                            ) : null}
                          </div>
                        </div>
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
          onClose={() => setOpenCreate(false)}
          title="Create Project"
          footer={(
            <>
              <Button variant="outline" size="sm" onClick={() => setOpenCreate(false)}>Cancel</Button>
              <Button
                size="sm"
                isLoading={createProject.isPending}
                onClick={async () => {
                  if (!name.trim()) return toast.error('Project name is required');
                  try {
                    await createProject.mutateAsync({
                      name: name.trim(),
                      clientName: clientName || undefined,
                      price: budget ? Number(budget) : undefined,
                      deadline: dueDate || undefined,
                      notes: projectDescription.trim() || undefined,
                    });
                    toast.success('Project created');
                    setOpenCreate(false);
                    setName('');
                    setClientName('');
                    setBudget('');
                    setDueDate('');
                    setProjectDescription('');
                  } catch (err) {
                    toast.error(err instanceof Error ? err.message : 'Failed to create project');
                  }
                }}
              >
                Create
              </Button>
            </>
          )}
        >
          <div className="space-y-3">
            <Input label="Project Name" value={name} onChange={(e) => setName(e.target.value)} required />
            <Input label="Client Name" value={clientName} onChange={(e) => setClientName(e.target.value)} />
            <Textarea label="Description" value={projectDescription} onChange={(e) => setProjectDescription(e.target.value)} rows={3} placeholder="Project description..." />
            <div className="grid gap-3 sm:grid-cols-2">
              <Input type="number" min="0" step="0.01" label="Budget (USD)" value={budget} onChange={(e) => setBudget(e.target.value)} />
              <Input type="date" label="Due Date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
          </div>
        </Modal>
      </div>
    </PageTransition>
  );
}
