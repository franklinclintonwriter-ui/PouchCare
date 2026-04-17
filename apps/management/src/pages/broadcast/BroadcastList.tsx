import { useCallback, useMemo, useState, useEffect } from 'react';
import { Megaphone, Plus, Eye, Trash2, Radio, Users } from 'lucide-react';
import { useHeaderConfig } from '@/hooks/useHeaderConfig';
import { useBroadcasts, useCreateBroadcast, useDeleteBroadcast } from '@/api/broadcast';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { PageTransition } from '@/components/ui/PageTransition';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { formatDateTime } from '@/utils/format';
import type { Broadcast } from '@/types/models';
import type { BroadcastDeliverySummary } from '@/types/api';
import { toast } from 'sonner';

function formatDeliverySummary(d: BroadcastDeliverySummary): string {
  if (d.attempted === 0) return 'No recipients matched (check audience and contact info).';
  const parts: string[] = [];
  parts.push(`${d.sent} delivered`);
  if (d.skipped > 0) parts.push(`${d.skipped} skipped (dev / missing Resend)`);
  if (d.failed > 0) parts.push(`${d.failed} failed`);
  return parts.join(' · ');
}

const channelColors: Record<string, 'primary' | 'success' | 'warning'> = {
  email: 'primary',
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
];

const FILTER_CHANNELS = [{ label: 'All channels', value: '' }, ...CHANNEL_OPTIONS];
const FILTER_AUDIENCES = [
  { label: 'All audiences', value: '' },
  { label: 'All Users', value: 'all' },
  { label: 'Staff Only', value: 'staff' },
  { label: 'Clients Only', value: 'clients' },
];

function audienceLabel(value: string) {
  const o = AUDIENCE_OPTIONS.find((x) => x.value === value);
  return o?.label ?? value;
}

function truncate(text: string, max: number) {
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max)}…`;
}

export default function BroadcastList() {
  const [page, setPage] = useState(1);
  const [channelFilter, setChannelFilter] = useState('');
  const [audienceFilter, setAudienceFilter] = useState('');
  const [detail, setDetail] = useState<Broadcast | null>(null);
  const [showCompose, setShowCompose] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Broadcast | null>(null);
  const [form, setForm] = useState({
    title: '',
    message: '',
    audience: 'all',
    channel: 'in_app',
    isUrgent: false,
  });

  useEffect(() => { setPage(1); }, [channelFilter, audienceFilter]);

  const onChannelChange = useCallback((v: string) => setChannelFilter(v), []);
  const onAudienceChange = useCallback((v: string) => setAudienceFilter(v), []);

  const { data, isLoading, isError, error } = useBroadcasts({
    page,
    limit: 20,
    channel: channelFilter || undefined,
    audience: audienceFilter || undefined,
  });
  const broadcasts = data?.data ?? [];
  const meta = data?.meta;

  const createBroadcast = useCreateBroadcast();
  const deleteBroadcast = useDeleteBroadcast();

  const headerConfig = useMemo(() => ({
    title: 'Broadcasts',
    breadcrumbs: [{ label: 'Broadcasts', icon: Megaphone }],
    actions: [
      {
        type: 'filter' as const,
        label: 'Channel',
        icon: Radio,
        options: FILTER_CHANNELS,
        value: channelFilter,
        onChange: onChannelChange,
      },
      {
        type: 'filter' as const,
        label: 'Audience',
        icon: Users,
        options: FILTER_AUDIENCES,
        value: audienceFilter,
        onChange: onAudienceChange,
      },
      { type: 'button' as const, label: 'Compose', icon: Plus, onClick: () => setShowCompose(true) },
    ],
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [channelFilter, audienceFilter]);
  useHeaderConfig(headerConfig);

  const handleCompose = async () => {
    if (!form.title.trim() || !form.message.trim()) {
      toast.error('Title and message are required');
      return;
    }
    try {
      const { delivery } = await createBroadcast.mutateAsync(form);
      if (delivery) {
        toast.success(formatDeliverySummary(delivery));
      } else {
        toast.success('Broadcast sent successfully');
      }
      setShowCompose(false);
      setForm({ title: '', message: '', audience: 'all', channel: 'in_app', isUrgent: false });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save broadcast');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteBroadcast.mutateAsync(deleteTarget.id);
      toast.success('Broadcast deleted');
      if (detail?.id === deleteTarget.id) setDetail(null);
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Delete failed');
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
      key: 'message',
      label: 'Message',
      render: (row) => (
        <span className="line-clamp-2 max-w-xs text-gray-600 dark:text-gray-400" title={row.message}>
          {truncate(row.message, 120)}
        </span>
      ),
    },
    {
      key: 'channel',
      label: 'Channel',
      render: (row) => (
        <Badge variant={channelColors[row.channel] ?? 'default'}>
          {row.channel.replace(/_/g, ' ').toUpperCase()}
        </Badge>
      ),
    },
    {
      key: 'audience',
      label: 'Audience',
      render: (row) => <span>{audienceLabel(row.audience)}</span>,
    },
    {
      key: 'isUrgent',
      label: 'Urgent',
      render: (row) =>
        row.isUrgent ? (
          <Badge variant="warning">Yes</Badge>
        ) : (
          <span className="text-xs text-gray-400">—</span>
        ),
    },
    {
      key: 'sentBy',
      label: 'Sent by',
      render: (row) => <span className="text-gray-700 dark:text-gray-300">{row.sentBy}</span>,
    },
    {
      key: 'createdAt',
      label: 'Sent',
      render: (row) => (
        <span className="text-gray-500 dark:text-gray-400">{formatDateTime(row.createdAt)}</span>
      ),
    },
    {
      key: 'actions',
      label: '',
      align: 'right',
      width: '120px',
      render: (row) => (
        <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            icon={<Eye className="h-4 w-4" />}
            aria-label="View broadcast"
            onClick={() => setDetail(row)}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
            icon={<Trash2 className="h-4 w-4" />}
            aria-label="Delete broadcast"
            isLoading={deleteBroadcast.isPending && deleteBroadcast.variables === row.id}
            onClick={() => setDeleteTarget(row)}
          />
        </div>
      ),
    },
  ];


  return (
    <PageTransition>
      {isError && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
          {error instanceof Error ? error.message : 'Failed to load broadcasts'}
        </div>
      )}

      <DataTable
        columns={columns}
        data={broadcasts}
        isLoading={isLoading}
        getRowId={(row) => row.id}
        emptyTitle="No broadcasts found"
        emptyDescription="Compose a broadcast to reach staff or clients."
        pagination={meta}
        onPageChange={setPage}
      />

      <Modal
        isOpen={showCompose}
        onClose={() => setShowCompose(false)}
        title="Compose Broadcast"
        description="Send a message to staff or clients"
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowCompose(false)}>
              Cancel
            </Button>
            <Button isLoading={createBroadcast.isPending} onClick={handleCompose}>
              Send Broadcast
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {form.channel === 'email' && (
            <p className="rounded-lg border border-sky-200/80 bg-sky-50 px-3 py-2 text-xs text-sky-950 dark:border-sky-900/40 dark:bg-sky-950/30 dark:text-sky-100">
              Email delivery uses Resend. Set <code className="rounded bg-white/60 px-1 dark:bg-black/20">RESEND_API_KEY</code> and{' '}
              <code className="rounded bg-white/60 px-1 dark:bg-black/20">EMAIL_FROM</code> in the API environment. Without them, sends are logged only (skipped).
            </p>
          )}
          <Input
            label="Title *"
            placeholder="Broadcast subject line"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          />
          <Textarea
            label="Message *"
            rows={4}
            placeholder="Write your message here..."
            value={form.message}
            onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Select
              label="Audience"
              value={form.audience}
              onChange={(e) => setForm((f) => ({ ...f, audience: e.target.value }))}
              options={AUDIENCE_OPTIONS}
            />
            <Select
              label="Channel"
              value={form.channel}
              onChange={(e) => setForm((f) => ({ ...f, channel: e.target.value }))}
              options={CHANNEL_OPTIONS}
            />
          </div>
          <label className="flex cursor-pointer items-center gap-2.5">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              checked={form.isUrgent}
              onChange={(e) => setForm((f) => ({ ...f, isUrgent: e.target.checked }))}
            />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Mark as urgent</span>
          </label>
        </div>
      </Modal>

      <Modal
        isOpen={detail != null}
        onClose={() => setDetail(null)}
        title={detail?.title ?? 'Broadcast'}
        description={`Sent ${detail ? formatDateTime(detail.createdAt) : ''} · ${detail ? audienceLabel(detail.audience) : ''}`}
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDetail(null)}>
              Close
            </Button>
            {detail && (
              <Button
                variant="danger"
                isLoading={deleteBroadcast.isPending}
                onClick={() => setDeleteTarget(detail)}
              >
                Delete
              </Button>
            )}
          </>
        }
      >
        {detail && (
          <div className="space-y-3 text-sm">
            <div className="flex flex-wrap gap-2">
              <Badge variant={channelColors[detail.channel] ?? 'default'}>
                {detail.channel.replace(/_/g, ' ').toUpperCase()}
              </Badge>
              {detail.isUrgent && <Badge variant="warning">Urgent</Badge>}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              From <span className="font-medium text-gray-700 dark:text-gray-300">{detail.sentBy}</span>
            </p>
            <div className="rounded-lg border border-gray-200 bg-gray-50/80 p-3 whitespace-pre-wrap text-gray-800 dark:border-gray-600 dark:bg-gray-900/40 dark:text-gray-100">
              {detail.message}
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Broadcast"
        message={`Delete broadcast "${deleteTarget?.title}"? This cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        isLoading={deleteBroadcast.isPending}
        onConfirm={handleDelete}
      />
    </PageTransition>
  );
}
