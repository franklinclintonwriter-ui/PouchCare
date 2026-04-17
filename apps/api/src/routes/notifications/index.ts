import { Router } from 'express'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import type { AuthRequest } from '@/middleware/auth'
import { requireAuth } from '@/middleware/auth'
import { validate } from '@/middleware/validate'
import { buildMeta } from '@/utils/pagination'
import { ok, serverError, notFound, forbidden, badRequest } from '@/utils/response'

const router = Router()

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  unread: z.enum(['true', 'false']).optional(),
})

const markReadBodySchema = z
  .object({
    all: z.literal(true).optional(),
    id: z.string().uuid().optional(),
  })
  .refine((b) => b.all === true || (typeof b.id === 'string' && b.id.length > 0), {
    message: 'Send { all: true } or { id: "<uuid>" }',
  })

function recipientWhere(req: AuthRequest) {
  return {
    recipientId: req.user!.id,
    recipientType: req.user!.type,
  } as const
}

/** Serialize Prisma rows for JSON (dates → ISO strings). */
function toNotificationDto(n: {
  id: string
  recipientId: string
  recipientType: string
  type: string
  title: string
  message: string
  read: boolean
  link: string | null
  metadata: string | null
  createdAt: Date
}) {
  return {
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
  }
}

// GET /notifications — list for current user (staff or portal JWT)
router.get('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const q = listQuerySchema.safeParse(req.query)
    if (!q.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid query',
        code: 'VALIDATION_ERROR',
        errors: q.error.flatten().fieldErrors,
      })
    }
    const { page, limit, unread } = q.data
    const skip = (page - 1) * limit
    const baseWhere = { ...recipientWhere(req) }
    const where =
      unread === 'true' ? { ...baseWhere, read: false } : baseWhere

    const [rows, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({
        where: { ...recipientWhere(req), read: false },
      }),
    ])

    const data = rows.map(toNotificationDto)
    return ok(res, data, { ...buildMeta(total, page, limit), unreadCount })
  } catch (err) {
    return serverError(res, err)
  }
})

// GET /notifications/:id — single notification (must belong to user)
router.get('/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const id = req.params.id
    if (!z.string().uuid().safeParse(id).success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid notification id',
        code: 'VALIDATION_ERROR',
      })
    }
    const scope = recipientWhere(req)
    const row = await prisma.notification.findFirst({
      where: { id, ...scope },
    })
    if (!row) {
      const any = await prisma.notification.findUnique({ where: { id } })
      if (!any) return notFound(res, 'Notification')
      return forbidden(res, 'Not your notification')
    }
    return ok(res, toNotificationDto(row))
  } catch (err) {
    return serverError(res, err)
  }
})

// POST /notifications/mark-read — one id (scoped) or all for user
router.post('/mark-read', requireAuth, validate(markReadBodySchema), async (req: AuthRequest, res) => {
  try {
    const body = req.body as z.infer<typeof markReadBodySchema>
    const scope = recipientWhere(req)

    if (body.all === true) {
      await prisma.notification.updateMany({
        where: scope,
        data: { read: true },
      })
      return ok(res, { message: 'Marked as read' })
    }

    if (body.id) {
      const result = await prisma.notification.updateMany({
        where: { id: body.id, ...scope },
        data: { read: true },
      })
      if (result.count === 0) {
        const exists = await prisma.notification.findUnique({ where: { id: body.id } })
        if (!exists) return notFound(res, 'Notification')
        return forbidden(res, 'Not your notification')
      }
      return ok(res, { message: 'Marked as read' })
    }

    return badRequest(res, 'Send { all: true } or { id: "<uuid>" }')
  } catch (err) {
    return serverError(res, err)
  }
})

// DELETE /notifications — delete all read notifications for current user (before /:id)
router.delete('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const result = await prisma.notification.deleteMany({
      where: {
        ...recipientWhere(req),
        read: true,
      },
    })
    return ok(res, { message: `${result.count} notifications deleted`, deleted: result.count })
  } catch (err) {
    return serverError(res, err)
  }
})

// DELETE /notifications/:id — single notification (must belong to user)
router.delete('/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const id = req.params.id
    const scope = recipientWhere(req)

    const notification = await prisma.notification.findFirst({
      where: { id, ...scope },
    })
    if (!notification) {
      const any = await prisma.notification.findUnique({ where: { id } })
      if (!any) return notFound(res, 'Notification')
      return forbidden(res, 'Not your notification')
    }

    await prisma.notification.delete({ where: { id } })
    return ok(res, { message: 'Notification deleted' })
  } catch (err) {
    return serverError(res, err)
  }
})

/** Create a notification (internal / other routes). */
export async function createNotification(
  recipientId: string,
  recipientType: 'staff' | 'portal',
  type: string,
  title: string,
  message: string,
  link?: string,
) {
  return prisma.notification.create({
    data: { recipientId, recipientType, type, title, message, link },
  })
}

export default router
