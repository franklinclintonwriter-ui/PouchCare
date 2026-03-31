import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LifeBuoy } from 'lucide-react';
import { useHeaderConfig } from '@/hooks/useHeaderConfig';
import { useTickets } from '@/api/support';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Tabs } from '@/components/ui/Tabs';
import { PageTransition } from '@/components/ui/PageTransition';
import type { Ticket } from '@/types/models';

const tabs = [
  { label: 'All', value: 'all' },
  { label: 'Open', value: 'open' },
  { label: 'Resolved', value: 'resolved' },
];

export default function TicketList() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('all');
  const [page, setPage] = useState(1);

  const params = useMemo(() => ({
    status: tab === 'all' ? undefined : tab,
    page,
    limit: 20,
  }), [tab, page]);

  const { data, isLoading } = useTickets(params);
  const tickets = data?.data ?? [];

  const headerConfig = useMemo(() => ({
    title: 'Support Tickets',
    breadcrumbs: [{ label: 'Support', icon: LifeBuoy }],
    actions: [],
  }), []);
  useHeaderConfig(headerConfig);

  const columns: Column<Ticket>[] = [
    {
      key: 'number',
      label: 'Ticket #',
      sticky: true,
      render: (row) => (
        <span className="font-semibold text-gray-900 dark:text-gray-100">{row.number}</span>
      ),
    },
    {
      key: 'subject',
      label: 'Subject',
      render: (row) => (
        <span className="max-w-[200px] truncate">{row.subject}</span>
      ),
    },
    { key: 'clientName', label: 'Client' },
    {
      key: 'priority',
      label: 'Priority',
      render: (row) => <StatusBadge status={row.priority} />,
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'createdAt',
      label: 'Created',
      render: (row) => (
        <span className="text-gray-500 dark:text-gray-400">{row.createdAt}</span>
      ),
    },
    {
      key: 'lastReplyAt',
      label: 'Last Reply',
      render: (row) => (
        <span className="text-gray-500 dark:text-gray-400">{row.lastReplyAt}</span>
      ),
    },
  ];

  return (
    <PageTransition className="space-y-4">
      <Tabs tabs={tabs} value={tab} onChange={(v) => { setTab(v); setPage(1); }} />

      <DataTable
        columns={columns}
        data={tickets}
        isLoading={isLoading}
        getRowId={(row) => row.id}
        onRowClick={(row) => navigate(`/support/${row.id}`)}
        pagination={data?.meta}
        onPageChange={setPage}
        emptyTitle="No tickets found"
      />
    </PageTransition>
  );
}
