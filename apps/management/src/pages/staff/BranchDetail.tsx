import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  Building2,
  Pencil,
  Trash2,
  Users,
  UserCircle,
  CheckCircle2,
  ListTodo,
  Star,
} from 'lucide-react';
import { useHeaderConfig } from '@/hooks/useHeaderConfig';
import { useDebounce } from '@/hooks/useDebounce';
import {
  useBranchDetail,
  useBranchMembers,
  useUpdateBranch,
  useDeleteBranch,
  type BranchMemberRow,
  type BranchReferenceBreakdown,
} from '@/api/admin-resources';
import { PageTransition } from '@/components/ui/PageTransition';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { toast } from 'sonner';

const STATUS_OPTIONS = [
  { label: 'Active', value: 'Active' },
  { label: 'Inactive', value: 'Inactive' },
  { label: 'Suspended', value: 'Suspended' },
];

function formatRole(role: string) {
  return role.replace(/_/g, ' ');
}

export default function BranchDetail() {
  const { branchId } = useParams<{ branchId: string }>();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [memberSearch, setMemberSearch] = useState('');
  const debouncedMemberQ = useDebounce(memberSearch, 350);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    country: '',
    city: '',
    type: '',
    status: 'Active',
    branchManager: '',
    email: '',
    phone: '',
    address: '',
    notes: '',
  });

  const { data, isLoading, isError } = useBranchDetail(branchId);
  const { data: membersPage, isLoading: membersLoading } = useBranchMembers(branchId, {
    page,
    limit: 15,
    ...(debouncedMemberQ.trim() ? { q: debouncedMemberQ.trim() } : {}),
  });

  useEffect(() => {
    setPage(1);
    setMemberSearch('');
  }, [branchId]);

  useEffect(() => {
    setPage(1);
  }, [debouncedMemberQ]);
  const updateBranch = useUpdateBranch();
  const deleteBranch = useDeleteBranch();

  const branch = data?.branch;
  const stats = data?.stats;
  const managerMember = data?.managerMember;
  const refs = data?.references;

  const onMemberSearchChange = useCallback((v: string) => { setMemberSearch(v); setPage(1); }, []);

  const openEdit = useCallback(() => {
    if (!branch) return;
    setForm({
      name: branch.name,
      country: branch.country ?? '',
      city: branch.city ?? '',
      type: branch.type ?? '',
      status: branch.status,
      branchManager: branch.branchManager ?? '',
      email: branch.email ?? '',
      phone: branch.phone ?? '',
      address: branch.address ?? '',
      notes: branch.notes ?? '',
    });
    setEditOpen(true);
  }, [branch]);

  useHeaderConfig(
    useMemo(
      () => ({
        title: branch?.name ?? 'Branch',
        breadcrumbs: [
          { label: 'Staff', href: '/staff' },
          { label: 'Branches', href: '/staff/branches' },
          { label: branch?.name ?? '…' },
        ],
        actions: [
          { type: 'search' as const, placeholder: 'Search team members…', value: memberSearch, onChange: onMemberSearchChange },
          { type: 'button' as const, label: 'Edit', icon: Pencil, variant: 'outline' as const, onClick: openEdit },
          { type: 'button' as const, label: 'Delete', icon: Trash2, variant: 'danger' as const, onClick: () => setDeleteOpen(true) },
        ],
      }),
      [branch, memberSearch, onMemberSearchChange, openEdit],
    ),
  );

  const onSaveEdit = async () => {
    if (!branchId || !form.name.trim()) {
      toast.error('Branch name is required');
      return;
    }
    try {
      await updateBranch.mutateAsync({
        id: branchId,
        name: form.name.trim(),
        country: form.country || undefined,
        city: form.city || undefined,
        type: form.type || undefined,
        status: form.status,
        branchManager: form.branchManager || undefined,
        email: form.email || undefined,
        phone: form.phone || undefined,
        address: form.address || undefined,
        notes: form.notes || undefined,
      });
      setEditOpen(false);
      toast.success('Branch updated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Update failed');
    }
  };

  const onDelete = async () => {
    if (!branchId) return;
    try {
      await deleteBranch.mutateAsync(branchId);
      toast.success('Branch deleted');
      navigate('/staff/branches');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  const onSetManagerFromMember = useCallback(
    async (member: BranchMemberRow) => {
      if (!branchId) return;
      try {
        await updateBranch.mutateAsync({
          id: branchId,
          branchManager: member.name,
        });
        toast.success(`Manager set to ${member.name}`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Update failed');
      }
    },
    [branchId, updateBranch],
  );

  const memberRows = membersPage?.data ?? [];
  const memberMeta = membersPage?.meta;

  const columns: Column<BranchMemberRow>[] = useMemo(
    () => [
      {
        key: 'name',
        label: 'Name',
        sticky: true,
        render: (r) => (
          <Link
            to={`/staff/${r.id}`}
            className="font-medium text-primary-600 hover:underline dark:text-primary-400"
            onClick={(e) => e.stopPropagation()}
          >
            {r.name}
          </Link>
        ),
      },
      {
        key: 'systemRole',
        label: 'Role',
        render: (r) => <span className="text-xs text-gray-600 dark:text-gray-400">{formatRole(r.systemRole)}</span>,
      },
      { key: 'jobRole', label: 'Job', render: (r) => <span>{r.jobRole || '—'}</span> },
      {
        key: 'status',
        label: 'Status',
        render: (r) => (
          <Badge variant={(r.status || '').toLowerCase() === 'active' ? 'success' : 'default'} size="sm">
            {r.status || '—'}
          </Badge>
        ),
      },
      { key: 'tasksCompleted', label: 'Tasks', render: (r) => <span>{r.tasksCompleted}</span> },
      {
        key: 'rating',
        label: 'Avg rating',
        render: (r) => <span>{r.averageTaskRating != null ? r.averageTaskRating.toFixed(1) : '—'}</span>,
      },
      {
        key: 'actions',
        label: '',
        align: 'right',
        render: (r) => (
          <Button
            variant="ghost"
            size="sm"
            className="text-xs"
            onClick={(e) => {
              e.stopPropagation();
              void onSetManagerFromMember(r);
            }}
          >
            Set as manager
          </Button>
        ),
      },
    ],
    [onSetManagerFromMember],
  );

  if (isLoading) {
    return (
      <PageTransition>
        <Skeleton className="h-36 w-full rounded-xl" />
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      </PageTransition>
    );
  }

  if (isError || !branch || !stats || !refs) {
    return (
      <PageTransition>
        <Card>
          <p className="py-8 text-center text-gray-500">Branch not found or you don&apos;t have access.</p>
        </Card>
      </PageTransition>
    );
  }

  const roleEntries = Object.entries(stats.byRole).sort((a, b) => b[1] - a[1]);

  return (
    <PageTransition className="space-y-6">
      <Card padding="lg">
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-primary-50 p-2.5 dark:bg-primary-900/30">
              <Building2 className="h-6 w-6 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <CardTitle className="text-xl">{branch.name}</CardTitle>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <Badge variant={branch.status === 'Active' ? 'success' : 'default'} size="sm">
                  {branch.status}
                </Badge>
                {branch.type ? (
                  <span className="text-sm text-gray-500 dark:text-gray-400">{branch.type}</span>
                ) : null}
                {[branch.city, branch.country].filter(Boolean).length > 0 ? (
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    {[branch.city, branch.country].filter(Boolean).join(', ')}
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 border-t border-gray-100 pt-4 dark:border-gray-700/60 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Email" value={branch.email || '—'} />
          <Field label="Phone" value={branch.phone || '—'} />
          <Field label="Established" value={branch.establishedDate ? branch.establishedDate.slice(0, 10) : '—'} />
          {branch.address ? <Field label="Address" value={branch.address} /> : null}
          {branch.notes ? <Field label="Notes" value={branch.notes} className="sm:col-span-2 lg:col-span-3" /> : null}
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users} label="Members" value={String(stats.memberCount)} hint={`${stats.activeCount} active`} />
        <StatCard icon={UserCircle} label="Manager" value={branch.branchManager || '—'} hint={managerMember ? 'Linked to profile' : 'Set in edit or below'} />
        <StatCard icon={ListTodo} label="Tasks completed" value={String(stats.totalTasksCompleted)} hint="Sum across branch" />
        <StatCard icon={Star} label="Avg task rating" value={stats.avgTaskRating != null ? stats.avgTaskRating.toFixed(1) : '—'} hint="Members with ratings" />
      </div>

      <ReferencesCard refs={refs} />

      {managerMember ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Branch manager</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-100">{managerMember.name}</p>
              <p className="text-sm text-gray-500">{managerMember.email}</p>
              <p className="text-xs text-gray-400">{formatRole(managerMember.systemRole)}{managerMember.jobRole ? ` · ${managerMember.jobRole}` : ''}</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate(`/staff/${managerMember.id}`)}>
              View profile
            </Button>
          </CardContent>
        </Card>
      ) : branch.branchManager ? (
        <Card>
          <CardContent className="flex items-start gap-2 py-4 text-sm text-amber-800 dark:text-amber-200/90">
            <UserCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              Manager name is set to &quot;{branch.branchManager}&quot; but no staff profile matched this name at this branch.
              Use Edit to adjust the name or pick someone from the table below.
            </p>
          </CardContent>
        </Card>
      ) : null}

      {roleEntries.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Headcount by role</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {roleEntries.map(([role, n]) => (
              <Badge key={role} variant="default" size="sm">
                {formatRole(role)}: {n}
              </Badge>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <div>
        <div className="mb-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Team members</h2>
        </div>
        <DataTable
          columns={columns}
          data={memberRows}
          isLoading={membersLoading}
          pagination={memberMeta}
          onPageChange={setPage}
          onRowClick={(row) => navigate(`/staff/${row.id}`)}
          emptyIcon={<Users />}
          emptyTitle="No staff at this branch"
          emptyDescription="Assign staff to this branch name from HR / staff records."
        />
      </div>

      <Modal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit branch"
        footer={(
          <>
            <Button variant="outline" size="sm" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={onSaveEdit} isLoading={updateBranch.isPending}>Save</Button>
          </>
        )}
      >
        <div className="max-h-[70vh] space-y-3 overflow-y-auto pr-1">
          <Input label="Branch name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="Country" value={form.country} onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))} />
            <Input label="City" value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} />
          </div>
          <Input label="Type" value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))} placeholder="e.g. HQ, Regional" />
          <Select
            label="Status"
            value={form.status}
            onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
            options={STATUS_OPTIONS}
          />
          <Input
            label="Branch manager (display name)"
            value={form.branchManager}
            onChange={(e) => setForm((f) => ({ ...f, branchManager: e.target.value }))}
            placeholder="Must match a staff member name at this branch"
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="Email" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
            <Input label="Phone" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
          </div>
          <Input label="Address" value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
          <Input label="Notes" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete Branch"
        message={refs && refs.total > 0
          ? `Cannot delete: ${refs.total} record(s) still reference this branch. Clear all references first.`
          : `Permanently delete branch "${branch.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        isLoading={deleteBranch.isPending}
        onConfirm={refs?.total === 0 ? onDelete : () => setDeleteOpen(false)}
      />
    </PageTransition>
  );
}

function refBreakdownLines(refs: BranchReferenceBreakdown) {
  const rows = [
    { label: 'Staff', n: refs.staffMembers },
    { label: 'Tasks', n: refs.tasks },
    { label: 'Projects', n: refs.projects },
    { label: 'Attendance', n: refs.attendance },
    { label: 'Leave requests', n: refs.leaveRequests },
    { label: 'Daily reports', n: refs.dailyReports },
    { label: 'Performance ratings', n: refs.performanceRatings },
    { label: 'Payroll', n: refs.payroll },
    { label: 'Devices', n: refs.devices },
    { label: 'Expenses', n: refs.expenses },
    { label: 'Sales orders', n: refs.salesOrders },
    { label: 'Job postings', n: refs.jobPositions },
  ];
  return rows.filter((r) => r.n > 0);
}

function ReferencesCard({ refs }: { refs: BranchReferenceBreakdown }) {
  if (refs.total === 0) {
    return (
      <Card className="border-emerald-200/80 bg-emerald-50/40 dark:border-emerald-800/40 dark:bg-emerald-950/20">
        <CardContent className="flex items-start gap-2 py-4 text-sm text-emerald-900 dark:text-emerald-200/90">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <p>No other records reference this branch name. You can delete this branch when ready.</p>
        </CardContent>
      </Card>
    );
  }
  return (
    <Card className="border-amber-200/80 bg-amber-50/50 dark:border-amber-800/40 dark:bg-amber-950/20">
      <CardHeader>
        <CardTitle className="text-base text-amber-950 dark:text-amber-100">References block deletion</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-sm text-amber-950/90 dark:text-amber-100/90">
          {refs.total}
          {' '}
          record(s) still store this exact branch name across staff, HR, finance, and operations. Clear or reassign them before deleting.
        </p>
        <ul className="grid gap-1.5 text-sm sm:grid-cols-2">
          {refBreakdownLines(refs).map((r) => (
            <li key={r.label} className="flex justify-between gap-2 rounded-md bg-white/60 px-2 py-1 dark:bg-gray-900/40">
              <span className="text-gray-600 dark:text-gray-400">{r.label}</span>
              <span className="tabular-nums font-medium text-gray-900 dark:text-gray-100">{r.n}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function Field({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={className}>
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</p>
      <p className="mt-0.5 text-gray-900 dark:text-gray-100">{value}</p>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof Users;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <Card hover className="p-4">
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-gray-50 p-2 dark:bg-gray-700/50">
          <Icon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</p>
          <p className="text-2xl font-semibold tabular-nums text-gray-900 dark:text-gray-100">{value}</p>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
            <CheckCircle2 className="h-3 w-3 opacity-70" />
            {hint}
          </p>
        </div>
      </div>
    </Card>
  );
}
