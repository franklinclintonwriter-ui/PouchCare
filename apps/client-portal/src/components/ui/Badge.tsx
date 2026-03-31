import { cn } from '@/lib/utils'

interface Props { label: string; color?: 'green' | 'sky' | 'yellow' | 'red' | 'gray'; dot?: boolean; className?: string }

export function Badge({ label, color = 'gray', dot = true, className }: Props) {
  const colors = {
    green: 'bg-green-500/10 text-green-500 border-green-500/20',
    sky: 'bg-sky-500/15 text-sky-500 border-sky-500/20',
    yellow: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    red: 'bg-red-500/10 text-red-500 border-red-500/20',
    gray: 'bg-white/5 text-text-secondary border-white/10',
  }
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border', colors[color], className)}>
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full', { 'bg-green-500': color==='green', 'bg-sky-500': color==='sky', 'bg-yellow-500': color==='yellow', 'bg-red-500': color==='red', 'bg-text-secondary': color==='gray' })} />}
      {label}
    </span>
  )
}
