import { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Megaphone, Users, Mail, Bell, Calendar, AlertTriangle, Pencil, Trash2 } from 'lucide-react';
import { useHeaderConfig } from '@/hooks/useHeaderConfig';
import { useBroadcast, useUpdateBroadcast, useDeleteBroadcast } from '@/api/broadcast';
import { PageTransition } from '@/components/ui/PageTransition';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { usePermission } from '@/hooks/usePermission';
import { toast } from 'sonner';

const audienceLabels: Record<string, string> = {
  staff: 'Shoulder Only',
  clients: 'Clients Only',
  all: 'Everyone',
};

const audienceIcons: Record<string, React.ReactNode> = {
  staff: <Users className="h-5 w-5" />,
  clients: <Users className="h-5 w-5" />,
  all: <Users className="h-5 w-5" />,
};

const channelLabels: Record<string, string> = {
  in_app: 'In-App Notification',
  email: 'Email',
};

const channelIcons: Record<string, React.ReactNode> = {
  in_app: <Bell className="h-5 w-5" />,
  email: <Mail className="h-5 w-5" />,
};

export default function BroadcastDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const perm = usePermission();

  const { data: broadcast, isLoading, isError } = useBroadcast(id || '');
  const updateBroadcast = useUpdateBroadcast();
  const deleteBroadcast = useDeleteBroadcast();

  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [form, setForm] = useState({
    title: '',
    message: '',
    isUrgent: false,
  });

  const headerConfig = useMemo(() => ({
    title: 'Broadcast Details',
    breadcrumbs: [
      { label: 'Broadcast', href: '/broadcast' },
      { label: broadcast?.title || 'Details' },
    ],
    actions: perm.can('broadcast.access') ? [
      { type: 'button' as const, label: 'Edit', icon: Pencil, variant: 'outline' as const, onClick: () => openEdit() },
    ] : [],
  }), [broadcast, perm]);

  useHeaderConfig(headerConfig);

  const openEdit = () => {
    if (broadcast) {
      setForm({
        title: broadcast.title,
        message: broadcast.message,
        isUrgent: broadcast.isUrgent || false,
      });
      setShowEdit(true);
    }
  };

  const handleUpdate = async () => {
    if (!id || !form.title.trim() || !form.message.trim()) {
      toast.error('Title and message are required');
      return;
    }
    try {
      await updateBroadcast.mutateAsync({
        id,
        title: form.title.trim(),
        message: form.message.trim(),
        isUrgent: form.isUrgent,
      });
      toast.success('Broadcast updated');
      setShowEdit(false);
    } catch {
      toast.error('Failed to update broadcast');
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    try {
      await deleteBroadcast.mutateAsync(id);
      toast.success('Broadcast deleted');
      navigate('/broadcast');
    } catch {
      toast.error('Failed to delete broadcast');
    }
  };

  if (isLoading) {
    return (
      <PageTransition>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64" />
          <div className="grid gap-6 md:grid-cols-3">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        </div>
      </PageTransition>
    );
  }

  if (isError || !broadcast) {
    return (
      <PageTransition>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500 dark:text-gray-400">Broadcast not found</p>
            <Button variant="outline" className="mt-4" onClick={() => navigate('/broadcast')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Broadcasts
            </Button>
          </CardContent>
        </Card>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="space-y-6">
        <Button variant="ghost" size="sm" onClick={() => navigate('/broadcast')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Broadcasts
        </Button>

        {/* Header Card */}
        <Card className={broadcast.isUrgent ? 'border-amber-200 dark:border-amber-800' : ''}>
          <CardContent className="py-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl ${broadcast.isUrgent ? 'bg-amber-100 dark:bg-amber-900/30' : 'bg-primary-50 dark:bg-primary-900/30'}`}>
                  <Megaphone className={`h-8 w-8 ${broadcast.isUrgent ? 'text-amber-600 dark:text-amber-400' : 'text-primary-600 dark:text-primary-400'}`} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{broadcast.title}</h2>
                    {broadcast.isUrgent && (
                      <Badge variant="warning" className="flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Urgent
                      </Badge>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Sent by {broadcast.sentBy}
                  </p>
                </div>
              </div>
              {perm.can('broadcast.access') && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-500 hover:text-red-600"
                  onClick={() => setShowDelete(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Message Content */}
        <Card>
          <CardHeader>
            <CardTitle>Message</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <p className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">{broadcast.message}</p>
            </div>
          </CardContent>
        </Card>

        {/* Meta Info */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                  {audienceIcons[broadcast.audience] || <Users className="h-5 w-5" />}
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Audience</p>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">
                    {audienceLabels[broadcast.audience] || broadcast.audience}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                  {channelIcons[broadcast.channel] || <Bell className="h-5 w-5" />}
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Channel</p>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">
                    {channelLabels[broadcast.channel] || broadcast.channel}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Sent On</p>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">
                    {new Date(broadcast.createdAt).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Edit Modal */}
        <Modal
          isOpen={showEdit}
          onClose={() => setShowEdit(false)}
          title="Edit Broadcast"
          size="md"
          footer={
            <>
              <Button variant="ghost" onClick={() => setShowEdit(false)}>Cancel</Button>
              <Button isLoading={updateBroadcast.isPending} onClick={handleUpdate}>Save Changes</Button>
            </>
          }
        >
          <div className="space-y-4">
            <Input
              label="Title *"
              value={form.title}
              onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
            />
            <Textarea
              label="Message *"
              rows={5}
              value={form.message}
              onChange={(e) => setForm(f => ({ ...f, message: e.target.value }))}
            />
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isUrgent}
                onChange={(e) => setForm(f => ({ ...f, isUrgent: e.target.checked }))}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Mark as Urgent</span>
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Note: Audience and channel cannot be changed after the broadcast is sent.
            </p>
          </div>
        </Modal>

        {/* Delete Confirm */}
        <ConfirmDialog
          isOpen={showDelete}
          onClose={() => setShowDelete(false)}
          title="Delete Broadcast"
          message={`Delete "${broadcast.title}"? This cannot be undone.`}
          confirmLabel="Delete"
          variant="danger"
          isLoading={deleteBroadcast.isPending}
          onConfirm={handleDelete}
        />
      </div>
    </PageTransition>
  );
}
