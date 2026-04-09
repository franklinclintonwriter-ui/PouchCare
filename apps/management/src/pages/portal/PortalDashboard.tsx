import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Wallet, UserPlus } from 'lucide-react';
import { useHeaderConfig } from '@/hooks/useHeaderConfig';
import { useAuthStore } from '@/store/authStore';
import { usePortalOrders } from '@/api/portal';
import { formatCurrency } from '@/lib/format';
import { PageTransition } from '@/components/ui/PageTransition';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { StatsRow } from '@/components/shared/StatsRow';
import { WalletCard } from '@/components/shared/WalletCard';
import { DataTable, type Column } from '@/components/ui/DataTable';
import type { PortalUser } from '@/types/auth';
import type { PortalOrder } from '@/types/models';

export default function PortalDashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const portalUser = user as PortalUser;

  useHeaderConfig({ title: 'Dashboard', breadcrumbs: [{ label: 'Dashboard' }] });

  const { data: ordersData, isLoading } = usePortalOrders({ limit: 5 });
  const recentOrders = ordersData?.data ?? [];

  const stats = useMemo(() => {
    const active = recentOrders.filter(o => ['PENDING', 'PROCESSING'].includes(o.status)).length;
    const completed = recentOrders.filter(o => o.status === 'COMPLETED').length;
    const totalSpent = recentOrders.reduce((s, o) => s + (o.amount || 0), 0);
    return { active, completed, totalSpent };
  }, [recentOrders]);

  const columns: Column<PortalOrder>[] = [
    { key: 'number', label: 'Order #', render: (r) => <span className="font-mono text-xs">{r.number}</span> },
    { key: 'serviceName', label: 'Service' },
    { key: 'amount', label: 'Amount', render: (r) => formatCurrency(r.amount) },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} size="sm" /> },
  ];

  const quickActions = [
    { label: 'Place Order', icon: ShoppingBag, path: '/portal/order' },
    { label: 'View Wallet', icon: Wallet, path: '/portal/wallet' },
    { label: 'Invite Friends', icon: UserPlus, path: '/portal/referrals' },
  ];

  return (
    <PageTransition>
      <div className="space-y-5">
        {/* Welcome + Wallet */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <p className="text-sm text-gray-500 dark:text-gray-400">Welcome back,</p>
            <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-gray-100">
              {portalUser?.fullName ?? 'User'}
            </p>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {quickActions.map((a) => (
                <Button
                  key={a.path}
                  variant="outline"
                  size="sm"
                  icon={<a.icon className="h-3.5 w-3.5" />}
                  onClick={() => navigate(a.path)}
                  className="w-full justify-center text-[11px]"
                >
                  {a.label}
                </Button>
              ))}
            </div>
          </Card>
          <WalletCard
            balance={portalUser?.walletBalance ?? 0}
            compact
            onDeposit={() => navigate('/portal/wallet')}
            onWithdraw={() => navigate('/portal/wallet')}
          />
        </div>

        {/* Stats */}
        <StatsRow
          loading={isLoading}
          items={[
            { title: 'Active Orders', value: stats.active },
            { title: 'Completed', value: stats.completed },
            { title: 'Total Spent', value: formatCurrency(stats.totalSpent) },
            { title: 'Wallet', value: formatCurrency(portalUser?.walletBalance ?? 0) },
          ]}
        />

        {/* Recent Orders */}
        <Card padding="none">
          <div className="p-4 pb-0 sm:p-5 sm:pb-0">
            <CardHeader>
              <CardTitle>Recent Orders</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate('/portal/orders')}>
                View All
              </Button>
            </CardHeader>
          </div>
          <CardContent className="mt-0">
            <DataTable
              columns={columns}
              data={recentOrders}
              isLoading={isLoading}
              compact
              onRowClick={(r) => navigate(`/portal/orders/${r.id}`)}
              emptyTitle="No orders yet"
              emptyDescription="Place your first order to get started."
            />
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
}
