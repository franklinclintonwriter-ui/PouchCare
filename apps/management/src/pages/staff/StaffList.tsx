import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, UserCheck, UserX, Building, Shield, Plus } from 'lucide-react';
import { useHeaderConfig } from '@/hooks/useHeaderConfig';
import { useCreateStaff, useStaffList } from '@/api/staff';
import { PageTransition } from '@/components/ui/PageTransition';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { StatsRow } from '@/components/shared/StatsRow';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
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
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [page, setPage] = useState(1);
  const [sortField, setSortField] = useState('');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [openCreate, setOpenCreate] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [systemRole, setSystemRole] = useState('STAFF');
  const [branchName, setBranchName] = useState('');
  const createStaff = useCreateStaff();

  const { data, isLoading } = useStaffList({
    q: search || undefined,
    role: role || undefined,
    page,
    limit: 20,
  });

  const staff = data?.data ?? [];
  const meta = data?.meta;

  const stats = useMemo(() => {
    const total = meta?.total ?? 0;
    const active = staff.filter(s => s.isActive).length;
    const inactive = staff.filter(s => !s.isActive).length;
    const branches = new Set(staff.map(s => s.branch)).size;
    return [
      { title: 'Total Staff', value: total, icon: <Users />, iconBg: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
      { title: 'Active', value: active, icon: <UserCheck />, iconBg: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' },
      { title: 'Inactive', value: inactive, icon: <UserX />, iconBg: 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400' },
      { title: 'Branches', value: branches, icon: <Building />, iconBg: 'bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' },
    ];
  }, [staff, meta]);

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
            <Input label="Branch" value={branchName} onChange={(e) => setBranchName(e.target.value)} />
          </div>
        </Modal>
      </div>
    </PageTransition>
  );
}
