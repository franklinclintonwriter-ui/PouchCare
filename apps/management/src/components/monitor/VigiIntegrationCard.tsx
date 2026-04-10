import { useEffect, useState } from 'react';
import { Link2, Loader2, Trash2, ShieldAlert } from 'lucide-react';
import { cn } from '@/utils/cn';
import { Button } from '@/components/ui/Button';
import {
  useVigiIntegration,
  useVigiUpsert,
  useVigiTest,
  useVigiTestSaved,
  useVigiSync,
  useVigiDelete,
} from '@/api/vigi';

type Props = {
  branchId: string;
  canManage: boolean;
};

export function VigiIntegrationCard({ branchId, canManage }: Props) {
  const { data: integration, isLoading } = useVigiIntegration(branchId);
  const upsert = useVigiUpsert(branchId);
  const test = useVigiTest();
  const testSaved = useVigiTestSaved(branchId);
  const sync = useVigiSync(branchId);
  const del = useVigiDelete(branchId);

  const [host, setHost] = useState('');
  const [port, setPort] = useState('20443');
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [tlsInsecure, setTlsInsecure] = useState(false);
  const [enabled, setEnabled] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!integration) return;
    setHost(integration.host);
    setPort(String(integration.port));
    setUsername(integration.username);
    setTlsInsecure(integration.tlsAllowInsecure);
    setEnabled(integration.enabled);
    setPassword('');
  }, [integration]);

  const onSave = async () => {
    setMsg(null);
    try {
      await upsert.mutateAsync({
        host,
        port: parseInt(port, 10) || 20443,
        username,
        password: password || undefined,
        tlsAllowInsecure: tlsInsecure,
        enabled,
      });
      setMsg('Saved. Use “Sync cameras” to import channels from the NVR.');
      setPassword('');
    } catch (e: unknown) {
      setMsg(e instanceof Error ? e.message : 'Save failed');
    }
  };

  const onTest = async () => {
    setMsg(null);
    try {
      if (integration?.hasPassword && !password.trim()) {
        const r = await testSaved.mutateAsync();
        setMsg(
          `Connection OK — ${r?.deviceCount ?? 0} device(s) reported by NVR (OpenAPI /added_devices).`,
        );
        return;
      }
      if (!password.trim()) {
        setMsg('Enter the NVR password to test, or save the integration first.');
        return;
      }
      const r = await test.mutateAsync({
        host,
        port: parseInt(port, 10) || 20443,
        username,
        password: password.trim(),
        tlsAllowInsecure: tlsInsecure,
      });
      setMsg(
        `Connection OK — ${r?.deviceCount ?? 0} device(s) reported by NVR (OpenAPI /added_devices).`,
      );
    } catch (e: unknown) {
      setMsg(e instanceof Error ? e.message : 'Test failed');
    }
  };

  const onSync = async () => {
    setMsg(null);
    try {
      const r = await sync.mutateAsync();
      setMsg(`Sync complete: +${r.created} new, ${r.updated} updated (${r.totalFromNvr} on NVR).`);
    } catch (e: unknown) {
      setMsg(e instanceof Error ? e.message : 'Sync failed');
    }
  };

  const onRemove = async () => {
    if (!confirm('Remove VIGI integration from this branch? Linked imported cameras will be detached.')) return;
    setMsg(null);
    try {
      await del.mutateAsync();
      setMsg('VIGI integration removed.');
    } catch (e: unknown) {
      setMsg(e instanceof Error ? e.message : 'Remove failed');
    }
  };

  if (!canManage) {
    return (
      <div className="rounded-xl border border-gray-200 bg-gray-50/80 p-4 dark:border-gray-700 dark:bg-gray-900/40">
        <div className="flex items-start gap-2">
          <ShieldAlert className="mt-0.5 h-4 w-4 text-amber-500" />
          <p className="text-xs text-gray-600 dark:text-gray-400">
            TP-Link VIGI NVR linking is available to CEO / Co-MD / Ops. Ask an administrator to configure OpenAPI on
            the NVR (port 20443) and connect it here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm dark:border-gray-700 dark:bg-gray-900/60 sm:p-4">
      <div className="mb-3 flex items-center gap-2">
        <Link2 className="h-4 w-4 text-primary-500" />
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">TP-Link VIGI NVR</h2>
        {integration && (
          <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-400">
            Connected
          </span>
        )}
      </div>
      <p className="mb-3 text-[11px] leading-relaxed text-gray-500 dark:text-gray-400">
        Enable OpenAPI on the NVR: <strong>Settings → Network → OpenAPI</strong> (HTTPS, default{' '}
        <strong>20443</strong>). This server uses Digest (SHA-256) to obtain a token, then reads{' '}
        <code className="rounded bg-gray-100 px-1 dark:bg-gray-800">/openapi/added_devices</code>. Use “Allow insecure
        TLS” only if the NVR uses a self-signed certificate.
      </p>

      {isLoading ? (
        <div className="flex items-center gap-2 py-4 text-xs text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-gray-500">NVR host / URL</span>
            <input
              value={host}
              onChange={(e) => setHost(e.target.value)}
              placeholder="192.168.1.50 or https://nvr.example.com:20443"
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-gray-500">Port</span>
            <input
              value={port}
              onChange={(e) => setPort(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-gray-500">Username</span>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-gray-500">
              Password {integration?.hasPassword && '(leave blank to keep saved)'}
            </span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
            />
          </label>
          <label className="flex items-center gap-2 sm:col-span-2">
            <input
              type="checkbox"
              checked={tlsInsecure}
              onChange={(e) => setTlsInsecure(e.target.checked)}
              className="rounded border-gray-300"
            />
            <span className="text-xs text-gray-600 dark:text-gray-300">Allow insecure TLS (self-signed NVR cert)</span>
          </label>
          <label className="flex items-center gap-2 sm:col-span-2">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="rounded border-gray-300"
            />
            <span className="text-xs text-gray-600 dark:text-gray-300">Integration enabled</span>
          </label>
        </div>
      )}

      {integration?.lastError && (
        <p className="mt-2 rounded-lg bg-red-50 px-2 py-1.5 text-[11px] text-red-700 dark:bg-red-950/40 dark:text-red-300">
          Last error: {integration.lastError}
        </p>
      )}
      {integration?.lastSyncAt && (
        <p className="mt-1 text-[10px] text-gray-400">
          Last sync: {new Date(integration.lastSyncAt).toLocaleString()}
        </p>
      )}

      {msg && (
        <p className={cn('mt-2 text-xs', msg.includes('failed') || msg.includes('Error') ? 'text-red-600' : 'text-emerald-600')}>
          {msg}
        </p>
      )}

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Button
          size="sm"
          variant="primary"
          className="min-h-[44px] w-full justify-center sm:min-h-0 sm:w-auto"
          onClick={onSave}
          disabled={upsert.isPending || !host.trim()}
        >
          {upsert.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Save integration'}
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="min-h-[44px] w-full justify-center sm:min-h-0 sm:w-auto"
          onClick={onTest}
          disabled={test.isPending || testSaved.isPending}
        >
          {test.isPending || testSaved.isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            'Test connection'
          )}
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="min-h-[44px] w-full justify-center sm:min-h-0 sm:w-auto"
          onClick={onSync}
          disabled={sync.isPending || !integration}
        >
          {sync.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Sync cameras'}
        </Button>
        {integration && (
          <Button
            size="sm"
            variant="ghost"
            className="min-h-[44px] w-full justify-center text-red-600 sm:min-h-0 sm:w-auto"
            onClick={onRemove}
            disabled={del.isPending}
          >
            <Trash2 className="mr-1 h-3.5 w-3.5" /> Remove
          </Button>
        )}
      </div>
    </div>
  );
}
