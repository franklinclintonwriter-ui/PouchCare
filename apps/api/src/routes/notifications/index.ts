import { Router } from 'express'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { requireAuth } from '@/middleware/auth'
import { validate } from '@/middleware/validate'
import { getPagination, buildMeta } from '@/utils/pagination'
import { ok, serverError } from '@/utils/response'

const router = Router()

router.get('/', requireAuth, async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req)
    const { unread } = req.query as Record<string, string>
    const where: any = {
      recipientId:   req.user!.id,
      recipientType: req.user!.type,
    }
    if (unread === 'true') where.read = false

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      prisma.notification.count({ where }),
    ])
    const unreadCount = await prisma.notification.count({ where: { ...where, read: false } })
    return ok(res, notifications, { ...buildMeta(page, limit, total), unreadCount })
  } catch (err) { serverError(res, err) }
})

router.post('/mark-read', requireAuth, async (req, res) => {
  try {
    const { id, all } = req.body
    if (all) {
      await prisma.notification.updateMany({
        where: { recipientId: req.user!.id, recipientType: req.user!.type },
        data: { read: true },
      })
    } else if (id) {
      await prisma.notification.update({ where: { id }, data: { read: true } })
    }
    return ok(res, { message: 'Marked as read' })
  } catch (err) { serverError(res, err) }
})

// Helper to create notifications (used internally)
export async function createNotification(
  recipientId: string,
  recipientType: 'staff' | 'portal',
  type: string,
  title: string,
  message: string,
  link?: string
) {
  return prisma.notification.create({
    data: { recipientId, recipientType, type, title, message, link },
  })
}

export default router
