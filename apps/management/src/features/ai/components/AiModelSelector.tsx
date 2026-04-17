import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check, Cpu, Zap, Brain, Code2 } from 'lucide-react'
import { cn } from '@/utils/cn'
import type { AiModelOption } from '../types'

const PROVIDER_ICONS: Record<string, React.ReactNode> = {
  openai: <Brain className="h-3.5 w-3.5 text-emerald-500" />,
  anthropic: <Zap className="h-3.5 w-3.5 text-orange-500" />,
  google: <Cpu className="h-3.5 w-3.5 text-blue-500" />,
  groq: <Code2 className="h-3.5 w-3.5 text-violet-500" />,
  openrouter: <Zap className="h-3.5 w-3.5 text-pink-500" />,
}

const PROVIDER_COLORS: Record<string, string> = {
  openai: 'border-emerald-200 dark:border-emerald-800',
  anthropic: 'border-orange-200 dark:border-orange-800',
  google: 'border-blue-200 dark:border-blue-800',
  groq: 'border-violet-200 dark:border-violet-800',
  openrouter: 'border-pink-200 dark:border-pink-800',
}

interface AiModelSelectorProps {
  models: AiModelOption[]
  value: string
  onChange: (modelId: string) => void
  className?: string
  compact?: boolean
}

export function AiModelSelector({ models, value, onChange, className, compact }: AiModelSelectorProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const selected = models.find((m) => m.id === value)

  if (models.length === 0) return null

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'flex items-center gap-2 rounded-xl border bg-white px-3 py-2 text-left transition hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-750',
          selected ? PROVIDER_COLORS[selected.provider] ?? 'border-gray-200 dark:border-gray-700' : 'border-gray-200 dark:border-gray-700',
          compact ? 'text-[11px]' : 'text-xs',
        )}
      >
        {selected && PROVIDER_ICONS[selected.provider]}
        <span className="min-w-0 font-medium text-gray-900 dark:text-gray-100">
          {selected?.label ?? 'Select model'}
        </span>
        {!compact && selected && (
          <span className="hidden text-gray-400 sm:inline">({selected.provider})</span>
        )}
        <ChevronDown className={cn('ml-auto h-3 w-3 shrink-0 text-gray-400 transition', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 max-h-80 w-[min(320px,calc(100vw-2rem))] overflow-y-auto rounded-xl border border-gray-200 bg-white p-1.5 shadow-xl dark:border-gray-700 dark:bg-gray-900">
          {(['openai', 'anthropic', 'google', 'groq', 'openrouter'] as const).map((provider) => {
            const providerModels = models.filter((m) => m.provider === provider)
            if (providerModels.length === 0) return null
            return (
              <div key={provider}>
                <div className="flex items-center gap-1.5 px-2 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                  {PROVIDER_ICONS[provider]}
                  {provider}
                </div>
                {providerModels.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      onChange(m.id)
                      setOpen(false)
                    }}
                    className={cn(
                      'flex w-full items-start gap-3 rounded-lg px-2.5 py-2 text-left transition',
                      value === m.id
                        ? 'bg-primary-50 dark:bg-primary-950/30'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800/80',
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-gray-900 dark:text-gray-100">{m.label}</span>
                        {m.id.includes('codex') && (
                          <span className="rounded bg-violet-100 px-1 py-0.5 text-[9px] font-bold text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">CODE</span>
                        )}
                      </div>
                      <p className="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">{m.description}</p>
                      <p className="mt-0.5 text-[10px] text-gray-400 dark:text-gray-500">{m.bestFor}</p>
                    </div>
                    {value === m.id && <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary-600 dark:text-primary-400" />}
                  </button>
                ))}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
