import { Router } from 'express'
import type { Prisma } from '@prisma/client'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { authenticate } from '@/middleware/auth'
import { requirePermission } from '@/middleware/rbac'
import { validate } from '@/middleware/validate'
import { getPagination, buildMeta } from '@/utils/pagination'
import { deliverBroadcastByEmail } from '@/lib/broadcastDelivery'
import { ok, created, notFound, serverError } from '@/utils/response'

const router = Router()
router.use(authenticate)
const bc = requirePermission('broadcast.access')

const CHANNELS = ['in_app', 'email'] as const
const AUDIENCES = ['staff', 'clients', 'all'] as const

const schema = z.object({
  title:    z.string().min(1),
  message:  z.string().min(1),
  audience: z.enum(AUDIENCES),
  channel:  z.enum(CHANNELS).optional().default('in_app'),
  isUrgent: z.boolean().optional().default(false),
})

function broadcastWhere(req: { query: Record<string, unknown> }): Prisma.BroadcastWhereInput {
  const where: Prisma.BroadcastWhereInput = {}
  const channel = typeof req.query.channel === 'string' ? req.query.channel : undefined
  const audience = typeof req.query.audience === 'string' ? req.query.audience : undefined
  if (channel && (CHANNELS as readonly string[]).includes(channel)) {
    where.channel = channel
  }
  if (audience && (AUDIENCES as readonly string[]).includes(audience)) {
    where.audience = audience
  }
  return where
}

router.get('/', bc, async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req)
    const where = broadcastWhere(req)
    const [broadcasts, total] = await Promise.all([
      prisma.broadcast.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      prisma.broadcast.count({ where }),
    ])
    return ok(res, broadcasts, buildMeta(total, page, limit))
  } catch (err) { serverError(res, err) }
})

router.get('/:id', bc, async (req, res) => {
  try {
    const broadcast = await prisma.broadcast.findUnique({ where: { id: req.params.id } })
    if (!broadcast) return notFound(res)
    return ok(res, broadcast)
  } catch (err) { serverError(res, err) }
})

router.delete('/:id', bc, async (req, res) => {
  try {
    const existing = await prisma.broadcast.findUnique({ where: { id: req.params.id } })
    if (!existing) return notFound(res)
    await prisma.broadcast.delete({ where: { id: req.params.id } })
    return ok(res, { message: 'Broadcast deleted' })
  } catch (err) { serverError(res, err) }
})

router.post('/', bc, validate(schema), async (req, res) => {
  try {
    const { title, message, audience, channel, isUrgent } = req.body
    const staff = await prisma.staffMember.findUnique({ where: { id: req.user!.id }, select: { name: true } })

    const broadcast = await prisma.$transaction(async (tx) => {
      const b = await tx.broadcast.create({
        data: { title, message, audience, channel, isUrgent, sentBy: staff?.name || req.user!.id },
      })

      if (channel === 'in_app') {
        if (audience === 'staff' || audience === 'all') {
          const staffMembers = await tx.staffMember.findMany({
            where: { status: 'Active' },
            select: { id: true },
          })
          if (staffMembers.length > 0) {
            await tx.notification.createMany({
              data: staffMembers.map(s => ({
                recipientId:   s.id,
                recipientType: 'staff',
                type:          'broadcast',
                title,
                message,
              })),
            })
          }
        }
        if (audience === 'clients' || audience === 'all') {
          const members = await tx.portalMember.findMany({
            where: { status: 'ACTIVE' },
            select: { id: true },
          })
          if (members.length > 0) {
            await tx.notification.createMany({
              data: members.map(m => ({
                recipientId:   m.id,
                recipientType: 'portal',
                type:          'announcement',
                title,
                message,
              })),
            })
          }
        }
      }

      return b
    })

    if (channel === 'email') {
      const delivery = await deliverBroadcastByEmail(audience, title, message, isUrgent)
      return created(res, broadcast, { delivery })
    }

    return created(res, broadcast)
  } catch (err) { serverError(res, err) }
})

export default router
