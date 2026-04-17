import { useCallback, useMemo, useState } from 'react'
import { Play, Trash2, Clock, Copy, Check, Download } from 'lucide-react'
import { useHeaderConfig } from '@/hooks/useHeaderConfig'
import { PageTransition } from '@/components/ui/PageTransition'
import { Input } from '@/components/ui/Input'
import { ToolPageChrome } from '@/features/tools/components/ToolPageChrome'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { useAiTaskPlan, useAiStatus } from '@/api/ai'
import { toast } from 'sonner'
import { cn } from '@/utils/cn'

interface Subtask {
  title: string
  estimatedHours: number
  priority: string
  notes?: string
}

const PRIORITY_COLORS: Record<string, { badge: 'success' | 'warning' | 'default'; dot: string }> = {
  high: { badge: 'warning', dot: 'bg-amber-500' },
  medium: { badge: 'default', dot: 'bg-blue-500' },
  low: { badge: 'success', dot: 'bg-emerald-500' },
}

export default function AiTaskPlannerPage() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [notes, setNotes] = useState('')
  const [subtasks, setSubtasks] = useState<Subtask[]>([])
  const [copied, setCopied] = useState(false)
  const { data: status } = useAiStatus()
  const mutation = useAiTaskPlan()

  const clearAll = useCallback(() => { setTitle(''); setDescription(''); setNotes(''); setSubtasks([]) }, [])

  const run = useCallback(async () => {
    if (!title.trim()) return
    try {
      const res = await mutation.mutateAsync({
        taskTitle: title.trim(),
        taskDescription: description.trim() || undefined,
        taskNotes: notes.trim() || undefined,
      })
      const parsed = Array.isArray(res.subtasks) ? res.subtasks as Subtask[] : []
      setSubtasks(parsed)
      toast.success(`Generated ${parsed.length} subtasks`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Planning failed')
    }
  }, [title, description, notes, mutation])

  const totalHours = subtasks.reduce((s, t) => s + (t.estimatedHours ?? 0), 0)

  const copyPlan = useCallback(() => {
    if (!subtasks.length) return
    const text = subtasks.map((s, i) => `${i + 1}. [${s.priority}] ${s.title} (${s.estimatedHours}h)${s.notes ? `\n   ${s.notes}` : ''}`).join('\n')
    navigator.clipboard.writeText(`Task: ${title}\nTotal: ${totalHours}h\n\n${text}`).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }, [subtasks, title, totalHours])

  const exportMd = useCallback(() => {
    if (!subtasks.length) return
    const md = `# Task Plan: ${title}\n\n**Estimated total:** ${totalHours}h\n\n${subtasks.map((s, i) => `## ${i + 1}. ${s.title}\n\n- **Priority:** ${s.priority}\n- **Estimated:** ${s.estimatedHours}h\n${s.notes ? `- **Notes:** ${s.notes}\n` : ''}`).join('\n')}`
    const blob = new Blob([md], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `task-plan-${title.trim().slice(0, 30).replace(/\s+/g, '-').toLowerCase()}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [subtasks, title, totalHours])

  const headerConfig = useMemo(() => ({
    title: 'Task Planner',
    description: subtasks.length ? `${subtasks.length} subtasks, ${totalHours}h` : undefined,
    breadcrumbs: [{ label: 'AI', href: '/ai' }, { label: 'Task Planner' }],
    actions: [
      { type: 'button' as const, label: copied ? 'Copied' : 'Copy', icon: copied ? Check : Copy, variant: 'secondary' as const, disabled: !subtasks.length, onClick: copyPlan },
      { type: 'button' as const, label: 'Export', icon: Download, variant: 'secondary' as const, disabled: !subtasks.length, onClick: exportMd },
      { type: 'button' as const, label: 'Clear', icon: Trash2, variant: 'ghost' as const, onClick: clearAll },
      { type: 'button' as const, label: 'Plan', icon: Play, variant: 'primary' as const, disabled: !title.trim() || !status?.hasAny, isLoading: mutation.isPending, onClick: run },
    ],
  }), [clearAll, run, title, status?.hasAny, mutation.isPending, subtasks.length, totalHours, copied, copyPlan, exportMd])

  useHeaderConfig(headerConfig, [clearAll, run, title, status?.hasAny, mutation.isPending, subtasks.length, totalHours, copied, copyPlan, exportMd])

  return (
    <PageTransition>
      <div className="mx-auto max-w-5xl space-y-5 px-4 pb-10 pt-1 sm:px-6 lg:px-8">
        <ToolPageChrome accent="amber" eyebrow="AI Planning" title="Task breakdown" hint="Describe a task → AI generates actionable subtasks with time estimates" />

        <Card>
          <CardContent className="space-y-4 p-5">
            <Input label="Task title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Redesign the landing page" />
            <Input label="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What needs to be done, constraints, deliverables..." />
            <Input label="Additional notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Tech stack, team size, deadlines..." />
            {!status?.hasAny && (
              <div className="rounded-lg border border-amber-200 bg-amber-50/80 px-3 py-2 text-xs text-amber-800 dark:border-amber-800/60 dark:bg-amber-950/30 dark:text-amber-200">
                Configure an AI provider on the API.
              </div>
            )}
          </CardContent>
        </Card>

        {subtasks.length > 0 && (
          <div className="space-y-4">
            {/* Summary strip */}
            <div className="flex flex-wrap items-center gap-4 rounded-xl border border-gray-200/90 bg-white px-4 py-3 dark:border-gray-700/60 dark:bg-gray-900">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 font-mono text-sm font-bold text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">{subtasks.length}</span>
                <span className="text-sm text-gray-600 dark:text-gray-400">subtasks</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-400" />
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{totalHours}h total</span>
              </div>
              <div className="ml-auto flex gap-2">
                {['high', 'medium', 'low'].map((p) => {
                  const count = subtasks.filter((s) => s.priority === p).length
                  if (!count) return null
                  const colors = PRIORITY_COLORS[p] ?? PRIORITY_COLORS.medium
                  return (
                    <span key={p} className="flex items-center gap-1 text-[11px] text-gray-500 dark:text-gray-400">
                      <span className={cn('h-2 w-2 rounded-full', colors.dot)} />
                      {count} {p}
                    </span>
                  )
                })}
              </div>
            </div>

            {/* Subtask list */}
            <div className="space-y-2">
              {subtasks.map((st, i) => {
                const colors = PRIORITY_COLORS[st.priority] ?? PRIORITY_COLORS.medium
                return (
                  <Card key={i} className="transition hover:shadow-sm">
                    <CardContent className="flex items-start gap-3 p-4">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 font-mono text-xs font-bold text-amber-700 dark:from-amber-900/30 dark:to-orange-900/20 dark:text-amber-300">
                        {i + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-900 dark:text-gray-100">{st.title}</p>
                        {st.notes && <p className="mt-1 text-xs leading-relaxed text-gray-500 dark:text-gray-400">{st.notes}</p>}
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <Badge variant={colors.badge} size="sm">{st.priority}</Badge>
                        <span className="flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-[11px] font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                          <Clock className="h-3 w-3" />
                          {st.estimatedHours}h
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  )
}
