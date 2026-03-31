import { Router } from 'express'
import { z } from 'zod'
import { authenticate, isOps } from '@/middleware/auth'
import { validate } from '@/middleware/validate'
import prisma from '@/lib/prisma'
import { ok, created, notFound, serverError, paginated } from '@/lib/response'
import { getPagination, paginatedMeta, buildMeta} from '@/lib/pagination'

const router = Router()

const schema = z.object({
  name: z.string().min(1), type: z.string(),
  daRange: z.string().optional(), status: z.string().default('Active'),
  pricePerLink: z.number(), priceX10: z.number().optional(),
  priceX50: z.number().optional(), priceX100: z.number().optional(),
  priceX1000: z.number().optional(), turnaroundDays: z.number().int().optional(),
  featured: z.boolean().default(false), notes: z.string().optional(),
})

// Public
router.get('/', async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req)
    const { type, featured } = req.query as Record<string, string>
    const where: any = { status: 'Active' }
    if (type)     where.type = type
    if (featured) where.featured = featured === 'true'
    const [data, total] = await Promise.all([
      prisma.backlinkPackage.findMany({ where, skip, take: limit, orderBy: { pricePerLink: 'asc' } }),
      prisma.backlinkPackage.count({ where }),
    ])
    return paginated(res, data, buildMeta(total, page, limit))
  } catch { return serverError(res) }
})

router.get('/:id', async (req, res) => {
  try {
    const pkg = await prisma.backlinkPackage.findUnique({ where: { id: req.params.id } })
    if (!pkg) return notFound(res, 'Package')
    return ok(res, pkg)
  } catch { return serverError(res) }
})

// Admin
router.post('/', authenticate, isOps, validate(schema), async (req, res) => {
  try {
    const pkg = await prisma.backlinkPackage.create({ data: req.body })
    return created(res, pkg)
  } catch { return serverError(res) }
})

router.put('/:id', authenticate, isOps, validate(schema.partial()), async (req, res) => {
  try {
    const pkg = await prisma.backlinkPackage.update({ where: { id: req.params.id }, data: req.body })
    return ok(res, pkg)
  } catch { return serverError(res) }
})

router.delete('/:id', authenticate, isOps, async (req, res) => {
  try {
    const pkg = await prisma.backlinkPackage.update({ where: { id: req.params.id }, data: { status: 'Inactive' } })
    return ok(res, pkg)
  } catch { return serverError(res) }
})

export default router
