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
    <Card padding="none">
      <CardHeader className="border-b border-gray-100 px-4 pb-3 pt-4 dark:border-gray-800 sm:px-5 sm:pt-5">
        <CardTitle className="flex min-w-0 items-center gap-2 text-base font-semibold leading-snug sm:text-[17px]">
          <Globe className="h-[18px] w-[18px] shrink-0 text-purple-500 sm:h-5 sm:w-5" aria-hidden />
          <span className="truncate">Top Clients</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="!mt-0 px-4 pb-4 pt-2 sm:px-5 sm:pb-5">
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
          <div className="space-y-1.5 sm:space-y-2">
            {spenders.slice(0, 5).map((client, index) => (
              <div 
                key={client.id} 
                className={cn(
                  'group flex min-w-0 cursor-default items-center gap-2 rounded-xl p-2 transition-all sm:gap-3 sm:p-2.5',
                  index === 0 
                    ? 'bg-gradient-to-r from-purple-50 to-purple-100/50 dark:from-purple-900/20 dark:to-purple-900/10 ring-1 ring-purple-200/50 dark:ring-purple-700/30' 
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800/30'
                )}
              >
                <span className="flex w-7 shrink-0 justify-center text-center text-base leading-none sm:w-8 sm:text-lg">
                  {index < 3 ? RANK_ICONS[index] : null}
                </span>
                <div className="relative shrink-0">
                  <Avatar name={client.fullName} size="sm" />
                  {index === 0 && (
                    <div className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-purple-500">
                      <span className="text-[8px] font-bold text-white">1</span>
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900 transition-colors group-hover:text-purple-600 dark:text-gray-100 dark:group-hover:text-purple-400">
                    {client.fullName}
                  </p>
                  <p className="flex min-w-0 items-center gap-1 truncate text-[11px] text-gray-500 dark:text-gray-400 sm:text-xs">
                    <span className="shrink-0">{client.country ?? 'Unknown'}</span>
                    <span className="shrink-0">·</span>
                    <ShoppingBag className="h-3 w-3 shrink-0 opacity-70" aria-hidden />
                    <span className="min-w-0 truncate">{client.totalOrders} orders</span>
                  </p>
                </div>
                <span className={cn(
                  'shrink-0 rounded-lg px-2 py-1 text-xs font-bold tabular-nums transition-all sm:px-2.5 sm:text-sm',
                  index === 0 
                    ? 'bg-purple-200/50 text-purple-700 dark:bg-purple-800/30 dark:text-purple-300' 
                    : 'text-emerald-600 group-hover:bg-emerald-50 dark:text-emerald-400 dark:group-hover:bg-emerald-900/20'
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
