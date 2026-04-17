import { useState, useRef, useEffect, useCallback } from 'react'
import { Send, Square, RotateCcw, Bot, User, Copy, Check, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/utils/cn'
import { AiMarkdownView } from './AiMarkdownView'
import { AiProviderBadge } from './AiProviderBadge'
import type { useAiChat } from '../hooks/useAiChat'

type ChatState = ReturnType<typeof useAiChat>

interface AiChatPanelProps {
  chat: ChatState
  provider?: string
  model?: string
  placeholder?: string
  className?: string
  suggestions?: string[]
  compact?: boolean
}

const DEFAULT_SUGGESTIONS = [
  'Summarize my tasks for today',
  'Draft an SEO meta description',
  'Break down a project into subtasks',
  'Write a professional email',
]

export function AiChatPanel({
  chat,
  provider,
  model,
  placeholder,
  className,
  suggestions = DEFAULT_SUGGESTIONS,
  compact = false,
}: AiChatPanelProps) {
  const [input, setInput] = useState('')
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chat.messages])

  useEffect(() => {
    if (!chat.streaming && chat.messages.length > 0) inputRef.current?.focus()
  }, [chat.streaming, chat.messages.length])

  const handleSubmit = () => {
    const text = input.trim()
    if (!text || chat.streaming) return
    setInput('')
    chat.send(text)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const copyMessage = useCallback((idx: number, content: string) => {
    navigator.clipboard.writeText(content).then(() => {
      setCopiedIdx(idx)
      setTimeout(() => setCopiedIdx(null), 2000)
    })
  }, [])

  const handleSuggestion = (text: string) => {
    if (chat.streaming) return
    chat.send(text)
  }

  const autoResize = (el: HTMLTextAreaElement) => {
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 128)}px`
  }

  return (
    <div className={cn('flex h-full flex-col', className)}>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5">
        {chat.messages.length === 0 && !chat.streaming && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="relative">
              <div className="absolute -inset-3 animate-pulse rounded-3xl bg-primary-100/50 blur-xl dark:bg-primary-900/20" />
              <div className="relative rounded-2xl bg-gradient-to-br from-primary-50 to-violet-50 p-5 dark:from-primary-900/30 dark:to-violet-900/20">
                <Bot className="h-10 w-10 text-primary-600 dark:text-primary-400" />
              </div>
            </div>
            <h3 className="mt-5 text-base font-semibold text-gray-900 dark:text-gray-50">
              {compact ? 'Quick AI' : 'How can I help today?'}
            </h3>
            <p className="mt-1.5 max-w-xs text-xs leading-relaxed text-gray-500 dark:text-gray-400">
              {compact
                ? 'Ask any work question.'
                : 'I can help with tasks, content writing, SEO, planning, and more.'}
            </p>
            {!compact && (
              <div className="mt-5 grid w-full max-w-md grid-cols-2 gap-2">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handleSuggestion(s)}
                    className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-left text-[12px] leading-snug text-gray-700 transition hover:border-primary-300 hover:bg-primary-50/50 hover:text-primary-700 dark:border-gray-700 dark:bg-gray-800/80 dark:text-gray-300 dark:hover:border-primary-700 dark:hover:bg-primary-950/30 dark:hover:text-primary-300"
                  >
                    <Sparkles className="mb-1 h-3 w-3 text-primary-400" />
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="space-y-4">
          {chat.messages.map((msg, i) => (
            <div key={i} className={cn('flex gap-2.5', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
              {msg.role === 'assistant' && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-100 to-violet-100 dark:from-primary-900/40 dark:to-violet-900/30">
                  <Bot className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                </div>
              )}
              <div className="group/msg relative max-w-[82%]">
                <div
                  className={cn(
                    'rounded-2xl px-4 py-3 text-sm',
                    msg.role === 'user'
                      ? 'bg-gradient-to-br from-primary-600 to-primary-700 text-white shadow-sm'
                      : 'bg-gray-50 text-gray-900 ring-1 ring-gray-200/80 dark:bg-gray-800/80 dark:text-gray-100 dark:ring-gray-700/60',
                  )}
                >
                  {msg.role === 'assistant' ? (
                    <AiMarkdownView content={msg.content || (chat.streaming && i === chat.messages.length - 1 ? '...' : '')} />
                  ) : (
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  )}
                </div>
                {msg.role === 'assistant' && msg.content && (
                  <button
                    type="button"
                    onClick={() => copyMessage(i, msg.content)}
                    className="absolute -bottom-1 right-2 flex h-6 items-center gap-1 rounded-full border border-gray-200 bg-white px-2 text-[10px] font-medium text-gray-500 opacity-0 shadow-sm transition group-hover/msg:opacity-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
                  >
                    {copiedIdx === i ? <><Check className="h-2.5 w-2.5 text-emerald-500" /> Copied</> : <><Copy className="h-2.5 w-2.5" /> Copy</>}
                  </button>
                )}
              </div>
              {msg.role === 'user' && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gray-200 dark:bg-gray-700">
                  <User className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                </div>
              )}
            </div>
          ))}
        </div>

        {chat.streaming && (
          <div className="mt-3 flex items-center gap-2 pl-10">
            <span className="flex gap-1">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary-400 [animation-delay:0ms]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary-400 [animation-delay:150ms]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary-400 [animation-delay:300ms]" />
            </span>
            <span className="text-[11px] text-gray-400">Thinking...</span>
          </div>
        )}

        {chat.error && (
          <div className="mt-3 rounded-xl border border-red-200 bg-red-50/80 px-4 py-3 text-xs text-red-800 dark:border-red-800/60 dark:bg-red-950/30 dark:text-red-200">
            {chat.error}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {provider && (
        <div className="border-t border-gray-100 px-4 py-1.5 dark:border-gray-800">
          <AiProviderBadge provider={provider} model={model} />
        </div>
      )}

      <div className="border-t border-gray-200 bg-gray-50/50 p-3 dark:border-gray-700 dark:bg-gray-800/50">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value)
              autoResize(e.target)
            }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder ?? 'Type a message... (Enter to send)'}
            rows={1}
            className="min-h-[42px] max-h-32 flex-1 resize-none rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-400/20 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-primary-500 dark:focus:ring-primary-500/20"
          />
          <div className="flex shrink-0 gap-1">
            {chat.streaming ? (
              <Button size="sm" variant="danger" onClick={chat.stop} icon={<Square className="h-3.5 w-3.5" />} className="h-[42px] w-[42px] rounded-xl" aria-label="Stop" />
            ) : (
              <>
                {chat.messages.length > 0 && (
                  <Button size="sm" variant="ghost" onClick={chat.reset} icon={<RotateCcw className="h-3.5 w-3.5" />} className="h-[42px] w-[42px] rounded-xl" aria-label="New chat" />
                )}
                <Button size="sm" variant="primary" onClick={handleSubmit} disabled={!input.trim()} icon={<Send className="h-3.5 w-3.5" />} className="h-[42px] w-[42px] rounded-xl" aria-label="Send" />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
