import { cn } from '@/utils/cn';
import { KPICard } from '@/components/ui/KPICard';
import type { ReactNode } from 'react';

interface StatItem {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: ReactNode;
  iconBg?: string;
}

interface StatsRowProps {
  items: StatItem[];
  loading?: boolean;
  columns?: string;
}

function StatsRow({ items, loading = false, columns }: StatsRowProps) {
  return (
    <div
      className={cn(
        'grid gap-3 sm:gap-4',
        columns || (items.length <= 3
          ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
          : 'grid-cols-1 min-[400px]:grid-cols-2 lg:grid-cols-4'),
      )}
    >
      {items.map((item, i) => (
        <KPICard key={i} {...item} loading={loading} />
      ))}
    </div>
  );
}

export { StatsRow };
