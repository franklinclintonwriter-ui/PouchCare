import { Router } from 'express'
import prisma from '@/lib/prisma'
import { authenticate, requirePortal, requireRoles, CEO_ROLES  } from '@/middleware/auth'
import { getPagination, buildMeta } from '@/utils/pagination'
import { ok, notFound, serverError } from '@/utils/response'

const router = Router()
router.use(authenticate)
const CEO_OP = [...CEO_ROLES, 'Operation Manager']

// GET /v1/portal/me
router.get('/me', requirePortal, async (req, res) => {
  try {
    const member = await prisma.portalMember.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true, fullName: true, email: true, phone: true,
        country: true, status: true, referralCode: true,
        walletBalance: true, totalDeposited: true, totalSpent: true,
        totalOrders: true, totalReferrals: true, totalCommissionEarned: true,
        emailVerified: true, registrationDate: true, lastLoginDate: true,
      },
    })
    if (!member) return notFound(res)
    return ok(res, member)
  } catch (err) { serverError(res, err) }
})

// PUT /v1/portal/me
router.put('/me', requirePortal, async (req, res) => {
  try {
    const allowed = ['fullName', 'phone', 'whatsapp', 'country']
    const data: Record<string, any> = {}
    allowed.forEach(k => { if (req.body[k] !== undefined) data[k] = req.body[k] })
    const member = await prisma.portalMember.update({
      where: { id: req.user!.id }, data,
      select: { id: true, fullName: true, email: true, phone: true, country: true },
    })
    return ok(res, member)
  } catch (err) { serverError(res, err) }
})

// Admin routes
// GET /v1/admin/portal/members
router.get('/admin/members', requireRoles(...CEO_OP as any), async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req)
    const { q, status } = req.query as Record<string, string>
    const where: any = {}
    if (status) where.status = status
    if (q) where.OR = [
      { fullName: { contains: q, mode: 'insensitive' } },
      { email:    { contains: q, mode: 'insensitive' } },
    ]
    const [members, total] = await Promise.all([
      prisma.portalMember.findMany({
        where, skip, take: limit,
        orderBy: { registrationDate: 'desc' },
        select: {
          id: true, fullName: true, email: true, country: true,
          status: true, referralCode: true, walletBalance: true,
          totalOrders: true, totalSpent: true, totalCommissionEarned: true,
          registrationDate: true, emailVerified: true,
        },
      }),
      prisma.portalMember.count({ where }),
    ])
    return ok(res, members, buildMeta(page, limit, total))
  } catch (err) { serverError(res, err) }
})

// GET /v1/admin/portal/members/:id
router.get('/admin/members/:id', requireRoles(...CEO_OP as any), async (req, res) => {
  try {
    const member = await prisma.portalMember.findUnique({
      where: { id: req.params.id },
      include: {
        orders:    { take: 10, orderBy: { orderDate: 'desc' } },
        walletTx:  { take: 10, orderBy: { createdAt: 'desc' } },
        commissionsEarned: { take: 10, orderBy: { createdAt: 'desc' } },
      },
    })
    if (!member) return notFound(res)
    return ok(res, member)
  } catch (err) { serverError(res, err) }
})

// PUT /v1/admin/portal/members/:id/status
router.put('/admin/members/:id/status', requireRoles(...CEO_OP as any), async (req, res) => {
  try {
    const member = await prisma.portalMember.update({
      where: { id: req.params.id },
      data: { status: req.body.status },
      select: { id: true, status: true },
    })
    return ok(res, member)
  } catch (err) { serverError(res, err) }
})

export default router
