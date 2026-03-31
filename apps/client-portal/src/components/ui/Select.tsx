import { cn } from '@/lib/utils'
import { forwardRef, type SelectHTMLAttributes } from 'react'

interface Option { value: string; label: string }
interface Props extends SelectHTMLAttributes<HTMLSelectElement> { label?: string; error?: string; options: Option[] }

export const Select = forwardRef<HTMLSelectElement, Props>(({ label, error, options, className, ...props }, ref) => (
  <div className="flex flex-col gap-1.5">
    {label && <label className="text-xs font-medium text-text-secondary uppercase tracking-wide">{label}</label>}
    <select ref={ref} className={cn(
      'w-full bg-[#0d1528] border text-text-primary rounded-lg px-3 py-2.5 text-sm font-inter outline-none cursor-pointer appearance-none transition-all',
      error ? 'border-red-500' : 'border-midnight-border focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10',
      className
    )} {...props}>
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
    {error && <span className="text-xs text-red-400">{error}</span>}
  </div>
))
Select.displayName = 'Select'
