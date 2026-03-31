import { Router } from 'express'
import prisma from '@/lib/prisma'
import { authenticate, requireStaff, requireRoles, CEO_ROLES  } from '@/middleware/auth'
import { getPagination, buildMeta } from '@/utils/pagination'
import { ok, created, notFound, serverError } from '@/utils/response'

const router = Router()
router.use(authenticate)
const CEO_OP = [...CEO_ROLES, 'Operation Manager']

// ── DOMAINS ──
router.get('/domains', requireStaff, async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req)
    const { status } = req.query as Record<string, string>
    const where: any = {}
    if (status) where.status = status
    const [domains, total] = await Promise.all([
      prisma.domain.findMany({ where, skip, take: limit, orderBy: { expiryDate: 'asc' } }),
      prisma.domain.count({ where }),
    ])
    return ok(res, domains, buildMeta(page, limit, total))
  } catch (err) { serverError(res, err) }
})

router.post('/domains', requireRoles(...CEO_OP as any), async (req, res) => {
  try {
    const domain = await prisma.domain.create({
      data: {
        ...req.body,
        expiryDate:      req.body.expiryDate      ? new Date(req.body.expiryDate)      : undefined,
        registrationDate: req.body.registrationDate ? new Date(req.body.registrationDate) : undefined,
      },
    })
    return created(res, domain)
  } catch (err) { serverError(res, err) }
})

router.put('/domains/:id', requireRoles(...CEO_OP as any), async (req, res) => {
  try {
    const domain = await prisma.domain.update({ where: { id: req.params.id }, data: req.body })
    return ok(res, domain)
  } catch (err) { serverError(res, err) }
})

// ── SERVERS ──
router.get('/servers', requireStaff, async (req, res) => {
  try {
    const servers = await prisma.server.findMany({ orderBy: { name: 'asc' } })
    return ok(res, servers)
  } catch (err) { serverError(res, err) }
})

router.post('/servers', requireRoles(...CEO_OP as any), async (req, res) => {
  try {
    const server = await prisma.server.create({ data: req.body })
    return created(res, server)
  } catch (err) { serverError(res, err) }
})

// ── WEBSITES ──
router.get('/websites', requireStaff, async (req, res) => {
  try {
    const websites = await prisma.website.findMany({ orderBy: { name: 'asc' } })
    return ok(res, websites)
  } catch (err) { serverError(res, err) }
})

router.post('/websites', requireRoles(...CEO_OP as any), async (req, res) => {
  try {
    const website = await prisma.website.create({ data: req.body })
    return created(res, website)
  } catch (err) { serverError(res, err) }
})

export default router
