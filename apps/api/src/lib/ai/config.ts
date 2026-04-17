import { env } from '@/config/env'

export type AiProviderName = 'openai' | 'anthropic' | 'google' | 'groq' | 'openrouter'

export interface AiModelOption {
  id: string
  provider: AiProviderName
  label: string
  description: string
  contextWindow: number
  bestFor: string
}

export const AI_MODELS: AiModelOption[] = [
  { id: 'gpt-4o', provider: 'openai', label: 'GPT-4o', description: 'Most capable general model', contextWindow: 128000, bestFor: 'Complex tasks, analysis, content' },
  { id: 'gpt-4o-mini', provider: 'openai', label: 'GPT-4o Mini', description: 'Fast and cost-efficient', contextWindow: 128000, bestFor: 'Quick tasks, simple queries' },
  { id: 'codex-mini-latest', provider: 'openai', label: 'Codex Mini', description: 'Optimized for code and technical', contextWindow: 192000, bestFor: 'Code generation, technical writing' },
  { id: 'o3-mini', provider: 'openai', label: 'o3-mini', description: 'Reasoning-focused model', contextWindow: 200000, bestFor: 'Complex reasoning, planning' },
  { id: 'claude-sonnet-4-20250514', provider: 'anthropic', label: 'Claude Sonnet 4', description: 'Balanced power and speed', contextWindow: 200000, bestFor: 'Long content, analysis' },
  { id: 'claude-haiku-3-5-20241022', provider: 'anthropic', label: 'Claude Haiku 3.5', description: 'Fastest Claude model', contextWindow: 200000, bestFor: 'Quick tasks, summaries' },
  { id: 'gemini-2.5-flash-preview-04-17', provider: 'google', label: 'Gemini 2.5 Flash', description: 'Fast multimodal model', contextWindow: 1048576, bestFor: 'Speed, large context' },
  { id: 'gemini-2.5-pro-preview-05-06', provider: 'google', label: 'Gemini 2.5 Pro', description: 'Most capable Google model', contextWindow: 1048576, bestFor: 'Complex analysis, large docs' },
  { id: 'llama-3.3-70b-versatile', provider: 'groq', label: 'Llama 3.3 70B', description: 'Open-source via Groq (fast)', contextWindow: 128000, bestFor: 'Fast inference, general tasks' },
  { id: 'mixtral-8x7b-32768', provider: 'groq', label: 'Mixtral 8x7B', description: 'Efficient mixture-of-experts', contextWindow: 32768, bestFor: 'Quick responses, lightweight' },
  // OpenRouter — access 200+ models through one key
  { id: 'openai/gpt-4o', provider: 'openrouter', label: 'GPT-4o (Router)', description: 'GPT-4o via OpenRouter', contextWindow: 128000, bestFor: 'General tasks, fallback routing' },
  { id: 'anthropic/claude-sonnet-4', provider: 'openrouter', label: 'Claude Sonnet 4 (Router)', description: 'Claude via OpenRouter', contextWindow: 200000, bestFor: 'Long content via router' },
  { id: 'google/gemini-2.5-flash-preview', provider: 'openrouter', label: 'Gemini Flash (Router)', description: 'Gemini via OpenRouter', contextWindow: 1048576, bestFor: 'Large context via router' },
  { id: 'meta-llama/llama-4-maverick', provider: 'openrouter', label: 'Llama 4 Maverick', description: 'Meta Llama 4 via OpenRouter', contextWindow: 128000, bestFor: 'Open-source, large scale' },
  { id: 'deepseek/deepseek-r1', provider: 'openrouter', label: 'DeepSeek R1', description: 'Reasoning model via OpenRouter', contextWindow: 128000, bestFor: 'Complex reasoning, math' },
  { id: 'qwen/qwen3-235b-a22b', provider: 'openrouter', label: 'Qwen 3 235B', description: 'Alibaba Qwen via OpenRouter', contextWindow: 128000, bestFor: 'Multilingual, large tasks' },
]

export function getAiEnv() {
  return {
    openai: env.OPENAI_API_KEY.trim(),
    anthropic: env.ANTHROPIC_API_KEY.trim(),
    google: env.GOOGLE_AI_API_KEY.trim(),
    groq: env.GROQ_API_KEY.trim(),
    openrouter: (process.env.OPENROUTER_API_KEY ?? '').trim(),
    defaultProvider: env.AI_DEFAULT_PROVIDER as AiProviderName,
    defaultModel: env.AI_DEFAULT_MODEL,
    monthlyTokenLimit: env.AI_MONTHLY_TOKEN_LIMIT,
  }
}

export function aiStatus() {
  const e = getAiEnv()
  const available = AI_MODELS.filter((m) => Boolean(e[m.provider]))
  return {
    openai: Boolean(e.openai),
    anthropic: Boolean(e.anthropic),
    google: Boolean(e.google),
    groq: Boolean(e.groq),
    openrouter: Boolean(e.openrouter),
    defaultProvider: e.defaultProvider,
    defaultModel: e.defaultModel,
    hasAny: Boolean(e.openai || e.anthropic || e.google || e.groq || e.openrouter),
    models: available,
  }
}

export function resolveProvider(requested?: string): AiProviderName {
  const e = getAiEnv()
  if (requested && ['openai', 'anthropic', 'google', 'groq', 'openrouter'].includes(requested)) {
    return requested as AiProviderName
  }
  if (e[e.defaultProvider]) return e.defaultProvider
  if (e.openai) return 'openai'
  if (e.anthropic) return 'anthropic'
  if (e.google) return 'google'
  if (e.groq) return 'groq'
  if (e.openrouter) return 'openrouter'
  return e.defaultProvider
}

export function resolveModel(provider: AiProviderName, requested?: string): string {
  if (requested) return requested
  const defaults: Record<AiProviderName, string> = {
    openai: 'gpt-4o',
    anthropic: 'claude-sonnet-4-20250514',
    google: 'gemini-2.5-flash-preview-04-17',
    groq: 'llama-3.3-70b-versatile',
    openrouter: 'openai/gpt-4o',
  }
  return defaults[provider]
}

export function resolveProviderForModel(modelId: string): AiProviderName | undefined {
  const model = AI_MODELS.find((m) => m.id === modelId)
  return model?.provider
}
