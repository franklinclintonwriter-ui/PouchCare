import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  ChevronRight,
  LayoutGrid,
  MapPin,
  Plus,
  Table2,
  Users,
} from 'lucide-react';
import { useHeaderConfig } from '@/hooks/useHeaderConfig';
import { useDebounce } from '@/hooks/useDebounce';
import { useBranches, useCreateBranch, useStaffForManager } from '@/api/admin-resources';
import { PageTransition } from '@/components/ui/PageTransition';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Pagination } from '@/components/ui/Pagination';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { toast } from 'sonner';
import type { Branch } from '@/api/admin-resources';

function formatRoleLabel(role: string) {
  return role.replace(/_/g, ' ');
}

type BranchViewMode = 'table' | 'cards';

export default function BranchManagement() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<BranchViewMode>('table');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 350);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [manager, setManager] = useState('');

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const { data, isLoading } = useBranches({
    page,
    limit: 20,
    ...(debouncedSearch.trim() ? { q: debouncedSearch.trim() } : {}),
  });
  const createBranch = useCreateBranch();

  const { data: staffCandidates, isLoading: staffLoading } = useStaffForManager();

  const managerOptions = useMemo(() => {
    const opts = [{ label: '— No manager —', value: '' }];
    if (staffCandidates) {
      for (const s of staffCandidates) {
        const hint = s.branch ? ` (${s.branch})` : '';
        const role = s.jobRole || formatRoleLabel(s.systemRole);
        opts.push({ label: `${s.name} — ${role}${hint}`, value: s.name });
      }
    }
    return opts;
  }, [staffCandidates]);

  const onSearchChange = useCallback((v: string) => setSearch(v), []);

  const onViewChange = useCallback((v: string) => {
    setViewMode(v === 'cards' ? 'cards' : 'table');
  }, []);

  useHeaderConfig(useMemo(() => ({
    title: 'Branch Management',
    breadcrumbs: [{ label: 'Home', href: '/' }, { label: 'Staff', href: '/staff' }, { label: 'Branches' }],
    actions: [
      {
        type: 'toggle' as const,
        value: viewMode,
        onChange: onViewChange,
        options: [
          { value: 'table', label: 'Table', icon: Table2 },
          { value: 'cards', label: 'Cards', icon: LayoutGrid },
        ],
      },
      {
        type: 'search' as const,
        placeholder: 'Search branches…',
        value: search,
        onChange: onSearchChange,
      },
      { type: 'button' as const, label: 'New Branch', icon: Plus, onClick: () => setOpen(true) },
    ],
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [search, viewMode, onViewChange, onSearchChange]));

  const rows = data?.data ?? [];
  const meta = data?.meta;

  const onCreate = async () => {
    if (!name.trim()) return toast.error('Branch name is required');
    try {
      await createBranch.mutateAsync({
        name: name.trim(),
        country: country || undefined,
        city: city || undefined,
        branchManager: manager || undefined,
      });
      setOpen(false);
      setName('');
      setCountry('');
      setCity('');
      setManager('');
      toast.success('Branch created');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create branch');
    }
  };

  const columns: Column<Branch>[] = [
    {
      key: 'name',
      label: 'Branch',
      sticky: true,
      render: (r) => (
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-50 dark:bg-primary-950/40">
            <Building2 className="h-4 w-4 text-primary-600 dark:text-primary-400" />
          </div>
          <div className="min-w-0">
            <p className="truncate font-semibold text-gray-900 dark:text-gray-100">{r.name}</p>
            {r.type ? (
              <p className="truncate text-[11px] text-gray-500 dark:text-gray-400">{r.type}</p>
            ) : null}
          </div>
        </div>
      ),
    },
    {
      key: 'location',
      label: 'Location',
      render: (r) => {
        const parts = [r.city, r.country].filter(Boolean);
        if (parts.length === 0) {
          return <span className="text-gray-400">—</span>;
        }
        return (
          <span className="inline-flex max-w-[14rem] items-center gap-1.5 text-sm text-gray-700 dark:text-gray-300">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-gray-400" aria-hidden />
            <span className="truncate">{parts.join(', ')}</span>
          </span>
        );
      },
    },
    {
      key: 'staffCount',
      label: 'Team',
      render: (r) => (
        <span className="inline-flex items-center gap-1 tabular-nums text-gray-800 dark:text-gray-200">
          <Users className="h-3.5 w-3.5 text-gray-400" aria-hidden />
          {r.staffCount ?? 0}
        </span>
      ),
    },
    {
      key: 'branchManager',
      label: 'Manager',
      render: (r) => <span className="text-sm text-gray-700 dark:text-gray-300">{r.branchManager || '—'}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (r) => (
        <div className="flex items-center gap-2">
          <Badge variant={r.status === 'Active' ? 'success' : 'default'} size="sm">
            {r.status}
          </Badge>
          <ChevronRight className="h-4 w-4 shrink-0 text-gray-300 dark:text-gray-600" aria-hidden />
        </div>
      ),
    },
  ];

  const emptyDesc = debouncedSearch.trim()
    ? 'Try a different search or clear filters.'
    : 'Create your first branch to organize teams by location.';

  return (
    <PageTransition className="space-y-6">
      <div className="mx-auto max-w-6xl space-y-6">
        {viewMode === 'table' ? (
          <DataTable
            columns={columns}
            data={rows}
            isLoading={isLoading}
            compact
            pagination={meta}
            onPageChange={setPage}
            onRowClick={(row) => navigate(`/staff/branches/${row.id}`)}
            emptyIcon={<Building2 />}
            emptyTitle="No branches found"
            emptyDescription={emptyDesc}
          />
        ) : (
          <div className="rounded-xl border border-gray-200/80 bg-white shadow-soft dark:border-gray-700/60 dark:bg-gray-800/80">
            {isLoading ? (
              <div className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3 lg:p-5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-40 rounded-xl" />
                ))}
              </div>
            ) : rows.length === 0 ? (
              <EmptyState
                icon={<Building2 />}
                title="No branches found"
                description={emptyDesc}
                className="py-12"
              />
            ) : (
              <>
                <div className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3 lg:p-5">
                  {rows.map((branch) => (
                    <BranchCard
                      key={branch.id}
                      branch={branch}
                      onClick={() => navigate(`/staff/branches/${branch.id}`)}
                    />
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
      </div>

      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title="Create Branch"
        footer={(
          <>
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={onCreate} isLoading={createBranch.isPending}>Create</Button>
          </>
        )}
      >
        <div className="space-y-3">
          <Input label="Branch Name" value={name} onChange={(e) => setName(e.target.value)} required />
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="Country" value={country} onChange={(e) => setCountry(e.target.value)} />
            <Input label="City" value={city} onChange={(e) => setCity(e.target.value)} />
          </div>
          <Select
            label="Branch Manager"
            value={manager}
            onChange={(e) => setManager(e.target.value)}
            options={managerOptions}
            disabled={staffLoading}
          />
          {manager ? (
            <p className="text-xs text-gray-500">
              Selected manager: <span className="font-medium">{manager}</span>
            </p>
          ) : null}
        </div>
      </Modal>
    </PageTransition>
  );
}

function BranchCard({ branch, onClick }: { branch: Branch; onClick: () => void }) {
  const locationParts = [branch.city, branch.country].filter(Boolean);
  return (
    <Card hover padding="none" onClick={onClick} className="group overflow-hidden">
      <div className="flex items-start gap-3 p-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-50 dark:bg-primary-950/40">
          <Building2 className="h-5 w-5 text-primary-600 dark:text-primary-400" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold leading-snug text-gray-900 dark:text-gray-100">{branch.name}</h3>
            <ChevronRight className="h-4 w-4 shrink-0 text-gray-300 transition-transform group-hover:translate-x-0.5 dark:text-gray-600" aria-hidden />
          </div>
          {branch.type ? (
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{branch.type}</p>
          ) : null}
        </div>
      </div>
      <div className="space-y-2 border-t border-gray-100 px-4 py-3 text-sm dark:border-gray-700/60">
        {locationParts.length > 0 ? (
          <p className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-gray-400" aria-hidden />
            <span className="line-clamp-2">{locationParts.join(', ')}</span>
          </p>
        ) : (
          <p className="text-gray-400">No location set</p>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={branch.status === 'Active' ? 'success' : 'default'} size="sm">
            {branch.status}
          </Badge>
          <span className="inline-flex items-center gap-1 text-xs tabular-nums text-gray-500 dark:text-gray-400">
            <Users className="h-3.5 w-3.5" aria-hidden />
            {branch.staffCount ?? 0}
            {' '}
            staff
          </span>
        </div>
        {branch.branchManager ? (
          <p className="truncate text-xs text-gray-500 dark:text-gray-400">
            Manager:
            {' '}
            <span className="font-medium text-gray-700 dark:text-gray-300">{branch.branchManager}</span>
          </p>
        ) : null}
      </div>
    </Card>
  );
}
