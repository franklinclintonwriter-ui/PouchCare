import { Router } from 'express'
import { z } from 'zod'
import { authenticate, requirePortal, isOps, type AuthRequest } from '@/middleware/auth'
import { validate } from '@/middleware/validate'
import prisma from '@/lib/prisma'
import { ok, created, badRequest, notFound, serverError, paginated } from '@/lib/response'
import { getPagination, paginatedMeta, buildMeta} from '@/lib/pagination'
import { env } from '@/config/env'
import { PaymentMethod, PayoutStatus } from '@prisma/client'

const router = Router()

// GET /portal/commissions — my ledger
router.get('/', authenticate, requirePortal, async (req: AuthRequest, res) => {
  try {
    const { page, limit, skip } = getPagination(req.query as Record<string, string>)
    const { status } = req.query as Record<string, string>
    const where: any = { earnerId: req.user!.id }
    if (status) where.status = status
    const [data, total] = await Promise.all([
      prisma.commission.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      prisma.commission.count({ where }),
    ])
    return paginated(res, data, buildMeta(total, page, limit))
  } catch { return serverError(res) }
})

// GET /portal/commissions/summary
router.get('/summary', authenticate, requirePortal, async (req: AuthRequest, res) => {
  try {
    const [total, pending, available, paidOut] = await Promise.all([
      prisma.commission.aggregate({ where: { earnerId: req.user!.id }, _sum: { commissionAmountUsd: true } }),
      prisma.commission.aggregate({ where: { earnerId: req.user!.id, status: 'PENDING_HOLD' }, _sum: { commissionAmountUsd: true } }),
      prisma.commission.aggregate({ where: { earnerId: req.user!.id, status: 'AVAILABLE' }, _sum: { commissionAmountUsd: true } }),
      prisma.commission.aggregate({ where: { earnerId: req.user!.id, status: 'PAID_OUT' }, _sum: { commissionAmountUsd: true } }),
    ])
    return ok(res, {
      total:    total._sum.commissionAmountUsd    || 0,
      pending:  pending._sum.commissionAmountUsd  || 0,
      available:available._sum.commissionAmountUsd|| 0,
      paidOut:  paidOut._sum.commissionAmountUsd  || 0,
    })
  } catch { return serverError(res) }
})

// GET /portal/commissions/payouts — payout history
router.get('/payouts', authenticate, requirePortal, async (req: AuthRequest, res) => {
  try {
    const { page, limit, skip } = getPagination(req.query as Record<string, string>)
    const [data, total] = await Promise.all([
      prisma.payoutRequest.findMany({ where: { memberId: req.user!.id }, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      prisma.payoutRequest.count({ where: { memberId: req.user!.id } }),
    ])
    return paginated(res, data, buildMeta(total, page, limit))
  } catch { return serverError(res) }
})

// POST /portal/commissions/payout-request
router.post('/payout-request', authenticate, requirePortal, validate(z.object({
  amountUsd:      z.number().min(env.MIN_PAYOUT_USD),
  paymentMethod:  z.nativeEnum(PaymentMethod),
  paymentDetails: z.string().min(5),
})), async (req: AuthRequest, res) => {
  try {
    const member = await prisma.portalMember.findUnique({ where: { id: req.user!.id }, select: { fullName:true, email:true } })
    if (!member) return notFound(res, 'Member')

    // Check available balance
    const available = await prisma.commission.aggregate({
      where: { earnerId: req.user!.id, status: 'AVAILABLE' }, _sum: { commissionAmountUsd: true },
    })
    if ((available._sum.commissionAmountUsd || 0) < req.body.amountUsd) {
      return badRequest(res, `Insufficient available commission. Available: $${available._sum.commissionAmountUsd || 0}`)
    }

    const payout = await prisma.payoutRequest.create({
      data: { memberId: req.user!.id, memberEmail: member.email, ...req.body },
    })
    return created(res, payout)
  } catch { return serverError(res) }
})

// Admin: process payout
router.put('/:id/process', authenticate, isOps, async (req: AuthRequest, res) => {
  try {
    const payoutStatus = req.body.status === 'REJECTED' ? PayoutStatus.REJECTED : PayoutStatus.COMPLETED
    const payout = await prisma.payoutRequest.update({
      where: { id: req.params.id },
      data: { status: payoutStatus, processedDate: new Date(), processedBy: req.user!.id, transactionId: req.body.transactionId },
    })
    if (payout.status === PayoutStatus.COMPLETED) {
      await prisma.commission.updateMany({ where: { earnerId: payout.memberId, status: 'AVAILABLE' }, data: { status: 'PAID_OUT', payoutDate: new Date() } })
    }
    return ok(res, payout)
  } catch { return serverError(res) }
})

export default router
