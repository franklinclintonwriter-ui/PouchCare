import { useCallback, useRef, useState } from 'react'
import { getAccessToken } from '@/utils/storage'
import { getApiOrigin } from '@/config/apiOrigin'
import type { AiSseEvent } from '../types'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface UseAiChatOptions {
  useCase?: string
  provider?: string
  model?: string
  context?: string
  systemPrompt?: string
  workspaceId?: string
}

export function useAiChat(opts: UseAiChatOptions = {}) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [streaming, setStreaming] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const send = useCallback(
    async (text: string) => {
      setError(null)
      setMessages((prev) => [...prev, { role: 'user', content: text }])
      setStreaming(true)

      const ac = new AbortController()
      abortRef.current = ac

      try {
        const origin = getApiOrigin() ?? ''
        const token = getAccessToken()

        const res = await fetch(`${origin}/v1/ai/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            message: text,
            conversationId: conversationId ?? undefined,
            workspaceId: opts.workspaceId ?? undefined,
            useCase: opts.useCase ?? 'CHAT',
            provider: opts.provider,
            model: opts.model,
            context: opts.context,
            systemPrompt: opts.systemPrompt,
          }),
          signal: ac.signal,
        })

        if (!res.ok || !res.body) {
          const err = await res.text().catch(() => 'AI request failed')
          setError(err)
          setStreaming(false)
          return
        }

        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''
        let assistantText = ''

        setMessages((prev) => [...prev, { role: 'assistant', content: '' }])

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
              if (evt.type === 'start' && evt.conversationId) {
                setConversationId(evt.conversationId)
              } else if (evt.type === 'chunk' && evt.text) {
                assistantText += evt.text
                const snapshot = assistantText
                setMessages((prev) => {
                  const copy = [...prev]
                  copy[copy.length - 1] = { role: 'assistant', content: snapshot }
                  return copy
                })
              } else if (evt.type === 'error') {
                setError(evt.error ?? 'Unknown error')
              }
            } catch { /* skip malformed lines */ }
          }
        }
      } catch (e) {
        if ((e as Error).name !== 'AbortError') {
          setError(e instanceof Error ? e.message : 'Stream failed')
        }
      } finally {
        setStreaming(false)
        abortRef.current = null
      }
    },
    [conversationId, opts.useCase, opts.provider, opts.model, opts.context, opts.systemPrompt, opts.workspaceId],
  )

  const stop = useCallback(() => {
    abortRef.current?.abort()
  }, [])

  const reset = useCallback(() => {
    abortRef.current?.abort()
    setMessages([])
    setConversationId(null)
    setError(null)
    setStreaming(false)
  }, [])

  const loadConversation = useCallback(async (convId: string) => {
    try {
      const origin = getApiOrigin() ?? ''
      const token = getAccessToken()
      const res = await fetch(`${origin}/v1/ai/conversations/${convId}`, {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      })
      if (!res.ok) return
      const json = await res.json()
      const data = json?.data ?? json
      if (data?.messages && Array.isArray(data.messages)) {
        const msgs: ChatMessage[] = data.messages
          .filter((m: any) => m.role === 'user' || m.role === 'assistant')
          .map((m: any) => ({ role: m.role as 'user' | 'assistant', content: m.content }))
        setMessages(msgs)
        setConversationId(convId)
      }
    } catch { /* silent */ }
  }, [])

  return { messages, streaming, conversationId, error, send, stop, reset, loadConversation, setConversationId }
}
