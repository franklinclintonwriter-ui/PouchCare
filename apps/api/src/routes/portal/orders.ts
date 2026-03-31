import { Router } from 'express'
import prisma from '@/lib/prisma'
import { authenticate, requirePortal } from '@/middleware/auth'
import { ok, created, badRequest, notFound, serverError } from '@/lib/response'
import { getPaginationParams, buildMeta } from '@/lib/pagination'
import { OrderStatus, WalletTxType } from '@prisma/client'
import { z } from 'zod'
import { validate } from '@/middleware/validate'

const router = Router()
router.use(authenticate, requirePortal)

type OrderMessage = {
  id: string
  authorType: 'member' | 'staff'
  authorName: string
  content: string
  createdAt: string
}

function parseOrderMessages(notes?: string | null): OrderMessage[] {
  if (!notes) return []
  try {
    const parsed = JSON.parse(notes)
    if (Array.isArray(parsed)) return parsed as OrderMessage[]
    if (Array.isArray(parsed.messages)) return parsed.messages as OrderMessage[]
    return []
  } catch {
    return []
  }
}

// GET /portal/orders
router.get('/', async (req, res) => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query as any)
    const status = String(req.query.status ?? "")
    const where = { memberId: req.user!.id, ...(status ? { status: status as any } : {}) }
    const [items, total] = await Promise.all([
      prisma.portalOrder.findMany({ where, orderBy: { orderDate: 'desc' }, skip, take: limit }),
      prisma.portalOrder.count({ where }),
    ])
    return ok(res, items.map(o => ({ ...o, serviceName: o.service })), buildMeta(total, page, limit))
  } catch { return serverError(res) }
})

// GET /portal/orders/:id
router.get('/:id', async (req, res) => {
  try {
    const order = await prisma.portalOrder.findFirst({ where: { id: req.params.id, memberId: req.user!.id } })
    if (!order) return notFound(res)
    return ok(res, { ...order, serviceName: order.service })
  } catch { return serverError(res) }
})

// POST /portal/orders — place order
router.post('/', async (req, res) => {
  try {
    const { serviceId, quantity = 1, requirements } = req.body
    const svc = await prisma.service.findUnique({ where: { id: serviceId } })
    if (!svc) return notFound(res, 'Service not found')

    const total = (svc.basePriceUsd ?? 0) * quantity
    const member = await prisma.portalMember.findUnique({ where: { id: req.user!.id } })
    if (!member || member.walletBalance < total) return badRequest(res, `Insufficient balance. Required: $${total}`)

    const [order] = await prisma.$transaction(async (tx) => {
      const o = await tx.portalOrder.create({
        data: { memberId: member.id, memberEmail: member.email, service: svc.name, amountUsd: total, quantity, requirements, status: OrderStatus.PENDING, paymentStatus: 'Paid' },
      })
      await tx.walletTransaction.create({
        data: { memberId: member.id, type: WalletTxType.ORDER_PAYMENT, amountUsd: -total, balanceAfterUsd: member.walletBalance - total, status: 'Confirmed', reference: `Order #${o.orderId}` },
      })
      await tx.portalMember.update({ where: { id: member.id }, data: { walletBalance: { decrement: total }, totalOrders: { increment: 1 }, totalSpent: { increment: total } } })

      // 20% commission if referred
      if (member.referredById) {
        const commAmt = total * 0.20
        const holdDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
        await tx.commission.create({ data: { earnerId: member.referredById, orderId: o.id, referredMemberName: member.fullName, orderAmountUsd: total, commissionAmountUsd: commAmt, holdReleaseDate: holdDate } })
        await tx.portalMember.update({ where: { id: member.referredById }, data: { totalCommissionEarned: { increment: commAmt } } })
      }
      return [o]
    })
    return created(res, { ...order, serviceName: order.service })
  } catch (e: any) { return serverError(res, e.message) }
})

// POST /portal/orders/:id/revision
router.post('/:id/revision', async (req, res) => {
  try {
    const order = await prisma.portalOrder.findFirst({ where: { id: req.params.id, memberId: req.user!.id } })
    if (!order) return notFound(res)
    if (order.status !== OrderStatus.DELIVERED) return badRequest(res, 'Can only request revision on delivered orders')
    const updated = await prisma.portalOrder.update({ where: { id: req.params.id }, data: { status: OrderStatus.REVISION_REQUESTED, revisionCount: { increment: 1 } } })
    return ok(res, updated)
  } catch { return serverError(res) }
})

// GET /portal/orders/:id/messages
router.get('/:id/messages', async (req, res) => {
  try {
    const order = await prisma.portalOrder.findFirst({
      where: { id: req.params.id, memberId: req.user!.id },
      select: { notes: true },
    })
    if (!order) return notFound(res)
    return ok(res, parseOrderMessages(order.notes))
  } catch { return serverError(res) }
})

// POST /portal/orders/:id/messages
router.post('/:id/messages', validate(z.object({ content: z.string().min(1).max(2000) })), async (req, res) => {
  try {
    const order = await prisma.portalOrder.findFirst({
      where: { id: req.params.id, memberId: req.user!.id },
      select: { id: true, notes: true, member: { select: { fullName: true } } },
    })
    if (!order) return notFound(res)

    const messages = parseOrderMessages(order.notes)
    const message: OrderMessage = {
      id: `m_${Date.now()}`,
      authorType: 'member',
      authorName: order.member.fullName,
      content: req.body.content,
      createdAt: new Date().toISOString(),
    }
    const next = [...messages, message]
    await prisma.portalOrder.update({
      where: { id: order.id },
      data: { notes: JSON.stringify({ messages: next }) },
    })

    return created(res, message)
  } catch { return serverError(res) }
})

export default router
