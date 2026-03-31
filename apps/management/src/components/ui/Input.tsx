import { cn } from '@/lib/utils'
import { forwardRef, type InputHTMLAttributes } from 'react'

interface Props extends InputHTMLAttributes<HTMLInputElement> { label?: string; error?: string; icon?: React.ReactNode }

export const Input = forwardRef<HTMLInputElement, Props>(({ label, error, icon, className, ...props }, ref) => (
  <div className="flex flex-col gap-1.5">
    {label && <label className="text-xs font-medium text-text-secondary uppercase tracking-wide">{label}</label>}
    <div className="relative">
      {icon && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none">{icon}</span>}
      <input ref={ref} className={cn(
        'w-full bg-[#0d1528] border text-text-primary rounded-lg px-3 py-2.5 text-sm font-inter outline-none transition-all placeholder:text-text-muted appearance-none',
        error ? 'border-red-500 focus:ring-2 focus:ring-red-500/20' : 'border-midnight-border focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10',
        icon && 'pl-9',
        className
      )} {...props} />
    </div>
    {error && <span className="text-xs text-red-400">{error}</span>}
  </div>
))
Input.displayName = 'Input'
