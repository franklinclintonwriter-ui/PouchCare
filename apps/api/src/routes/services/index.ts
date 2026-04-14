import { Router } from 'express'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { authenticate, requireRoles, SENIOR_ROLES } from '@/middleware/auth'
import { validate } from '@/middleware/validate'
import { ok, created, notFound, serverError } from '@/utils/response'

const createServiceSchema = z.object({
  name: z.string().min(1).max(200),
  category: z.string().optional(),
  status: z.enum(['Active', 'Inactive']).optional(),
  basePriceUsd: z.number().positive().optional(),
  priceBdt: z.number().positive().optional(),
  turnaroundDays: z.number().int().positive().optional(),
  shortDescription: z.string().max(500).optional(),
  fullDescription: z.string().optional(),
  slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/),
  icon: z.string().optional(),
  featured: z.boolean().optional(),
  displayOrder: z.number().int().optional(),
  metaTitle: z.string().max(200).optional(),
  metaDescription: z.string().max(500).optional(),
})
const updateServiceSchema = createServiceSchema.partial()

const createBacklinkPackageSchema = z.object({
  name: z.string().min(1).max(200),
  type: z.string().optional(),
  daRange: z.string().optional(),
  status: z.enum(['Active', 'Inactive']).optional(),
  pricePerLink: z.number().positive(),
  priceX10: z.number().positive().optional(),
  priceX50: z.number().positive().optional(),
  priceX100: z.number().positive().optional(),
  priceX1000: z.number().positive().optional(),
  turnaroundDays: z.number().int().positive().optional(),
  featured: z.boolean().optional(),
  notes: z.string().optional(),
})
const updateBacklinkPackageSchema = createBacklinkPackageSchema.partial()

const router = Router()

// Public endpoints
router.get('/', async (req, res) => {
  try {
    const { category } = req.query as Record<string, string>
    const where: any = { status: 'Active' }
    if (category) where.category = category
    const services = await prisma.service.findMany({ where, orderBy: [{ featured: 'desc' }, { displayOrder: 'asc' }] })
    return ok(res, services)
  } catch (err) { return serverError(res, err) }
})

router.get('/categories', async (_req, res) => {
  try {
    const cats = await prisma.service.groupBy({ by: ['category'], where: { status: 'Active' } })
    return ok(res, cats.map(c => c.category).filter(Boolean))
  } catch (err) { return serverError(res, err) }
})

router.get('/backlink-packages', async (req, res) => {
  try {
    const { type } = req.query as Record<string, string>
    const where: any = { status: 'Active' }
    if (type) where.type = type
    const pkgs = await prisma.backlinkPackage.findMany({ where, orderBy: [{ featured: 'desc' }, { pricePerLink: 'asc' }] })
    return ok(res, pkgs)
  } catch (err) { return serverError(res, err) }
})

router.get('/:slug', async (req, res) => {
  try {
    const service = await prisma.service.findUnique({ where: { slug: req.params.slug } })
    return ok(res, service)
  } catch (err) { return serverError(res, err) }
})

// Admin routes (require authentication)
router.post('/admin', authenticate, requireRoles(...SENIOR_ROLES as any), validate(createServiceSchema), async (req, res) => {
  try {
    const svc = await prisma.service.create({ data: req.body })
    return created(res, svc)
  } catch (err) { return serverError(res, err) }
})

router.put('/admin/:id', authenticate, requireRoles(...SENIOR_ROLES as any), validate(updateServiceSchema), async (req, res) => {
  try {
    const svc = await prisma.service.update({ where: { id: req.params.id }, data: req.body })
    return ok(res, svc)
  } catch (err) { return serverError(res, err) }
})

router.delete('/admin/:id', authenticate, requireRoles(...SENIOR_ROLES as any), async (req, res) => {
  try {
    const svc = await prisma.service.findUnique({ where: { id: req.params.id } })
    if (!svc) return notFound(res)
    await prisma.service.delete({ where: { id: req.params.id } })
    return ok(res, { message: 'Service deleted' })
  } catch (err) { return serverError(res, err) }
})

router.post('/admin/backlink-packages', authenticate, requireRoles(...SENIOR_ROLES as any), validate(createBacklinkPackageSchema), async (req, res) => {
  try {
    const pkg = await prisma.backlinkPackage.create({ data: req.body })
    return created(res, pkg)
  } catch (err) { return serverError(res, err) }
})

router.put('/admin/backlink-packages/:id', authenticate, requireRoles(...SENIOR_ROLES as any), validate(updateBacklinkPackageSchema), async (req, res) => {
  try {
    const pkg = await prisma.backlinkPackage.update({ where: { id: req.params.id }, data: req.body })
    return ok(res, pkg)
  } catch (err) { return serverError(res, err) }
})

router.delete('/admin/backlink-packages/:id', authenticate, requireRoles(...SENIOR_ROLES as any), async (req, res) => {
  try {
    const pkg = await prisma.backlinkPackage.findUnique({ where: { id: req.params.id } })
    if (!pkg) return notFound(res)
    await prisma.backlinkPackage.delete({ where: { id: req.params.id } })
    return ok(res, { message: 'Package deleted' })
  } catch (err) { return serverError(res, err) }
})

export default router
