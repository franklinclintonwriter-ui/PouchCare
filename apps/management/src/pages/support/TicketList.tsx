import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LifeBuoy, Plus } from 'lucide-react';
import { useHeaderConfig } from '@/hooks/useHeaderConfig';
import { useCreateTicket, useTickets } from '@/api/support';
import { usePermission } from '@/hooks/usePermission';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Tabs } from '@/components/ui/Tabs';
import { PageTransition } from '@/components/ui/PageTransition';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import type { Ticket } from '@/types/models';
import { toast } from 'sonner';

const tabs = [
  { label: 'All', value: 'all' },
  { label: 'Open', value: 'open' },
  { label: 'Resolved', value: 'resolved' },
];

export default function TicketList() {
  const navigate = useNavigate();
  const permission = usePermission();
  const [tab, setTab] = useState('all');
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const createTicket = useCreateTicket();
  const [createForm, setCreateForm] = useState({ subject: '', message: '', priority: 'MEDIUM' });

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
    actions: permission.isStaff
      ? [{ type: 'button' as const, label: 'New Ticket', icon: Plus, onClick: () => setCreateOpen(true) }]
      : [],
  }), [permission]);
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
        emptyDescription="Create a ticket to get support."
      />

      <Modal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        title="New Ticket"
        footer={(
          <>
            <Button variant="outline" size="sm" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button
              size="sm"
              isLoading={createTicket.isPending}
              onClick={async () => {
                const subject = createForm.subject.trim();
                const message = createForm.message.trim();
                if (!subject || !message) return toast.error('Subject and message are required');
                try {
                  await createTicket.mutateAsync({ subject, message, priority: createForm.priority });
                  setCreateOpen(false);
                  setCreateForm({ subject: '', message: '', priority: 'MEDIUM' });
                  toast.success('Ticket created');
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : 'Failed to create ticket');
                }
              }}
            >
              Create
            </Button>
          </>
        )}
      >
        <div className="space-y-3">
          <Input label="Subject" value={createForm.subject} onChange={(e) => setCreateForm((s) => ({ ...s, subject: e.target.value }))} />
          <Select
            label="Priority"
            value={createForm.priority}
            onChange={(e) => setCreateForm((s) => ({ ...s, priority: e.target.value }))}
            options={[
              { label: 'Low', value: 'LOW' },
              { label: 'Medium', value: 'MEDIUM' },
              { label: 'High', value: 'HIGH' },
              { label: 'Critical', value: 'CRITICAL' },
            ]}
          />
          <Textarea label="Message" value={createForm.message} onChange={(e) => setCreateForm((s) => ({ ...s, message: e.target.value }))} />
        </div>
      </Modal>
    </PageTransition>
  );
}
