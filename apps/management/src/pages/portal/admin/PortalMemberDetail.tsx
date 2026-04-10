import { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Mail, Globe, ShoppingBag, DollarSign, UsersRound, Wallet } from 'lucide-react';
import { useHeaderConfig } from '@/hooks/useHeaderConfig';
import { usePortalMember } from '@/api/admin-portal';
import { PageTransition } from '@/components/ui/PageTransition';
import { Card, CardContent } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Tabs } from '@/components/ui/Tabs';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatsRow } from '@/components/shared/StatsRow';
import { useCurrency } from '@/hooks/useCurrency';
import { DataTable, type Column } from '@/components/ui/DataTable';

export default function PortalMemberDetail() {
  const { id } = useParams<{ id: string }>();
  const { formatCurrency } = useCurrency();
  const { data: member, isLoading } = usePortalMember(id!);
  const [tab, setTab] = useState('overview');

  const headerConfig = useMemo(() => ({
    title: member?.fullName ?? 'Member',
    breadcrumbs: [
      { label: 'Admin', href: '/admin' },
      { label: 'Portal', href: '/admin/portal' },
      { label: 'Members', href: '/admin/portal/members' },
      { label: member?.fullName ?? '...' },
    ],
    actions: [],
  }), [member?.fullName]);

  useHeaderConfig(headerConfig);

  if (isLoading) {
    return (
      <PageTransition>
        <div className="space-y-6">
          <Card>
            <div className="flex items-center gap-4">
              <Skeleton className="h-16 w-16 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-44" />
                <Skeleton className="h-3 w-28" />
              </div>
            </div>
          </Card>
        </div>
      </PageTransition>
    );
  }

  if (!member) {
    return (
      <PageTransition>
        <div className="flex items-center justify-center py-20 text-gray-500 dark:text-gray-400">
          Member not found
        </div>
      </PageTransition>
    );
  }

  const overviewStats = [
    { title: 'Total Orders', value: member.totalOrders, icon: <ShoppingBag />, iconBg: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
    { title: 'Total Spent', value: formatCurrency(member.totalSpent), icon: <DollarSign />, iconBg: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' },
    { title: 'Referrals', value: (member as any).referralsCount ?? (member as any).totalReferrals ?? 0, icon: <UsersRound />, iconBg: 'bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' },
    { title: 'Balance', value: formatCurrency(member.walletBalance), icon: <Wallet />, iconBg: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' },
  ];

  const orderColumns: Column<any>[] = [
    { key: 'orderId', label: 'Order #', render: (r) => <span className="font-mono text-xs">#{r.orderId}</span> },
    { key: 'service', label: 'Service' },
    { key: 'amountUsd', label: 'Amount', align: 'right', render: (r) => formatCurrency(r.amountUsd || 0) },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} size="sm" /> },
    { key: 'orderDate', label: 'Date', render: (r) => <span className="text-xs text-gray-500">{new Date(r.orderDate).toLocaleDateString()}</span> },
  ];

  const walletColumns: Column<any>[] = [
    { key: 'transactionDate', label: 'Date', render: (r) => <span className="text-xs text-gray-500">{new Date(r.transactionDate).toLocaleDateString()}</span> },
    { key: 'type', label: 'Type' },
    {
      key: 'amountUsd',
      label: 'Amount',
      align: 'right',
      render: (r) => (
        <span className={r.amountUsd >= 0 ? 'text-emerald-600' : 'text-red-600'}>
          {r.amountUsd >= 0 ? '+' : ''}
          {formatCurrency(r.amountUsd || 0)}
        </span>
      ),
    },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} size="sm" /> },
  ];

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Profile card */}
        <Card>
          <div className="flex flex-col items-center gap-4 sm:flex-row">
            <Avatar name={member.fullName} src={member.avatarUrl} size="xl" />
            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                <StatusBadge status={member.status} />
              </div>
              <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">{member.email}</p>
              <div className="mt-2 flex flex-wrap items-center justify-center gap-3 sm:justify-start">
                <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                  <Globe className="h-3.5 w-3.5" />
                  {member.country}
                </span>
                <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                  <Mail className="h-3.5 w-3.5" />
                  {member.email}
                </span>
              </div>
              <div className="mt-2">
                <span className="rounded bg-gray-100 px-2 py-0.5 font-mono text-xs text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                  {member.referralCode}
                </span>
              </div>
              <p className="mt-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
                {formatCurrency(member.walletBalance)}
                <span className="ml-1 text-xs font-normal text-gray-500 dark:text-gray-400">balance</span>
              </p>
            </div>
          </div>
        </Card>

        {/* Tabs */}
        <Tabs
          tabs={[
            { label: 'Overview', value: 'overview' },
            { label: 'Orders', value: 'orders' },
            { label: 'Wallet', value: 'wallet' },
          ]}
          value={tab}
          onChange={setTab}
        />

        {tab === 'overview' && (
          <StatsRow items={overviewStats} />
        )}

        {tab === 'orders' && (
          <Card padding="none">
            <CardContent className="mt-0">
              <DataTable
                columns={orderColumns}
                data={(member as any).orders ?? []}
                emptyTitle="No orders"
                emptyDescription="This member has no portal orders yet."
                compact
              />
            </CardContent>
          </Card>
        )}

        {tab === 'wallet' && (
          <Card padding="none">
            <CardContent className="mt-0">
              <DataTable
                columns={walletColumns}
                data={(member as any).walletTx ?? []}
                emptyTitle="No wallet transactions"
                emptyDescription="No wallet activity found for this member."
                compact
              />
            </CardContent>
          </Card>
        )}
      </div>
    </PageTransition>
  );
}
