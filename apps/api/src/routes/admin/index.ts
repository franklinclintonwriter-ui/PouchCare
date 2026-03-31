import { Router } from 'express'
import prisma from '@/lib/prisma'
import { authenticate, isOps } from '@/middleware/auth'
import { ok, serverError } from '@/lib/response'
import { getPaginationParams, buildMeta } from '@/lib/pagination'
import { WalletTxType } from '@prisma/client'

const router = Router()
router.use(authenticate, isOps)

// GET /admin/portal/members
router.get('/members', async (req, res) => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query as any)
    const [items, total] = await Promise.all([
      prisma.portalMember.findMany({ orderBy: { registrationDate: 'desc' }, skip, take: limit }),
      prisma.portalMember.count(),
    ])
    return ok(res, items.map(({ passwordHash, emailVerifyToken, resetPasswordToken, refreshToken, ...m }) => m), buildMeta(total, page, limit))
  } catch { return serverError(res) }
})

// GET /admin/portal/members/:id
router.get('/members/:id', async (req, res) => {
  try {
    const m = await prisma.portalMember.findUnique({
      where: { id: req.params.id },
      include: { orders: { take: 10, orderBy: { orderDate: 'desc' } } },
    })
    if (!m) return ok(res, null)
    const { passwordHash, emailVerifyToken, resetPasswordToken, refreshToken, ...safe } = m
    return ok(res, safe)
  } catch { return serverError(res) }
})

// PUT /admin/portal/members/:id/status
router.put('/members/:id/status', async (req, res) => {
  try {
    const m = await prisma.portalMember.update({ where: { id: req.params.id }, data: { status: req.body.status as any } })
    return ok(res, m)
  } catch { return serverError(res) }
})

// GET /admin/portal/orders
router.get('/orders', async (req, res) => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query as any)
    const [items, total] = await Promise.all([
      prisma.portalOrder.findMany({ orderBy: { orderDate: 'desc' }, skip, take: limit }),
      prisma.portalOrder.count(),
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
    const where = req.query.status ? { status: req.query.status as any } : {}
    const [items, total] = await Promise.all([
      prisma.commission.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: limit }),
      prisma.commission.count({ where }),
    ])
    return ok(res, items, buildMeta(total, page, limit))
  } catch { return serverError(res) }
})

// GET /admin/portal/payouts
router.get('/payouts', async (req, res) => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query as any)
    const where = { status: 'PENDING' as any }
    const [items, total] = await Promise.all([
      prisma.payoutRequest.findMany({ where, orderBy: { requestedDate: 'desc' }, skip, take: limit }),
      prisma.payoutRequest.count({ where }),
    ])
    return ok(res, items, buildMeta(total, page, limit))
  } catch { return serverError(res) }
})

// PUT /admin/portal/payouts/:id/process
router.put('/payouts/:id/process', async (req, res) => {
  try {
    const { status, transactionId } = req.body
    const p = await prisma.payoutRequest.update({
      where: { id: req.params.id },
      data: { status: status as any, processedDate: new Date(), processedBy: req.user!.id, ...(transactionId && { transactionId }) },
    })
    return ok(res, p)
  } catch { return serverError(res) }
})

export default router
