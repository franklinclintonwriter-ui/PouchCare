import { Router } from 'express'
import prisma from '@/lib/prisma'
import { authenticate, requirePortal, type AuthRequest } from '@/middleware/auth'
import { ok, notFound, serverError } from '@/lib/response'
import { getPaginationParams, buildMeta } from '@/lib/pagination'

const router = Router()
router.use(authenticate, requirePortal)

// GET /portal/notifications — List notifications for current user
router.get('/', async (req: AuthRequest, res) => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query as any)
    const where = { recipientId: req.user!.id, recipientType: 'portal' }
    const [items, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.notification.count({ where }),
    ])
    return ok(res, items, buildMeta(total, page, limit))
  } catch (e) {
    console.error('[portal/notifications]', e)
    return serverError(res)
  }
})

// PATCH /portal/notifications/:id/read — Mark notification as read
router.patch('/:id/read', async (req: AuthRequest, res) => {
  try {
    const notification = await prisma.notification.findFirst({
      where: { id: req.params.id, recipientId: req.user!.id },
    })
    if (!notification) return notFound(res, 'Notification')
    const updated = await prisma.notification.update({
      where: { id: req.params.id },
      data: { read: true },
    })
    return ok(res, updated)
  } catch (e) {
    console.error('[portal/notifications]', e)
    return serverError(res)
  }
})

// PATCH /portal/notifications/read-all — Mark all as read
router.patch('/read-all', async (req: AuthRequest, res) => {
  try {
    await prisma.notification.updateMany({
      where: { recipientId: req.user!.id, recipientType: 'portal', read: false },
      data: { read: true },
    })
    return ok(res, { message: 'All notifications marked as read' })
  } catch (e) {
    console.error('[portal/notifications]', e)
    return serverError(res)
  }
})

export default router
