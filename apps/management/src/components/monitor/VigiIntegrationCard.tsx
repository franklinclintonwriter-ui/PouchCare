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
  useVigiCloudDiscover,
  type TplinkDiscoveredDeviceRow,
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
  const cloudDiscover = useVigiCloudDiscover();

  const [host, setHost] = useState('');
  const [port, setPort] = useState('20443');
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [tlsInsecure, setTlsInsecure] = useState(false);
  const [enabled, setEnabled] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);
  const [cloudEmail, setCloudEmail] = useState('');
  const [cloudPassword, setCloudPassword] = useState('');
  const [cloudDevices, setCloudDevices] = useState<TplinkDiscoveredDeviceRow[] | null>(null);

  useEffect(() => {
    if (!integration) return;
    setHost(integration.host);
    setPort(String(integration.port));
    setUsername(integration.username);
    setTlsInsecure(integration.tlsAllowInsecure);
    setEnabled(integration.enabled);
    setPassword('');
  }, [integration]);

  const [autoSyncing, setAutoSyncing] = useState(false);

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
      setPassword('');

      // Auto-test + auto-sync after saving
      setMsg('Saved — testing connection…');
      setAutoSyncing(true);
      try {
        const testResult = await testSaved.mutateAsync();
        const devCount = testResult?.deviceCount ?? 0;
        if (devCount === 0) {
          setMsg('Saved & connected, but NVR reports 0 devices. Add cameras to the NVR first, then Sync.');
          setAutoSyncing(false);
          return;
        }
        setMsg(`Connected (${devCount} device(s)) — syncing cameras…`);
        const syncResult = await sync.mutateAsync();
        setMsg(
          `Done! +${syncResult.created} new, ${syncResult.updated} updated (${syncResult.totalFromNvr} on NVR). Cameras should appear below.`,
        );
      } catch (e: unknown) {
        const errMsg = e instanceof Error ? e.message : String(e);
        setMsg(
          `Saved, but auto-sync failed: ${errMsg}. Use "Test connection" to diagnose, then "Sync cameras" manually.`,
        );
      } finally {
        setAutoSyncing(false);
      }
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

      <p className="mb-3 border-l-2 border-primary-400 pl-2.5 text-[11px] leading-relaxed text-gray-600 dark:text-gray-300">
        <span className="font-semibold text-gray-800 dark:text-gray-100">Why more than email?</span> The TP-Link/VIGI{' '}
        <em>app</em> password only talks to TP-Link&apos;s <em>cloud</em> (device list). PouchCare <strong>Test</strong> and{' '}
        <strong>Sync cameras</strong> use TP-Link&apos;s <strong>on-NVR OpenAPI</strong> (HTTPS to the recorder). So you
        always need <strong>NVR address + NVR login</strong> (usually user <code className="rounded bg-gray-100 px-0.5 text-[10px] dark:bg-gray-800">admin</code>
        ). Email is optional — it can help fill the host IP when the cloud shows it.
      </p>
      <p className="mb-3 rounded-lg bg-sky-50/90 px-2.5 py-2 text-[11px] leading-relaxed text-sky-950 dark:bg-sky-950/35 dark:text-sky-100/95">
        <span className="font-semibold">App shows live video but PouchCare shows &quot;timeout&quot;?</span> The VIGI{' '}
        <em>mobile app</em> often streams via <strong>TP-Link cloud relay</strong> — it does not prove that{' '}
        <strong>this API server</strong> can open a raw TCP connection to your NVR&apos;s LAN IP (
        <code className="rounded bg-white/60 px-0.5 text-[10px] dark:bg-sky-900/50">:20443</code> OpenAPI). PouchCare must
        reach the NVR the same way as a PC browser to <code className="text-[10px]">https://NVR:20443</code> — same LAN,
        VPN, or port-forward + public hostname.
      </p>

      <details className="mb-3 text-[11px] text-gray-500 dark:text-gray-400">
        <summary className="cursor-pointer select-none font-medium text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-100">
          More: OpenAPI, LAN vs remote, ports
        </summary>
        <div className="mt-2 space-y-2 leading-relaxed">
          <p>
            Enable <strong>OpenAPI</strong> on the NVR (HTTPS · default <strong>20443</strong>). Optional: allow insecure TLS for self-signed certs.
          </p>
          <p>
            <strong className="text-gray-700 dark:text-gray-200">Who connects:</strong> the <strong>API server</strong> calls the NVR — not the browser.{' '}
            <code className="rounded bg-gray-100 px-0.5 dark:bg-gray-800">192.168.x.x</code> only works if the API can reach that network (same LAN, VPN, tunnel, or DDNS).
          </p>
          <p>
            <strong className="text-gray-700 dark:text-gray-200">Remote:</strong> use a hostname the API can reach (DDNS, Cloudflare Tunnel, Tailscale, etc.).
          </p>
          <p>
            <strong className="text-gray-700 dark:text-gray-200">Required ports:</strong>{' '}
            <code className="rounded bg-gray-100 px-0.5 dark:bg-gray-800">20443</code> (OpenAPI — test &amp; sync),{' '}
            <code className="rounded bg-gray-100 px-0.5 dark:bg-gray-800">443</code> or{' '}
            <code className="rounded bg-gray-100 px-0.5 dark:bg-gray-800">8443</code> (NVR web UI — JPEG snapshot preview),{' '}
            <code className="rounded bg-gray-100 px-0.5 dark:bg-gray-800">554</code> (RTSP — live/replay in VLC).
            If only 20443 is reachable, cameras will sync but the snapshot preview in the browser will show a placeholder.
          </p>
        </div>
      </details>

      <p className="mb-2 text-[11px] font-medium text-gray-800 dark:text-gray-100">NVR connection (required)</p>

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
        <div className="mt-2 rounded-lg bg-red-50 px-2 py-1.5 dark:bg-red-950/40">
          <p className="text-[11px] text-red-700 dark:text-red-300">Last error: {integration.lastError}</p>
          {(integration.lastError.includes('ETIMEDOUT') ||
            integration.lastError.includes('ENETUNREACH') ||
            integration.lastError.includes('EHOSTUNREACH')) && (
            <p className="mt-1.5 text-[10px] leading-snug text-red-800/90 dark:text-red-200/90">
              The <strong>API server process</strong> could not open TCP to that host:port (not your phone). Use the same
              network path as a laptop opening the NVR web UI: run the API on-site, site-to-site VPN / Tailscale, or DDNS +
              port-forward <code className="rounded bg-red-100/80 px-0.5 dark:bg-red-900/40">20443</code> to the NVR. Different
              subnets (e.g. <code className="text-[9px]">192.168.1.x</code> vs <code className="text-[9px]">192.168.31.x</code>)
              need routing between VLANs.
            </p>
          )}
        </div>
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
          disabled={upsert.isPending || autoSyncing || !host.trim()}
        >
          {upsert.isPending || autoSyncing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Save & sync'}
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

      <details className="mt-4 rounded-lg border border-dashed border-gray-300/80 bg-gray-50/50 p-3 dark:border-gray-600 dark:bg-gray-800/30">
        <summary className="cursor-pointer text-[11px] font-medium text-gray-700 dark:text-gray-200">
          Optional: look up devices with TP-Link / VIGI app email
        </summary>
        <p className="mt-2 text-[10px] leading-relaxed text-gray-500 dark:text-gray-400">
          Only fills the <strong className="text-gray-600 dark:text-gray-300">host</strong> when TP-Link&apos;s cloud returns
          an IP. You still save NVR OpenAPI credentials above. If &quot;Discover&quot; returns 404, restart the API after
          updating the app (endpoint <code className="text-[9px]">POST /v1/assets/vigi/cloud/discover</code>).
        </p>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="mb-0.5 block text-[10px] font-medium uppercase tracking-wide text-gray-500">Email</span>
            <input
              type="email"
              value={cloudEmail}
              onChange={(e) => setCloudEmail(e.target.value)}
              autoComplete="off"
              placeholder="same as VIGI app"
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-0.5 block text-[10px] font-medium uppercase tracking-wide text-gray-500">TP-Link password</span>
            <input
              type="password"
              value={cloudPassword}
              onChange={(e) => setCloudPassword(e.target.value)}
              autoComplete="new-password"
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
            />
          </label>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="mt-2 h-9 w-full sm:w-auto"
          disabled={cloudDiscover.isPending || !cloudEmail.trim() || !cloudPassword}
          onClick={async () => {
            setMsg(null);
            setCloudDevices(null);
            try {
              const r = await cloudDiscover.mutateAsync({
                email: cloudEmail.trim(),
                password: cloudPassword,
              });
              setCloudDevices(r.devices);
              setMsg(
                `Found ${r.devices.length} device(s) via cloud (${r.cloudUrlUsed}). ${r.hint ?? ''}`.trim(),
              );
            } catch (e: unknown) {
              const m = e instanceof Error ? e.message : String(e);
              if (/\b404\b|Not Found|status code 404/i.test(m)) {
                setMsg(
                  'Discover failed (404): this API build may be missing the route. Restart `npm run dev` for apps/api after pulling latest, or deploy the updated API.',
                );
              } else {
                setMsg(m || 'Cloud discover failed');
              }
            }
          }}
        >
          {cloudDiscover.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Discover devices on account'}
        </Button>
        {cloudDevices && cloudDevices.length > 0 && (
          <div className="mt-2 max-h-40 overflow-auto rounded border border-gray-200 dark:border-gray-600">
            <table className="w-full text-left text-[10px]">
              <thead className="sticky top-0 bg-gray-100 dark:bg-gray-800">
                <tr>
                  <th className="p-1.5 font-medium">Name</th>
                  <th className="p-1.5 font-medium">Type</th>
                  <th className="p-1.5 font-medium">IP</th>
                  <th className="p-1.5 font-medium" />
                </tr>
              </thead>
              <tbody>
                {cloudDevices.map((d) => (
                  <tr key={d.deviceId || d.mac} className="border-t border-gray-100 dark:border-gray-700">
                    <td className="p-1.5">
                      {d.alias}
                      {d.likelyNvr ? (
                        <span className="ml-1 rounded bg-violet-500/15 px-1 text-violet-700 dark:text-violet-300">NVR?</span>
                      ) : null}
                    </td>
                    <td className="max-w-[120px] truncate p-1.5 text-gray-500">{d.deviceType}</td>
                    <td className="p-1.5 font-mono text-[9px]">{d.ip ?? '—'}</td>
                    <td className="p-1.5">
                      <button
                        type="button"
                        className="text-primary-600 underline hover:text-primary-700 dark:text-primary-400"
                        onClick={() => {
                          if (d.ip) setHost(d.ip);
                          setPort('20443');
                          setUsername('admin');
                          if (cloudPassword) setPassword(cloudPassword);
                          setTlsInsecure(true);
                          setMsg(
                            d.ip
                              ? `Filled host from cloud. Save, then Test — NVR password is often the same as TP-Link.`
                              : `No IP from cloud — type host manually (DDNS / tunnel / VPN).`,
                          );
                        }}
                      >
                        Use for NVR
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </details>
    </div>
  );
}
