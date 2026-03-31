import { WalletTxType, OrderStatus } from '@prisma/client'
import { Router } from 'express'
import { z } from 'zod'
import { authenticate, requirePortal, type AuthRequest } from '@/middleware/auth'
import { validate } from '@/middleware/validate'
import prisma from '@/lib/prisma'
import { ok, created, badRequest, notFound, serverError, paginated } from '@/lib/response'
import { getPagination, buildMeta} from '@/lib/pagination'
import { env } from '@/config/env'
import { addDays } from 'date-fns'

const router = Router()
router.use(authenticate, requirePortal)

// ── Me ──
router.get('/me', async (req: AuthRequest, res) => {
  try {
    const m = await prisma.portalMember.findUnique({
      where: { id: req.user!.id },
      select: { id: true, fullName: true, email: true, phone: true, whatsapp: true, country: true, status: true, referralCode: true, referredBy: true, walletBalance: true, totalDeposited: true, totalSpent: true, totalOrders: true, totalReferrals: true, totalCommissionEarned: true, emailVerified: true, registrationDate: true },
    })
    if (!m) return notFound(res)
    ok(res, m)
  } catch { serverError(res) }
})

router.put('/me', validate(z.object({ fullName: z.string().optional(), phone: z.string().optional(), whatsapp: z.string().optional(), country: z.string().optional() })), async (req: AuthRequest, res) => {
  try {
    ok(res, await prisma.portalMember.update({ where: { id: req.user!.id }, data: req.body, select: { id: true, fullName: true, email: true } }))
  } catch { serverError(res) }
})

// ── Wallet ──
router.get('/wallet', async (req: AuthRequest, res) => {
  try {
    const m = await prisma.portalMember.findUnique({ where: { id: req.user!.id }, select: { walletBalance: true, totalDeposited: true, totalSpent: true, totalCommissionEarned: true } })
    ok(res, m)
  } catch { serverError(res) }
})

router.post('/wallet/deposit', validate(z.object({ amountUsd: z.number().min(5), paymentMethod: z.string(), proofUrl: z.string().url().optional() })), async (req: AuthRequest, res) => {
  try {
    const tx = await prisma.walletTransaction.create({
      data: {
        memberId: req.user!.id, type: WalletTxType.DEPOSIT, amountUsd: req.body.amountUsd,
        balanceAfterUsd: 0, // Will be updated when admin confirms
        paymentMethod: req.body.paymentMethod, proofUrl: req.body.proofUrl, status: 'Pending',
      },
    })
    created(res, { ...tx, message: 'Deposit request submitted. Admin will confirm within 24h.' })
  } catch { serverError(res) }
})

router.get('/wallet/transactions', async (req: AuthRequest, res) => {
  try {
    const { page, limit, skip } = getPagination(req)
    const { type } = req.query as Record<string, string>
    const where: any = { memberId: req.user!.id }
    if (type) where.type = type
    const [data, total] = await Promise.all([
      prisma.walletTransaction.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      prisma.walletTransaction.count({ where }),
    ])
    paginated(res, data, buildMeta(total, page, limit))
  } catch { serverError(res) }
})

// ── Orders ──
router.get('/orders', async (req: AuthRequest, res) => {
  try {
    const { page, limit, skip } = getPagination(req)
    const [data, total] = await Promise.all([
      prisma.portalOrder.findMany({ where: { memberId: req.user!.id }, skip, take: limit, orderBy: { orderDate: 'desc' } }),
      prisma.portalOrder.count({ where: { memberId: req.user!.id } }),
    ])
    paginated(res, data, buildMeta(total, page, limit))
  } catch { serverError(res) }
})

router.post('/orders', validate(z.object({ service: z.string(), amountUsd: z.number().positive(), quantity: z.number().default(1), requirements: z.string().optional() })), async (req: AuthRequest, res) => {
  try {
    const member = await prisma.portalMember.findUnique({ where: { id: req.user!.id } })
    if (!member) return notFound(res)
    if (member.walletBalance < req.body.amountUsd) return badRequest(res, `Insufficient balance. You have $${member.walletBalance.toFixed(2)}`)

    // Deduct from wallet + create order in transaction
    const [order] = await prisma.$transaction([
      prisma.portalOrder.create({ data: { memberId: req.user!.id, ...req.body, paymentStatus: 'Paid from Wallet' } }),
      prisma.portalMember.update({ where: { id: req.user!.id }, data: { walletBalance: { decrement: req.body.amountUsd }, totalSpent: { increment: req.body.amountUsd }, totalOrders: { increment: 1 } } }),
      prisma.walletTransaction.create({ data: { memberId: req.user!.id, type: WalletTxType.ORDER_PAYMENT, amountUsd: -req.body.amountUsd, balanceAfterUsd: member.walletBalance - req.body.amountUsd, status: 'Confirmed', reference: `Order payment` } }),
    ])

    // Create commission for referrer
    const referral = await prisma.portalMember.findUnique({ where: { id: req.user!.id }, select: { referredById: true } })
    if (referral) {
      const commissionAmt = req.body.amountUsd * env.COMMISSION_RATE
      await prisma.commission.create({
        data: {
          earnerId: referral.referredById!, orderId: order.id,
          orderAmountUsd: req.body.amountUsd, commissionRate: env.COMMISSION_RATE,
          commissionAmountUsd: commissionAmt, status: 'PENDING_HOLD',
          holdReleaseDate: addDays(new Date(), env.COMMISSION_HOLD_DAYS),
        },
      })
    }

    created(res, order)
  } catch (e) { console.error(e); serverError(res) }
})

router.get('/orders/:id', async (req: AuthRequest, res) => {
  try {
    const order = await prisma.portalOrder.findFirst({ where: { id: req.params.id, memberId: req.user!.id } })
    if (!order) return notFound(res)
    ok(res, order)
  } catch { serverError(res) }
})

router.post('/orders/:id/revision', validate(z.object({ note: z.string().min(10) })), async (req: AuthRequest, res) => {
  try {
    const order = await prisma.portalOrder.findFirst({ where: { id: req.params.id, memberId: req.user!.id } })
    if (!order) return notFound(res)
    if (order.status !== OrderStatus.DELIVERED) return badRequest(res, 'Revision only available for delivered orders')
    ok(res, await prisma.portalOrder.update({ where: { id: req.params.id }, data: { status: OrderStatus.REVISION_REQUESTED, revisionNote: req.body.note, revisionCount: { increment: 1 } } }))
  } catch { serverError(res) }
})

// ── Referrals ──
router.get('/referrals', async (req: AuthRequest, res) => {
  try {
    const { page, limit, skip } = getPagination(req)
    const [data, total] = await Promise.all([
      prisma.portalMember.findMany({ where: { referredById: req.user!.id }, skip, take: limit, orderBy: { registrationDate: 'desc' }, select: { id: true, status: true, registrationDate: true, totalOrders: true, totalSpent: true } }),
      prisma.portalMember.count({ where: { referredById: req.user!.id } }),
    ])
    paginated(res, data, buildMeta(total, page, limit))
  } catch { serverError(res) }
})

router.get('/referrals/stats', async (req: AuthRequest, res) => {
  try {
    const member = await prisma.portalMember.findUnique({ where: { id: req.user!.id }, select: { referralCode: true, totalReferrals: true, totalCommissionEarned: true } })
    const pending = await prisma.commission.aggregate({ where: { earnerId: req.user!.id, status: 'PENDING_HOLD' }, _sum: { commissionAmountUsd: true } })
    const available = await prisma.commission.aggregate({ where: { earnerId: req.user!.id, status: 'AVAILABLE' }, _sum: { commissionAmountUsd: true } })
    ok(res, { ...member, pendingCommission: pending?._sum?.commissionAmountUsd || 0, availableCommission: available?._sum?.commissionAmountUsd || 0 })
  } catch { serverError(res) }
})

router.get('/referrals/leaderboard', async (_req, res) => {
  try {
    const top = await prisma.portalMember.findMany({
      where: { totalCommissionEarned: { gt: 0 } },
      orderBy: { totalCommissionEarned: 'desc' },
      take: 20,
      select: { id: true, totalCommissionEarned: true, totalReferrals: true },
    })
    ok(res, top.map((m, i) => ({ rank: i + 1, ...m })))
  } catch { serverError(res) }
})

// ── Commissions ──
router.get('/commissions', async (req: AuthRequest, res) => {
  try {
    const { page, limit, skip } = getPagination(req)
    const { status } = req.query as Record<string, string>
    const where: any = { earnerId: req.user!.id }
    if (status) where.status = status
    const [data, total] = await Promise.all([
      prisma.commission.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      prisma.commission.count({ where }),
    ])
    paginated(res, data, buildMeta(total, page, limit))
  } catch { serverError(res) }
})

router.get('/commissions/summary', async (req: AuthRequest, res) => {
  try {
    const [total, pending, available, paidOut] = await Promise.all([
      prisma.commission.aggregate({ where: { earnerId: req.user!.id }, _sum: { commissionAmountUsd: true } }),
      prisma.commission.aggregate({ where: { earnerId: req.user!.id, status: 'PENDING_HOLD' }, _sum: { commissionAmountUsd: true } }),
      prisma.commission.aggregate({ where: { earnerId: req.user!.id, status: 'AVAILABLE' }, _sum: { commissionAmountUsd: true } }),
      prisma.commission.aggregate({ where: { earnerId: req.user!.id, status: 'PAID_OUT' }, _sum: { commissionAmountUsd: true } }),
    ])
    ok(res, { totalEarned: total?._sum?.commissionAmountUsd || 0, pending: pending?._sum?.commissionAmountUsd || 0, available: available?._sum?.commissionAmountUsd || 0, paidOut: paidOut?._sum?.commissionAmountUsd || 0 })
  } catch { serverError(res) }
})

// ── Payout Requests ──
router.post('/commissions/payout-request', validate(z.object({ amountUsd: z.number().min(env.MIN_PAYOUT_USD), paymentMethod: z.enum(['Payoneer', 'USDT TRC20', 'Binance']), paymentDetails: z.string() })), async (req: AuthRequest, res) => {
  try {
    const available = await prisma.commission.aggregate({ where: { earnerId: req.user!.id, status: 'AVAILABLE' }, _sum: { commissionAmountUsd: true } })
    const bal = available?._sum?.commissionAmountUsd || 0
    if (bal < req.body.amountUsd) return badRequest(res, `Insufficient available balance: $${bal.toFixed(2)}`)
    const payout = await prisma.payoutRequest.create({ data: { memberId: req.user!.id, ...req.body } })
    created(res, payout)
  } catch { serverError(res) }
})

router.get('/commissions/payouts', async (req: AuthRequest, res) => {
  try {
    const payouts = await prisma.payoutRequest.findMany({ where: { memberId: req.user!.id }, orderBy: { requestedDate: 'desc' } })
    ok(res, payouts)
  } catch { serverError(res) }
})

export default router
