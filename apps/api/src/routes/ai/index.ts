import { Router } from 'express'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import type { AuthRequest } from '@/middleware/auth'
import { authenticate, requireStaff } from '@/middleware/auth'
import { validate } from '@/middleware/validate'
import { aiRateLimit } from '@/middleware/rateLimit'
import { ok, badRequest, serverError, serviceUnavailable, notFound, forbidden } from '@/lib/response'
import { getPaginationParams, buildMeta } from '@/lib/pagination'
import { aiStatus, resolveProvider, resolveModel } from '@/lib/ai/config'
import { getProvider, type AiMessage as ProviderMsg } from '@/lib/ai/providers'
import { AiUseCase } from '@prisma/client'
import * as prompts from '@/lib/ai/prompts'
import { mirrorToSupabase } from '@/lib/supabase'

const router = Router()
router.use(authenticate, requireStaff)

function staffCtx(req: AuthRequest) {
  return { name: req.user!.id, role: String(req.user!.role), branch: undefined as string | undefined }
}

async function enrichStaffCtx(req: AuthRequest) {
  const staff = await prisma.staffMember.findUnique({
    where: { id: req.user!.id },
    select: { name: true, systemRole: true, branch: true },
  })
  return {
    name: staff?.name ?? req.user!.id,
    role: staff?.systemRole ?? String(req.user!.role),
    branch: staff?.branch ?? undefined,
  }
}

function ensureAiAvailable() {
  const s = aiStatus()
  if (!s.hasAny) throw new Error('NO_PROVIDER')
  return s
}

async function checkMonthlyBudget(staffId: string): Promise<boolean> {
  const { getAiEnv } = await import('@/lib/ai/config')
  const limit = getAiEnv().monthlyTokenLimit
  if (limit <= 0) return true

  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const agg = await prisma.aiUsage.aggregate({
    where: { staffId, createdAt: { gte: startOfMonth } },
    _sum: { inputTk: true, outputTk: true },
  })
  const used = (agg._sum.inputTk ?? 0) + (agg._sum.outputTk ?? 0)
  return used < limit
}

async function logUsage(
  staffId: string,
  provider: string,
  model: string,
  inputTk: number,
  outputTk: number,
  useCase: AiUseCase,
) {
  await prisma.aiUsage.create({ data: { staffId, provider, model, inputTk, outputTk, useCase } })
  mirrorToSupabase('ai_analytics', { staff_id: staffId, provider, model, input_tokens: inputTk, output_tokens: outputTk, use_case: useCase })
}

function sseHeaders(res: import('express').Response) {
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no')
  res.flushHeaders()
}

// ── GET /status ───────────────────────────────────────────────
router.get('/status', (_req, res) => ok(res, { ...aiStatus(), checkedAt: new Date().toISOString() }))

// ── GET /usage ────────────────────────────────────────────────
router.get('/usage', async (req: AuthRequest, res) => {
  try {
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const rows = await prisma.aiUsage.groupBy({
      by: ['provider', 'model', 'useCase'],
      where: { staffId: req.user!.id, createdAt: { gte: startOfMonth } },
      _sum: { inputTk: true, outputTk: true },
      _count: true,
    })

    const totalInput = rows.reduce((s, r) => s + (r._sum.inputTk ?? 0), 0)
    const totalOutput = rows.reduce((s, r) => s + (r._sum.outputTk ?? 0), 0)
    const { getAiEnv } = await import('@/lib/ai/config')
    const limit = getAiEnv().monthlyTokenLimit

    return ok(res, {
      month: startOfMonth.toISOString().slice(0, 7),
      totalInput,
      totalOutput,
      totalTokens: totalInput + totalOutput,
      limit,
      remaining: limit > 0 ? Math.max(0, limit - totalInput - totalOutput) : null,
      breakdown: rows.map((r) => ({
        provider: r.provider,
        model: r.model,
        useCase: r.useCase,
        inputTokens: r._sum.inputTk ?? 0,
        outputTokens: r._sum.outputTk ?? 0,
        requests: r._count,
      })),
    })
  } catch (e) {
    return serverError(res, e)
  }
})

// ── GET /conversations ────────────────────────────────────────
router.get('/conversations', async (req: AuthRequest, res) => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query as any)
    const where = { staffId: req.user!.id }
    const [rows, total] = await Promise.all([
      prisma.aiConversation.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        select: { id: true, useCase: true, title: true, provider: true, model: true, totalTokens: true, createdAt: true, updatedAt: true },
      }),
      prisma.aiConversation.count({ where }),
    ])
    return ok(res, rows, buildMeta(total, page, limit))
  } catch (e) {
    return serverError(res, e)
  }
})

// ── GET /conversations/:id ────────────────────────────────────
router.get('/conversations/:id', async (req: AuthRequest, res) => {
  try {
    const conv = await prisma.aiConversation.findFirst({
      where: { id: req.params.id, staffId: req.user!.id },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    })
    if (!conv) return notFound(res, 'Conversation')
    return ok(res, conv)
  } catch (e) {
    return serverError(res, e)
  }
})

// ── DELETE /conversations/:id ─────────────────────────────────
router.delete('/conversations/:id', async (req: AuthRequest, res) => {
  try {
    const conv = await prisma.aiConversation.findFirst({ where: { id: req.params.id, staffId: req.user!.id } })
    if (!conv) return notFound(res, 'Conversation')
    await prisma.aiConversation.delete({ where: { id: req.params.id } })
    return ok(res, { message: 'Conversation deleted' })
  } catch (e) {
    return serverError(res, e)
  }
})

// ── POST /chat (SSE streaming) ────────────────────────────────
const chatSchema = z.object({
  message: z.string().min(1).max(20000),
  conversationId: z.string().uuid().optional(),
  workspaceId: z.string().uuid().optional(),
  useCase: z.enum(['BLOG', 'SEO_BRIEF', 'TASK', 'REPORT', 'CHAT']).default('CHAT'),
  provider: z.string().optional(),
  model: z.string().optional(),
  systemPrompt: z.string().max(5000).optional(),
  context: z.string().max(30000).optional(),
})

router.post('/chat', aiRateLimit, validate(chatSchema), async (req: AuthRequest, res) => {
  try {
    ensureAiAvailable()
  } catch {
    return serviceUnavailable(res, 'No AI provider configured')
  }

  try {
    const withinBudget = await checkMonthlyBudget(req.user!.id)
    if (!withinBudget) return badRequest(res, 'Monthly AI token budget exceeded')

    const body = req.body as z.infer<typeof chatSchema>
    const providerName = resolveProvider(body.provider)
    const modelName = resolveModel(providerName, body.model)
    const provider = getProvider(providerName)
    const staff = await enrichStaffCtx(req)
    const useCase = body.useCase as AiUseCase

    let conv = body.conversationId
      ? await prisma.aiConversation.findFirst({ where: { id: body.conversationId, staffId: req.user!.id }, include: { messages: { orderBy: { createdAt: 'asc' } } } })
      : null

    let systemPrompt = body.systemPrompt ?? getSystemPrompt(useCase, staff)
    systemPrompt += await workspaceIdeSystemExtra(body.workspaceId, req.user!.id)

    if (!conv) {
      conv = await prisma.aiConversation.create({
        data: {
          staffId: req.user!.id,
          workspaceId: body.workspaceId ?? null,
          useCase,
          title: body.message.slice(0, 100),
          provider: providerName,
          model: modelName,
        },
        include: { messages: true },
      })
    }

    await prisma.aiMessage.create({ data: { conversationId: conv.id, role: 'user', content: body.message } })

    const messages: ProviderMsg[] = [
      { role: 'system', content: systemPrompt },
      ...(conv.messages ?? []).map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      { role: 'user' as const, content: body.context ? `Context:\n${body.context}\n\n${body.message}` : body.message },
    ]

    sseHeaders(res)
    res.write(`data: ${JSON.stringify({ type: 'start', conversationId: conv.id })}\n\n`)

    const gen = provider.stream(messages, { model: modelName })
    let result = { content: '', inputTokens: 0, outputTokens: 0, model: modelName }

    for (;;) {
      const next = await gen.next()
      if (next.done) {
        result = next.value
        break
      }
      res.write(`data: ${JSON.stringify({ type: 'chunk', text: next.value })}\n\n`)
    }

    await prisma.aiMessage.create({ data: { conversationId: conv.id, role: 'assistant', content: result.content, tokensUsed: result.outputTokens } })
    await prisma.aiConversation.update({ where: { id: conv.id }, data: { totalTokens: { increment: result.inputTokens + result.outputTokens } } })
    await logUsage(req.user!.id, providerName, modelName, result.inputTokens, result.outputTokens, useCase)

    res.write(`data: ${JSON.stringify({ type: 'done', conversationId: conv.id, usage: { input: result.inputTokens, output: result.outputTokens } })}\n\n`)
    res.end()
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'AI request failed'
    if (!res.headersSent) return serverError(res, e)
    res.write(`data: ${JSON.stringify({ type: 'error', error: msg })}\n\n`)
    res.end()
  }
})

// ── POST /chat/sync ───────────────────────────────────────────
router.post('/chat/sync', aiRateLimit, validate(chatSchema), async (req: AuthRequest, res) => {
  try {
    ensureAiAvailable()
  } catch {
    return serviceUnavailable(res, 'No AI provider configured')
  }

  try {
    const withinBudget = await checkMonthlyBudget(req.user!.id)
    if (!withinBudget) return badRequest(res, 'Monthly AI token budget exceeded')

    const body = req.body as z.infer<typeof chatSchema>
    const providerName = resolveProvider(body.provider)
    const modelName = resolveModel(providerName, body.model)
    const provider = getProvider(providerName)
    const staff = await enrichStaffCtx(req)
    const useCase = body.useCase as AiUseCase
    let systemPrompt = body.systemPrompt ?? getSystemPrompt(useCase, staff)
    systemPrompt += await workspaceIdeSystemExtra(body.workspaceId, req.user!.id)

    const messages: ProviderMsg[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: body.context ? `Context:\n${body.context}\n\n${body.message}` : body.message },
    ]

    const result = await provider.chatSync(messages, { model: modelName })
    await logUsage(req.user!.id, providerName, modelName, result.inputTokens, result.outputTokens, useCase)
    return ok(res, { content: result.content, provider: providerName, model: modelName, usage: { input: result.inputTokens, output: result.outputTokens } })
  } catch (e) {
    return serverError(res, e)
  }
})

// ── POST /blog/generate (SSE) ─────────────────────────────────
const blogSchema = z.object({
  topic: z.string().min(1).max(2000),
  keywords: z.string().max(2000).optional(),
  tone: z.enum(['professional', 'casual', 'technical']).default('professional'),
  wordCount: z.coerce.number().min(300).max(5000).default(1200),
  outline: z.string().max(5000).optional(),
  provider: z.string().optional(),
  model: z.string().optional(),
})

router.post('/blog/generate', aiRateLimit, validate(blogSchema), async (req: AuthRequest, res) => {
  try { ensureAiAvailable() } catch { return serviceUnavailable(res, 'No AI provider configured') }

  try {
    const withinBudget = await checkMonthlyBudget(req.user!.id)
    if (!withinBudget) return badRequest(res, 'Monthly AI token budget exceeded')

    const body = req.body as z.infer<typeof blogSchema>
    const providerName = resolveProvider(body.provider)
    const modelName = resolveModel(providerName, body.model)
    const provider = getProvider(providerName)
    const staff = await enrichStaffCtx(req)

    const userMsg = [
      `Write a ${body.wordCount}-word ${body.tone} blog article about: ${body.topic}`,
      body.keywords ? `Target keywords: ${body.keywords}` : '',
      body.outline ? `Follow this outline:\n${body.outline}` : '',
    ].filter(Boolean).join('\n\n')

    const messages: ProviderMsg[] = [
      { role: 'system', content: prompts.blogWriterSystem(staff) },
      { role: 'user', content: userMsg },
    ]

    const conv = await prisma.aiConversation.create({
      data: { staffId: req.user!.id, useCase: 'BLOG', title: body.topic.slice(0, 100), provider: providerName, model: modelName },
    })
    await prisma.aiMessage.create({ data: { conversationId: conv.id, role: 'user', content: userMsg } })

    sseHeaders(res)
    res.write(`data: ${JSON.stringify({ type: 'start', conversationId: conv.id })}\n\n`)

    const gen = provider.stream(messages, { model: modelName, maxTokens: Math.min(body.wordCount * 3, 8192) })
    let result = { content: '', inputTokens: 0, outputTokens: 0, model: modelName }

    for (;;) {
      const next = await gen.next()
      if (next.done) { result = next.value; break }
      res.write(`data: ${JSON.stringify({ type: 'chunk', text: next.value })}\n\n`)
    }

    await prisma.aiMessage.create({ data: { conversationId: conv.id, role: 'assistant', content: result.content, tokensUsed: result.outputTokens } })
    await prisma.aiConversation.update({ where: { id: conv.id }, data: { totalTokens: result.inputTokens + result.outputTokens } })
    await logUsage(req.user!.id, providerName, modelName, result.inputTokens, result.outputTokens, 'BLOG')

    res.write(`data: ${JSON.stringify({ type: 'done', conversationId: conv.id, usage: { input: result.inputTokens, output: result.outputTokens } })}\n\n`)
    res.end()
  } catch (e) {
    if (!res.headersSent) return serverError(res, e)
    res.write(`data: ${JSON.stringify({ type: 'error', error: e instanceof Error ? e.message : 'Failed' })}\n\n`)
    res.end()
  }
})

// ── POST /blog/improve (SSE) ──────────────────────────────────
const improveSchema = z.object({
  content: z.string().min(1).max(50000),
  instructions: z.string().min(1).max(5000),
  provider: z.string().optional(),
  model: z.string().optional(),
})

router.post('/blog/improve', aiRateLimit, validate(improveSchema), async (req: AuthRequest, res) => {
  try { ensureAiAvailable() } catch { return serviceUnavailable(res, 'No AI provider configured') }
  try {
    const body = req.body as z.infer<typeof improveSchema>
    const providerName = resolveProvider(body.provider)
    const modelName = resolveModel(providerName, body.model)
    const provider = getProvider(providerName)

    const messages: ProviderMsg[] = [
      { role: 'system', content: prompts.blogImproveSystem() },
      { role: 'user', content: `Article:\n${body.content}\n\nInstructions: ${body.instructions}` },
    ]

    sseHeaders(res)
    const gen = provider.stream(messages, { model: modelName, maxTokens: 8192 })
    let result = { content: '', inputTokens: 0, outputTokens: 0, model: modelName }

    for (;;) {
      const next = await gen.next()
      if (next.done) { result = next.value; break }
      res.write(`data: ${JSON.stringify({ type: 'chunk', text: next.value })}\n\n`)
    }

    await logUsage(req.user!.id, providerName, modelName, result.inputTokens, result.outputTokens, 'BLOG')
    res.write(`data: ${JSON.stringify({ type: 'done', usage: { input: result.inputTokens, output: result.outputTokens } })}\n\n`)
    res.end()
  } catch (e) {
    if (!res.headersSent) return serverError(res, e)
    res.write(`data: ${JSON.stringify({ type: 'error', error: e instanceof Error ? e.message : 'Failed' })}\n\n`)
    res.end()
  }
})

// ── POST /seo/brief ───────────────────────────────────────────
const seoBriefSchema = z.object({
  primaryKeyword: z.string().min(1).max(500),
  secondaryKeywords: z.string().max(2000).optional(),
  competitorUrls: z.string().max(5000).optional(),
  serpContext: z.string().max(30000).optional(),
  provider: z.string().optional(),
  model: z.string().optional(),
})

router.post('/seo/brief', aiRateLimit, validate(seoBriefSchema), async (req: AuthRequest, res) => {
  try { ensureAiAvailable() } catch { return serviceUnavailable(res, 'No AI provider configured') }
  try {
    const withinBudget = await checkMonthlyBudget(req.user!.id)
    if (!withinBudget) return badRequest(res, 'Monthly AI token budget exceeded')

    const body = req.body as z.infer<typeof seoBriefSchema>
    const providerName = resolveProvider(body.provider)
    const modelName = resolveModel(providerName, body.model)
    const provider = getProvider(providerName)
    const staff = await enrichStaffCtx(req)

    const userMsg = [
      `Primary keyword: ${body.primaryKeyword}`,
      body.secondaryKeywords ? `Secondary keywords: ${body.secondaryKeywords}` : '',
      body.competitorUrls ? `Competitor URLs to analyze: ${body.competitorUrls}` : '',
      body.serpContext ? `SERP data context:\n${body.serpContext}` : '',
    ].filter(Boolean).join('\n\n')

    const result = await provider.chatSync(
      [{ role: 'system', content: prompts.seoBriefSystem(staff) }, { role: 'user', content: userMsg }],
      { model: modelName, maxTokens: 4096 },
    )

    await logUsage(req.user!.id, providerName, modelName, result.inputTokens, result.outputTokens, 'SEO_BRIEF')

    let brief: unknown
    try { brief = JSON.parse(result.content) } catch { brief = { raw: result.content } }

    return ok(res, { brief, provider: providerName, model: modelName, usage: { input: result.inputTokens, output: result.outputTokens } })
  } catch (e) { return serverError(res, e) }
})

// ── POST /seo/meta ────────────────────────────────────────────
const seoMetaSchema = z.object({
  content: z.string().min(1).max(30000),
  provider: z.string().optional(),
  model: z.string().optional(),
})

router.post('/seo/meta', aiRateLimit, validate(seoMetaSchema), async (req: AuthRequest, res) => {
  try { ensureAiAvailable() } catch { return serviceUnavailable(res, 'No AI provider configured') }
  try {
    const body = req.body as z.infer<typeof seoMetaSchema>
    const providerName = resolveProvider(body.provider)
    const modelName = resolveModel(providerName, body.model)
    const provider = getProvider(providerName)

    const result = await provider.chatSync(
      [{ role: 'system', content: prompts.seoMetaSystem() }, { role: 'user', content: body.content }],
      { model: modelName, maxTokens: 512 },
    )
    await logUsage(req.user!.id, providerName, modelName, result.inputTokens, result.outputTokens, 'SEO_BRIEF')

    let meta: unknown
    try { meta = JSON.parse(result.content) } catch { meta = { raw: result.content } }
    return ok(res, { meta, usage: { input: result.inputTokens, output: result.outputTokens } })
  } catch (e) { return serverError(res, e) }
})

// ── POST /task/plan ───────────────────────────────────────────
const taskPlanSchema = z.object({
  taskTitle: z.string().min(1).max(1000),
  taskDescription: z.string().max(10000).optional(),
  taskNotes: z.string().max(10000).optional(),
  provider: z.string().optional(),
  model: z.string().optional(),
})

router.post('/task/plan', aiRateLimit, validate(taskPlanSchema), async (req: AuthRequest, res) => {
  try { ensureAiAvailable() } catch { return serviceUnavailable(res, 'No AI provider configured') }
  try {
    const body = req.body as z.infer<typeof taskPlanSchema>
    const providerName = resolveProvider(body.provider)
    const modelName = resolveModel(providerName, body.model)
    const provider = getProvider(providerName)
    const staff = await enrichStaffCtx(req)

    const userMsg = [`Task: ${body.taskTitle}`, body.taskDescription ? `Description: ${body.taskDescription}` : '', body.taskNotes ? `Notes: ${body.taskNotes}` : ''].filter(Boolean).join('\n\n')

    const result = await provider.chatSync(
      [{ role: 'system', content: prompts.taskPlanSystem(staff) }, { role: 'user', content: userMsg }],
      { model: modelName, maxTokens: 4096 },
    )
    await logUsage(req.user!.id, providerName, modelName, result.inputTokens, result.outputTokens, 'TASK')

    let subtasks: unknown
    try { subtasks = JSON.parse(result.content) } catch { subtasks = { raw: result.content } }
    return ok(res, { subtasks, usage: { input: result.inputTokens, output: result.outputTokens } })
  } catch (e) { return serverError(res, e) }
})

// ── POST /task/summarize ──────────────────────────────────────
const taskSummarizeSchema = z.object({
  taskTitle: z.string().min(1).max(1000),
  taskDescription: z.string().max(10000).optional(),
  comments: z.string().max(30000).optional(),
  provider: z.string().optional(),
  model: z.string().optional(),
})

router.post('/task/summarize', aiRateLimit, validate(taskSummarizeSchema), async (req: AuthRequest, res) => {
  try { ensureAiAvailable() } catch { return serviceUnavailable(res, 'No AI provider configured') }
  try {
    const body = req.body as z.infer<typeof taskSummarizeSchema>
    const providerName = resolveProvider(body.provider)
    const modelName = resolveModel(providerName, body.model)
    const provider = getProvider(providerName)

    const userMsg = [`Task: ${body.taskTitle}`, body.taskDescription ? `Description: ${body.taskDescription}` : '', body.comments ? `Comments:\n${body.comments}` : ''].filter(Boolean).join('\n\n')

    const result = await provider.chatSync(
      [{ role: 'system', content: prompts.taskSummarizeSystem() }, { role: 'user', content: userMsg }],
      { model: modelName, maxTokens: 1024 },
    )
    await logUsage(req.user!.id, providerName, modelName, result.inputTokens, result.outputTokens, 'TASK')
    return ok(res, { summary: result.content, usage: { input: result.inputTokens, output: result.outputTokens } })
  } catch (e) { return serverError(res, e) }
})

// ── POST /report/draft ────────────────────────────────────────
const reportDraftSchema = z.object({
  date: z.string().optional(),
  additionalContext: z.string().max(10000).optional(),
  provider: z.string().optional(),
  model: z.string().optional(),
})

router.post('/report/draft', aiRateLimit, validate(reportDraftSchema), async (req: AuthRequest, res) => {
  try { ensureAiAvailable() } catch { return serviceUnavailable(res, 'No AI provider configured') }
  try {
    const body = req.body as z.infer<typeof reportDraftSchema>
    const providerName = resolveProvider(body.provider)
    const modelName = resolveModel(providerName, body.model)
    const provider = getProvider(providerName)
    const staff = await enrichStaffCtx(req)

    const targetDate = body.date ? new Date(body.date) : new Date()
    const dayStart = new Date(targetDate); dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(targetDate); dayEnd.setHours(23, 59, 59, 999)

    const tasks = await prisma.task.findMany({
      where: {
        assignedMemberId: req.user!.id,
        OR: [
          { updatedAt: { gte: dayStart, lte: dayEnd } },
          { completedDate: { gte: dayStart, lte: dayEnd } },
        ],
      },
      select: { title: true, status: true, progress: true, notes: true },
      take: 20,
    })

    const taskContext = tasks.length > 0
      ? tasks.map((t, i) => `${i + 1}. [${t.status}] ${t.title} (${t.progress}% done)${t.notes ? ` — ${t.notes}` : ''}`).join('\n')
      : 'No tracked task activity today.'

    const userMsg = [`Date: ${targetDate.toISOString().slice(0, 10)}`, `Tasks activity:\n${taskContext}`, body.additionalContext ? `Additional notes: ${body.additionalContext}` : ''].filter(Boolean).join('\n\n')

    const result = await provider.chatSync(
      [{ role: 'system', content: prompts.reportDraftSystem(staff) }, { role: 'user', content: userMsg }],
      { model: modelName, maxTokens: 1024 },
    )
    await logUsage(req.user!.id, providerName, modelName, result.inputTokens, result.outputTokens, 'REPORT')

    let draft: unknown
    try { draft = JSON.parse(result.content) } catch { draft = { raw: result.content } }
    return ok(res, { draft, tasksUsed: tasks.length, usage: { input: result.inputTokens, output: result.outputTokens } })
  } catch (e) { return serverError(res, e) }
})

// ── POST /task/insights — AI analysis for a specific task ─────
const taskInsightsSchema = z.object({
  taskId: z.string().uuid(),
  provider: z.string().optional(),
  model: z.string().optional(),
})

router.post('/task/insights', aiRateLimit, validate(taskInsightsSchema), async (req: AuthRequest, res) => {
  try { ensureAiAvailable() } catch { return serviceUnavailable(res, 'No AI provider configured') }
  try {
    const withinBudget = await checkMonthlyBudget(req.user!.id)
    if (!withinBudget) return badRequest(res, 'Monthly AI token budget exceeded')

    const body = req.body as z.infer<typeof taskInsightsSchema>
    const task = await prisma.task.findFirst({
      where: { id: body.taskId },
      include: {
        comments: { orderBy: { createdAt: 'desc' }, take: 10, select: { content: true, createdAt: true } },
      },
    })
    if (!task) return notFound(res, 'Task')

    const providerName = resolveProvider(body.provider)
    const modelName = resolveModel(providerName, body.model)
    const provider = getProvider(providerName)
    const staff = await enrichStaffCtx(req)

    const commentsText = task.comments.length > 0
      ? task.comments.map((c) => `- ${c.content}`).join('\n')
      : 'No comments yet.'

    const overdue = task.deadline && new Date(task.deadline) < new Date()
    const daysLeft = task.deadline ? Math.ceil((new Date(task.deadline).getTime() - Date.now()) / 86400000) : null

    const userMsg = [
      `Task: "${task.title}"`,
      `Status: ${task.status} | Priority: ${task.priority} | Progress: ${task.progress ?? 0}%`,
      task.notes ? `Notes: ${task.notes}` : '',
      task.deadline ? `Deadline: ${new Date(task.deadline).toLocaleDateString()}${overdue ? ' (OVERDUE)' : ` (${daysLeft} days left)`}` : 'No deadline set',
      `Recent comments:\n${commentsText}`,
    ].filter(Boolean).join('\n')

    const systemPrompt = `You are a task productivity coach for ${staff.name} (${staff.role}) at PouchCare. Analyze this task and respond with a JSON object containing:
- "status_assessment": one sentence about current state
- "priority_tip": what to focus on first (1 sentence)
- "blockers": potential issues or risks (1-2 sentences)
- "next_steps": array of 2-3 concrete next actions
- "time_estimate": remaining effort estimate (e.g. "2-3 hours")
- "motivation": one encouraging sentence

Return ONLY valid JSON.`

    const result = await provider.chatSync(
      [{ role: 'system', content: systemPrompt }, { role: 'user', content: userMsg }],
      { model: modelName, maxTokens: 1024 },
    )
    await logUsage(req.user!.id, providerName, modelName, result.inputTokens, result.outputTokens, 'TASK')

    let insights: unknown
    try { insights = JSON.parse(result.content) } catch { insights = { raw: result.content } }
    return ok(res, { insights, provider: providerName, model: modelName, usage: { input: result.inputTokens, output: result.outputTokens } })
  } catch (e) { return serverError(res, e) }
})

// ── POST /task/my-pending — AI coach for all pending tasks ────
router.post('/task/my-pending', aiRateLimit, async (req: AuthRequest, res) => {
  try { ensureAiAvailable() } catch { return serviceUnavailable(res, 'No AI provider configured') }
  try {
    const withinBudget = await checkMonthlyBudget(req.user!.id)
    if (!withinBudget) return badRequest(res, 'Monthly AI token budget exceeded')

    const tasks = await prisma.task.findMany({
      where: {
        assignedMemberId: req.user!.id,
        status: { in: ['NOT_STARTED', 'IN_PROGRESS', 'BLOCKED'] },
      },
      select: { title: true, status: true, priority: true, deadline: true, progress: true },
      orderBy: [{ priority: 'asc' }, { deadline: 'asc' }],
      take: 10,
    })

    if (tasks.length === 0) return ok(res, { plan: null, message: 'No pending tasks', tasks: 0 })

    const providerName = resolveProvider(req.body?.provider)
    const modelName = resolveModel(providerName, req.body?.model)
    const provider = getProvider(providerName)
    const staff = await enrichStaffCtx(req)

    const taskList = tasks.map((t, i) =>
      `${i + 1}. [${t.status}] "${t.title}" — ${t.priority} priority, ${t.progress ?? 0}%${t.deadline ? `, due ${new Date(t.deadline).toLocaleDateString()}` : ''}`
    ).join('\n')

    const result = await provider.chatSync(
      [
        {
          role: 'system',
          content: `You are a task coach for ${staff.name} (${staff.role}) at PouchCare. Given their pending tasks, create a focused daily action plan. Return JSON:
- "summary": 1-2 sentence overview
- "today_focus": array of 1-3 task titles to prioritize today with reason
- "overdue_alert": any overdue items needing immediate attention (or null)
- "quick_wins": tasks that can be completed quickly
- "recommendation": one strategic suggestion
Return ONLY valid JSON.`,
        },
        { role: 'user', content: `My ${tasks.length} pending tasks:\n${taskList}` },
      ],
      { model: modelName, maxTokens: 1024 },
    )
    await logUsage(req.user!.id, providerName, modelName, result.inputTokens, result.outputTokens, 'TASK')

    let plan: unknown
    try { plan = JSON.parse(result.content) } catch { plan = { raw: result.content } }
    return ok(res, { plan, tasks: tasks.length, usage: { input: result.inputTokens, output: result.outputTokens } })
  } catch (e) { return serverError(res, e) }
})

// ── POST /executive/chat (SSE) — CEO/MD personal assistant ────
const execChatSchema = z.object({
  message: z.string().min(1).max(20000),
  conversationId: z.string().uuid().optional(),
  provider: z.string().optional(),
  model: z.string().optional(),
})

const CEO_ROLES = ['CEO', 'CO_MD']

async function buildOrgSnapshot() {
  const [
    staffCounts,
    activeStaff,
    taskStats,
    recentTasks,
    projects,
    attendance,
    revenue,
    expenses,
    leaveRequests,
  ] = await Promise.all([
    prisma.staffMember.groupBy({ by: ['systemRole'], _count: true, where: { status: 'Active' } }),
    prisma.staffMember.findMany({
      where: { status: 'Active' },
      select: { id: true, name: true, systemRole: true, branch: true, tasksAssigned: true, tasksCompleted: true, averageTaskRating: true, performanceScore: true },
      orderBy: { name: 'asc' },
    }),
    prisma.task.groupBy({ by: ['status'], _count: true }),
    prisma.task.findMany({
      where: { status: { in: ['NOT_STARTED', 'IN_PROGRESS', 'BLOCKED'] } },
      select: { title: true, status: true, priority: true, deadline: true, progress: true, assignedMemberId: true },
      orderBy: [{ priority: 'asc' }, { deadline: 'asc' }],
      take: 30,
    }),
    prisma.project.findMany({
      select: { name: true, status: true, price: true },
      orderBy: { createdAt: 'desc' },
      take: 15,
    }),
    prisma.attendance.groupBy({
      by: ['status'],
      _count: true,
      where: { date: { gte: new Date(new Date().setDate(new Date().getDate() - 7)) } },
    }),
    prisma.invoice.aggregate({ _sum: { amountUsd: true }, where: { status: 'Paid' } }).catch(() => null),
    prisma.expense.aggregate({ _sum: { amountUsd: true }, where: { status: 'Approved' } }).catch(() => null),
    prisma.leaveRequest.findMany({
      where: { status: 'PENDING' },
      select: { staffName: true, leaveType: true, startDate: true, endDate: true },
      take: 10,
    }),
  ])

  const staffById = new Map(activeStaff.map((s) => [s.id, s.name]))

  const sections = [
    `## Staff Overview (${activeStaff.length} active)`,
    staffCounts.map((r) => `- ${r.systemRole}: ${r._count}`).join('\n'),
    '',
    '## Staff Directory (active)',
    activeStaff.map((s) =>
      `- ${s.name} | ${s.systemRole} | ${s.branch ?? 'No branch'} | Tasks: ${s.tasksAssigned ?? 0} assigned, ${s.tasksCompleted ?? 0} done | Rating: ${s.averageTaskRating?.toFixed(1) ?? '—'} | Score: ${s.performanceScore?.toFixed(1) ?? '—'}`
    ).join('\n'),
    '',
    '## Task Pipeline',
    taskStats.map((r) => `- ${r.status}: ${r._count}`).join('\n'),
    '',
    '## Active/Pending Tasks (top 30)',
    recentTasks.map((t) =>
      `- [${t.status}] "${t.title}" — ${t.priority}${t.deadline ? `, due ${new Date(t.deadline).toLocaleDateString()}` : ''} — ${t.progress ?? 0}% — assigned: ${t.assignedMemberId ? (staffById.get(t.assignedMemberId) ?? t.assignedMemberId) : 'unassigned'}`
    ).join('\n'),
    '',
    '## Projects',
    projects.map((p) => `- ${p.name} (${p.status})${p.price ? ` — price: $${p.price}` : ''}`).join('\n'),
    '',
    '## Attendance (last 7 days)',
    attendance.map((a) => `- ${a.status}: ${a._count}`).join('\n'),
    '',
    '## Financials',
    `- Total paid invoices: $${(revenue as any)?._sum?.amountUsd?.toLocaleString() ?? '0'}`,
    `- Total approved expenses: $${(expenses as any)?._sum?.amountUsd?.toLocaleString() ?? '0'}`,
    '',
    '## Pending Leave Requests',
    leaveRequests.length > 0
      ? leaveRequests.map((l) => `- ${l.staffName}: ${l.leaveType} (${new Date(l.startDate).toLocaleDateString()} → ${new Date(l.endDate).toLocaleDateString()})`).join('\n')
      : '- None pending',
  ]

  return sections.join('\n')
}

router.post('/executive/chat', aiRateLimit, validate(execChatSchema), async (req: AuthRequest, res) => {
  if (!CEO_ROLES.includes(String(req.user!.role))) {
    return forbidden(res, 'Executive assistant is available to CEO and Co-MD only')
  }

  try { ensureAiAvailable() } catch { return serviceUnavailable(res, 'No AI provider configured') }

  try {
    const withinBudget = await checkMonthlyBudget(req.user!.id)
    if (!withinBudget) return badRequest(res, 'Monthly AI token budget exceeded')

    const body = req.body as z.infer<typeof execChatSchema>
    const providerName = resolveProvider(body.provider)
    const modelName = resolveModel(providerName, body.model)
    const provider = getProvider(providerName)
    const staff = await enrichStaffCtx(req)

    const orgSnapshot = await buildOrgSnapshot()
    const systemPrompt = prompts.executiveAssistantSystem(staff, orgSnapshot)

    let conv = body.conversationId
      ? await prisma.aiConversation.findFirst({ where: { id: body.conversationId, staffId: req.user!.id }, include: { messages: { orderBy: { createdAt: 'asc' } } } })
      : null

    if (!conv) {
      conv = await prisma.aiConversation.create({
        data: {
          staffId: req.user!.id,
          useCase: 'CHAT',
          title: `Executive: ${body.message.slice(0, 80)}`,
          provider: providerName,
          model: modelName,
        },
        include: { messages: true },
      })
    }

    await prisma.aiMessage.create({ data: { conversationId: conv.id, role: 'user', content: body.message } })

    const messages: ProviderMsg[] = [
      { role: 'system', content: systemPrompt },
      ...(conv.messages ?? []).map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      { role: 'user' as const, content: body.message },
    ]

    sseHeaders(res)
    res.write(`data: ${JSON.stringify({ type: 'start', conversationId: conv.id })}\n\n`)

    const gen = provider.stream(messages, { model: modelName, maxTokens: 8192 })
    let result = { content: '', inputTokens: 0, outputTokens: 0, model: modelName }

    for (;;) {
      const next = await gen.next()
      if (next.done) { result = next.value; break }
      res.write(`data: ${JSON.stringify({ type: 'chunk', text: next.value })}\n\n`)
    }

    await prisma.aiMessage.create({ data: { conversationId: conv.id, role: 'assistant', content: result.content, tokensUsed: result.outputTokens } })
    await prisma.aiConversation.update({ where: { id: conv.id }, data: { totalTokens: { increment: result.inputTokens + result.outputTokens } } })
    await logUsage(req.user!.id, providerName, modelName, result.inputTokens, result.outputTokens, 'CHAT')

    res.write(`data: ${JSON.stringify({ type: 'done', conversationId: conv.id, usage: { input: result.inputTokens, output: result.outputTokens } })}\n\n`)
    res.end()
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Executive AI request failed'
    if (!res.headersSent) return serverError(res, e)
    res.write(`data: ${JSON.stringify({ type: 'error', error: msg })}\n\n`)
    res.end()
  }
})

// ── GET /executive/status — check if current user has exec access ──
router.get('/executive/status', async (req: AuthRequest, res) => {
  const isExec = CEO_ROLES.includes(String(req.user!.role))
  return ok(res, { isExecutive: isExec, role: req.user!.role })
})

// ── Helper ────────────────────────────────────────────────────

/** When `workspaceId` is set, append IDE-specific instructions (empty vs non-empty project). Owner-only. */
async function workspaceIdeSystemExtra(workspaceId: string | undefined, ownerId: string): Promise<string> {
  if (!workspaceId) return ''
  const ownedWs = await prisma.workspace.findFirst({
    where: { id: workspaceId, ownerId },
    select: { name: true, _count: { select: { files: true } } },
  })
  if (!ownedWs) return ''
  return prompts.workspaceIdeSystemSuffix(ownedWs.name, ownedWs._count.files)
}

function getSystemPrompt(useCase: AiUseCase, staff: { name: string; role: string; branch?: string }) {
  switch (useCase) {
    case 'BLOG': return prompts.blogWriterSystem(staff)
    case 'SEO_BRIEF': return prompts.seoBriefSystem(staff)
    case 'TASK': return prompts.taskPlanSystem(staff)
    case 'REPORT': return prompts.reportDraftSystem(staff)
    case 'CHAT': return prompts.generalChatSystem(staff)
    default: return prompts.generalChatSystem(staff)
  }
}

export default router
