import { Router } from 'express'
import prisma from '@/lib/prisma'
import { authenticate, isOps } from '@/middleware/auth'
import { ok, serverError, notFound, badRequest } from '@/lib/response'
import { getPaginationParams, buildMeta } from '@/lib/pagination'

const router = Router()
router.use(authenticate, isOps)

// GET /admin/portal/members
router.get('/members', async (req, res) => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query as any)
    const q = String(req.query.q ?? '').trim()
    const status = String(req.query.status ?? '').trim()
    const where: any = {}
    if (q) {
      where.OR = [
        { fullName: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { referralCode: { contains: q, mode: 'insensitive' } },
      ]
    }
    if (status) where.status = status as any
    const [items, total] = await Promise.all([
      prisma.portalMember.findMany({ where, orderBy: { registrationDate: 'desc' }, skip, take: limit }),
      prisma.portalMember.count({ where }),
    ])
    return ok(res, items.map(({ passwordHash: _, emailVerifyToken: __, resetPasswordToken: ___, refreshToken: ____, ...m }) => m), buildMeta(total, page, limit))
  } catch { return serverError(res) }
})

// GET /admin/portal/members/:id
router.get('/members/:id', async (req, res) => {
  try {
    const m = await prisma.portalMember.findUnique({
      where: { id: req.params.id },
      include: {
        orders: { take: 10, orderBy: { orderDate: 'desc' } },
        commissionsEarned: { take: 10, orderBy: { createdAt: 'desc' } },
        walletTx: { take: 20, orderBy: { transactionDate: 'desc' } },
      },
    })
    if (!m) return notFound(res)
    const { passwordHash, emailVerifyToken, resetPasswordToken, refreshToken, ...safe } = m
    return ok(res, safe)
  } catch { return serverError(res) }
})

// PUT /admin/portal/members/:id/status
router.put('/members/:id/status', async (req, res) => {
  try {
    const m = await prisma.portalMember.update({ where: { id: req.params.id }, data: { status: req.body.status } })
    return ok(res, m)
  } catch { return serverError(res) }
})

// GET /admin/portal/orders
router.get('/orders', async (req, res) => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query as any)
    const q = String(req.query.q ?? '').trim()
    const status = String(req.query.status ?? '').trim()
    const where: any = {}
    if (status) where.status = status as any
    if (q) {
      where.OR = [
        { service: { contains: q, mode: 'insensitive' } },
        { memberEmail: { contains: q, mode: 'insensitive' } },
      ]
      if (!Number.isNaN(Number(q))) {
        where.OR.push({ orderId: Number(q) })
      }
    }
    const [items, total] = await Promise.all([
      prisma.portalOrder.findMany({ where, orderBy: { orderDate: 'desc' }, skip, take: limit }),
      prisma.portalOrder.count({ where }),
    ])
    return ok(res, items.map(o => ({ ...o, serviceName: o.service })), buildMeta(total, page, limit))
  } catch { return serverError(res) }
})

// PUT /admin/portal/orders/:id/status
router.put('/orders/:id/status', async (req, res) => {
  try {
    const o = await prisma.portalOrder.update({ where: { id: req.params.id }, data: { status: req.body.status as any, ...(req.body.deliveryLink && { deliveryLink: req.body.deliveryLink }) } })
    return ok(res, o)
  } catch { return serverError(res) }
})

// GET /admin/portal/commissions
router.get('/commissions', async (req, res) => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query as any)
    const status = String(req.query.status ?? "")
    const [items, total] = await Promise.all([
      prisma.commission.findMany({ where: status ? { status: status as any } : {}, orderBy: { createdAt: 'desc' }, skip, take: limit }),
      prisma.commission.count(status ? { where: { status: status as any } } : undefined),
    ])
    return ok(res, items, buildMeta(total, page, limit))
  } catch { return serverError(res) }
})

// GET /admin/portal/payouts — pending queue
router.get('/payouts', async (req, res) => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query as any)
    const status = String(req.query.status ?? 'PENDING')
    const [items, total] = await Promise.all([
      prisma.payoutRequest.findMany({ where: status ? { status: status as any } : {}, orderBy: { requestedDate: 'desc' }, skip, take: limit }),
      prisma.payoutRequest.count({ where: status ? { status: status as any } : {} }),
    ])
    return ok(res, items, buildMeta(total, page, limit))
  } catch { return serverError(res) }
})

// PUT /admin/portal/payouts/:id/process
router.put('/payouts/:id/process', async (req, res) => {
  try {
    const { status, transactionId } = req.body
    const p = await prisma.payoutRequest.update({ where: { id: req.params.id }, data: { status: status as any, processedDate: new Date(), processedBy: req.user!.id, ...(transactionId && { transactionId }) } })
    return ok(res, p)
  } catch { return serverError(res) }
})

// GET /admin/portal/deposits — list wallet deposit requests
router.get('/deposits', async (req, res) => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query as any)
    const status = String(req.query.status ?? '').trim()
    const where: any = { type: 'DEPOSIT' }
    if (status) where.status = status
    const [items, total] = await Promise.all([
      prisma.walletTransaction.findMany({ where, orderBy: { transactionDate: 'desc' }, skip, take: limit,
        include: { member: { select: { fullName: true, email: true } } },
      }),
      prisma.walletTransaction.count({ where }),
    ])
    return ok(res, items, buildMeta(total, page, limit))
  } catch { return serverError(res) }
})

// PUT /admin/portal/deposits/:id/approve
router.put('/deposits/:id/approve', async (req: any, res) => {
  try {
    const tx = await prisma.walletTransaction.findUnique({ where: { id: req.params.id } })
    if (!tx || tx.type !== 'DEPOSIT') return notFound(res, 'Deposit')
    if (tx.status !== 'Pending') return badRequest(res, 'Already processed')

    const member = await prisma.portalMember.findUnique({ where: { id: tx.memberId }, select: { walletBalance: true } })
    if (!member) return notFound(res, 'Member')

    const newBalance = member.walletBalance + tx.amountUsd
    await prisma.$transaction([
      prisma.walletTransaction.update({ where: { id: tx.id }, data: { status: 'Confirmed', balanceAfterUsd: newBalance, approvedBy: req.user!.id } }),
      prisma.portalMember.update({ where: { id: tx.memberId }, data: { walletBalance: { increment: tx.amountUsd }, totalDeposited: { increment: tx.amountUsd } } }),
    ])
    return ok(res, { message: 'Deposit approved', newBalance })
  } catch { return serverError(res) }
})

// PUT /admin/portal/deposits/:id/reject
router.put('/deposits/:id/reject', async (req: any, res) => {
  try {
    const tx = await prisma.walletTransaction.findUnique({ where: { id: req.params.id } })
    if (!tx || tx.type !== 'DEPOSIT') return notFound(res, 'Deposit')
    if (tx.status !== 'Pending') return badRequest(res, 'Already processed')

    await prisma.walletTransaction.update({ where: { id: tx.id }, data: { status: 'Failed', approvedBy: req.user!.id } })
    return ok(res, { message: 'Deposit rejected' })
  } catch { return serverError(res) }
})

export default router
