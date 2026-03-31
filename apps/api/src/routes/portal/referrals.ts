import { Router } from 'express'
import prisma from '@/lib/prisma'
import { authenticate, requirePortal } from '@/middleware/auth'
import { ok, serverError } from '@/lib/response'
import { getPaginationParams, buildMeta } from '@/lib/pagination'

const router = Router()
// GET /portal/referrals/leaderboard — public
router.get('/leaderboard', async (req, res) => {
  try {
    const top = await prisma.portalMember.findMany({
      where: { totalCommissionEarned: { gt: 0 } },
      orderBy: { totalCommissionEarned: 'desc' },
      take: 20,
      select: { id: true, country: true, totalReferrals: true, totalCommissionEarned: true },
    })
    return ok(res, top.map((m, i) => ({ rank: i + 1, name: `Referrer #${i + 1}`, country: m.country || '—', referrals: m.totalReferrals, earned: m.totalCommissionEarned })))
  } catch { return serverError(res) }
})

router.use(authenticate, requirePortal)

// GET /portal/referrals — my referrals
router.get('/', async (req, res) => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query as any)
    const [items, total] = await Promise.all([
      prisma.portalMember.findMany({
        where: { referredById: req.user!.id },
        select: { id: true, fullName: true, email: true, country: true, totalOrders: true, status: true, registrationDate: true },
        orderBy: { registrationDate: 'desc' },
        skip, take: limit,
      }),
      prisma.portalMember.count({ where: { referredById: req.user!.id } }),
    ])
    return ok(res, items.map(m => ({
      id: m.id, referredName: m.fullName, referredEmail: m.email, country: m.country,
      totalOrders: m.totalOrders, status: m.status, registrationDate: m.registrationDate,
    })), buildMeta(total, page, limit))
  } catch { return serverError(res) }
})

// GET /portal/referrals/stats
router.get('/stats', async (req, res) => {
  try {
    const me = await prisma.portalMember.findUnique({ where: { id: req.user!.id }, select: { referralCode: true, totalReferrals: true, totalCommissionEarned: true } })
    return ok(res, { referralCode: me?.referralCode, totalReferrals: me?.totalReferrals || 0, totalCommissionEarned: me?.totalCommissionEarned || 0 })
  } catch { return serverError(res) }
})



// GET /portal/referrals/fraud — admin only
router.get('/fraud', async (req, res) => {
  try {
    const flagged = await prisma.commission.findMany({ where: { fraudFlag: true }, take: 50, orderBy: { createdAt: 'desc' } })
    return ok(res, flagged)
  } catch { return serverError(res) }
})

export default router
