import { Router } from 'express'
import prisma from '@/lib/prisma'
import { authenticate, requireRoles, CEO_ROLES  } from '@/middleware/auth'
import { ok, created, serverError } from '@/utils/response'

const router = Router()
const CEO_OP = [...CEO_ROLES, 'Operation Manager']

// Public endpoints
router.get('/', async (req, res) => {
  try {
    const { category } = req.query as Record<string, string>
    const where: any = { status: 'Active' }
    if (category) where.category = category
    const services = await prisma.service.findMany({ where, orderBy: [{ featured: 'desc' }, { displayOrder: 'asc' }] })
    return ok(res, services)
  } catch (err) { serverError(res, err) }
})

router.get('/categories', async (_req, res) => {
  try {
    const cats = await prisma.service.groupBy({ by: ['category'], where: { status: 'Active' } })
    return ok(res, cats.map(c => c.category).filter(Boolean))
  } catch (err) { serverError(res, err) }
})

router.get('/backlink-packages', async (req, res) => {
  try {
    const { type } = req.query as Record<string, string>
    const where: any = { status: 'Active' }
    if (type) where.type = type
    const pkgs = await prisma.backlinkPackage.findMany({ where, orderBy: [{ featured: 'desc' }, { pricePerLink: 'asc' }] })
    return ok(res, pkgs)
  } catch (err) { serverError(res, err) }
})

router.get('/:slug', async (req, res) => {
  try {
    const service = await prisma.service.findUnique({ where: { slug: req.params.slug } })
    return ok(res, service)
  } catch (err) { serverError(res, err) }
})

// Admin routes
router.post('/admin', requireRoles(...CEO_OP as any), async (req, res) => {
  try {
    const svc = await prisma.service.create({ data: req.body })
    return created(res, svc)
  } catch (err) { serverError(res, err) }
})

router.put('/admin/:id', requireRoles(...CEO_OP as any), async (req, res) => {
  try {
    const svc = await prisma.service.update({ where: { id: req.params.id }, data: req.body })
    return ok(res, svc)
  } catch (err) { serverError(res, err) }
})

router.post('/admin/backlink-packages', requireRoles(...CEO_OP as any), async (req, res) => {
  try {
    const pkg = await prisma.backlinkPackage.create({ data: req.body })
    return created(res, pkg)
  } catch (err) { serverError(res, err) }
})

router.put('/admin/backlink-packages/:id', requireRoles(...CEO_OP as any), async (req, res) => {
  try {
    const pkg = await prisma.backlinkPackage.update({ where: { id: req.params.id }, data: req.body })
    return ok(res, pkg)
  } catch (err) { serverError(res, err) }
})

export default router
