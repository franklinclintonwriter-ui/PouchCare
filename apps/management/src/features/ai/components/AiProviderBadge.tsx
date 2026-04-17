import { cn } from '@/utils/cn'

const COLORS: Record<string, string> = {
  openai: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  anthropic: 'bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  google: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  groq: 'bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
  openrouter: 'bg-pink-50 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
}

interface AiProviderBadgeProps {
  provider: string
  model?: string
  className?: string
}

export function AiProviderBadge({ provider, model, className }: AiProviderBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium',
        COLORS[provider] ?? 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
        className,
      )}
    >
      {provider}
      {model ? <span className="opacity-60">/ {model}</span> : null}
    </span>
  )
}
