import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, UserCheck, Clock, ShieldOff, CircleDot } from 'lucide-react';
import { useHeaderConfig } from '@/hooks/useHeaderConfig';
import { usePortalMembers, useUpdateMemberStatus } from '@/api/admin-portal';
import { PageTransition } from '@/components/ui/PageTransition';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Avatar } from '@/components/ui/Avatar';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { StatsRow } from '@/components/shared/StatsRow';
import { Button } from '@/components/ui/Button';
import { useCurrency } from '@/hooks/useCurrency';
import type { PortalMember } from '@/types/models';
import { toast } from 'sonner';

export default function PortalMembers() {
  const navigate = useNavigate();
  const { formatCurrency } = useCurrency();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const updateStatus = useUpdateMemberStatus();

  const { data, isLoading } = usePortalMembers({
    q: search || undefined,
    status: status || undefined,
    page,
    limit: 20,
  });

  const members = data?.data ?? [];
  const meta = data?.meta;

  const stats = useMemo(() => {
    const total = meta?.total ?? 0;
    const active = members.filter(m => m.status === 'ACTIVE').length;
    const pending = members.filter(m => m.status === 'PENDING_VERIFICATION').length;
    const suspended = members.filter(m => m.status === 'SUSPENDED').length;
    return [
      { title: 'Total Members', value: total, icon: <Users />, iconBg: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
      { title: 'Active', value: active, icon: <UserCheck />, iconBg: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' },
      { title: 'Pending', value: pending, icon: <Clock />, iconBg: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' },
      { title: 'Suspended', value: suspended, icon: <ShieldOff />, iconBg: 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400' },
    ];
  }, [members, meta]);

  const headerConfig = useMemo(() => ({
    title: 'Portal Members',
    breadcrumbs: [
      { label: 'Admin', href: '/admin/portal' },
      { label: 'Portal', href: '/admin/portal' },
      { label: 'Members' },
    ],
    actions: [
      { type: 'search' as const, placeholder: 'Search members...', value: search, onChange: setSearch },
      {
        type: 'filter' as const,
        label: 'Status',
        icon: CircleDot,
        options: [
          { label: 'All Statuses', value: '' },
          { label: 'Active', value: 'ACTIVE' },
          { label: 'Pending', value: 'PENDING_VERIFICATION' },
          { label: 'Suspended', value: 'SUSPENDED' },
          { label: 'Inactive', value: 'INACTIVE' },
        ],
        value: status,
        onChange: setStatus,
      },
    ],
  }), [search, status]);

  useHeaderConfig(headerConfig);

  const columns: Column<PortalMember>[] = [
    {
      key: 'fullName',
      label: 'Member',
      sticky: true,
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <Avatar name={row.fullName} src={row.avatarUrl} size="sm" />
          <div>
            <p className="font-medium text-gray-900 dark:text-gray-100">{row.fullName}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'email',
      label: 'Email',
      render: (row) => (
        <span className="text-sm text-gray-500 dark:text-gray-400">{row.email}</span>
      ),
    },
    {
      key: 'country',
      label: 'Country',
      render: (row) => (
        <span className="text-sm text-gray-600 dark:text-gray-400">{row.country}</span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'walletBalance',
      label: 'Balance',
      render: (row) => (
        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{formatCurrency(row.walletBalance)}</span>
      ),
    },
    {
      key: 'referralCode',
      label: 'Referral Code',
      render: (row) => (
        <span className="rounded bg-gray-100 px-2 py-0.5 font-mono text-xs text-gray-700 dark:bg-gray-700 dark:text-gray-300">{row.referralCode}</span>
      ),
    },
    {
      key: 'totalOrders',
      label: 'Orders',
      render: (row) => (
        <span className="text-sm text-gray-600 dark:text-gray-400">{row.totalOrders}</span>
      ),
    },
    {
      key: 'joinDate',
      label: 'Joined',
      render: (row) => (
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {new Date(row.joinDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="outline"
            isLoading={updateStatus.isPending}
            onClick={async (e) => {
              e.stopPropagation();
              try {
                await updateStatus.mutateAsync({ id: row.id, status: 'ACTIVE' });
                toast.success('Member activated');
              } catch (err) {
                toast.error(err instanceof Error ? err.message : 'Failed');
              }
            }}
          >
            Activate
          </Button>
          <Button
            size="sm"
            variant="ghost"
            isLoading={updateStatus.isPending}
            onClick={async (e) => {
              e.stopPropagation();
              try {
                await updateStatus.mutateAsync({ id: row.id, status: 'SUSPENDED' });
                toast.success('Member suspended');
              } catch (err) {
                toast.error(err instanceof Error ? err.message : 'Failed');
              }
            }}
          >
            Suspend
          </Button>
        </div>
      ),
    },
  ];

  return (
    <PageTransition>
      <div className="space-y-6">
        <StatsRow items={stats} loading={isLoading} />

        <DataTable
          columns={columns}
          data={members}
          isLoading={isLoading}
          onRowClick={(row) => navigate(`/admin/portal/members/${row.id}`)}
          pagination={meta}
          onPageChange={setPage}
          emptyTitle="No members found"
          emptyDescription="Try adjusting your search or filters"
        />
      </div>
    </PageTransition>
  );
}
