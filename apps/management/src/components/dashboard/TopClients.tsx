import { Globe, ShoppingBag, Users } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Skeleton } from '@/components/ui/Skeleton';
import { useCurrency } from '@/hooks/useCurrency';
import { cn } from '@/utils/cn';
import type { ClientStats } from '@/types/analytics';

interface TopClientsProps {
  clients?: ClientStats;
  loading?: boolean;
}

const RANK_ICONS = ['🥇', '🥈', '🥉'];

export function TopClients({ clients, loading = false }: TopClientsProps) {
  const { formatCurrency } = useCurrency();
  const spenders = clients?.topSpenders ?? [];

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Globe className="h-4 w-4 text-purple-500" />
          Top Clients
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-2">
                <Skeleton className="h-9 w-9 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-28 mb-1" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-5 w-16" />
              </div>
            ))}
          </div>
        ) : spenders.length === 0 ? (
          <div className="py-8 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center mx-auto mb-3 shadow-sm">
              <Users className="h-6 w-6 text-gray-400 dark:text-gray-500" />
            </div>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">No clients yet</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Top spending clients will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {spenders.slice(0, 5).map((client, index) => (
              <div 
                key={client.id} 
                className={cn(
                  'flex items-center gap-3 p-2.5 rounded-xl transition-all group cursor-default',
                  index === 0 
                    ? 'bg-gradient-to-r from-purple-50 to-purple-100/50 dark:from-purple-900/20 dark:to-purple-900/10 ring-1 ring-purple-200/50 dark:ring-purple-700/30' 
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800/30'
                )}
              >
                {index < 3 && (
                  <span className="text-lg">{RANK_ICONS[index]}</span>
                )}
                <div className="relative">
                  <Avatar name={client.fullName} size="sm" />
                  {index === 0 && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-purple-500 rounded-full flex items-center justify-center">
                      <span className="text-[8px] text-white font-bold">1</span>
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                    {client.fullName}
                  </p>
                  <p className="truncate text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <span>{client.country ?? 'Unknown'}</span>
                    <span>·</span>
                    <ShoppingBag className="h-3 w-3" />
                    <span>{client.totalOrders} orders</span>
                  </p>
                </div>
                <span className={cn(
                  'shrink-0 text-sm font-bold px-2.5 py-1 rounded-lg transition-all',
                  index === 0 
                    ? 'text-purple-700 dark:text-purple-300 bg-purple-200/50 dark:bg-purple-800/30' 
                    : 'text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-900/20'
                )}>
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
