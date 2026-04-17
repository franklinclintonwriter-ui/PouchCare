import { useState, useCallback, useRef, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { Crown, X, Minimize2, Maximize2, Send, Square, RotateCcw, Bot, User, Terminal, FolderCode } from 'lucide-react'
import { cn } from '@/utils/cn'
import { AiMarkdownView } from './AiMarkdownView'
import { usePermission } from '@/hooks/usePermission'
import { useWorkspaceSessionStore } from '@/store/workspaceSessionStore'
import { getAccessToken } from '@/utils/storage'
import { getApiOrigin } from '@/config/apiOrigin'
import { AnimatePresence, motion } from 'framer-motion'
import { toast } from 'sonner'
import type { AiSseEvent } from '../types'

interface ChatMessage { role: 'user' | 'assistant'; content: string }

const STORAGE_ENGAGED = 'pouchcare.aiFabEngaged'
const SESSION_LAST_ACT = 'pouchcare.aiFabLastActivity'
/** Hide floating UI after this much inactivity (ms). */
const IDLE_HIDE_MS = 4 * 60 * 1000
/** While panel is open, treat as active this often so reading long replies does not dismiss. */
const HEARTBEAT_OPEN_MS = 90 * 1000

export function AiChatFab() {
  const [open, setOpen] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [streaming, setStreaming] = useState(false)
  const [input, setInput] = useState('')
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [engaged, setEngaged] = useState(() =>
    typeof localStorage !== 'undefined' && localStorage.getItem(STORAGE_ENGAGED) === '1',
  )
  /** When true, idle timeout has hidden the floating UI (FAB + panel). */
  const [idleHidden, setIdleHidden] = useState(() => {
    if (typeof sessionStorage === 'undefined') return false
    try {
      const s = sessionStorage.getItem(SESSION_LAST_ACT)
      if (!s) return false
      return Date.now() - Number(s) > IDLE_HIDE_MS
    } catch {
      return false
    }
  })

  const abortRef = useRef<AbortController | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const lastActivityRef = useRef(
    (() => {
      try {
        const s = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(SESSION_LAST_ACT) : null
        if (s) return Number(s)
      } catch { /* ignore */ }
      return Date.now()
    })(),
  )
  const perm = usePermission()
  const location = useLocation()
  const { activeSession, endSession } = useWorkspaceSessionStore()

  const isExec = perm.isCEO
  const wsMatch = location.pathname.match(/\/ai\/workspace\/([a-f0-9-]+)/)
  const onWorkspacePage = Boolean(wsMatch?.[1])
  const onAiSection = location.pathname.startsWith('/ai')
  const activeWorkspaceId = wsMatch?.[1] ?? activeSession?.workspaceId ?? null
  const hasBackgroundSession = Boolean(activeSession && !onWorkspacePage)

  const bumpActivity = useCallback(() => {
    const t = Date.now()
    lastActivityRef.current = t
    try {
      sessionStorage.setItem(SESSION_LAST_ACT, String(t))
    } catch { /* ignore */ }
    setIdleHidden(false)
  }, [])

  const persistEngaged = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_ENGAGED, '1')
    } catch { /* ignore */ }
    setEngaged(true)
  }, [])

  useEffect(() => {
    if (onAiSection || hasBackgroundSession) {
      persistEngaged()
      bumpActivity()
    }
  }, [onAiSection, hasBackgroundSession, persistEngaged, bumpActivity])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    const tick = () => {
      const quietFor = Date.now() - lastActivityRef.current
      if (quietFor > IDLE_HIDE_MS && !hasBackgroundSession && !streaming) {
        setIdleHidden(true)
        setOpen(false)
      }
    }
    const id = window.setInterval(tick, 12_000)
    tick()
    return () => window.clearInterval(id)
  }, [hasBackgroundSession, streaming])

  useEffect(() => {
    if (!open) return
    const id = window.setInterval(bumpActivity, HEARTBEAT_OPEN_MS)
    return () => window.clearInterval(id)
  }, [open, bumpActivity])

  const reset = useCallback(() => {
    abortRef.current?.abort()
    setMessages([])
    setConversationId(null)
    setStreaming(false)
    setInput('')
    bumpActivity()
  }, [bumpActivity])

  const send = useCallback(async (text: string) => {
    if (!text.trim() || streaming) return
    persistEngaged()
    bumpActivity()
    setInput('')
    setMessages((prev) => [...prev, { role: 'user', content: text }])
    setStreaming(true)
    const ac = new AbortController()
    abortRef.current = ac

    try {
      const origin = getApiOrigin() ?? ''
      const token = getAccessToken()
      const endpoint = isExec ? `${origin}/v1/ai/executive/chat` : `${origin}/v1/ai/chat`

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          message: text,
          conversationId: conversationId ?? undefined,
          ...(activeWorkspaceId ? { workspaceId: activeWorkspaceId } : {}),
          ...(!isExec ? { useCase: 'CHAT' } : {}),
        }),
        signal: ac.signal,
      })

      if (!res.ok || !res.body) {
        setStreaming(false)
        return
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let assistantText = ''
      setMessages((prev) => [...prev, { role: 'assistant', content: '' }])

      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const evt: AiSseEvent = JSON.parse(line.slice(6))
            if (evt.type === 'start' && evt.conversationId) setConversationId(evt.conversationId)
            else if (evt.type === 'chunk' && evt.text) {
              assistantText += evt.text
              const s = assistantText
              setMessages((prev) => { const c = [...prev]; c[c.length - 1] = { role: 'assistant', content: s }; return c })
            }
          } catch { /* skip */ }
        }
      }
    } catch (e) {
      if ((e as Error).name !== 'AbortError') toast.error('Chat failed')
    } finally {
      setStreaming(false)
      abortRef.current = null
      bumpActivity()
    }
  }, [streaming, conversationId, isExec, activeWorkspaceId, persistEngaged, bumpActivity])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input) }
  }

  const toggleOpen = useCallback(() => {
    setOpen((v) => {
      const next = !v
      if (next) {
        persistEngaged()
        bumpActivity()
      } else {
        bumpActivity()
      }
      return next
    })
  }, [persistEngaged, bumpActivity])

  const label = hasBackgroundSession ? activeSession!.workspaceName : isExec ? 'Executive AI' : 'AI Assistant'
  const accentFrom = isExec ? 'from-amber-500' : 'from-primary-500'
  const accentTo = isExec ? 'to-orange-600' : 'to-violet-600'
  const Icon = isExec ? Crown : Bot

  const conversationStarted = messages.length > 0 || streaming
  const showFloatingChrome =
    engaged || onAiSection || hasBackgroundSession

  const showFab =
    showFloatingChrome &&
    (!idleHidden || hasBackgroundSession || streaming || open)

  if (!showFab) {
    return null
  }

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className={cn(
              'fixed z-[90] flex flex-col overflow-hidden rounded-2xl border shadow-2xl',
              isExec ? 'border-amber-200 dark:border-amber-800/40' : 'border-gray-200 dark:border-gray-700',
              'bg-white dark:bg-gray-900',
              expanded
                ? 'bottom-4 right-4 h-[calc(100vh-2rem)] w-[calc(100vw-2rem)] sm:bottom-6 sm:right-6 sm:h-[640px] sm:w-[480px]'
                : 'bottom-[7.5rem] right-4 h-[calc(100vh-10rem)] max-h-[480px] w-[360px] max-w-[calc(100vw-2rem)] lg:bottom-6 lg:right-6 lg:h-[480px]',
            )}
          >
            {/* Header */}
            <div className={cn('flex shrink-0 items-center justify-between border-b px-4 py-2.5', isExec ? 'border-amber-100 bg-gradient-to-r from-amber-50/80 to-white dark:border-amber-900/30 dark:from-amber-950/20 dark:to-gray-900' : 'border-gray-100 dark:border-gray-800')}>
              <div className="flex min-w-0 items-center gap-2">
                <div className={cn('flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br', hasBackgroundSession ? 'from-cyan-500 to-violet-600' : accentFrom + ' ' + accentTo)}>
                  {hasBackgroundSession ? <FolderCode className="h-3 w-3 text-white" /> : <Icon className="h-3 w-3 text-white" />}
                </div>
                <div className="min-w-0">
                  <span className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">{label}</span>
                  {hasBackgroundSession && (
                    <span className="ml-1.5 inline-flex items-center gap-0.5 rounded bg-cyan-100 px-1 py-0.5 text-[8px] font-bold text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300">
                      <span className="h-1 w-1 animate-pulse rounded-full bg-cyan-500" /> ACTIVE
                    </span>
                  )}
                  {!hasBackgroundSession && activeWorkspaceId && <span className="ml-1.5 rounded bg-cyan-100 px-1 py-0.5 text-[8px] font-bold text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300">WS</span>}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-0.5">
                {hasBackgroundSession && (
                  <button
                    type="button"
                    onClick={() => { endSession(); reset() }}
                    className="rounded-lg px-1.5 py-0.5 text-[9px] font-medium text-red-400 transition hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/30"
                  >
                    End
                  </button>
                )}
                {conversationStarted && (
                  <>
                    <button type="button" onClick={reset} className="rounded-lg p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300" aria-label="New chat"><RotateCcw className="h-3 w-3" /></button>
                    <button type="button" onClick={() => setExpanded((v) => !v)} className="hidden rounded-lg p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300 sm:block" aria-label={expanded ? 'Minimize' : 'Maximize'}>
                      {expanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => { setOpen(false); bumpActivity() }}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-gray-50 text-gray-600 shadow-sm transition hover:bg-gray-100 hover:text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
                  aria-label="Close panel"
                >
                  <X className="h-4 w-4" strokeWidth={2.25} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className={cn('rounded-2xl p-4 bg-gradient-to-br', isExec ? 'from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/15' : 'from-primary-50 to-violet-50 dark:from-primary-900/20 dark:to-violet-900/15')}>
                    <Icon className={cn('h-8 w-8', isExec ? 'text-amber-600 dark:text-amber-400' : 'text-primary-600 dark:text-primary-400')} />
                  </div>
                  <p className="mt-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                    {isExec ? 'Executive Assistant' : 'How can I help?'}
                  </p>
                  <p className="mt-1 max-w-[240px] text-[11px] text-gray-500 dark:text-gray-400">
                    {hasBackgroundSession
                      ? `Background session: ${activeSession!.workspaceName}. Your workspace context is active.`
                      : isExec
                        ? 'Full org access — staff, tasks, finances.'
                        : activeWorkspaceId
                          ? 'Connected to workspace — ask about your code or run commands.'
                          : 'Ask anything about work.'}
                  </p>
                  {(activeWorkspaceId || hasBackgroundSession) && (
                    <p className="mt-2 flex items-center gap-1 rounded-lg bg-cyan-50 px-2 py-1 text-[10px] text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300">
                      <Terminal className="h-3 w-3" /> {hasBackgroundSession ? 'Background session active' : 'Workspace commands active'}
                    </p>
                  )}
                </div>
              )}

              <div className="space-y-3">
                {messages.map((msg, i) => (
                  <div key={i} className={cn('flex gap-2', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                    {msg.role === 'assistant' && (
                      <div className={cn('flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br', accentFrom, accentTo)}>
                        <Icon className="h-3 w-3 text-white" />
                      </div>
                    )}
                    <div className={cn(
                      'max-w-[85%] rounded-2xl px-3 py-2 text-sm',
                      msg.role === 'user'
                        ? cn('text-white shadow-sm bg-gradient-to-br', accentFrom, accentTo)
                        : 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100',
                    )}>
                      {msg.role === 'assistant'
                        ? <AiMarkdownView content={msg.content || (streaming && i === messages.length - 1 ? '...' : '')} showCopy={false} />
                        : <p className="whitespace-pre-wrap text-[13px]">{msg.content}</p>
                      }
                    </div>
                    {msg.role === 'user' && (
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-gray-200 dark:bg-gray-700">
                        <User className="h-3 w-3 text-gray-600 dark:text-gray-400" />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {streaming && (
                <div className="mt-2 flex items-center gap-2 pl-8">
                  <span className="flex gap-0.5">
                    <span className={cn('h-1.5 w-1.5 animate-bounce rounded-full [animation-delay:0ms]', isExec ? 'bg-amber-400' : 'bg-primary-400')} />
                    <span className={cn('h-1.5 w-1.5 animate-bounce rounded-full [animation-delay:150ms]', isExec ? 'bg-amber-400' : 'bg-primary-400')} />
                    <span className={cn('h-1.5 w-1.5 animate-bounce rounded-full [animation-delay:300ms]', isExec ? 'bg-amber-400' : 'bg-primary-400')} />
                  </span>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="border-t border-gray-200 bg-gray-50/50 p-3 dark:border-gray-700 dark:bg-gray-800/50">
              <div className="flex items-end gap-2">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => { setInput(e.target.value); e.target.style.height = 'auto'; e.target.style.height = `${Math.min(e.target.scrollHeight, 96)}px` }}
                  onFocus={bumpActivity}
                  onKeyDown={handleKeyDown}
                  placeholder={isExec ? 'Ask about staff, tasks, finances...' : activeWorkspaceId ? 'Ask about code or run commands...' : 'Quick question...'}
                  rows={1}
                  className="min-h-[36px] max-h-24 flex-1 resize-none rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-primary-400 focus:ring-1 focus:ring-primary-400/20 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                />
                {streaming ? (
                  <button type="button" onClick={() => abortRef.current?.abort()} className={cn('flex h-9 w-9 items-center justify-center rounded-xl bg-red-500 text-white')}><Square className="h-3.5 w-3.5" /></button>
                ) : (
                  <button type="button" onClick={() => send(input)} disabled={!input.trim()} className={cn('flex h-9 w-9 items-center justify-center rounded-xl text-white transition disabled:opacity-30 bg-gradient-to-br', accentFrom, accentTo)}><Send className="h-3.5 w-3.5" /></button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={toggleOpen}
        className={cn(
          'no-print fixed bottom-[5.5rem] right-4 z-[90] flex items-center justify-center rounded-full shadow-lg transition-all duration-200 active:scale-95',
          'lg:bottom-6 lg:right-6',
          open
            ? cn(
                'h-12 w-12 border-2 border-white/25 bg-gradient-to-br from-gray-800 to-gray-950 text-white shadow-xl ring-2 ring-black/20 ring-offset-2 ring-offset-gray-50',
                'dark:from-white dark:to-gray-100 dark:text-gray-900 dark:ring-white/30 dark:ring-offset-gray-950',
                'lg:h-14 lg:w-14',
              )
            : hasBackgroundSession
              ? 'h-12 w-12 bg-gradient-to-br from-cyan-500 to-violet-600 text-white shadow-md hover:from-cyan-600 hover:to-violet-700 lg:h-14 lg:w-14'
              : cn('h-12 w-12 text-white shadow-md lg:h-14 lg:w-14 bg-gradient-to-br', accentFrom, isExec ? 'hover:from-amber-600 hover:to-orange-700' : 'hover:from-primary-700 hover:to-violet-700', accentTo),
        )}
        aria-label={open ? 'Close AI chat' : `Open ${label}`}
      >
        {open ? (
          <X className="h-5 w-5" strokeWidth={2.25} />
        ) : (
          <div className="relative">
            {hasBackgroundSession ? <FolderCode className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
            <span className={cn('absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full ring-2 ring-white dark:ring-gray-900', hasBackgroundSession ? 'animate-pulse bg-cyan-400' : isExec ? 'bg-amber-400' : 'bg-emerald-400')} />
          </div>
        )}
      </button>
    </>
  )
}
