import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, UserCheck, UserX, Building, Shield, Plus, Edit, UserMinus, RotateCcw, LayoutGrid, Table2 } from 'lucide-react';
import { useHeaderConfig } from '@/hooks/useHeaderConfig';
import { useCreateStaff, useStaffList, useStaffStats, useDeactivateStaff, useRestoreStaff } from '@/api/staff';
import { useBranches } from '@/api/admin-resources';
import { PageTransition } from '@/components/ui/PageTransition';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { StatsRow } from '@/components/shared/StatsRow';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Dropdown, type DropdownItem } from '@/components/ui/Dropdown';
import { Card } from '@/components/ui/Card';
import { Pagination } from '@/components/ui/Pagination';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { usePermission } from '@/hooks/usePermission';
import type { StaffMember } from '@/types/models';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/utils/apiError';

const roleBadgeVariant: Record<string, 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'default'> = {
  CEO: 'danger',
  CO_MD: 'danger',
  OP_MANAGER: 'warning',
  HR_MANAGER: 'warning',
  BRANCH_MANAGER: 'info',
  STAFF: 'default',
  INTERN: 'primary',
};

const roleLabel: Record<string, string> = {
  CEO: 'CEO',
  CO_MD: 'Co-MD',
  OP_MANAGER: 'Ops Manager',
  HR_MANAGER: 'HR Manager',
  BRANCH_MANAGER: 'Branch Mgr',
  STAFF: 'Staff',
  INTERN: 'Intern',
};

type StaffViewMode = 'table' | 'cards';

export default function StaffList() {
  const navigate = useNavigate();
  const perm = usePermission();
  const [viewMode, setViewMode] = useState<StaffViewMode>('table');
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [page, setPage] = useState(1);
  const [sortField, setSortField] = useState('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [openCreate, setOpenCreate] = useState(false);
  const [confirmDeactivate, setConfirmDeactivate] = useState<StaffMember | null>(null);
  const [confirmRestore, setConfirmRestore] = useState<StaffMember | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [systemRole, setSystemRole] = useState('STAFF');
  const [branchName, setBranchName] = useState('');
  const createStaff = useCreateStaff();
  const deactivateStaff = useDeactivateStaff();
  const restoreStaff = useRestoreStaff();
  const { data: branches } = useBranches({ limit: 100 });

  const canManageStaff = perm.isCEO || perm.can('staff.manage_profiles');

  const { data, isLoading } = useStaffList({
    q: search || undefined,
    role: role || undefined,
    page,
    limit: 20,
    sortBy: sortField === 'isActive' ? 'status' : sortField || undefined,
    sortDir: sortField ? sortDir : undefined,
  });

  const { data: statsData, isLoading: statsLoading } = useStaffStats({
    q: search || undefined,
    role: role || undefined,
  });

  const staff = data?.data ?? [];
  const meta = data?.meta;

  const stats = useMemo(() => {
    const total = statsData?.total ?? meta?.total ?? 0;
    const active = statsData?.active ?? 0;
    const inactive = statsData?.inactive ?? 0;
    const branches = statsData?.branchCount ?? 0;
    return [
      { title: 'Total Staff', value: total, icon: <Users />, iconBg: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
      { title: 'Active', value: active, icon: <UserCheck />, iconBg: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' },
      { title: 'Inactive', value: inactive, icon: <UserX />, iconBg: 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400' },
      { title: 'Branches', value: branches, icon: <Building />, iconBg: 'bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' },
    ];
  }, [statsData, meta]);

  const headerConfig = useMemo(() => ({
    title: 'Staff',
    breadcrumbs: [{ label: 'Home', href: '/' }, { label: 'Staff' }],
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
      ...(canManageStaff
        ? [{ type: 'button' as const, label: 'New Staff', icon: Plus, onClick: () => setOpenCreate(true) }]
        : []),
      { type: 'search' as const, placeholder: 'Search staff...', value: search, onChange: setSearch },
      {
        type: 'filter' as const,
        label: 'Role',
        icon: Shield,
        options: [
          { label: 'All Roles', value: '' },
          { label: 'CEO', value: 'CEO' },
          { label: 'Co-MD', value: 'CO_MD' },
          { label: 'Ops Manager', value: 'OP_MANAGER' },
          { label: 'HR Manager', value: 'HR_MANAGER' },
          { label: 'Branch Manager', value: 'BRANCH_MANAGER' },
          { label: 'Staff', value: 'STAFF' },
          { label: 'Intern', value: 'INTERN' },
        ],
        value: role,
        onChange: setRole,
      },
    ],
  }), [search, role, canManageStaff, viewMode]);

  useHeaderConfig(headerConfig);

  const handleSort = (field: string) => {
    setPage(1);
    if (sortField === field) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const columns: Column<StaffMember>[] = [
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      sticky: true,
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <Avatar name={row.name} src={row.avatarUrl} size="sm" />
          <div>
            <p className="font-medium text-gray-900 dark:text-gray-100">{row.name}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'memberId',
      label: 'ID',
      render: (row) => (
        <span className="font-mono text-xs text-gray-500 dark:text-gray-400">{row.memberId}</span>
      ),
    },
    {
      key: 'systemRole',
      label: 'Role',
      render: (row) => (
        <Badge variant={roleBadgeVariant[row.systemRole] ?? 'default'} size="sm">
          {roleLabel[row.systemRole] ?? row.systemRole}
        </Badge>
      ),
    },
    {
      key: 'branch',
      label: 'Branch',
      render: (row) => (
        <span className="text-sm text-gray-600 dark:text-gray-400">{row.branch}</span>
      ),
    },
    {
      key: 'isActive',
      label: 'Status',
      render: (row) => (
        <Badge variant={row.isActive ? 'success' : 'danger'} size="sm" dot>
          {row.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'joinDate',
      label: 'Join Date',
      sortable: true,
      render: (row) => (
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {row.joinDate && !Number.isNaN(new Date(row.joinDate).getTime())
            ? new Date(row.joinDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
            : '—'}
        </span>
      ),
    },
    ...(canManageStaff ? [{
      key: 'actions' as const,
      label: '',
      width: '50px',
      render: (row: StaffMember) => {
        const items: DropdownItem[] = [
          { label: 'View / Edit', icon: <Edit className="h-4 w-4" />, onClick: () => navigate(`/staff/${row.id}`) },
          row.isActive
            ? { label: 'Deactivate', icon: <UserMinus className="h-4 w-4" />, onClick: () => setConfirmDeactivate(row), variant: 'danger' as const }
            : { label: 'Restore', icon: <RotateCcw className="h-4 w-4" />, onClick: () => setConfirmRestore(row) },
        ];
        return <Dropdown items={items} />;
      },
    }] : []),
  ];

  return (
    <PageTransition>
      <div className="space-y-6">
        <StatsRow items={stats} loading={isLoading || statsLoading} />

        {viewMode === 'table' ? (
          <DataTable
            columns={columns}
            data={staff}
            isLoading={isLoading}
            onRowClick={(row) => navigate(`/staff/${row.id}`)}
            sortField={sortField}
            sortDirection={sortDir}
            onSort={handleSort}
            pagination={meta}
            onPageChange={setPage}
            emptyTitle="No staff found"
            emptyDescription="Try adjusting your search or filters"
          />
        ) : (
          <div className="rounded-xl border border-gray-200/80 bg-white shadow-soft dark:border-gray-700/60 dark:bg-gray-800/80">
            {isLoading ? (
              <div className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3 lg:p-5">
                {Array.from({ length: 9 }).map((_, i) => (
                  <Skeleton key={i} className="h-44 rounded-xl" />
                ))}
              </div>
            ) : staff.length === 0 ? (
              <EmptyState
                icon={<Users />}
                title="No staff found"
                description="Try adjusting your search or filters"
                className="py-12"
              />
            ) : (
              <>
                <div className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3 lg:p-5">
                  {staff.map((m) => {
                    const items: DropdownItem[] = [
                      { label: 'View / Edit', icon: <Edit className="h-4 w-4" />, onClick: () => navigate(`/staff/${m.id}`) },
                      m.isActive
                        ? { label: 'Deactivate', icon: <UserMinus className="h-4 w-4" />, onClick: () => setConfirmDeactivate(m), variant: 'danger' as const }
                        : { label: 'Restore', icon: <RotateCcw className="h-4 w-4" />, onClick: () => setConfirmRestore(m) },
                    ];

                    return (
                      <Card
                        key={m.id}
                        hover
                        padding="md"
                        onClick={() => navigate(`/staff/${m.id}`)}
                        className="min-h-[44px]"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex min-w-0 items-center gap-3">
                            <Avatar name={m.name} src={m.avatarUrl} size="sm" />
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
                                {m.name}
                              </p>
                              <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                                {m.email}
                              </p>
                            </div>
                          </div>

                          {canManageStaff ? (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="shrink-0"
                            >
                              <Dropdown items={items} />
                            </div>
                          ) : null}
                        </div>

                        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-4 dark:border-gray-700/60">
                          <Badge variant={roleBadgeVariant[m.systemRole] ?? 'default'} size="sm">
                            {roleLabel[m.systemRole] ?? m.systemRole}
                          </Badge>
                          <Badge variant={m.isActive ? 'success' : 'danger'} size="sm" dot>
                            {m.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                          <span className="ml-auto truncate text-xs text-gray-600 dark:text-gray-400">
                            {m.branch || 'No branch'}
                          </span>
                        </div>
                      </Card>
                    );
                  })}
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
          title="Create Staff"
          footer={(
            <>
              <Button variant="outline" size="sm" onClick={() => setOpenCreate(false)}>Cancel</Button>
              <Button
                size="sm"
                isLoading={createStaff.isPending}
                onClick={async () => {
                  if (!name.trim() || !email.trim() || !password.trim()) return toast.error('Name, email, and password are required');
                  try {
                    await createStaff.mutateAsync({
                      name: name.trim(),
                      email: email.trim(),
                      password,
                      systemRole,
                      branch: branchName || undefined,
                    });
                    toast.success('Staff created');
                    setOpenCreate(false);
                    setName('');
                    setEmail('');
                    setPassword('');
                    setBranchName('');
                  } catch (err) {
                    toast.error(getApiErrorMessage(err, 'Failed to create staff'));
                  }
                }}
              >
                Create
              </Button>
            </>
          )}
        >
          <div className="space-y-3">
            <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} />
            <Input label="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <Input type="password" label="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <Select
              label="Role"
              value={systemRole}
              onChange={(e) => setSystemRole(e.target.value)}
              options={[
                { label: 'CEO', value: 'CEO' },
                { label: 'Co-MD', value: 'CO_MD' },
                { label: 'Ops Manager', value: 'OP_MANAGER' },
                { label: 'HR Manager', value: 'HR_MANAGER' },
                { label: 'Branch Manager', value: 'BRANCH_MANAGER' },
                { label: 'Staff', value: 'STAFF' },
                { label: 'Intern', value: 'INTERN' },
              ]}
            />
            <Select
              label="Branch"
              value={branchName}
              onChange={(e) => setBranchName(e.target.value)}
              options={[
                { label: 'No Branch', value: '' },
                ...(branches?.data ?? []).map((b) => ({ label: b.name, value: b.name })),
              ]}
            />
          </div>
        </Modal>

        <ConfirmDialog
          isOpen={!!confirmDeactivate}
          onClose={() => setConfirmDeactivate(null)}
          title="Deactivate Staff Member"
          message={`Are you sure you want to deactivate ${confirmDeactivate?.name}? They will no longer be able to access the system.`}
          confirmLabel="Deactivate"
          variant="danger"
          isLoading={deactivateStaff.isPending}
          onConfirm={async () => {
            if (!confirmDeactivate) return;
            try {
              await deactivateStaff.mutateAsync(confirmDeactivate.id);
              toast.success(`${confirmDeactivate.name} has been deactivated`);
              setConfirmDeactivate(null);
            } catch (err) {
              toast.error(getApiErrorMessage(err, 'Failed to deactivate staff'));
            }
          }}
        />

        <ConfirmDialog
          isOpen={!!confirmRestore}
          onClose={() => setConfirmRestore(null)}
          title="Restore Staff Member"
          message={`Are you sure you want to restore ${confirmRestore?.name}? They will regain access to the system.`}
          confirmLabel="Restore"
          variant="info"
          isLoading={restoreStaff.isPending}
          onConfirm={async () => {
            if (!confirmRestore) return;
            try {
              await restoreStaff.mutateAsync(confirmRestore.id);
              toast.success(`${confirmRestore.name} has been restored`);
              setConfirmRestore(null);
            } catch (err) {
              toast.error(getApiErrorMessage(err, 'Failed to restore staff'));
            }
          }}
        />
      </div>
    </PageTransition>
  );
}
