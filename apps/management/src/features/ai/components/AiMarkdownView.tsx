import { useCallback, useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { cn } from '@/utils/cn'

interface AiMarkdownViewProps {
  content: string
  className?: string
  showCopy?: boolean
}

export function AiMarkdownView({ content, className, showCopy = true }: AiMarkdownViewProps) {
  const [copied, setCopied] = useState(false)

  const copy = useCallback(() => {
    navigator.clipboard.writeText(content).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }, [content])

  return (
    <div className={cn('group/md relative', className)}>
      {showCopy && content.length > 50 && (
        <button
          type="button"
          onClick={copy}
          className="absolute right-2 top-2 z-10 flex items-center gap-1 rounded-lg border border-gray-200 bg-white/90 px-2 py-1 text-[10px] font-medium text-gray-500 opacity-0 shadow-sm backdrop-blur-sm transition hover:text-gray-900 group-hover/md:opacity-100 dark:border-gray-700 dark:bg-gray-800/90 dark:text-gray-400 dark:hover:text-gray-100"
          aria-label="Copy"
        >
          {copied ? <><Check className="h-3 w-3 text-emerald-500" /> Copied</> : <><Copy className="h-3 w-3" /> Copy</>}
        </button>
      )}
      <div
        className="prose prose-sm max-w-none dark:prose-invert prose-headings:font-semibold prose-headings:tracking-tight prose-h2:mt-6 prose-h2:text-base prose-h3:text-sm prose-p:leading-relaxed prose-a:text-primary-600 prose-a:no-underline hover:prose-a:underline prose-code:rounded prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:font-mono prose-code:text-xs prose-code:before:content-[''] prose-code:after:content-[''] dark:prose-code:bg-gray-800 prose-pre:rounded-xl prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-li:my-0.5"
        dangerouslySetInnerHTML={{ __html: markdownToHtml(content) }}
      />
    </div>
  )
}

function markdownToHtml(md: string): string {
  let html = md
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  // Code blocks (triple backtick)
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_m, lang, code) => {
    return `<pre><code class="language-${lang}">${code.trim()}</code></pre>`
  })

  // Headings
  html = html.replace(/^#### (.+)$/gm, '<h4>$1</h4>')
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>')
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>')
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>')

  // Horizontal rule
  html = html.replace(/^---$/gm, '<hr />')

  // Bold, italic, inline code
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>')
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>')

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')

  // Numbered lists
  html = html.replace(/^(\d+)\. (.+)$/gm, '<oli>$2</oli>')
  html = html.replace(/((?:<oli>.*<\/oli>\n?)+)/g, (match) => {
    const items = match.replace(/<\/?oli>/g, '').split('\n').filter(Boolean)
    return '<ol>' + items.map((i) => `<li>${i}</li>`).join('') + '</ol>'
  })

  // Unordered lists
  html = html.replace(/^[-*] (.+)$/gm, '<uli>$1</uli>')
  html = html.replace(/((?:<uli>.*<\/uli>\n?)+)/g, (match) => {
    const items = match.replace(/<\/?uli>/g, '').split('\n').filter(Boolean)
    return '<ul>' + items.map((i) => `<li>${i}</li>`).join('') + '</ul>'
  })

  // Blockquotes
  html = html.replace(/^&gt; (.+)$/gm, '<blockquote>$1</blockquote>')

  // Paragraphs
  html = html.replace(/\n{2,}/g, '</p><p>')
  html = `<p>${html}</p>`

  // Clean up nested tags
  html = html.replace(/<p><(h[1-4]|ul|ol|pre|blockquote|hr)/g, '<$1')
  html = html.replace(/<\/(h[1-4]|ul|ol|pre|blockquote)><\/p>/g, '</$1>')
  html = html.replace(/<p><hr \/><\/p>/g, '<hr />')
  html = html.replace(/<p>\s*<\/p>/g, '')

  return html
}
