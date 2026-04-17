import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LifeBuoy, Plus } from 'lucide-react';
import { useHeaderConfig } from '@/hooks/useHeaderConfig';
import { useCreateTicket, useTickets } from '@/api/support';
import { PageTransition } from '@/components/ui/PageTransition';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';
import type { Ticket } from '@/types/models';

export default function PortalSupport() {
  const navigate = useNavigate();
  const [showNew, setShowNew] = useState(false);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const { data } = useTickets({ page: 1, limit: 50 });
  const createTicket = useCreateTicket();

  const tickets = data?.data ?? [];

  useHeaderConfig({
    title: 'Support',
    breadcrumbs: [
      { label: 'Dashboard', href: '/portal' },
      { label: 'Support' },
    ],
    actions: [
      { type: 'button', label: 'New Ticket', icon: Plus, onClick: () => setShowNew(true) },
    ],
  });

  const columns: Column<Ticket>[] = [
    { key: 'subject', label: 'Subject', render: (r) => <span className="text-sm font-medium">{r.subject}</span> },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} size="sm" /> },
    { key: 'lastReplyAt', label: 'Last Reply', render: (r) => <span className="text-xs text-gray-500">{r.lastReplyAt || '-'}</span> },
    { key: 'createdAt', label: 'Created', render: (r) => <span className="text-xs text-gray-500">{r.createdAt}</span> },
  ];

  return (
    <PageTransition>
      <div className="space-y-4">
        <DataTable
          columns={columns}
          data={tickets}
          onRowClick={(row) => navigate(`/portal/support/${row.id}`)}
          emptyIcon={<LifeBuoy />}
          emptyTitle="No tickets"
          emptyDescription="You haven't submitted any support tickets yet."
        />

        <Modal isOpen={showNew} onClose={() => setShowNew(false)} title="New Support Ticket">
          <div className="space-y-4">
            <Input label="Subject" placeholder="Brief description of your issue" value={subject} onChange={(e) => setSubject(e.target.value)} />
            <Textarea label="Message" placeholder="Describe your issue in detail..." value={message} onChange={(e) => setMessage(e.target.value)} />
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowNew(false)}>Cancel</Button>
              <Button
                size="sm"
                isLoading={createTicket.isPending}
                onClick={async () => {
                  if (!subject.trim() || !message.trim()) {
                    toast.error('Subject and message are required');
                    return;
                  }
                  try {
                    await createTicket.mutateAsync({ subject, message, priority: 'MEDIUM' });
                    toast.success('Ticket submitted');
                    setSubject('');
                    setMessage('');
                    setShowNew(false);
                  } catch (err) {
                    toast.error(err instanceof Error ? err.message : 'Failed to submit');
                  }
                }}
              >
                Submit
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </PageTransition>
  );
}
