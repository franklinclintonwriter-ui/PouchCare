import { cn } from '@/utils/cn'

interface AiUsageBarProps {
  used: number
  limit: number | null
  className?: string
}

export function AiUsageBar({ used, limit, className }: AiUsageBarProps) {
  if (!limit || limit <= 0) return null
  const pct = Math.min(100, Math.round((used / limit) * 100))
  const color = pct > 90 ? 'bg-red-500' : pct > 70 ? 'bg-amber-500' : 'bg-emerald-500'

  return (
    <div className={cn('space-y-1', className)}>
      <div className="flex items-center justify-between text-[11px] text-gray-600 dark:text-gray-400">
        <span>{used.toLocaleString()} / {limit.toLocaleString()} tokens</span>
        <span className="font-medium">{pct}%</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
        <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
