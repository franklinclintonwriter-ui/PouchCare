import { Router } from 'express'
import { z } from 'zod'
import { authenticate, requirePortal, isOps, type AuthRequest } from '@/middleware/auth'
import { validate } from '@/middleware/validate'
import prisma from '@/lib/prisma'
import { ok, created, badRequest, notFound, serverError, paginated } from '@/lib/response'
import { getPagination, paginatedMeta, buildMeta} from '@/lib/pagination'
import { WalletTxType } from '@prisma/client'

const router = Router()

// GET /portal/wallet — balance + summary
router.get('/', authenticate, requirePortal, async (req: AuthRequest, res) => {
  try {
    const member = await prisma.portalMember.findUnique({
      where: { id: req.user!.id },
      select: { walletBalance:true, totalDeposited:true, totalSpent:true, totalCommissionEarned:true },
    })
    if (!member) return notFound(res, 'Member')
    return ok(res, member)
  } catch { return serverError(res) }
})

// GET /portal/wallet/transactions
router.get('/transactions', authenticate, requirePortal, async (req: AuthRequest, res) => {
  try {
    const { page, limit, skip } = getPagination(req)
    const { type } = req.query as Record<string, string>
    const where: any = { memberId: req.user!.id }
    if (type) where.type = type as WalletTxType
    const [data, total] = await Promise.all([
      prisma.walletTransaction.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      prisma.walletTransaction.count({ where }),
    ])
    return paginated(res, data, buildMeta(limit, total, page))
  } catch { return serverError(res) }
})

// POST /portal/wallet/deposit — submit deposit proof
router.post('/deposit', authenticate, requirePortal, validate(z.object({
  amountUsd: z.number().positive(),
  paymentMethod: z.enum(['Payoneer', 'USDT TRC20', 'Binance']),
  proofUrl: z.string().url().optional(),
})), async (req: AuthRequest, res) => {
  try {
    const member = await prisma.portalMember.findUnique({ where: { id: req.user!.id }, select: { walletBalance: true } })
    if (!member) return notFound(res, 'Member')

    const tx = await prisma.walletTransaction.create({
      data: {
        memberId: req.user!.id, type: 'DEPOSIT',
        amountUsd: req.body.amountUsd,
        balanceAfterUsd: member.walletBalance, // will update after admin approves
        paymentMethod: req.body.paymentMethod,
        proofUrl: req.body.proofUrl,
        status: 'Pending',
      },
    })
    return created(res, { ...tx, message: 'Deposit submitted — pending admin approval' })
  } catch { return serverError(res) }
})

// PUT /portal/wallet/deposit/:id/approve — admin approves deposit
router.put('/deposit/:id/approve', authenticate, isOps, async (req: AuthRequest, res) => {
  try {
    const tx = await prisma.walletTransaction.findUnique({ where: { id: req.params.id } })
    if (!tx || tx.type !== 'DEPOSIT') return notFound(res, 'Transaction')
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

export default router
