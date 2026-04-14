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
      <div className="rounded-xl border border-amber-200/60 bg-amber-50/50 p-3 dark:border-amber-900/40 dark:bg-amber-950/20 sm:p-4">
        <div className="flex items-start gap-2.5">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <p className="text-xs leading-snug text-amber-900/90 dark:text-amber-100/90">
            <span className="font-semibold">VIGI NVR</span> — Admin setup only. OpenAPI on port <strong>20443</strong>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200/80 bg-white p-3 shadow-sm dark:border-gray-700 dark:bg-gray-900/70 sm:p-4">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2">
          <Link2 className="h-4 w-4 text-primary-500" />
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">VIGI NVR</h2>
        </div>
        {integration && (
          <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-400">
            Linked
          </span>
        )}
      </div>
      <details className="mb-3 text-[11px] text-gray-500 dark:text-gray-400">
        <summary className="cursor-pointer select-none font-medium text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-100">
          Connection help
        </summary>
        <p className="mt-2 leading-relaxed">
          Enable <strong>OpenAPI</strong> on the NVR (HTTPS · default <strong>20443</strong>). Optional: allow insecure TLS for self-signed certs.
        </p>
      </details>

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
          className="h-10 w-full justify-center sm:h-9 sm:w-auto"
          onClick={onSave}
          disabled={upsert.isPending || !host.trim()}
        >
          {upsert.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Save integration'}
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-10 w-full justify-center sm:h-9 sm:w-auto"
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
          className="h-10 w-full justify-center sm:h-9 sm:w-auto"
          onClick={onSync}
          disabled={sync.isPending || !integration}
        >
          {sync.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Sync cameras'}
        </Button>
        {integration && (
          <Button
            size="sm"
            variant="ghost"
            className="h-10 w-full justify-center text-red-600 sm:h-9 sm:w-auto"
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
