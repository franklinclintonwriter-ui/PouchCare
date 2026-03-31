import { Router } from 'express'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { authenticate, requireAuth, requirePortal, requireStaff, requireRoles, CEO_ROLES  } from '@/middleware/auth'
import { validate } from '@/middleware/validate'
import { getPagination, buildMeta } from '@/utils/pagination'
import { ok, created, notFound, forbidden, serverError } from '@/utils/response'

const router = Router()
router.use(authenticate)
router.use(authenticate)

const ticketSchema = z.object({
  subject:  z.string().min(3),
  message:  z.string().min(1).optional(),
  priority: z.string().optional().default("Medium"),
  category: z.string().optional(),
})

router.get('/tickets', requireAuth, async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req)
    const where: any = {}
    if (req.user?.type === 'portal') where.memberId = req.user.id
    const [tickets, total] = await Promise.all([
      prisma.supportTicket.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      prisma.supportTicket.count({ where }),
    ])
    return ok(res, tickets, buildMeta(page, limit, total))
  } catch (err) { serverError(res, err) }
})

router.get('/tickets/:id', requireAuth, async (req, res) => {
  try {
    const ticket = await prisma.supportTicket.findUnique({
      where: { id: req.params.id },
      include: { replies: { orderBy: { createdAt: 'asc' } } },
    })
    if (!ticket) return notFound(res)
    if (req.user?.type === 'portal' && ticket.memberId !== req.user.id) return forbidden(res)
    return ok(res, ticket)
  } catch (err) { serverError(res, err) }
})

router.post("/tickets", validate(ticketSchema), async (req, res) => {
  try {
    // Support staff AND portal members creating tickets
    let memberEmail = ''
    let memberName = ''
    if (req.user!.type === 'portal') {
      const pm = await prisma.portalMember.findUnique({ where: { id: req.user!.id }, select: { email: true, fullName: true } })
      memberEmail = pm?.email || ''
      memberName = pm?.fullName || 'Client'
    } else {
      const sm = await prisma.staffMember.findUnique({ where: { id: req.user!.id }, select: { email: true, name: true } })
      memberEmail = sm?.email || ''
      memberName = sm?.name || 'Staff'
    }
    const ticket = await prisma.supportTicket.create({
      data: {
        memberId:    req.user!.id,
        memberEmail: memberEmail,
        subject:     req.body.subject,
        priority:    req.body.priority,
      },
    })
    // First message as a reply
    await prisma.ticketReply.create({
      data: {
        ticketId:   ticket.id,
        authorId:   req.user!.id,
        authorName: memberName,
        authorType: 'client',
        content:    req.body.message,
      },
    })
    return created(res, ticket)
  } catch (err) { serverError(res, err) }
})

router.post('/tickets/:id/reply', requireAuth, async (req, res) => {
  try {
    const { content } = req.body
    if (!content?.trim()) return ok(res, { error: 'Content required' })

    let authorName = 'Unknown'
    let authorType = req.user!.type
    if (req.user?.type === 'staff') {
      const staff = await prisma.staffMember.findUnique({ where: { id: req.user.id }, select: { name: true } })
      authorName = staff?.name || 'Staff'
    } else {
      const member = await prisma.portalMember.findUnique({ where: { id: req.user!.id }, select: { fullName: true } })
      authorName = member?.fullName || 'Client'
    }

    const reply = await prisma.ticketReply.create({
      data: { ticketId: req.params.id, authorId: req.user!.id, authorName, authorType: authorType as 'staff'|'client', content },
    })
    await prisma.supportTicket.update({
      where: { id: req.params.id },
      data: { status: req.user?.type === 'staff' ? 'In Progress' : 'Open', updatedAt: new Date() },
    })
    return created(res, reply)
  } catch (err) { serverError(res, err) }
})

router.put('/tickets/:id', requireStaff, async (req, res) => {
  try {
    const ticket = await prisma.supportTicket.update({
      where: { id: req.params.id },
      data: { status: req.body.status, assignedTo: req.body.assignedTo },
    })
    return ok(res, ticket)
  } catch (err) { serverError(res, err) }
})

export default router
