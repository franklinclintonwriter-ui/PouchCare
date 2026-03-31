import { cn } from '@/lib/utils'
import type { ButtonHTMLAttributes } from 'react'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'danger' | 'secondary'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

export function Button({ variant = 'primary', size = 'md', loading, className, children, disabled, ...props }: Props) {
  const base = 'inline-flex items-center justify-center gap-2 font-semibold font-inter rounded-lg transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap'
  const variants = {
    primary: 'bg-sky-500 hover:bg-sky-600 text-white shadow-[0_4px_14px_rgba(14,165,233,0.25)] hover:shadow-[0_6px_20px_rgba(14,165,233,0.35)] hover:-translate-y-px',
    ghost: 'bg-transparent border border-sky-500/40 text-sky-500 hover:bg-sky-500/8 hover:border-sky-500',
    danger: 'bg-transparent border border-red-500/40 text-red-500 hover:bg-red-500/10 hover:border-red-500',
    secondary: 'bg-midnight-card border border-midnight-border text-text-secondary hover:text-text-primary hover:border-white/20',
  }
  const sizes = { sm: 'h-8 px-3 text-xs', md: 'h-9 px-4 text-sm', lg: 'h-11 px-6 text-base' }
  return (
    <button className={cn(base, variants[variant], sizes[size], className)} disabled={disabled || loading} {...props}>
      {loading && <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />}
      {children}
    </button>
  )
}
