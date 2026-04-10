import { useParams } from 'react-router-dom';
import { Server } from 'lucide-react';
import { useHeaderConfig } from '@/hooks/useHeaderConfig';
import { useServer } from '@/api/assets';
import { PageTransition } from '@/components/ui/PageTransition';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { useCurrency } from '@/hooks/useCurrency';

export default function ServerDetail() {
  const { id } = useParams<{ id: string }>();
  const { formatCurrency } = useCurrency();
  const { data: s, isLoading } = useServer(id);

  useHeaderConfig({
    title: s?.name ?? 'Server',
    breadcrumbs: [
      { label: 'Assets', href: '/assets/servers' },
      { label: 'Servers', href: '/assets/servers' },
      { label: s?.name ?? '…' },
    ],
  });

  if (isLoading) {
    return (
      <PageTransition>
        <Skeleton className="h-48 w-full rounded-xl" />
      </PageTransition>
    );
  }

  if (!s) {
    return (
      <PageTransition>
        <Card>
          <p className="py-8 text-center text-gray-500">Server not found.</p>
        </Card>
      </PageTransition>
    );
  }

  return (
    <PageTransition className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-50 p-2 dark:bg-blue-900/30">
              <Server className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-lg">{s.name}</CardTitle>
              <p className="text-sm text-gray-500">{s.provider}</p>
              <StatusBadge status={s.status} className="mt-1" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap justify-between gap-2 text-sm">
            <span className="font-mono text-gray-700 dark:text-gray-300">{s.ip}</span>
            <Badge variant="success" size="sm">{s.uptime}% uptime</Badge>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {(['cpu', 'ram', 'disk'] as const).map((k) => (
              <div key={k}>
                <div className="mb-1 flex justify-between text-xs">
                  <span className="uppercase text-gray-500">{k}</span>
                  <span>{s.usage[k]}%</span>
                </div>
                <ProgressBar value={s.usage[k]} size="sm" />
              </div>
            ))}
          </div>
          <div className="flex justify-between border-t border-gray-100 pt-3 dark:border-gray-700/40">
            <span className="text-sm text-gray-500">Monthly</span>
            <span className="font-semibold">{formatCurrency(s.monthlyCost)}/mo</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-gray-500">CPU spec</span>
              <p className="font-medium">{s.specs.cpu}</p>
            </div>
            <div>
              <span className="text-gray-500">RAM / Disk</span>
              <p className="font-medium">{s.specs.ram} / {s.specs.disk}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </PageTransition>
  );
}
