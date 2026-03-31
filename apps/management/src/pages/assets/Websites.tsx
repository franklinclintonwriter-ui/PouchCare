import { useMemo } from 'react';
import { Globe2 } from 'lucide-react';
import { useHeaderConfig } from '@/hooks/useHeaderConfig';
import { useWebsites } from '@/api/assets';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { PageTransition } from '@/components/ui/PageTransition';
import { formatCompact } from '@/mocks/generators';
import type { WebsiteAsset } from '@/types/models';

export default function Websites() {
  const { data, isLoading } = useWebsites();
  const websites = data?.data ?? [];

  const headerConfig = useMemo(() => ({
    title: 'Websites',
    breadcrumbs: [
      { label: 'Assets', href: '/assets' },
      { label: 'Websites', icon: Globe2 },
    ],
    actions: [],
  }), []);
  useHeaderConfig(headerConfig);

  const columns: Column<WebsiteAsset>[] = [
    {
      key: 'name',
      label: 'Name',
      sticky: true,
      render: (row) => (
        <span className="font-semibold text-gray-900 dark:text-gray-100">{row.name}</span>
      ),
    },
    {
      key: 'url',
      label: 'URL',
      render: (row) => (
        <a
          href={row.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary-600 hover:underline dark:text-primary-400"
          onClick={(e) => e.stopPropagation()}
        >
          {row.url.replace('https://', '')}
        </a>
      ),
    },
    { key: 'serverName', label: 'Server' },
    { key: 'domainName', label: 'Domain' },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'monthlyTraffic',
      label: 'Traffic',
      align: 'right',
      render: (row) => (
        <span className="font-medium">{formatCompact(row.monthlyTraffic)}</span>
      ),
    },
    {
      key: 'lastDeploy',
      label: 'Last Deploy',
      render: (row) => (
        <span className="text-gray-500 dark:text-gray-400">{row.lastDeploy}</span>
      ),
    },
  ];

  return (
    <PageTransition>
      <DataTable
        columns={columns}
        data={websites}
        isLoading={isLoading}
        getRowId={(row) => row.id}
        emptyTitle="No websites found"
      />
    </PageTransition>
  );
}
