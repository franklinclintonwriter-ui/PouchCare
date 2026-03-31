import { useMemo } from 'react';
import { Megaphone } from 'lucide-react';
import { useHeaderConfig } from '@/hooks/useHeaderConfig';
import { useBroadcasts } from '@/api/broadcast';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { PageTransition } from '@/components/ui/PageTransition';
import { formatCompact } from '@/mocks/generators';
import type { Broadcast } from '@/types/models';

const channelColors: Record<string, 'primary' | 'success' | 'warning'> = {
  email: 'primary',
  sms: 'success',
  push: 'warning',
};

export default function BroadcastList() {
  const { data: broadcasts, isLoading } = useBroadcasts();

  const headerConfig = useMemo(() => ({
    title: 'Broadcasts',
    breadcrumbs: [{ label: 'Broadcasts', icon: Megaphone }],
    actions: [],
  }), []);
  useHeaderConfig(headerConfig);

  const columns: Column<Broadcast>[] = [
    {
      key: 'title',
      label: 'Title',
      render: (row) => (
        <span className="font-semibold text-gray-900 dark:text-gray-100">{row.title}</span>
      ),
    },
    {
      key: 'channel',
      label: 'Channel',
      render: (row) => (
        <Badge variant={channelColors[row.channel] ?? 'default'}>
          {row.channel.toUpperCase()}
        </Badge>
      ),
    },
    { key: 'audience', label: 'Audience' },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'recipientCount',
      label: 'Recipients',
      align: 'right',
      render: (row) => (
        <span className="font-medium">{formatCompact(row.recipientCount)}</span>
      ),
    },
    {
      key: 'openRate',
      label: 'Open Rate',
      render: (row) =>
        row.openRate != null ? (
          <div className="flex items-center gap-2">
            <ProgressBar value={row.openRate} size="sm" color="primary" className="w-16" />
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
              {row.openRate}%
            </span>
          </div>
        ) : (
          <span className="text-xs text-gray-400">--</span>
        ),
    },
    {
      key: 'sentDate',
      label: 'Sent Date',
      render: (row) => (
        <span className="text-gray-500 dark:text-gray-400">
          {row.sentDate ?? row.scheduledDate ?? '--'}
        </span>
      ),
    },
  ];

  return (
    <PageTransition>
      <DataTable
        columns={columns}
        data={broadcasts ?? []}
        isLoading={isLoading}
        getRowId={(row) => row.id}
        emptyTitle="No broadcasts found"
      />
    </PageTransition>
  );
}
