import { useCallback, useMemo, useState } from 'react'
import { Download, Play, Trash2, Target, ListOrdered, Type, AlignLeft, Link2, Eye, Hash } from 'lucide-react'
import { useHeaderConfig } from '@/hooks/useHeaderConfig'
import { PageTransition } from '@/components/ui/PageTransition'
import { Input } from '@/components/ui/Input'
import { ToolPageChrome } from '@/features/tools/components/ToolPageChrome'
import { Card, CardContent } from '@/components/ui/Card'
import { AiProviderBadge } from '@/features/ai/components/AiProviderBadge'
import { useAiSeoBrief, useAiStatus } from '@/api/ai'
import { toast } from 'sonner'
import { cn } from '@/utils/cn'

const SECTION_ICONS: Record<string, React.ReactNode> = {
  titleSuggestions: <Type className="h-4 w-4 text-violet-500" />,
  metaDescription: <AlignLeft className="h-4 w-4 text-emerald-500" />,
  targetWordCount: <Target className="h-4 w-4 text-amber-500" />,
  headingOutline: <ListOrdered className="h-4 w-4 text-sky-500" />,
  contentAngle: <Eye className="h-4 w-4 text-rose-500" />,
  internalLinkSuggestions: <Link2 className="h-4 w-4 text-primary-500" />,
  competitorInsights: <Hash className="h-4 w-4 text-gray-500" />,
}

const SECTION_LABELS: Record<string, string> = {
  titleSuggestions: 'Title suggestions',
  metaDescription: 'Meta description',
  targetWordCount: 'Target word count',
  headingOutline: 'Heading outline (H2s)',
  contentAngle: 'Content angle',
  internalLinkSuggestions: 'Internal link topics',
  competitorInsights: 'Competitor insights',
}

export default function AiSeoBriefPage() {
  const [primaryKw, setPrimaryKw] = useState('')
  const [secondaryKw, setSecondaryKw] = useState('')
  const [competitors, setCompetitors] = useState('')
  const [brief, setBrief] = useState<Record<string, unknown> | null>(null)
  const [providerUsed, setProviderUsed] = useState('')
  const [modelUsed, setModelUsed] = useState('')
  const { data: status } = useAiStatus()
  const mutation = useAiSeoBrief()

  const clearAll = useCallback(() => {
    setPrimaryKw('')
    setSecondaryKw('')
    setCompetitors('')
    setBrief(null)
  }, [])

  const run = useCallback(async () => {
    if (!primaryKw.trim()) return
    try {
      const res = await mutation.mutateAsync({
        primaryKeyword: primaryKw.trim(),
        secondaryKeywords: secondaryKw.trim() || undefined,
        competitorUrls: competitors.trim() || undefined,
      })
      setBrief(res.brief)
      setProviderUsed(res.provider)
      setModelUsed(res.model)
      toast.success('SEO brief generated')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Brief generation failed')
    }
  }, [primaryKw, secondaryKw, competitors, mutation])

  const exportMd = useCallback(() => {
    if (!brief) return
    const sections = Object.entries(brief).map(([k, v]) => {
      const label = SECTION_LABELS[k] ?? k
      if (Array.isArray(v)) return `## ${label}\n${v.map((i) => `- ${i}`).join('\n')}`
      return `## ${label}\n${String(v)}`
    })
    const md = `# SEO Brief: ${primaryKw}\n\n${sections.join('\n\n')}`
    const blob = new Blob([md], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `seo-brief-${primaryKw.trim().slice(0, 30).replace(/\s+/g, '-').toLowerCase()}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [brief, primaryKw])

  const headerConfig = useMemo(() => ({
    title: 'SEO Brief',
    description: brief ? `"${primaryKw}"` : undefined,
    breadcrumbs: [{ label: 'AI', href: '/ai' }, { label: 'SEO Brief' }],
    actions: [
      { type: 'button' as const, label: 'Export', icon: Download, variant: 'secondary' as const, disabled: !brief, onClick: exportMd },
      { type: 'button' as const, label: 'Clear', icon: Trash2, variant: 'ghost' as const, onClick: clearAll },
      { type: 'button' as const, label: 'Generate', icon: Play, variant: 'primary' as const, disabled: !primaryKw.trim() || !status?.hasAny, isLoading: mutation.isPending, onClick: run },
    ],
  }), [brief, exportMd, clearAll, run, primaryKw, status?.hasAny, mutation.isPending])

  useHeaderConfig(headerConfig, [brief, exportMd, clearAll, run, primaryKw, status?.hasAny, mutation.isPending])

  const orderedKeys = brief ? [
    'titleSuggestions', 'metaDescription', 'targetWordCount', 'headingOutline',
    'contentAngle', 'internalLinkSuggestions', 'competitorInsights',
    ...Object.keys(brief).filter((k) => !SECTION_LABELS[k]),
  ].filter((k) => k in brief) : []

  return (
    <PageTransition>
      <div className="mx-auto max-w-5xl space-y-5 px-4 pb-10 pt-1 sm:px-6 lg:px-8">
        <ToolPageChrome accent="violet" eyebrow="AI SEO" title="Content brief generator" hint="Primary keyword → structured brief with headings, meta, and content angle" />

        <Card>
          <CardContent className="space-y-4 p-5">
            <div className="grid gap-4 lg:grid-cols-2">
              <Input label="Primary keyword" value={primaryKw} onChange={(e) => setPrimaryKw(e.target.value)} placeholder="e.g. link building services" />
              <Input label="Secondary keywords" value={secondaryKw} onChange={(e) => setSecondaryKw(e.target.value)} placeholder="backlinks, guest posting (comma-separated)" />
            </div>
            <Input label="Competitor URLs (optional)" value={competitors} onChange={(e) => setCompetitors(e.target.value)} placeholder="https://competitor.com/page" />
            {!status?.hasAny && (
              <div className="rounded-lg border border-amber-200 bg-amber-50/80 px-3 py-2 text-xs text-amber-800 dark:border-amber-800/60 dark:bg-amber-950/30 dark:text-amber-200">
                Configure an AI provider on the API.
              </div>
            )}
          </CardContent>
        </Card>

        {brief && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <AiProviderBadge provider={providerUsed} model={modelUsed} />
              <span className="text-[11px] text-gray-400">Brief for &ldquo;{primaryKw}&rdquo;</span>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              {orderedKeys.map((key) => {
                const value = brief[key]
                const icon = SECTION_ICONS[key] ?? <Hash className="h-4 w-4 text-gray-400" />
                const label = SECTION_LABELS[key] ?? key.replace(/([A-Z])/g, ' $1').trim()
                const isFullWidth = key === 'headingOutline' || key === 'competitorInsights' || key === 'contentAngle'

                return (
                  <Card key={key} className={cn(isFullWidth && 'lg:col-span-2')}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        {icon}
                        <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400">{label}</h4>
                      </div>
                      <div className="mt-3">
                        {Array.isArray(value) ? (
                          <ul className="space-y-1.5">
                            {(value as string[]).map((v, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-400" />
                                {String(v)}
                              </li>
                            ))}
                          </ul>
                        ) : typeof value === 'number' ? (
                          <p className="text-2xl font-bold text-gray-900 dark:text-gray-50">{value.toLocaleString()}<span className="ml-1 text-sm font-normal text-gray-500">words</span></p>
                        ) : (
                          <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">{String(value)}</p>
                        )}
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
