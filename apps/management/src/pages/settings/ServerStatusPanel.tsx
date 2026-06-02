import { RefreshCw, Copy, Trash2, Server, Cpu, HardDrive, Clock, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Skeleton } from '@/components/ui/Skeleton';
import { useSystemStatus, useClearSystemCache, type ServiceHealth } from '@/api/system-status';
import { toast } from 'sonner';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
}

function formatDuration(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m ${seconds % 60}s`;
}

function usageBarColor(percent: number): 'success' | 'warning' | 'danger' {
  if (percent >= 90) return 'danger';
  if (percent >= 75) return 'warning';
  return 'success';
}

export default function ServerStatusPanel() {
  const { data, isLoading, isError, refetch, isFetching } = useSystemStatus();
  const clearCache = useClearSystemCache();

  const handleCopyDiagnostics = async () => {
    if (!data) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      toast.success('Diagnostics copied to clipboard');
    } catch {
      toast.error('Failed to copy diagnostics');
    }
  };

  const handleClearCache = async () => {
    try {
      await clearCache.mutateAsync();
      toast.success('System settings cache cleared');
    } catch {
      toast.error('Failed to clear cache');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <p className="text-sm text-gray-500">Unable to load server status.</p>
          <Button className="mt-4" onClick={() => refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" /> Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const memColor = usageBarColor(data.host.memoryUsedPercent);
  const diskColor = data.host.disk.available && data.host.disk.usedPercent != null
    ? usageBarColor(data.host.disk.usedPercent)
    : 'success';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Last updated {new Date(data.collectedAt).toLocaleString()}
          {isFetching && ' · refreshing…'}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleCopyDiagnostics}>
            <Copy className="mr-2 h-4 w-4" /> Copy diagnostics
          </Button>
          <Button variant="outline" size="sm" onClick={handleClearCache} disabled={clearCache.isPending}>
            <Trash2 className="mr-2 h-4 w-4" /> Clear settings cache
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          icon={Clock}
          title="Host uptime"
          value={formatDuration(data.host.uptimeSec)}
          subtitle={`API process: ${formatDuration(data.process.uptimeSec)}`}
        />
        <MetricCard
          icon={Cpu}
          title="CPU"
          value={`${data.host.cpuCores} cores`}
          subtitle={`Load ${data.host.loadAvg.map((n) => n.toFixed(2)).join(' / ')}`}
        />
        <MetricCard
          icon={Activity}
          title="Memory"
          value={`${data.host.memoryUsedPercent}% used`}
          subtitle={`${formatBytes(data.host.memoryUsedBytes)} / ${formatBytes(data.host.memoryTotalBytes)}`}
        />
        <MetricCard
          icon={HardDrive}
          title="Disk"
          value={
            data.host.disk.available && data.host.disk.usedPercent != null
              ? `${data.host.disk.usedPercent}% used`
              : 'N/A'
          }
          subtitle={
            data.host.disk.available
              ? `${formatBytes(data.host.disk.usedBytes ?? 0)} / ${formatBytes(data.host.disk.totalBytes ?? 0)}`
              : (data.host.disk.reason ?? 'Unavailable')
          }
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" /> Resource usage
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="mb-1 flex justify-between text-sm">
              <span>System memory</span>
              <span>{data.host.memoryUsedPercent}%</span>
            </div>
            <ProgressBar value={data.host.memoryUsedPercent} color={memColor} showLabel />
          </div>
          {data.host.disk.available && data.host.disk.usedPercent != null && (
            <div>
              <div className="mb-1 flex justify-between text-sm">
                <span>Disk ({data.host.disk.mount ?? '/'})</span>
                <span>{data.host.disk.usedPercent}%</span>
              </div>
              <ProgressBar value={data.host.disk.usedPercent} color={diskColor} showLabel />
            </div>
          )}
          <div>
            <div className="mb-1 flex justify-between text-sm">
              <span>Node heap</span>
              <span>
                {formatBytes(data.process.memoryHeapUsedBytes)} / {formatBytes(data.process.memoryHeapTotalBytes)}
              </span>
            </div>
            <ProgressBar
              value={data.process.memoryHeapUsedBytes}
              max={data.process.memoryHeapTotalBytes}
              color="primary"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Service health</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            <ServiceRow label="API" status={data.services.api.status} detail={`Port ${data.services.api.port} · ${data.services.api.nodeEnv}`} />
            <ServiceRow
              label="PostgreSQL"
              status={data.services.postgres.status}
              detail={data.services.postgres.latencyMs != null ? `${data.services.postgres.latencyMs} ms` : data.services.postgres.error ?? '—'}
            />
            <ServiceRow
              label="Redis"
              status={data.services.redis.status}
              detail={data.services.redis.latencyMs != null ? `${data.services.redis.latencyMs} ms` : data.services.redis.error ?? '—'}
            />
            <ServiceRow
              label="Storage"
              status={data.services.storage.status}
              detail={
                data.services.storage.mode === 'r2'
                  ? `R2 · ${data.services.storage.bucket ?? 'bucket'}`
                  : data.services.storage.mode === 'local'
                    ? 'Local disk fallback'
                    : 'Not configured'
              }
            />
            <ServiceRow label="WebSocket" status={data.services.websocket.status} detail={data.services.websocket.path} />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Runtime info</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2 text-sm">
              <InfoRow label="Hostname" value={data.host.hostname} />
              <InfoRow label="Platform" value={data.host.platform} />
              <InfoRow label="Timezone" value={data.host.timezone} />
              <InfoRow label="Node" value={data.process.nodeVersion} />
              <InfoRow label="Process PID" value={String(data.process.pid)} />
              <InfoRow label="API version" value={data.build.version} />
              <InfoRow label="Git SHA" value={data.build.gitSha} />
              <InfoRow label="Build time" value={data.build.buildTime} />
              <InfoRow label="CORS origins" value={String(data.runtime.allowedOriginsCount)} />
              <InfoRow label="Docker container" value={data.runtime.inDocker ? 'Yes' : 'No'} />
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Background jobs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left text-xs text-gray-500 dark:border-gray-800">
                    <th className="pb-2 pr-3">Job</th>
                    <th className="pb-2 pr-3">Schedule</th>
                    <th className="pb-2">Cron</th>
                  </tr>
                </thead>
                <tbody>
                  {data.jobs.map((job) => (
                    <tr key={job.id} className="border-b border-gray-50 dark:border-gray-800/50">
                      <td className="py-2 pr-3 font-medium">{job.label}</td>
                      <td className="py-2 pr-3 text-gray-500">{job.id}</td>
                      <td className="py-2 font-mono text-xs">{job.schedule}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  title,
  value,
  subtitle,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  value: string;
  subtitle: string;
}) {
  return (
    <Card>
      <CardContent className="pt-5">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-primary-50 p-2 dark:bg-primary-900/20">
            <Icon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{title}</p>
            <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">{value}</p>
            <p className="mt-0.5 text-xs text-gray-500">{subtitle}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ServiceRow({
  label,
  status,
  detail,
}: {
  label: string;
  status: ServiceHealth;
  detail: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2 dark:border-gray-800">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-gray-500">{detail}</p>
      </div>
      <StatusBadge status={status} size="sm" />
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="text-right font-medium text-gray-900 dark:text-white">{value}</span>
    </div>
  );
}
