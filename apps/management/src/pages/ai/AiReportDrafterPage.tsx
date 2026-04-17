import { useCallback, useMemo, useState } from 'react'
import { Play, Trash2, Copy, Check, ClipboardPaste, Smile, Meh, Frown, CalendarDays, ListTodo } from 'lucide-react'
import { useHeaderConfig } from '@/hooks/useHeaderConfig'
import { PageTransition } from '@/components/ui/PageTransition'
import { Input } from '@/components/ui/Input'
import { ToolPageChrome } from '@/features/tools/components/ToolPageChrome'
import { Card, CardContent } from '@/components/ui/Card'
import { useAiReportDraft, useAiStatus } from '@/api/ai'
import { toast } from 'sonner'
import { cn } from '@/utils/cn'

const MOOD_ICONS: Record<string, { icon: React.ReactNode; color: string }> = {
  productive: { icon: <Smile className="h-5 w-5" />, color: 'text-emerald-500' },
  neutral: { icon: <Meh className="h-5 w-5" />, color: 'text-amber-500' },
  challenged: { icon: <Frown className="h-5 w-5" />, color: 'text-rose-500' },
}

const FIELD_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  tasksCompleted: { label: 'Tasks completed', icon: <ListTodo className="h-4 w-4" />, color: 'border-l-emerald-500' },
  plannedTomorrow: { label: 'Planned for tomorrow', icon: <CalendarDays className="h-4 w-4" />, color: 'border-l-sky-500' },
  blockers: { label: 'Blockers', icon: <Frown className="h-4 w-4" />, color: 'border-l-amber-500' },
  mood: { label: 'Mood', icon: <Smile className="h-4 w-4" />, color: 'border-l-violet-500' },
}

export default function AiReportDrafterPage() {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [extra, setExtra] = useState('')
  const [draft, setDraft] = useState<Record<string, unknown> | null>(null)
  const [tasksUsed, setTasksUsed] = useState(0)
  const [copied, setCopied] = useState(false)
  const { data: status } = useAiStatus()
  const mutation = useAiReportDraft()

  const clearAll = useCallback(() => { setExtra(''); setDraft(null); setTasksUsed(0) }, [])

  const run = useCallback(async () => {
    try {
      const res = await mutation.mutateAsync({ date, additionalContext: extra.trim() || undefined })
      setDraft(res.draft as Record<string, unknown>)
      setTasksUsed(res.tasksUsed)
      toast.success(`Draft generated from ${res.tasksUsed} task(s)`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Draft failed')
    }
  }, [date, extra, mutation])

  const copyDraft = useCallback(() => {
    if (!draft) return
    const text = Object.entries(draft).map(([k, v]) => {
      const label = FIELD_CONFIG[k]?.label ?? k
      return `${label}:\n${String(v)}`
    }).join('\n\n')
    navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })
  }, [draft])

  const headerConfig = useMemo(() => ({
    title: 'Report Drafter',
    description: draft ? `${date} — ${tasksUsed} task(s)` : undefined,
    breadcrumbs: [{ label: 'AI', href: '/ai' }, { label: 'Report Drafter' }],
    actions: [
      { type: 'button' as const, label: copied ? 'Copied' : 'Copy all', icon: copied ? Check : Copy, variant: 'secondary' as const, disabled: !draft, onClick: copyDraft },
      { type: 'button' as const, label: 'Clear', icon: Trash2, variant: 'ghost' as const, onClick: clearAll },
      { type: 'button' as const, label: 'Draft', icon: Play, variant: 'primary' as const, disabled: !status?.hasAny, isLoading: mutation.isPending, onClick: run },
    ],
  }), [copied, copyDraft, draft, clearAll, run, status?.hasAny, mutation.isPending, date, tasksUsed])

  useHeaderConfig(headerConfig, [copied, copyDraft, draft, clearAll, run, status?.hasAny, mutation.isPending, date, tasksUsed])

  const orderedKeys = ['tasksCompleted', 'plannedTomorrow', 'blockers', 'mood']

  return (
    <PageTransition>
      <div className="mx-auto max-w-5xl space-y-5 px-4 pb-10 pt-1 sm:px-6 lg:px-8">
        <ToolPageChrome accent="rose" eyebrow="AI Reports" title="Daily report drafter" hint="Auto-pulls today's task activity → drafts a structured daily report" />

        <Card>
          <CardContent className="space-y-4 p-5">
            <div className="grid gap-4 lg:grid-cols-2">
              <Input label="Report date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              <Input label="Additional notes (optional)" value={extra} onChange={(e) => setExtra(e.target.value)} placeholder="Meetings, ad hoc work, client calls..." />
            </div>
            {!status?.hasAny && (
              <div className="rounded-lg border border-amber-200 bg-amber-50/80 px-3 py-2 text-xs text-amber-800 dark:border-amber-800/60 dark:bg-amber-950/30 dark:text-amber-200">
                Configure an AI provider on the API.
              </div>
            )}
          </CardContent>
        </Card>

        {draft && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-[11px] text-gray-500 dark:text-gray-400">
              <ClipboardPaste className="h-3.5 w-3.5" />
              Generated from {tasksUsed} task(s) on {date}
            </div>

            {orderedKeys.filter((k) => k in draft).map((key) => {
              const value = String(draft[key] ?? '')
              const config = FIELD_CONFIG[key]
              if (!config) return null

              if (key === 'mood') {
                const moodInfo = MOOD_ICONS[value.toLowerCase()] ?? MOOD_ICONS.neutral
                return (
                  <Card key={key} className={cn('border-l-4', config.color)}>
                    <CardContent className="flex items-center gap-3 p-4">
                      <span className={moodInfo.color}>{moodInfo.icon}</span>
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{config.label}</p>
                        <p className="text-sm font-medium capitalize text-gray-900 dark:text-gray-100">{value}</p>
                      </div>
                    </CardContent>
                  </Card>
                )
              }

              return (
                <Card key={key} className={cn('border-l-4', config.color)}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                      {config.icon}
                      <p className="text-[10px] font-semibold uppercase tracking-wide">{config.label}</p>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-gray-800 dark:text-gray-200">{value}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </PageTransition>
  )
}
