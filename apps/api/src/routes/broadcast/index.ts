import { Router } from 'express'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { authenticate, requireRoles, CEO_ROLES  } from '@/middleware/auth'
import { validate } from '@/middleware/validate'
import { getPagination, buildMeta } from '@/utils/pagination'
import { ok, created, serverError } from '@/utils/response'

const router = Router()
router.use(authenticate)
const CEO_OP = [...CEO_ROLES, 'Operation Manager']

const schema = z.object({
  title:    z.string().min(1),
  message:  z.string().min(1),
  audience: z.enum(['staff', 'clients', 'all']),
  channel:  z.enum(['in_app', 'email', 'whatsapp']).optional().default('in_app'),
  isUrgent: z.boolean().optional().default(false),
})

router.get('/', requireRoles(...CEO_OP as any), async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req)
    const [broadcasts, total] = await Promise.all([
      prisma.broadcast.findMany({ skip, take: limit, orderBy: { createdAt: 'desc' } }),
      prisma.broadcast.count(),
    ])
    return ok(res, broadcasts, buildMeta(page, limit, total))
  } catch (err) { serverError(res, err) }
})

router.post('/', requireRoles(...CEO_OP as any), validate(schema), async (req, res) => {
  try {
    const { title, message, audience, channel, isUrgent } = req.body
    const staff = await prisma.staffMember.findUnique({ where: { id: req.user!.id }, select: { name: true } })

    const broadcast = await prisma.broadcast.create({
      data: { title, message, audience, channel, isUrgent, sentBy: staff?.name || req.user!.id },
    })

    // Create in-app notifications for all recipients
    if (channel === 'in_app') {
      if (audience === 'staff' || audience === 'all') {
        const staffMembers = await prisma.staffMember.findMany({ where: { status: 'Active' }, select: { id: true } })
        await prisma.notification.createMany({
          data: staffMembers.map(s => ({
            recipientId:   s.id,
            recipientType: 'staff',
            type:          'broadcast',
            title,
            message,
          })),
        })
      }
      if (audience === 'clients' || audience === 'all') {
        const members = await prisma.portalMember.findMany({ where: { status: 'ACTIVE' }, select: { id: true } })
        await prisma.notification.createMany({
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

    return created(res, broadcast)
  } catch (err) { serverError(res, err) }
})

export default router
