import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderKanban, Pause, CheckCircle2, Loader2, CircleDot, Plus } from 'lucide-react';
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
import { Button } from '@/components/ui/Button';
import type { Project } from '@/types/models';
import { toast } from 'sonner';

export default function ProjectList() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [sortField, setSortField] = useState('');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [openCreate, setOpenCreate] = useState(false);
  const [name, setName] = useState('');
  const [clientName, setClientName] = useState('');
  const createProject = useCreateProject();

  const { data, isLoading } = useProjects({
    q: search || undefined,
    status: status || undefined,
    page,
    limit: 20,
  });

  const projects = data?.data ?? [];
  const meta = data?.meta;

  const stats = useMemo(() => {
    const total = meta?.total ?? 0;
    const active = projects.filter(p => p.status === 'IN_PROGRESS').length;
    const onHold = projects.filter(p => p.status === 'ON_HOLD').length;
    const delivered = projects.filter(p => p.status === 'DELIVERED').length;
    return [
      { title: 'Total Projects', value: total, icon: <FolderKanban />, iconBg: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
      { title: 'Active', value: active, icon: <Loader2 />, iconBg: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' },
      { title: 'On Hold', value: onHold, icon: <Pause />, iconBg: 'bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' },
      { title: 'Delivered', value: delivered, icon: <CheckCircle2 />, iconBg: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' },
    ];
  }, [projects, meta]);

  const headerConfig = useMemo(() => ({
    title: 'Projects',
    breadcrumbs: [{ label: 'Home', href: '/' }, { label: 'Projects' }],
    actions: [
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
  }), [search, status]);

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
          {new Date(row.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
        </span>
      ),
    },
    {
      key: 'budget',
      label: 'Budget',
      align: 'right',
      render: (row) => (
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          ${row.budget.toLocaleString()}
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
                    await createProject.mutateAsync({ name: name.trim(), clientName: clientName || undefined });
                    toast.success('Project created');
                    setOpenCreate(false);
                    setName('');
                    setClientName('');
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
            <Input label="Project Name" value={name} onChange={(e) => setName(e.target.value)} />
            <Input label="Client Name" value={clientName} onChange={(e) => setClientName(e.target.value)} />
          </div>
        </Modal>
      </div>
    </PageTransition>
  );
}
