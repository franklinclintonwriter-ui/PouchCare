import { useCallback, useState } from 'react';
import { Plus, Copy, Check, Trash2, AlertTriangle } from 'lucide-react';
import { useHeaderConfig } from '@/hooks/useHeaderConfig';
import { useApiKeys, useCreateApiKey, useRevokeApiKey, type ApiKey, type CreatedApiKey } from '@/api/api-keys';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Card, CardContent } from '@/components/ui/Card';
import { PageTransition } from '@/components/ui/PageTransition';
import { Skeleton } from '@/components/ui/Skeleton';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { usePermission } from '@/hooks/usePermission';
import { toast } from 'sonner';

const emptyForm = { name: '', scope: 'plugin_download' as const, expiresAt: '' };

const SCOPE_OPTIONS = [
  { value: 'plugin_download', label: 'Plugin Download' },
  { value: 'general', label: 'General' },
];

export default function ApiKeys() {
  const perm = usePermission();
  const { data: keys, isLoading } = useApiKeys();
  const createKey = useCreateApiKey();
  const revokeKey = useRevokeApiKey();

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [createdKey, setCreatedKey] = useState<CreatedApiKey | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState<ApiKey | null>(null);

  const canManage = perm.isCEO;

  const openCreate = useCallback(() => {
    setForm(emptyForm);
    setCreatedKey(null);
    setCopiedKey(false);
    setModalOpen(true);
  }, []);

  useHeaderConfig({
    title: 'API Keys',
    breadcrumbs: [
      { label: 'Settings', href: '/settings/preferences' },
      { label: 'API Keys' },
    ],
    actions: canManage
      ? [{ type: 'button', label: 'Generate Key', icon: Plus, onClick: openCreate, variant: 'primary' }]
      : [],
  });

  const handleCopyKey = async () => {
    if (!createdKey) return;
    await navigator.clipboard.writeText(createdKey.rawKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 3000);
    toast.success('API key copied to clipboard');
  };

  const handleGenerate = async () => {
    if (!form.name.trim()) return;
    try {
      const result = await createKey.mutateAsync({
        name: form.name.trim(),
        scope: form.scope,
        expiresAt: form.expiresAt || undefined,
      });
      setCreatedKey(result);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to generate key';
      toast.error(msg);
    }
  };

  const handleRevoke = async () => {
    if (!revokeTarget) return;
    try {
      await revokeKey.mutateAsync(revokeTarget.id);
      setRevokeTarget(null);
      toast.success(`API key "${revokeTarget.name}" revoked`);
    } catch {
      toast.error('Failed to revoke key');
    }
  };

  const columns: Column<ApiKey>[] = [
    {
      key: 'name',
      label: 'Name',
      render: (row) => (
        <div>
          <div className="font-medium text-[var(--color-text-primary)]">{row.name}</div>
          <div className="text-xs text-[var(--color-text-secondary)] font-mono mt-0.5">{row.keyPrefix}••••••••</div>
        </div>
      ),
    },
    {
      key: 'scope',
      label: 'Scope',
      render: (row) => (
        <Badge variant="info" size="sm">
          {row.scope === 'plugin_download' ? 'Plugin Download' : 'General'}
        </Badge>
      ),
    },
    {
      key: 'isActive',
      label: 'Status',
      render: (row) => (
        <Badge variant={row.isActive ? 'success' : 'danger'} size="sm">
          {row.isActive ? 'Active' : 'Revoked'}
        </Badge>
      ),
    },
    {
      key: 'lastUsedAt',
      label: 'Last Used',
      render: (row) => (
        <span className="text-sm text-[var(--color-text-secondary)]">
          {row.lastUsedAt ? new Date(row.lastUsedAt).toLocaleDateString() : 'Never'}
        </span>
      ),
    },
    {
      key: 'expiresAt',
      label: 'Expires',
      render: (row) => {
        if (!row.expiresAt) return <span className="text-sm text-[var(--color-text-secondary)]">Never</span>;
        const expired = new Date(row.expiresAt) < new Date();
        return (
          <span className={`text-sm ${expired ? 'text-danger-600' : 'text-[var(--color-text-secondary)]'}`}>
            {new Date(row.expiresAt).toLocaleDateString()}
            {expired && ' (Expired)'}
          </span>
        );
      },
    },
    {
      key: 'createdAt',
      label: 'Created',
      render: (row) => (
        <span className="text-sm text-[var(--color-text-secondary)]">
          {new Date(row.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    ...(canManage
      ? [{
          key: 'actions' as keyof ApiKey,
          label: '',
          render: (row: ApiKey) => row.isActive ? (
            <Button
              variant="ghost"
              size="sm"
              icon={<Trash2 size={14} className="text-danger-500" />}
              onClick={(e) => { e.stopPropagation(); setRevokeTarget(row); }}
            >
              Revoke
            </Button>
          ) : null,
        }]
      : []),
  ];

  return (
    <PageTransition>
      <div className="space-y-6">
        {!canManage && (
          <Card>
            <CardContent className="py-6">
              <p className="text-center text-[var(--color-text-secondary)]">
                API key management is restricted to CEO and Co-MD roles.
              </p>
            </CardContent>
          </Card>
        )}

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={keys ?? []}
            emptyTitle="No API keys yet"
            emptyDescription="Generate your first key to enable plugin downloads."
          />
        )}
      </div>

      {/* Generate Key Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Generate API Key"
        size="md"
        footer={
          createdKey ? (
            <div className="flex justify-end gap-3">
              <Button variant="primary" onClick={() => setModalOpen(false)}>Done</Button>
            </div>
          ) : (
            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button
                variant="primary"
                onClick={handleGenerate}
                isLoading={createKey.isPending}
                disabled={!form.name.trim()}
              >
                Generate Key
              </Button>
            </div>
          )
        }
      >
        {createdKey ? (
          /* Copy-once key display */
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-warning-50 border border-warning-200 dark:bg-warning-900/20 dark:border-warning-700">
              <AlertTriangle className="h-5 w-5 text-warning-600 mt-0.5 shrink-0" />
              <p className="text-sm text-warning-800 dark:text-warning-300">
                <strong>Copy this key now.</strong> For security reasons it will not be shown again.
              </p>
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">Your API Key</label>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-3 py-2.5 rounded-lg bg-gray-50 dark:bg-gray-900 border border-[var(--color-border)] font-mono text-sm text-[var(--color-text-primary)] overflow-x-auto">
                  {createdKey.rawKey}
                </code>
                <Button
                  variant="secondary"
                  size="sm"
                  icon={copiedKey ? <Check size={14} className="text-success-500" /> : <Copy size={14} />}
                  onClick={handleCopyKey}
                >
                  {copiedKey ? 'Copied' : 'Copy'}
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-[var(--color-text-secondary)]">Name: </span>
                <span className="font-medium">{createdKey.name}</span>
              </div>
              <div>
                <span className="text-[var(--color-text-secondary)]">Scope: </span>
                <span className="font-medium capitalize">{createdKey.scope.replace('_', ' ')}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <Input
              label="Key Name"
              placeholder="e.g. WordPress Production Site"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
              hint="A descriptive name to identify where this key is used"
            />
            <Select
              label="Scope"
              value={form.scope}
              onChange={(e) => setForm((f) => ({ ...f, scope: e.target.value as typeof form.scope }))}
              options={SCOPE_OPTIONS}
            />
            <Input
              label="Expiry Date"
              type="datetime-local"
              value={form.expiresAt}
              onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))}
              hint="Leave blank for no expiry"
            />
          </div>
        )}
      </Modal>

      {/* Revoke Confirm */}
      <ConfirmDialog
        isOpen={!!revokeTarget}
        onClose={() => setRevokeTarget(null)}
        onConfirm={handleRevoke}
        title="Revoke API Key"
        message={`Are you sure you want to revoke "${revokeTarget?.name}"? Any services using this key will lose access immediately.`}
        confirmLabel="Revoke"
        variant="danger"
      />
    </PageTransition>
  );
}
