import { useMemo } from 'react';
import { Users } from 'lucide-react';
import { useHeaderConfig } from '@/hooks/useHeaderConfig';
import { usePositions } from '@/api/hr';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Badge } from '@/components/ui/Badge';
import { PageTransition } from '@/components/ui/PageTransition';
import type { Position } from '@/types/models';

const typeLabels: Record<string, string> = {
  full_time: 'Full Time',
  part_time: 'Part Time',
  contract: 'Contract',
  internship: 'Internship',
};

const typeVariants: Record<string, 'primary' | 'success' | 'warning' | 'info'> = {
  full_time: 'primary',
  part_time: 'info',
  contract: 'warning',
  internship: 'success',
};

export default function Positions() {
  const { data, isLoading } = usePositions();
  const positions = data ?? [];

  const headerConfig = useMemo(() => ({
    title: 'Open Positions',
    breadcrumbs: [
      { label: 'HR', href: '/hr' },
      { label: 'Positions', icon: Users },
    ],
    actions: [],
  }), []);
  useHeaderConfig(headerConfig);

  const columns: Column<Position>[] = [
    {
      key: 'title',
      label: 'Title',
      sticky: true,
      render: (row) => (
        <span className="font-semibold text-gray-900 dark:text-gray-100">{row.title}</span>
      ),
    },
    { key: 'department', label: 'Department' },
    { key: 'location', label: 'Location' },
    {
      key: 'type',
      label: 'Type',
      render: (row) => (
        <Badge variant={typeVariants[row.type] ?? 'default'}>
          {typeLabels[row.type] ?? row.type}
        </Badge>
      ),
    },
    {
      key: 'applicationsCount',
      label: 'Applications',
      align: 'center',
      render: (row) => (
        <span className="font-medium">{row.applicationsCount}</span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'postedDate',
      label: 'Posted',
      render: (row) => (
        <span className="text-gray-500 dark:text-gray-400">{row.postedDate}</span>
      ),
    },
  ];

  return (
    <PageTransition>
      <DataTable
        columns={columns}
        data={positions}
        isLoading={isLoading}
        getRowId={(row) => row.id}
        emptyTitle="No positions found"
      />
    </PageTransition>
  );
}
