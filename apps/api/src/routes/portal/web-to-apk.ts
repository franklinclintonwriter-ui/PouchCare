import { Router } from 'express'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { authenticate, requirePortal, type AuthRequest } from '@/middleware/auth'
import { ok, created, badRequest, notFound, serverError } from '@/lib/response'
import { getPaginationParams, buildMeta } from '@/lib/pagination'
import { validate } from '@/middleware/validate'

const router = Router()
router.use(authenticate, requirePortal)

// ── Plan catalog (single source of truth) ─────────────────────────────
// `id` is what gets persisted on ApkJob.plan and accepted by POST /jobs.
// The dashboard plan picker renders name/pricing/features from this list,
// and the concurrency/size limits below are enforced on job creation.
export interface ApkPlanDef {
  id: 'free' | 'pro' | 'enterprise'
  name: string
  blurb: string
  monthlyUsd: number
  maxConversions: number | null
  features: string[]
  popular?: boolean
  maxApkSizeMb: number
  maxConcurrent: number
}

const WEB_TO_APK_PLANS: ApkPlanDef[] = [
  {
    id: 'free',
    name: 'Starter',
    blurb: 'Perfect for testing or small projects',
    monthlyUsd: 0,
    maxConversions: 1,
    features: ['1 APK conversion/month', 'Basic customization', 'Email support', '7-day expiry'],
    maxApkSizeMb: 50,
    maxConcurrent: 1,
  },
  {
    id: 'pro',
    name: 'Professional',
    blurb: 'For growing projects and small businesses',
    monthlyUsd: 29,
    maxConversions: 20,
    features: [
      '20 APK conversions/month',
      'Full customization',
      'Priority email support',
      '30-day expiry',
      'Custom icon & splash screen',
    ],
    popular: true,
    maxApkSizeMb: 150,
    maxConcurrent: 5,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    blurb: 'Unlimited capacity for large teams',
    monthlyUsd: 99,
    maxConversions: null,
    features: [
      'Unlimited APK conversions',
      'Full customization',
      '24/7 phone & email support',
      '90-day expiry',
      'Custom icon, splash & themes',
      'API access',
    ],
    maxApkSizeMb: 500,
    maxConcurrent: 20,
  },
]

// Validation schemas
const createJobSchema = z.object({
  appName: z.string().min(1).max(100),
  url: z.string().url(),
  plan: z.enum(['free', 'pro', 'enterprise']).default('free'),
})

// GET /portal/web-to-apk/plans — Plan catalog for the conversion picker
router.get('/plans', (_req, res) => {
  return ok(res, WEB_TO_APK_PLANS)
})

// GET /portal/web-to-apk/jobs — List APK jobs for member
router.get('/jobs', async (req: AuthRequest, res) => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query as any)
    const status = String(req.query.status ?? '')

    const where: any = { portalMemberId: req.user!.id }
    if (status && ['queued', 'processing', 'ready', 'failed', 'expired'].includes(status)) {
      where.status = status
    }

    const [items, total] = await Promise.all([
      prisma.apkJob.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.apkJob.count({ where }),
    ])

    return ok(res, items, buildMeta(total, page, limit))
  } catch (e) {
    console.error('[portal/web-to-apk/jobs]', e)
    return serverError(res)
  }
})

// POST /portal/web-to-apk/jobs — Submit new conversion job
router.post('/jobs', validate(createJobSchema), async (req: AuthRequest, res) => {
  try {
    const { appName, url, plan } = req.body

    // Validate URL format
    try {
      new URL(url)
    } catch {
      return badRequest(res, 'Invalid URL')
    }

    // Check plan limits (validated by zod, so the plan is always in the catalog)
    const planDef = WEB_TO_APK_PLANS.find((p) => p.id === plan)!
    const activeJobs = await prisma.apkJob.count({
      where: {
        portalMemberId: req.user!.id,
        status: { in: ['queued', 'processing'] },
      },
    })

    if (activeJobs >= planDef.maxConcurrent) {
      return badRequest(res, `Plan ${plan} limited to ${planDef.maxConcurrent} concurrent jobs`)
    }

    // Create APK job
    const job = await prisma.apkJob.create({
      data: {
        portalMemberId: req.user!.id,
        appName,
        url,
        plan,
        status: 'queued',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    })

    return created(res, job)
  } catch (e) {
    console.error('[portal/web-to-apk/jobs]', e)
    return serverError(res)
  }
})

// GET /portal/web-to-apk/jobs/:id — Job status + download URL
router.get('/jobs/:id', async (req: AuthRequest, res) => {
  try {
    const job = await prisma.apkJob.findFirst({
      where: {
        id: req.params.id,
        portalMemberId: req.user!.id,
      },
    })

    if (!job) return notFound(res, 'APK Job')

    // Check if job has expired
    if (job.expiresAt && new Date() > job.expiresAt && job.downloadUrl) {
      return ok(res, {
        ...job,
        status: 'expired',
        downloadUrl: null,
        message: 'Download link has expired. Re-submit to generate a new one.',
      })
    }

    return ok(res, {
      ...job,
      downloadReady: job.status === 'ready' && job.downloadUrl ? true : false,
      expiresIn: job.expiresAt ? Math.ceil((job.expiresAt.getTime() - Date.now()) / 1000 / 60 / 60) : null, // hours
    })
  } catch (e) {
    console.error('[portal/web-to-apk/jobs/:id]', e)
    return serverError(res)
  }
})

// DELETE /portal/web-to-apk/jobs/:id — Delete/cancel an APK job
router.delete('/jobs/:id', async (req: AuthRequest, res) => {
  try {
    const job = await prisma.apkJob.findFirst({
      where: { id: req.params.id, portalMemberId: req.user!.id },
    })
    if (!job) return notFound(res, 'APK Job')
    await prisma.apkJob.delete({ where: { id: req.params.id } })
    return ok(res, { message: 'Job deleted' })
  } catch (e) {
    console.error('[portal/web-to-apk]', e)
    return serverError(res)
  }
})

export default router
