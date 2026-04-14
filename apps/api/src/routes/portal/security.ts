import { Router } from 'express'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { authenticate, requirePortal, type AuthRequest } from '@/middleware/auth'
import { ok, badRequest, notFound, serverError } from '@/lib/response'
import { getPaginationParams, buildMeta } from '@/lib/pagination'
import { validate } from '@/middleware/validate'

const router = Router()
router.use(authenticate, requirePortal)

// Validation schemas
const updateSettingsSchema = z.object({
  emailNotifications: z.boolean().optional(),
  pushNotifications: z.boolean().optional(),
  twoFactorEnabled: z.boolean().optional(),
  theme: z.enum(['light', 'dark', 'auto']).optional(),
  language: z.string().optional(),
})

// GET /portal/security/sessions — List active sessions
router.get('/sessions', async (req: AuthRequest, res) => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query as any)

    const [items, total] = await Promise.all([
      prisma.portalSession.findMany({
        where: {
          portalMemberId: req.user!.id,
          revokedAt: null,
          expiresAt: { gt: new Date() },
        },
        orderBy: { lastActivityAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          deviceType: true,
          browserName: true,
          osName: true,
          ipAddress: true,
          country: true,
          city: true,
          createdAt: true,
          lastActivityAt: true,
          expiresAt: true,
        },
      }),
      prisma.portalSession.count({
        where: {
          portalMemberId: req.user!.id,
          revokedAt: null,
          expiresAt: { gt: new Date() },
        },
      }),
    ])

    return ok(res, items, buildMeta(total, page, limit))
  } catch (e) {
    console.error('[portal/security/sessions]', e)
    return serverError(res)
  }
})

// DELETE /portal/security/sessions/:id — Revoke a session
router.delete('/sessions/:id', async (req: AuthRequest, res) => {
  try {
    const session = await prisma.portalSession.findFirst({
      where: {
        id: req.params.id,
        portalMemberId: req.user!.id,
      },
    })

    if (!session) return notFound(res, 'Session')
    if (session.revokedAt) return badRequest(res, 'Session already revoked')

    await prisma.portalSession.update({
      where: { id: req.params.id },
      data: { revokedAt: new Date() },
    })

    return ok(res, { message: 'Session revoked' })
  } catch (e) {
    console.error('[portal/security/sessions/:id]', e)
    return serverError(res)
  }
})

// GET /portal/security/login-history — Login audit log
router.get('/login-history', async (req: AuthRequest, res) => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query as any)
    const status = String(req.query.status ?? '')

    const where: any = { portalMemberId: req.user!.id }
    if (status && ['success', 'failed', 'suspicious'].includes(status)) {
      where.status = status
    }

    const [items, total] = await Promise.all([
      prisma.portalLoginLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          ipAddress: true,
          country: true,
          city: true,
          deviceType: true,
          browserName: true,
          osName: true,
          status: true,
          failureReason: true,
          createdAt: true,
        },
      }),
      prisma.portalLoginLog.count({ where }),
    ])

    return ok(res, items, buildMeta(total, page, limit))
  } catch (e) {
    console.error('[portal/security/login-history]', e)
    return serverError(res)
  }
})

// PATCH /portal/security/settings — Update notification + appearance preferences
router.patch('/settings', validate(updateSettingsSchema), async (req: AuthRequest, res) => {
  try {
    const { emailNotifications, pushNotifications, twoFactorEnabled, theme, language } = req.body

    // Get existing preferences
    const member = await prisma.portalMember.findUnique({
      where: { id: req.user!.id },
      select: { preferences: true },
    })

    const existing = member?.preferences ? (typeof member.preferences === 'string' ? JSON.parse(member.preferences) : member.preferences) : {}

    // Merge with new values
    const merged = {
      ...existing,
      ...(emailNotifications !== undefined && { emailNotifications }),
      ...(pushNotifications !== undefined && { pushNotifications }),
      ...(twoFactorEnabled !== undefined && { twoFactorEnabled }),
      ...(theme !== undefined && { theme }),
      ...(language !== undefined && { language }),
    }

    // Update member with merged preferences
    await prisma.portalMember.update({
      where: { id: req.user!.id },
      data: { preferences: merged },
    })

    return ok(res, merged)
  } catch (e) {
    console.error('[portal/security/settings]', e)
    return serverError(res)
  }
})

// GET /portal/security/settings — Get security settings (added for completeness)
router.get('/settings', async (req: AuthRequest, res) => {
  try {
    const member = await prisma.portalMember.findUnique({
      where: { id: req.user!.id },
      select: { preferences: true },
    })

    const defaults = {
      emailNotifications: true,
      pushNotifications: true,
      twoFactorEnabled: false,
      theme: 'auto',
      language: 'en',
    }

    const preferences = member?.preferences ? (typeof member.preferences === 'string' ? JSON.parse(member.preferences) : member.preferences) : {}
    const settings = { ...defaults, ...preferences }

    return ok(res, settings)
  } catch (e) {
    console.error('[portal/security/settings]', e)
    return serverError(res)
  }
})

export default router
