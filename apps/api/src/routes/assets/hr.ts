import { Router } from 'express'
import { z } from 'zod'
import { authenticate, managerAndAbove } from '@/middleware/auth'
import { validate } from '@/middleware/validate'
import prisma from '@/lib/prisma'
import { ok, created, notFound, serverError, paginated } from '@/lib/response'
import { getPagination, buildMeta} from '@/lib/pagination'

const router = Router()
router.use(authenticate, managerAndAbove)

router.get('/positions', async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req)
    const [data, total] = await Promise.all([prisma.jobPosition.findMany({ skip, take: limit, orderBy: { postedDate: 'desc' } }), prisma.jobPosition.count()])
    paginated(res, data, buildMeta(total, page, limit))
  } catch { serverError(res) }
})

router.post('/positions', validate(z.object({ title: z.string(), department: z.string().optional(), branch: z.string().optional(), openings: z.number().default(1) })), async (req, res) => {
  try { created(res, await prisma.jobPosition.create({ data: req.body })) } catch { serverError(res) }
})

router.get('/applications', async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req)
    const [data, total] = await Promise.all([prisma.jobApplication.findMany({ skip, take: limit, orderBy: { appliedDate: 'desc' }, include: { position: { select: { title: true } } } }), prisma.jobApplication.count()])
    paginated(res, data, buildMeta(total, page, limit))
  } catch { serverError(res) }
})

router.put('/applications/:id', async (req, res) => {
  try { ok(res, await prisma.jobApplication.update({ where: { id: req.params.id }, data: req.body })) } catch { serverError(res) }
})

export default router
