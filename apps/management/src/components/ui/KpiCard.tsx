import { cn } from '@/lib/utils'
interface Props { label: string; value: string | number; change?: number; icon?: string; color?: 'sky' | 'green' | 'yellow' | 'red'; mono?: boolean }
export function KpiCard({ label, value, change, icon, color = 'sky', mono = true }: Props) {
  const borderColors = { sky: 'border-sky-500', green: 'border-green-500', yellow: 'border-yellow-500', red: 'border-red-500' }
  const textColors = { sky: 'text-sky-500', green: 'text-green-500', yellow: 'text-yellow-500', red: 'text-red-500' }
  return (
    <div className={cn('bg-midnight-card border border-midnight-border rounded-xl p-5 border-l-2 transition-all hover:-translate-y-0.5 hover:shadow-lg', borderColors[color])}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs text-text-muted uppercase tracking-wide font-inter mb-2">{label}</p>
          <p className={cn('text-2xl font-semibold', mono && 'font-mono', textColors[color])}>{value}</p>
        </div>
        {icon && <span className="text-2xl opacity-60">{icon}</span>}
      </div>
      {change !== undefined && (
        <p className={cn('text-xs mt-2', change >= 0 ? 'text-green-500' : 'text-red-400')}>
          {change >= 0 ? '↑' : '↓'} {Math.abs(change)}% vs last month
        </p>
      )}
    </div>
  )
}
