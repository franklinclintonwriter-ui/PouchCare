import { Router } from 'express'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { env } from '@/config/env'
import type { AuthRequest } from '@/middleware/auth'
import { authenticate, requireStaff } from '@/middleware/auth'
import { validate } from '@/middleware/validate'
import { ok, badRequest, serverError, forbidden, serviceUnavailable } from '@/lib/response'
import { aiRateLimit } from '@/middleware/rateLimit'
import { getSupabase, isSupabaseConfigured, supabaseStatus } from '@/lib/supabase'
import { resolveProvider, resolveModel } from '@/lib/ai/config'
import { getProvider } from '@/lib/ai/providers'

const router = Router()
const CEO_ROLES = ['CEO', 'CO_MD']

function requireExec(req: AuthRequest, res: import('express').Response, next: import('express').NextFunction) {
  if (!CEO_ROLES.includes(String(req.user!.role))) return forbidden(res, 'Supabase access is CEO/MD only')
  next()
}

router.use(authenticate, requireStaff, requireExec as any)

// ── Status ────────────────────────────────────────────────────

router.get('/status', (_req, res) => ok(res, supabaseStatus()))

// ── Presence Token ────────────────────────────────────────────

router.post('/presence/:workspaceId', async (req: AuthRequest, res) => {
  try {
    if (!isSupabaseConfigured()) return serviceUnavailable(res, 'Supabase not configured')
    const staff = await prisma.staffMember.findUnique({
      where: { id: req.user!.id },
      select: { name: true, avatarUrl: true },
    })
    return ok(res, {
      supabaseUrl: env.SUPABASE_URL,
      supabaseAnonKey: env.SUPABASE_ANON_KEY,
      channel: `workspace:${req.params.workspaceId}`,
      user: { id: req.user!.id, name: staff?.name ?? 'Unknown', avatarUrl: staff?.avatarUrl },
    })
  } catch (e) { return serverError(res, e) }
})

// ── DB Schema ─────────────────────────────────────────────────

router.get('/db-schema', async (_req: AuthRequest, res) => {
  try {
    const supabase = getSupabase()
    if (!supabase) return serviceUnavailable(res, 'Supabase not configured')

    const { data, error } = await supabase.rpc('get_table_info').select('*')
    if (error) {
      const { data: fallback } = await supabase.from('information_schema.tables' as any).select('table_name').eq('table_schema', 'public').limit(50)
      return ok(res, { tables: fallback ?? [], note: 'Basic schema only — create get_table_info RPC for full column info' })
    }
    return ok(res, { tables: data })
  } catch (e) { return serverError(res, e) }
})

// ── DB Query (natural language -> SQL) ────────────────────────

const dbQuerySchema = z.object({
  query: z.string().min(1).max(5000),
  autoExecute: z.boolean().default(false),
})

router.post('/db-query', aiRateLimit, validate(dbQuerySchema), async (req: AuthRequest, res) => {
  try {
    const supabase = getSupabase()
    if (!supabase) return serviceUnavailable(res, 'Supabase not configured')

    const body = req.body as z.infer<typeof dbQuerySchema>
    const providerName = resolveProvider()
    const modelName = resolveModel(providerName)
    const provider = getProvider(providerName)

    let schemaInfo = 'Schema unknown — the AI will use general SQL knowledge.'
    try {
      const { data } = await supabase.from('information_schema.columns' as any)
        .select('table_name, column_name, data_type')
        .eq('table_schema', 'public')
        .limit(200)
      if (data?.length) {
        const tables = new Map<string, string[]>()
        for (const row of data as any[]) {
          const t = row.table_name as string
          if (!tables.has(t)) tables.set(t, [])
          tables.get(t)!.push(`${row.column_name} (${row.data_type})`)
        }
        schemaInfo = Array.from(tables.entries()).map(([t, cols]) => `${t}: ${cols.join(', ')}`).join('\n')
      }
    } catch { /* schema fetch failed — proceed without */ }

    const aiResult = await provider.chatSync(
      [
        {
          role: 'system',
          content: `You are a SQL expert. Convert the user's natural language query to a PostgreSQL SELECT statement.

Database schema (Supabase PostgreSQL):
${schemaInfo}

RULES:
- Return ONLY a JSON object: { "sql": "SELECT ...", "explanation": "what this query does" }
- Only SELECT queries (no INSERT, UPDATE, DELETE, DROP)
- Use proper PostgreSQL syntax
- Limit results to 100 rows max
- Return ONLY valid JSON`,
        },
        { role: 'user', content: body.query },
      ],
      { model: modelName, maxTokens: 1024 },
    )

    let parsed: { sql?: string; explanation?: string }
    try { parsed = JSON.parse(aiResult.content) } catch { parsed = { explanation: aiResult.content } }

    if (!parsed.sql) return ok(res, { sql: null, explanation: parsed.explanation, executed: false })

    if (!body.autoExecute) {
      return ok(res, { sql: parsed.sql, explanation: parsed.explanation, executed: false })
    }

    const sqlUpper = parsed.sql.toUpperCase().trim()
    if (!sqlUpper.startsWith('SELECT') && !sqlUpper.startsWith('WITH')) {
      return badRequest(res, 'Only SELECT queries are allowed for safety')
    }

    const { data: queryData, error: queryError } = await supabase.rpc('exec_sql' as any, { query: parsed.sql })

    if (queryError) {
      const { data: fallbackData, error: fallbackError } = await (supabase as any).from(parsed.sql)
      if (fallbackError) {
        return ok(res, { sql: parsed.sql, explanation: parsed.explanation, executed: true, error: queryError.message, rows: [] })
      }
      return ok(res, { sql: parsed.sql, explanation: parsed.explanation, executed: true, rows: fallbackData ?? [] })
    }

    return ok(res, { sql: parsed.sql, explanation: parsed.explanation, executed: true, rows: queryData ?? [] })
  } catch (e) { return serverError(res, e) }
})

// ── Analytics Queries ─────────────────────────────────────────

router.get('/analytics/ai-usage', async (req: AuthRequest, res) => {
  try {
    const supabase = getSupabase()
    if (!supabase) {
      const localData = await prisma.aiUsage.groupBy({
        by: ['provider', 'model', 'useCase'],
        _sum: { inputTk: true, outputTk: true },
        _count: true,
        where: { createdAt: { gte: new Date(new Date().setDate(1)) } },
      })
      return ok(res, {
        source: 'local',
        data: localData.map((r) => ({
          provider: r.provider, model: r.model, useCase: r.useCase,
          inputTokens: r._sum.inputTk ?? 0, outputTokens: r._sum.outputTk ?? 0, count: r._count,
        })),
      })
    }

    const { data, error } = await supabase
      .from('ai_analytics')
      .select('provider, model, use_case, input_tokens, output_tokens')
      .gte('created_at', new Date(new Date().setDate(1)).toISOString())
      .order('created_at', { ascending: false })
      .limit(500)

    if (error) return ok(res, { source: 'supabase', data: [], error: error.message })

    const grouped = new Map<string, { provider: string; model: string; useCase: string; inputTokens: number; outputTokens: number; count: number }>()
    for (const row of (data ?? []) as any[]) {
      const key = `${row.provider}|${row.model}|${row.use_case}`
      const existing = grouped.get(key) ?? { provider: row.provider, model: row.model, useCase: row.use_case, inputTokens: 0, outputTokens: 0, count: 0 }
      existing.inputTokens += row.input_tokens ?? 0
      existing.outputTokens += row.output_tokens ?? 0
      existing.count++
      grouped.set(key, existing)
    }

    return ok(res, { source: 'supabase', data: Array.from(grouped.values()) })
  } catch (e) { return serverError(res, e) }
})

router.get('/analytics/tool-usage', async (req: AuthRequest, res) => {
  try {
    const supabase = getSupabase()
    if (!supabase) {
      const localData = await prisma.toolRun.groupBy({
        by: ['toolType'],
        _count: true,
        where: { createdAt: { gte: new Date(new Date().setDate(1)) } },
      })
      return ok(res, { source: 'local', data: localData.map((r) => ({ toolType: r.toolType, count: r._count })) })
    }

    const { data } = await supabase
      .from('tool_analytics')
      .select('tool_type')
      .gte('created_at', new Date(new Date().setDate(1)).toISOString())
      .limit(1000)

    const counts = new Map<string, number>()
    for (const row of (data ?? []) as any[]) {
      counts.set(row.tool_type, (counts.get(row.tool_type) ?? 0) + 1)
    }

    return ok(res, { source: 'supabase', data: Array.from(counts.entries()).map(([toolType, count]) => ({ toolType, count })) })
  } catch (e) { return serverError(res, e) }
})

export default router
