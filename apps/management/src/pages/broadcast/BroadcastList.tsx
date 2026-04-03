import { useMemo, useState } from 'react';
import { Megaphone, Plus } from 'lucide-react';
import { useHeaderConfig } from '@/hooks/useHeaderConfig';
import { useBroadcasts, useCreateBroadcast } from '@/api/broadcast';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { PageTransition } from '@/components/ui/PageTransition';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { formatCompact } from '@/mocks/generators';
import type { Broadcast } from '@/types/models';
import { toast } from 'sonner';

const channelColors: Record<string, 'primary' | 'success' | 'warning'> = {
  email: 'primary',
  sms: 'success',
  push: 'warning',
  in_app: 'primary',
};

const AUDIENCE_OPTIONS = [
  { label: 'All Users', value: 'all' },
  { label: 'Staff Only', value: 'staff' },
  { label: 'Clients Only', value: 'clients' },
];

const CHANNEL_OPTIONS = [
  { label: 'In-App', value: 'in_app' },
  { label: 'Email', value: 'email' },
  { label: 'WhatsApp', value: 'whatsapp' },
];

export default function BroadcastList() {
  const { data: broadcasts, isLoading } = useBroadcasts();
  const createBroadcast = useCreateBroadcast();
  const [showCompose, setShowCompose] = useState(false);
  const [form, setForm] = useState({
    title: '',
    message: '',
    audience: 'all',
    channel: 'in_app',
    isUrgent: false,
  });

  const headerConfig = useMemo(() => ({
    title: 'Broadcasts',
    breadcrumbs: [{ label: 'Broadcasts', icon: Megaphone }],
    actions: [
      { type: 'button' as const, label: 'Compose', icon: Plus, onClick: () => setShowCompose(true) },
    ],
  }), []);
  useHeaderConfig(headerConfig);

  const handleCompose = async () => {
    if (!form.title.trim() || !form.message.trim()) {
      toast.error('Title and message are required');
      return;
    }
    try {
      await createBroadcast.mutateAsync(form);
      toast.success('Broadcast sent successfully');
      setShowCompose(false);
      setForm({ title: '', message: '', audience: 'all', channel: 'in_app', isUrgent: false });
    } catch {
      toast.error('Failed to send broadcast');
    }
  };

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

  const inputCls = 'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100';
  const labelCls = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1';

  return (
    <PageTransition>
      <DataTable
        columns={columns}
        data={broadcasts ?? []}
        isLoading={isLoading}
        getRowId={(row) => row.id}
        emptyTitle="No broadcasts found"
      />

      <Modal
        isOpen={showCompose}
        onClose={() => setShowCompose(false)}
        title="Compose Broadcast"
        description="Send a message to staff or clients"
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowCompose(false)}>Cancel</Button>
            <Button isLoading={createBroadcast.isPending} onClick={handleCompose}>Send Broadcast</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className={labelCls}>Title *</label>
            <input
              className={inputCls}
              placeholder="Broadcast subject line"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            />
          </div>
          <div>
            <label className={labelCls}>Message *</label>
            <textarea
              className={inputCls}
              rows={4}
              placeholder="Write your message here..."
              value={form.message}
              onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Audience</label>
              <select className={inputCls} value={form.audience} onChange={e => setForm(f => ({ ...f, audience: e.target.value }))}>
                {AUDIENCE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Channel</label>
              <select className={inputCls} value={form.channel} onChange={e => setForm(f => ({ ...f, channel: e.target.value }))}>
                {CHANNEL_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              id="isUrgent"
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              checked={form.isUrgent}
              onChange={e => setForm(f => ({ ...f, isUrgent: e.target.checked }))}
            />
            <label htmlFor="isUrgent" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Mark as urgent
            </label>
          </div>
        </div>
      </Modal>
    </PageTransition>
  );
}
