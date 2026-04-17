import { Router } from 'express'
import multer from 'multer'
import { z } from 'zod'
import { authenticate, requireStaff, type AuthRequest } from '@/middleware/auth'
import { validate } from '@/middleware/validate'
import type { Response } from 'express'
import { ok, badRequest, serviceUnavailable, serverError, badGateway } from '@/lib/response'
import { toolsStatus } from '@/lib/tools/config'
import { logToolRun } from '@/lib/tools/logToolRun'
import { fetchGoogleSerpTop, fetchGoogleSerpRankForDomain } from '@/lib/tools/serpapi'
import { fetchOpenPageRanks } from '@/lib/tools/openpagerank'
import { fetchBacklinks, fetchKeywordIdeas } from '@/lib/tools/dataforseo'
import { buildFaviconZipFromBuffer } from '@/lib/tools/faviconZip'
import prisma from '@/lib/prisma'
import { ToolRunType } from '@prisma/client'

const router = Router()

function toolDataForSeoError(res: Response, e: unknown) {
  const msg = e instanceof Error ? e.message : 'Internal server error'
  if (msg.startsWith('DataForSEO')) {
    return badGateway(res, msg)
  }
  return serverError(res, e)
}
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 4 * 1024 * 1024 },
})

const serpSchema = z.object({
  keyword: z.string().min(1).max(500),
  hl: z.string().min(2).max(8).default('en'),
  gl: z.string().min(2).max(4).default('us'),
  num: z.coerce.number().min(10).max(100).optional(),
  location: z.string().max(500).optional(),
  google_domain: z.string().max(200).optional(),
})

const serpRankSchema = z.object({
  keyword: z.string().min(1).max(500),
  hl: z.string().min(2).max(8).default('en'),
  gl: z.string().min(2).max(4).default('us'),
  /** Domain or full URL to find in organic results (hostname + subdomains match). */
  target: z.string().min(1).max(2000),
  location: z.string().max(500).optional(),
  google_domain: z.string().max(200).optional(),
  num: z.coerce.number().min(10).max(100).optional(),
  maxScan: z.coerce.number().min(10).max(200).optional(),
})

const domainMetricsSchema = z.object({
  domainA: z.string().min(1).max(500),
  domainB: z.string().max(500).optional(),
})

const backlinksSchema = z.object({
  targetUrl: z.string().url().max(2000),
})

const keywordsSchema = z.object({
  seed: z.string().min(1).max(500),
})

/** GET /v1/tools/status — which external providers are configured */
router.get('/status', authenticate, requireStaff, (_req, res) => {
  return ok(res, {
    ...toolsStatus(),
    checkedAt: new Date().toISOString(),
  })
})

/** GET /v1/tools/runs — recent tool usage for current user */
router.get('/runs', authenticate, requireStaff, async (req: AuthRequest, res) => {
  try {
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 30))
    const rows = await prisma.toolRun.findMany({
      where: { staffId: req.user!.id },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        toolType: true,
        queryLabel: true,
        createdAt: true,
      },
    })
    return ok(res, rows)
  } catch (e) {
    return serverError(res, e)
  }
})

router.post('/serp', authenticate, requireStaff, validate(serpSchema), async (req: AuthRequest, res) => {
  const st = toolsStatus()
  if (!st.serpApi) {
    return serviceUnavailable(res, 'SERP is not configured. Set SERPAPI_API_KEY in the API environment.')
  }
  try {
    const { keyword, hl, gl, num, location, google_domain } = req.body as z.infer<typeof serpSchema>
    const rows = await fetchGoogleSerpTop({ q: keyword, hl, gl, num, location, google_domain })
    const locLabel =
      location?.trim() || google_domain?.trim()
        ? ` ${[location?.trim(), google_domain?.trim()].filter(Boolean).join(' · ')}`
        : ''
    await logToolRun(req.user!.id, ToolRunType.SERP_TOP_100, `${keyword} [${gl}/${hl}]${locLabel}`, {
      resultCount: rows.length,
    })
    return ok(res, { results: rows, provider: 'serpapi' as const })
  } catch (e) {
    return serverError(res, e)
  }
})

router.post('/serp/rank-check', authenticate, requireStaff, validate(serpRankSchema), async (req: AuthRequest, res) => {
  const st = toolsStatus()
  if (!st.serpApi) {
    return serviceUnavailable(res, 'SERP is not configured. Set SERPAPI_API_KEY in the API environment.')
  }
  try {
    const { keyword, hl, gl, target, location, google_domain, num, maxScan } = req.body as z.infer<
      typeof serpRankSchema
    >
    const rank = await fetchGoogleSerpRankForDomain({
      q: keyword,
      hl,
      gl,
      target,
      location,
      google_domain,
      num,
      maxScan,
    })
    await logToolRun(req.user!.id, ToolRunType.SERP_TOP_100, `rank: ${keyword} → ${target}`, {
      position: rank.position,
      scannedOrganic: rank.scannedOrganic,
    })
    return ok(res, { ...rank, provider: 'serpapi' as const })
  } catch (e) {
    return serverError(res, e)
  }
})

router.post('/domain-metrics', authenticate, requireStaff, validate(domainMetricsSchema), async (req: AuthRequest, res) => {
  const st = toolsStatus()
  if (!st.openPageRank) {
    return serviceUnavailable(
      res,
      'Domain metrics are not configured. Set OPENPAGERANK_API_KEY (free tier at openpagerank.com).',
    )
  }
  try {
    const { domainA, domainB } = req.body as z.infer<typeof domainMetricsSchema>
    const list = [domainA, domainB].filter((x): x is string => Boolean(x?.trim()))
    const rows = await fetchOpenPageRanks(list)
    await logToolRun(req.user!.id, ToolRunType.DOMAIN_METRICS, list.join(' vs '), {
      domains: rows.map((r) => r.domain),
    })
    return ok(res, {
      domains: rows,
      provider: 'openpagerank' as const,
      label: 'Open PageRank (0–10) — not Moz DA/PA',
    })
  } catch (e) {
    return serverError(res, e)
  }
})

router.post('/backlinks', authenticate, requireStaff, validate(backlinksSchema), async (req: AuthRequest, res) => {
  const st = toolsStatus()
  if (!st.dataForSeo) {
    return serviceUnavailable(
      res,
      'Backlinks are not configured. Set DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD.',
    )
  }
  try {
    const { targetUrl } = req.body as z.infer<typeof backlinksSchema>
    const rows = await fetchBacklinks(targetUrl)
    await logToolRun(req.user!.id, ToolRunType.BACKLINKS, targetUrl, { resultCount: rows.length })
    return ok(res, { rows, provider: 'dataforseo' as const })
  } catch (e) {
    return toolDataForSeoError(res, e)
  }
})

router.post('/keywords', authenticate, requireStaff, validate(keywordsSchema), async (req: AuthRequest, res) => {
  const st = toolsStatus()
  if (!st.dataForSeo) {
    return serviceUnavailable(
      res,
      'Keywords are not configured. Set DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD.',
    )
  }
  try {
    const { seed } = req.body as z.infer<typeof keywordsSchema>
    const rows = await fetchKeywordIdeas(seed)
    await logToolRun(req.user!.id, ToolRunType.KEYWORDS, seed, { resultCount: rows.length })
    return ok(res, { rows, provider: 'dataforseo' as const })
  } catch (e) {
    return toolDataForSeoError(res, e)
  }
})

router.post(
  '/favicon-zip',
  authenticate,
  requireStaff,
  upload.single('image'),
  async (req: AuthRequest, res) => {
    const file = req.file
    if (!file?.buffer) {
      return badRequest(res, 'Missing image file (field name: image)')
    }
    try {
      const zip = await buildFaviconZipFromBuffer(file.buffer)
      await logToolRun(req.user!.id, ToolRunType.FAVICON_ZIP, file.originalname || 'upload', {
        size: file.size,
      })
      res.setHeader('Content-Type', 'application/zip')
      res.setHeader('Content-Disposition', 'attachment; filename="favicon-kit.zip"')
      return res.send(zip)
    } catch (e) {
      return serverError(res, e)
    }
  },
)

export default router
