import { useMemo } from 'react';
import { Server } from 'lucide-react';
import { useHeaderConfig } from '@/hooks/useHeaderConfig';
import { useServers } from '@/api/assets';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Badge } from '@/components/ui/Badge';
import { PageTransition } from '@/components/ui/PageTransition';
import { formatCurrency } from '@/mocks/generators';
import { Skeleton } from '@/components/ui/Skeleton';

export default function Servers() {
  const { data: servers, isLoading } = useServers();

  const headerConfig = useMemo(() => ({
    title: 'Servers',
    breadcrumbs: [
      { label: 'Assets', href: '/assets' },
      { label: 'Servers', icon: Server },
    ],
    actions: [],
  }), []);
  useHeaderConfig(headerConfig);

  return (
    <PageTransition>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <Skeleton className="mb-3 h-5 w-32 rounded" />
                <Skeleton className="mb-2 h-4 w-24 rounded" />
                <div className="mt-4 space-y-3">
                  <Skeleton className="h-3 w-full rounded" />
                  <Skeleton className="h-3 w-full rounded" />
                  <Skeleton className="h-3 w-full rounded" />
                </div>
              </Card>
            ))
          : servers?.map((server) => (
              <Card key={server.id} hover>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <div className="rounded-lg bg-blue-50 p-2 dark:bg-blue-900/30">
                      <Server className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <CardTitle>{server.name}</CardTitle>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{server.provider}</p>
                    </div>
                  </div>
                  <StatusBadge status={server.status} size="sm" />
                </CardHeader>

                <CardContent>
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span className="font-mono">{server.ip}</span>
                    <Badge variant="success" size="sm">{server.uptime}% uptime</Badge>
                  </div>

                  <div className="mt-4 space-y-3">
                    <div>
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="text-gray-500 dark:text-gray-400">CPU</span>
                        <span className="font-medium text-gray-700 dark:text-gray-300">{server.usage.cpu}%</span>
                      </div>
                      <ProgressBar
                        value={server.usage.cpu}
                        size="sm"
                        color={server.usage.cpu > 80 ? 'danger' : server.usage.cpu > 60 ? 'warning' : 'success'}
                      />
                    </div>
                    <div>
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="text-gray-500 dark:text-gray-400">RAM</span>
                        <span className="font-medium text-gray-700 dark:text-gray-300">{server.usage.ram}%</span>
                      </div>
                      <ProgressBar
                        value={server.usage.ram}
                        size="sm"
                        color={server.usage.ram > 80 ? 'danger' : server.usage.ram > 60 ? 'warning' : 'success'}
                      />
                    </div>
                    <div>
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="text-gray-500 dark:text-gray-400">Disk</span>
                        <span className="font-medium text-gray-700 dark:text-gray-300">{server.usage.disk}%</span>
                      </div>
                      <ProgressBar
                        value={server.usage.disk}
                        size="sm"
                        color={server.usage.disk > 80 ? 'danger' : server.usage.disk > 60 ? 'warning' : 'success'}
                      />
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3 dark:border-gray-700/40">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {server.websiteCount} site{server.websiteCount !== 1 ? 's' : ''}
                    </span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {formatCurrency(server.monthlyCost)}/mo
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
      </div>
    </PageTransition>
  );
}
