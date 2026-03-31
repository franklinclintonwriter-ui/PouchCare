import { Globe } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { SkeletonRow } from '@/components/ui/Skeleton';
import { formatCurrency } from '@/utils/format';
import type { ClientStats } from '@/types/analytics';

interface TopClientsProps {
  clients?: ClientStats;
  loading?: boolean;
}

export function TopClients({ clients, loading = false }: TopClientsProps) {
  const spenders = clients?.topSpenders ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-purple-500" />
          Top Clients
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonRow key={i} />
            ))}
          </div>
        ) : spenders.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-400 dark:text-gray-500">No client data yet</p>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
            {spenders.slice(0, 5).map((client) => (
              <div key={client.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <Avatar name={client.fullName} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                    {client.fullName}
                  </p>
                  <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                    {client.country ?? 'Unknown'} &middot; {client.totalOrders} orders
                  </p>
                </div>
                <span className="shrink-0 text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {formatCurrency(client.totalSpent)}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
