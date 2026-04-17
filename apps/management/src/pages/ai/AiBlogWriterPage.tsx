import { useCallback, useMemo, useRef, useState } from 'react'
import { Download, Play, Trash2, Square, FileText, Hash } from 'lucide-react'
import { useHeaderConfig } from '@/hooks/useHeaderConfig'
import { PageTransition } from '@/components/ui/PageTransition'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { ToolPageChrome } from '@/features/tools/components/ToolPageChrome'
import { AiMarkdownView } from '@/features/ai/components/AiMarkdownView'
import { AiProviderBadge } from '@/features/ai/components/AiProviderBadge'
import { AiModelSelector } from '@/features/ai/components/AiModelSelector'
import { Card, CardContent } from '@/components/ui/Card'
import { useAiStatus } from '@/api/ai'
import { getAccessToken } from '@/utils/storage'
import { getApiOrigin } from '@/config/apiOrigin'
import { toast } from 'sonner'
import type { AiSseEvent } from '@/features/ai/types'

const TONES = [
  { value: 'professional', label: 'Professional' },
  { value: 'casual', label: 'Casual' },
  { value: 'technical', label: 'Technical' },
]

const WORD_PRESETS = [
  { value: '600', label: 'Short (600)' },
  { value: '1200', label: 'Medium (1200)' },
  { value: '2000', label: 'Long (2000)' },
  { value: '3000', label: 'In-depth (3000)' },
]

export default function AiBlogWriterPage() {
  const [topic, setTopic] = useState('')
  const [keywords, setKeywords] = useState('')
  const [tone, setTone] = useState('professional')
  const [wordCount, setWordCount] = useState('1200')
  const [outline, setOutline] = useState('')
  const [selectedModel, setSelectedModel] = useState('')
  const [output, setOutput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [tokenUsage, setTokenUsage] = useState<{ input: number; output: number } | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const { data: status } = useAiStatus()

  const clearAll = useCallback(() => {
    abortRef.current?.abort()
    setTopic('')
    setKeywords('')
    setOutline('')
    setOutput('')
    setTokenUsage(null)
  }, [])

  const stopGeneration = useCallback(() => {
    abortRef.current?.abort()
  }, [])

  const run = useCallback(async () => {
    if (!topic.trim()) return
    setOutput('')
    setTokenUsage(null)
    setStreaming(true)
    const ac = new AbortController()
    abortRef.current = ac

    try {
      const origin = getApiOrigin() ?? ''
      const token = getAccessToken()
      const res = await fetch(`${origin}/v1/ai/blog/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          topic: topic.trim(),
          keywords: keywords.trim() || undefined,
          tone,
          wordCount: Number(wordCount) || 1200,
          outline: outline.trim() || undefined,
          ...(selectedModel ? { model: selectedModel, provider: status?.models?.find((m) => m.id === selectedModel)?.provider } : {}),
        }),
        signal: ac.signal,
      })

      if (!res.ok || !res.body) {
        toast.error('Blog generation failed')
        setStreaming(false)
        return
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let content = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const evt: AiSseEvent = JSON.parse(line.slice(6))
            if (evt.type === 'chunk' && evt.text) {
              content += evt.text
              setOutput(content)
            } else if (evt.type === 'done') {
              if (evt.usage) setTokenUsage(evt.usage)
              toast.success('Article generated')
            } else if (evt.type === 'error') {
              toast.error(evt.error ?? 'Generation failed')
            }
          } catch { /* skip */ }
        }
      }
    } catch (e) {
      if ((e as Error).name !== 'AbortError') toast.error('Stream failed')
    } finally {
      setStreaming(false)
      abortRef.current = null
    }
  }, [topic, keywords, tone, wordCount, outline])

  const exportMd = useCallback(() => {
    if (!output) return
    const blob = new Blob([output], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${topic.trim().slice(0, 40).replace(/\s+/g, '-').toLowerCase() || 'article'}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [output, topic])

  const exportHtml = useCallback(() => {
    if (!output) return
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${topic}</title></head><body>${output}</body></html>`
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${topic.trim().slice(0, 40).replace(/\s+/g, '-').toLowerCase() || 'article'}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [output, topic])

  const wordCountEst = output ? output.split(/\s+/).length : 0

  const headerConfig = useMemo(() => ({
    title: 'Blog Writer',
    description: streaming ? 'Generating...' : output ? `${wordCountEst} words` : undefined,
    breadcrumbs: [{ label: 'AI', href: '/ai' }, { label: 'Blog Writer' }],
    actions: [
      { type: 'button' as const, label: 'Export .md', icon: Download, variant: 'secondary' as const, disabled: !output || streaming, onClick: exportMd },
      { type: 'button' as const, label: 'Clear', icon: Trash2, variant: 'ghost' as const, onClick: clearAll },
      ...(streaming
        ? [{ type: 'button' as const, label: 'Stop', icon: Square, variant: 'danger' as const, onClick: stopGeneration }]
        : [{ type: 'button' as const, label: 'Generate', icon: Play, variant: 'primary' as const, disabled: !topic.trim() || !status?.hasAny, onClick: run }]
      ),
    ],
  }), [output, exportMd, clearAll, run, topic, status?.hasAny, streaming, stopGeneration, wordCountEst])

  useHeaderConfig(headerConfig, [output, exportMd, clearAll, run, topic, status?.hasAny, streaming, stopGeneration, wordCountEst])

  return (
    <PageTransition>
      <div className="mx-auto max-w-5xl space-y-5 px-4 pb-10 pt-1 sm:px-6 lg:px-8">
        <ToolPageChrome accent="emerald" eyebrow="AI Content" title="Blog article writer" hint="Topic + keywords + tone → SEO-ready article — stream live" />

        {/* Input form */}
        <Card>
          <CardContent className="space-y-4 p-5">
            <div className="grid gap-4 lg:grid-cols-2">
              <Input label="Topic" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. How to build backlinks in 2026" />
              <Input label="Target keywords" value={keywords} onChange={(e) => setKeywords(e.target.value)} placeholder="backlinks, link building, SEO (comma-separated)" />
              <Select label="Tone" value={tone} onChange={(e) => setTone(e.target.value)} options={TONES} />
              <Select label="Target length" value={wordCount} onChange={(e) => setWordCount(e.target.value)} options={WORD_PRESETS} />
            </div>
            {status?.models && status.models.length > 0 && (
              <div className="flex items-center gap-3">
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Model</span>
                <AiModelSelector
                  models={status.models}
                  value={selectedModel || status.defaultModel}
                  onChange={setSelectedModel}
                />
              </div>
            )}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Outline (optional)</label>
              <textarea
                value={outline}
                onChange={(e) => setOutline(e.target.value)}
                placeholder="H2 sections, key points to cover..."
                rows={3}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-400/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              />
            </div>
            {!status?.hasAny && (
              <div className="rounded-lg border border-amber-200 bg-amber-50/80 px-3 py-2 text-xs text-amber-800 dark:border-amber-800/60 dark:bg-amber-950/30 dark:text-amber-200">
                Configure an AI provider in the API .env to enable this tool.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Streaming progress */}
        {streaming && (
          <div className="flex items-center gap-3 rounded-xl border border-primary-200 bg-primary-50/80 px-4 py-3 dark:border-primary-800/60 dark:bg-primary-950/30">
            <div className="flex gap-1">
              <span className="h-2 w-2 animate-bounce rounded-full bg-primary-500 [animation-delay:0ms]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-primary-500 [animation-delay:150ms]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-primary-500 [animation-delay:300ms]" />
            </div>
            <span className="text-sm font-medium text-primary-700 dark:text-primary-300">Writing article... {wordCountEst > 0 ? `(${wordCountEst} words)` : ''}</span>
          </div>
        )}

        {/* Output */}
        {output && (
          <div className="space-y-3">
            {/* Meta bar */}
            <div className="flex flex-wrap items-center gap-3">
              {status && <AiProviderBadge provider={status.defaultProvider} model={status.defaultModel} />}
              <span className="inline-flex items-center gap-1 text-[11px] text-gray-500 dark:text-gray-400">
                <FileText className="h-3 w-3" /> {wordCountEst} words
              </span>
              {tokenUsage && (
                <span className="inline-flex items-center gap-1 text-[11px] text-gray-500 dark:text-gray-400">
                  <Hash className="h-3 w-3" /> {(tokenUsage.input + tokenUsage.output).toLocaleString()} tokens
                </span>
              )}
              <div className="ml-auto flex gap-1.5">
                <button onClick={exportMd} className="rounded-lg border border-gray-200 px-2.5 py-1 text-[11px] font-medium text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800">
                  .md
                </button>
                <button onClick={exportHtml} className="rounded-lg border border-gray-200 px-2.5 py-1 text-[11px] font-medium text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800">
                  .html
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200/90 bg-white p-6 shadow-sm dark:border-gray-700/60 dark:bg-gray-900 sm:p-8">
              <AiMarkdownView content={output} />
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  )
}
