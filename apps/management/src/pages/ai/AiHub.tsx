import { Link } from 'react-router-dom'
import { useHeaderConfig } from '@/hooks/useHeaderConfig'
import { PageTransition } from '@/components/ui/PageTransition'
import { Card, CardContent } from '@/components/ui/Card'
import { ArrowUpRight, Brain, Zap, Shield, Activity, Crown } from 'lucide-react'
import { cn } from '@/utils/cn'
import { AI_TOOLS_REGISTRY } from '@/features/ai/registry'
import { useAiStatus, useAiUsage, useAiConversations } from '@/api/ai'
import { usePermission } from '@/hooks/usePermission'
import { AiUsageBar } from '@/features/ai/components/AiUsageBar'
import { AiProviderBadge } from '@/features/ai/components/AiProviderBadge'

const ACCENT_MAP: Record<string, { bg: string; border: string; glow: string }> = {
  sky: { bg: 'bg-sky-50 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400', border: 'group-hover:border-sky-300 dark:group-hover:border-sky-700', glow: 'group-hover:shadow-sky-100/50 dark:group-hover:shadow-sky-900/20' },
  emerald: { bg: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400', border: 'group-hover:border-emerald-300 dark:group-hover:border-emerald-700', glow: 'group-hover:shadow-emerald-100/50 dark:group-hover:shadow-emerald-900/20' },
  violet: { bg: 'bg-violet-50 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400', border: 'group-hover:border-violet-300 dark:group-hover:border-violet-700', glow: 'group-hover:shadow-violet-100/50 dark:group-hover:shadow-violet-900/20' },
  amber: { bg: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400', border: 'group-hover:border-amber-300 dark:group-hover:border-amber-700', glow: 'group-hover:shadow-amber-100/50 dark:group-hover:shadow-amber-900/20' },
  rose: { bg: 'bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400', border: 'group-hover:border-rose-300 dark:group-hover:border-rose-700', glow: 'group-hover:shadow-rose-100/50 dark:group-hover:shadow-rose-900/20' },
  slate: { bg: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400', border: 'group-hover:border-slate-300 dark:group-hover:border-slate-700', glow: '' },
}

export default function AiHub() {
  const { data: status } = useAiStatus()
  const { data: usage } = useAiUsage()
  const perm = usePermission()
  const isExec = perm.isCEO
  const { data: convData } = useAiConversations(5)
  const recentConvs = (convData as any)?.data ?? []

  useHeaderConfig({
    title: 'AI Assistant',
    description: 'Multi-provider AI tools',
    breadcrumbs: [{ label: 'AI' }],
    actions: [],
  })

  const configuredCount = status ? [status.openai, status.anthropic, status.google, status.groq].filter(Boolean).length : 0

  return (
    <PageTransition>
      <div className="mx-auto max-w-6xl space-y-6 px-4 pb-10 pt-1 sm:px-6 lg:px-8">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-2xl border border-gray-200/90 shadow-sm dark:border-gray-700/60">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-50/80 via-white to-violet-50/40 dark:from-primary-950/40 dark:via-gray-900/60 dark:to-violet-950/25" />
          <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-primary-500 via-violet-500 to-emerald-500" aria-hidden />
          <div className="absolute right-0 top-0 h-48 w-48 -translate-y-12 translate-x-12 rounded-full bg-primary-200/20 blur-3xl dark:bg-primary-800/10" aria-hidden />

          <div className="relative px-6 py-7 sm:px-8 sm:py-8">
            <div className="flex items-start gap-5">
              <div className="relative">
                <div className="absolute -inset-2 animate-pulse rounded-2xl bg-primary-200/30 blur-lg dark:bg-primary-800/20" />
                <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-violet-600 text-white shadow-lg shadow-primary-500/25">
                  <Brain className="h-7 w-7" />
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-gray-50 sm:text-3xl">
                  AI Assistant
                </h1>
                <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                  Write blog content, generate SEO briefs, plan tasks, draft daily reports, or ask anything.
                </p>
              </div>
            </div>

            {/* Stat chips */}
            <div className="mt-6 flex flex-wrap gap-3">
              <div className="flex items-center gap-2 rounded-xl border border-gray-200/80 bg-white/70 px-3 py-2 backdrop-blur-sm dark:border-gray-700/60 dark:bg-gray-800/50">
                <Zap className="h-4 w-4 text-amber-500" />
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Providers</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-50">{configuredCount} active</p>
                </div>
              </div>
              {usage && (
                <div className="flex items-center gap-2 rounded-xl border border-gray-200/80 bg-white/70 px-3 py-2 backdrop-blur-sm dark:border-gray-700/60 dark:bg-gray-800/50">
                  <Activity className="h-4 w-4 text-emerald-500" />
                  <div>
                    <p className="text-[10px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">This month</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-50">{usage.totalTokens.toLocaleString()} tokens</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2 rounded-xl border border-gray-200/80 bg-white/70 px-3 py-2 backdrop-blur-sm dark:border-gray-700/60 dark:bg-gray-800/50">
                <Shield className="h-4 w-4 text-primary-500" />
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Security</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-50">Audited</p>
                </div>
              </div>
            </div>

            {/* Provider badges */}
            {status && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {(['openai', 'anthropic', 'google', 'groq', 'openrouter'] as const).map((p) => (
                  <span
                    key={p}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium transition',
                      status[p]
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200'
                        : 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-600',
                    )}
                  >
                    <span className={cn('h-1.5 w-1.5 rounded-full', status[p] ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600')} />
                    {p}
                  </span>
                ))}
              </div>
            )}

            {usage && usage.limit > 0 && (
              <div className="mt-4 max-w-sm">
                <AiUsageBar used={usage.totalTokens} limit={usage.limit} />
              </div>
            )}
          </div>
        </div>

        {/* Executive AI — CEO/MD only */}
        {isExec && (
          <Link to="/ai/executive" className="group block">
            <div className="relative overflow-hidden rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50/80 via-white to-orange-50/40 p-5 shadow-sm transition-all hover:shadow-lg hover:shadow-amber-100/50 dark:border-amber-800/40 dark:from-amber-950/30 dark:via-gray-900/60 dark:to-orange-950/20 dark:hover:shadow-amber-900/20 sm:p-6">
              <div className="absolute right-0 top-0 h-32 w-32 -translate-y-8 translate-x-8 rounded-full bg-amber-200/20 blur-2xl dark:bg-amber-800/10" aria-hidden />
              <div className="relative flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/25 transition-transform group-hover:scale-105">
                  <Crown className="h-7 w-7" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50">Executive Assistant</h2>
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">CEO</span>
                  </div>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    Personal AI with full organization access — staff, tasks, finances, projects. Ask anything about your business.
                  </p>
                  <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-amber-600 opacity-0 transition group-hover:opacity-100 dark:text-amber-400">
                    Open <ArrowUpRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </div>
            </div>
          </Link>
        )}

        {/* Tool cards */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {AI_TOOLS_REGISTRY.map((tool) => {
            const Icon = tool.icon
            const accent = ACCENT_MAP[tool.accent] ?? ACCENT_MAP.slate
            return (
              <Link key={tool.id} to={tool.path} className="group block">
                <Card className={cn('h-full border transition-all duration-200 hover:shadow-lg', accent.border, accent.glow)}>
                  <CardContent className="flex flex-col gap-4 p-5">
                    <div className="flex items-start justify-between">
                      <div className={cn('flex h-12 w-12 items-center justify-center rounded-2xl transition-transform duration-200 group-hover:scale-110', accent.bg)}>
                        <Icon className="h-5.5 w-5.5" />
                      </div>
                      <ArrowUpRight className="h-4 w-4 text-gray-300 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary-500 dark:text-gray-600 dark:group-hover:text-primary-400" />
                    </div>
                    <div>
                      <h2 className="text-[15px] font-semibold text-gray-900 group-hover:text-primary-600 dark:text-gray-50 dark:group-hover:text-primary-400">
                        {tool.title}
                      </h2>
                      <p className="mt-1 text-[13px] leading-relaxed text-gray-500 line-clamp-2 dark:text-gray-400">{tool.description}</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>

        {/* Recent conversations */}
        {recentConvs.length > 0 && (
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Recent conversations</h3>
                <Link to="/ai/chat" className="text-xs font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400">View all</Link>
              </div>
              <div className="mt-3 divide-y divide-gray-100 dark:divide-gray-800">
                {recentConvs.slice(0, 5).map((c: any) => (
                  <div key={c.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                    <span className="text-[10px] font-mono text-gray-400 tabular-nums">{new Date(c.createdAt).toLocaleDateString()}</span>
                    <AiProviderBadge provider={c.provider} />
                    <span className="min-w-0 flex-1 truncate text-sm text-gray-700 dark:text-gray-300">{c.title || c.useCase}</span>
                    <span className="shrink-0 text-[10px] text-gray-400">{c.totalTokens.toLocaleString()} tk</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </PageTransition>
  )
}
