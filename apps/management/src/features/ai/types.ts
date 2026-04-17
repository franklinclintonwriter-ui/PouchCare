export type AiUseCase = 'BLOG' | 'SEO_BRIEF' | 'TASK' | 'REPORT' | 'CHAT'

export interface AiConversation {
  id: string
  useCase: AiUseCase
  title: string | null
  provider: string
  model: string
  totalTokens: number
  createdAt: string
  updatedAt: string
  messages?: AiMessageRow[]
}

export interface AiMessageRow {
  id: string
  conversationId: string
  role: 'system' | 'user' | 'assistant'
  content: string
  tokensUsed: number
  createdAt: string
}

export interface AiUsageBreakdown {
  provider: string
  model: string
  useCase: AiUseCase
  inputTokens: number
  outputTokens: number
  requests: number
}

export interface AiUsageSummary {
  month: string
  totalInput: number
  totalOutput: number
  totalTokens: number
  limit: number
  remaining: number | null
  breakdown: AiUsageBreakdown[]
}

export interface AiModelOption {
  id: string
  provider: string
  label: string
  description: string
  contextWindow: number
  bestFor: string
}

export interface AiStatus {
  openai: boolean
  anthropic: boolean
  google: boolean
  groq: boolean
  openrouter: boolean
  defaultProvider: string
  defaultModel: string
  hasAny: boolean
  checkedAt: string
  models: AiModelOption[]
}

export interface AiSseEvent {
  type: 'start' | 'chunk' | 'done' | 'error'
  conversationId?: string
  text?: string
  usage?: { input: number; output: number }
  error?: string
}
