import { useMemo } from 'react';
import { Globe, AlertTriangle } from 'lucide-react';
import { useHeaderConfig } from '@/hooks/useHeaderConfig';
import { useDomains } from '@/api/assets';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Card } from '@/components/ui/Card';
import { PageTransition } from '@/components/ui/PageTransition';
import { formatCurrency } from '@/mocks/generators';
import type { Domain } from '@/types/models';

export default function Domains() {
  const { data, isLoading } = useDomains();
  const domains = data?.data ?? [];

  const headerConfig = useMemo(() => ({
    title: 'Domains',
    breadcrumbs: [
      { label: 'Assets', href: '/assets' },
      { label: 'Domains', icon: Globe },
    ],
    actions: [],
  }), []);
  useHeaderConfig(headerConfig);

  const now = new Date();
  const expiringDomains = domains.filter((d) => {
    const diff = (new Date(d.expiryDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return diff > 0 && diff < 30;
  });

  const columns: Column<Domain>[] = [
    {
      key: 'domain',
      label: 'Domain',
      sticky: true,
      render: (row) => (
        <span className="font-semibold text-gray-900 dark:text-gray-100">{row.domain}</span>
      ),
    },
    { key: 'registrar', label: 'Registrar' },
    {
      key: 'expiryDate',
      label: 'Expiry',
      render: (row) => {
        const diff = (new Date(row.expiryDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
        const isExpiring = diff < 30;
        return (
          <span className={isExpiring ? 'font-medium text-red-600 dark:text-red-400' : ''}>
            {row.expiryDate}
          </span>
        );
      },
    },
    {
      key: 'autoRenew',
      label: 'Auto-Renew',
      align: 'center',
      render: (row) => (
        <span
          className={`inline-block h-2.5 w-2.5 rounded-full ${
            row.autoRenew ? 'bg-emerald-500' : 'bg-red-500'
          }`}
        />
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    { key: 'dnsProvider', label: 'DNS' },
    {
      key: 'annualCost',
      label: 'Cost',
      align: 'right',
      render: (row) => (
        <span className="font-medium">{formatCurrency(row.annualCost)}/yr</span>
      ),
    },
  ];

  return (
    <PageTransition className="space-y-4">
      {expiringDomains.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/60 dark:border-amber-700/40 dark:bg-amber-900/10">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-amber-100 p-2 dark:bg-amber-900/30">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                {expiringDomains.length} domain{expiringDomains.length > 1 ? 's' : ''} expiring within 30 days
              </p>
              <p className="text-xs text-amber-600 dark:text-amber-400">
                {expiringDomains.map((d) => d.domain).join(', ')}
              </p>
            </div>
          </div>
        </Card>
      )}

      <DataTable
        columns={columns}
        data={domains}
        isLoading={isLoading}
        getRowId={(row) => row.id}
        emptyTitle="No domains found"
      />
    </PageTransition>
  );
}
