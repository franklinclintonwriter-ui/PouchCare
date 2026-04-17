import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'
import { GoogleGenerativeAI } from '@google/generative-ai'
import Groq from 'groq-sdk'
import { getAiEnv, type AiProviderName } from './config'

export interface AiMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface AiChatOptions {
  model: string
  temperature?: number
  maxTokens?: number
}

export interface AiChatResult {
  content: string
  inputTokens: number
  outputTokens: number
  model: string
}

export interface AiProvider {
  name: AiProviderName
  stream(messages: AiMessage[], opts: AiChatOptions): AsyncGenerator<string, AiChatResult>
  chatSync(messages: AiMessage[], opts: AiChatOptions): Promise<AiChatResult>
}

// ── OpenAI ────────────────────────────────────────────────────

class OpenAiProvider implements AiProvider {
  name: AiProviderName = 'openai'
  private client: OpenAI

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey })
  }

  async *stream(messages: AiMessage[], opts: AiChatOptions): AsyncGenerator<string, AiChatResult> {
    const res = await this.client.chat.completions.create({
      model: opts.model,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      temperature: opts.temperature ?? 0.7,
      max_tokens: opts.maxTokens ?? 4096,
      stream: true,
      stream_options: { include_usage: true },
    })

    let content = ''
    let inputTokens = 0
    let outputTokens = 0

    for await (const chunk of res) {
      const delta = chunk.choices?.[0]?.delta?.content
      if (delta) {
        content += delta
        yield delta
      }
      if (chunk.usage) {
        inputTokens = chunk.usage.prompt_tokens ?? 0
        outputTokens = chunk.usage.completion_tokens ?? 0
      }
    }

    return { content, inputTokens, outputTokens, model: opts.model }
  }

  async chatSync(messages: AiMessage[], opts: AiChatOptions): Promise<AiChatResult> {
    const res = await this.client.chat.completions.create({
      model: opts.model,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      temperature: opts.temperature ?? 0.7,
      max_tokens: opts.maxTokens ?? 4096,
    })
    const choice = res.choices[0]
    return {
      content: choice?.message?.content ?? '',
      inputTokens: res.usage?.prompt_tokens ?? 0,
      outputTokens: res.usage?.completion_tokens ?? 0,
      model: opts.model,
    }
  }
}

// ── Anthropic ─────────────────────────────────────────────────

class AnthropicProvider implements AiProvider {
  name: AiProviderName = 'anthropic'
  private client: Anthropic

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey })
  }

  async *stream(messages: AiMessage[], opts: AiChatOptions): AsyncGenerator<string, AiChatResult> {
    const system = messages.filter((m) => m.role === 'system').map((m) => m.content).join('\n')
    const nonSystem = messages.filter((m) => m.role !== 'system').map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }))

    const res = this.client.messages.stream({
      model: opts.model,
      system: system || undefined,
      messages: nonSystem,
      temperature: opts.temperature ?? 0.7,
      max_tokens: opts.maxTokens ?? 4096,
    })

    let content = ''
    for await (const event of res) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        content += event.delta.text
        yield event.delta.text
      }
    }

    const final = await res.finalMessage()
    return {
      content,
      inputTokens: final.usage.input_tokens,
      outputTokens: final.usage.output_tokens,
      model: opts.model,
    }
  }

  async chatSync(messages: AiMessage[], opts: AiChatOptions): Promise<AiChatResult> {
    const system = messages.filter((m) => m.role === 'system').map((m) => m.content).join('\n')
    const nonSystem = messages.filter((m) => m.role !== 'system').map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }))
    const res = await this.client.messages.create({
      model: opts.model,
      system: system || undefined,
      messages: nonSystem,
      temperature: opts.temperature ?? 0.7,
      max_tokens: opts.maxTokens ?? 4096,
    })
    const text = res.content.map((b) => (b.type === 'text' ? b.text : '')).join('')
    return {
      content: text,
      inputTokens: res.usage.input_tokens,
      outputTokens: res.usage.output_tokens,
      model: opts.model,
    }
  }
}

// ── Google (Gemini) ───────────────────────────────────────────

class GoogleProvider implements AiProvider {
  name: AiProviderName = 'google'
  private client: GoogleGenerativeAI

  constructor(apiKey: string) {
    this.client = new GoogleGenerativeAI(apiKey)
  }

  async *stream(messages: AiMessage[], opts: AiChatOptions): AsyncGenerator<string, AiChatResult> {
    const systemMsg = messages.filter((m) => m.role === 'system').map((m) => m.content).join('\n')
    const history = messages.filter((m) => m.role !== 'system')
    const model = this.client.getGenerativeModel({
      model: opts.model,
      systemInstruction: systemMsg || undefined,
    })

    const chat = model.startChat({
      history: history.slice(0, -1).map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      })),
    })

    const lastMsg = history[history.length - 1]?.content ?? ''
    const res = await chat.sendMessageStream(lastMsg)
    let content = ''

    for await (const chunk of res.stream) {
      const text = chunk.text()
      if (text) {
        content += text
        yield text
      }
    }

    const final = await res.response
    const usage = final.usageMetadata
    return {
      content,
      inputTokens: usage?.promptTokenCount ?? 0,
      outputTokens: usage?.candidatesTokenCount ?? 0,
      model: opts.model,
    }
  }

  async chatSync(messages: AiMessage[], opts: AiChatOptions): Promise<AiChatResult> {
    const gen = this.stream(messages, opts)
    let result: AiChatResult | undefined
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for await (const _chunk of gen) { /* consume */ }
    const final = await gen.next()
    if (final.done) result = final.value
    return result ?? { content: '', inputTokens: 0, outputTokens: 0, model: opts.model }
  }
}

// ── Groq ──────────────────────────────────────────────────────

class GroqProvider implements AiProvider {
  name: AiProviderName = 'groq'
  private client: Groq

  constructor(apiKey: string) {
    this.client = new Groq({ apiKey })
  }

  async *stream(messages: AiMessage[], opts: AiChatOptions): AsyncGenerator<string, AiChatResult> {
    const res = await this.client.chat.completions.create({
      model: opts.model,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      temperature: opts.temperature ?? 0.7,
      max_tokens: opts.maxTokens ?? 4096,
      stream: true,
    })

    let content = ''
    let inputTokens = 0
    let outputTokens = 0

    for await (const chunk of res) {
      const delta = chunk.choices?.[0]?.delta?.content
      if (delta) {
        content += delta
        yield delta
      }
      if ((chunk as any).x_groq?.usage) {
        inputTokens = (chunk as any).x_groq.usage.prompt_tokens ?? 0
        outputTokens = (chunk as any).x_groq.usage.completion_tokens ?? 0
      }
    }

    return { content, inputTokens, outputTokens, model: opts.model }
  }

  async chatSync(messages: AiMessage[], opts: AiChatOptions): Promise<AiChatResult> {
    const res = await this.client.chat.completions.create({
      model: opts.model,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      temperature: opts.temperature ?? 0.7,
      max_tokens: opts.maxTokens ?? 4096,
    })
    const choice = res.choices[0]
    return {
      content: choice?.message?.content ?? '',
      inputTokens: res.usage?.prompt_tokens ?? 0,
      outputTokens: res.usage?.completion_tokens ?? 0,
      model: opts.model,
    }
  }
}

// ── OpenRouter (OpenAI-compatible) ────────────────────────────

class OpenRouterProvider implements AiProvider {
  name: AiProviderName = 'openrouter'
  private client: OpenAI

  constructor(apiKey: string) {
    this.client = new OpenAI({
      apiKey,
      baseURL: 'https://openrouter.ai/api/v1',
      defaultHeaders: {
        'HTTP-Referer': 'https://pouchcare.com',
        'X-Title': 'PouchCare AI',
      },
    })
  }

  async *stream(messages: AiMessage[], opts: AiChatOptions): AsyncGenerator<string, AiChatResult> {
    const res = await this.client.chat.completions.create({
      model: opts.model,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      temperature: opts.temperature ?? 0.7,
      max_tokens: opts.maxTokens ?? 4096,
      stream: true,
    })

    let content = ''
    let inputTokens = 0
    let outputTokens = 0

    for await (const chunk of res) {
      const delta = chunk.choices?.[0]?.delta?.content
      if (delta) {
        content += delta
        yield delta
      }
      if (chunk.usage) {
        inputTokens = chunk.usage.prompt_tokens ?? 0
        outputTokens = chunk.usage.completion_tokens ?? 0
      }
    }

    return { content, inputTokens, outputTokens, model: opts.model }
  }

  async chatSync(messages: AiMessage[], opts: AiChatOptions): Promise<AiChatResult> {
    const res = await this.client.chat.completions.create({
      model: opts.model,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      temperature: opts.temperature ?? 0.7,
      max_tokens: opts.maxTokens ?? 4096,
    })
    const choice = res.choices[0]
    return {
      content: choice?.message?.content ?? '',
      inputTokens: res.usage?.prompt_tokens ?? 0,
      outputTokens: res.usage?.completion_tokens ?? 0,
      model: opts.model,
    }
  }
}

// ── Factory ───────────────────────────────────────────────────

const providerCache = new Map<string, AiProvider>()

export function getProvider(name: AiProviderName): AiProvider {
  const cached = providerCache.get(name)
  if (cached) return cached

  const keys = getAiEnv()
  let provider: AiProvider

  switch (name) {
    case 'openai':
      if (!keys.openai) throw new Error('OPENAI_API_KEY not configured')
      provider = new OpenAiProvider(keys.openai)
      break
    case 'anthropic':
      if (!keys.anthropic) throw new Error('ANTHROPIC_API_KEY not configured')
      provider = new AnthropicProvider(keys.anthropic)
      break
    case 'google':
      if (!keys.google) throw new Error('GOOGLE_AI_API_KEY not configured')
      provider = new GoogleProvider(keys.google)
      break
    case 'groq':
      if (!keys.groq) throw new Error('GROQ_API_KEY not configured')
      provider = new GroqProvider(keys.groq)
      break
    case 'openrouter':
      if (!keys.openrouter) throw new Error('OPENROUTER_API_KEY not configured')
      provider = new OpenRouterProvider(keys.openrouter)
      break
    default:
      throw new Error(`Unknown AI provider: ${name}`)
  }

  providerCache.set(name, provider)
  return provider
}
