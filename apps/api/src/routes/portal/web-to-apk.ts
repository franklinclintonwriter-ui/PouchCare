import { Router } from 'express'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { authenticate, requirePortal, type AuthRequest } from '@/middleware/auth'
import { ok, created, badRequest, notFound, serverError } from '@/lib/response'
import { getPaginationParams, buildMeta } from '@/lib/pagination'
import { validate } from '@/middleware/validate'

const router = Router()
router.use(authenticate, requirePortal)

// Validation schemas
const createJobSchema = z.object({
  appName: z.string().min(1).max(100),
  url: z.string().url(),
  plan: z.enum(['free', 'pro', 'enterprise']).default('free'),
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

    // Check plan limits
    const planLimits: Record<string, { maxApkSize: number; maxConcurrent: number }> = {
      free: { maxApkSize: 50, maxConcurrent: 1 },
      pro: { maxApkSize: 150, maxConcurrent: 5 },
      enterprise: { maxApkSize: 500, maxConcurrent: 20 },
    }

    const limit = planLimits[plan]
    const activeJobs = await prisma.apkJob.count({
      where: {
        portalMemberId: req.user!.id,
        status: { in: ['queued', 'processing'] },
      },
    })

    if (activeJobs >= limit.maxConcurrent) {
      return badRequest(res, `Plan ${plan} limited to ${limit.maxConcurrent} concurrent jobs`)
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
