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
    const [items, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({
        where: { ...where, read: false },
      }),
    ])
    const data = items.map((n) => ({
      id: n.id,
      recipientId: n.recipientId,
      recipientType: n.recipientType,
      type: n.type,
      title: n.title,
      message: n.message,
      read: n.read,
      link: n.link,
      metadata: n.metadata,
      createdAt: n.createdAt.toISOString(),
    }))
    return ok(res, data, { ...buildMeta(total, page, limit), unreadCount })
  } catch (e) {
    console.error('[portal/notifications]', e)
    return serverError(res)
  }
})

// PATCH /portal/notifications/:id/read — Mark notification as read
router.patch('/:id/read', async (req: AuthRequest, res) => {
  try {
    const notification = await prisma.notification.findFirst({
      where: { id: req.params.id, recipientId: req.user!.id, recipientType: 'portal' },
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
