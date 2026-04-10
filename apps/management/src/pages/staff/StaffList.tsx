import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, UserCheck, UserX, Building, Shield, Plus, Edit, UserMinus, RotateCcw } from 'lucide-react';
import { useHeaderConfig } from '@/hooks/useHeaderConfig';
import { useCreateStaff, useStaffList, useDeactivateStaff, useRestoreStaff } from '@/api/staff';
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
import { usePermission } from '@/hooks/usePermission';
import type { StaffMember } from '@/types/models';
import { toast } from 'sonner';

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

export default function StaffList() {
  const navigate = useNavigate();
  const perm = usePermission();
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
    sortBy: sortField || undefined,
    sortDir: sortField ? sortDir : undefined,
  });

  const { data: allData } = useStaffList({ limit: 500 });

  const staff = data?.data ?? [];
  const allStaff = allData?.data ?? [];
  const meta = data?.meta;

  const stats = useMemo(() => {
    const total = meta?.total ?? allStaff.length;
    const active = allStaff.filter(s => s.isActive).length;
    const inactive = allStaff.filter(s => !s.isActive).length;
    const branches = new Set(allStaff.map(s => s.branch)).size;
    return [
      { title: 'Total Staff', value: total, icon: <Users />, iconBg: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
      { title: 'Active', value: active, icon: <UserCheck />, iconBg: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' },
      { title: 'Inactive', value: inactive, icon: <UserX />, iconBg: 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400' },
      { title: 'Branches', value: branches, icon: <Building />, iconBg: 'bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' },
    ];
  }, [allStaff, meta]);

  const headerConfig = useMemo(() => ({
    title: 'Staff',
    breadcrumbs: [{ label: 'Home', href: '/' }, { label: 'Staff' }],
    actions: [
      { type: 'button' as const, label: 'New Staff', icon: Plus, onClick: () => setOpenCreate(true) },
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
  }), [search, role]);

  useHeaderConfig(headerConfig);

  const handleSort = (field: string) => {
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
          {new Date(row.joinDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
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
        <StatsRow items={stats} loading={isLoading} />

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
                    toast.error(err instanceof Error ? err.message : 'Failed to create staff');
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
              toast.error(err instanceof Error ? err.message : 'Failed to deactivate staff');
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
              toast.error(err instanceof Error ? err.message : 'Failed to restore staff');
            }
          }}
        />
      </div>
    </PageTransition>
  );
}
