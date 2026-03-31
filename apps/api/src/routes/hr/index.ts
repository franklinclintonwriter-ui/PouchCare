import { Router } from 'express'
import prisma from '@/lib/prisma'
import { authenticate, requireRoles, CEO_ROLES  } from '@/middleware/auth'
import { getPagination, buildMeta } from '@/utils/pagination'
import { ok, created, notFound, serverError } from '@/utils/response'

const router = Router()
router.use(authenticate)
const HR_ROLES = [...CEO_ROLES, 'Operation Manager', 'HR Manager']

// ── JOB POSITIONS ──
router.get('/positions', requireRoles(...HR_ROLES as any), async (req, res) => {
  try {
    const positions = await prisma.jobPosition.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { jobApplications: true } } },
    })
    return ok(res, positions)
  } catch (err) { serverError(res, err) }
})

router.post('/positions', requireRoles(...HR_ROLES as any), async (req, res) => {
  try {
    const pos = await prisma.jobPosition.create({ data: req.body })
    return created(res, pos)
  } catch (err) { serverError(res, err) }
})

router.put('/positions/:id', requireRoles(...HR_ROLES as any), async (req, res) => {
  try {
    const pos = await prisma.jobPosition.update({ where: { id: req.params.id }, data: req.body })
    return ok(res, pos)
  } catch (err) { serverError(res, err) }
})

// ── JOB APPLICATIONS ──
router.get('/applications', requireRoles(...HR_ROLES as any), async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req)
    const { status, positionId } = req.query as Record<string, string>
    const where: any = {}
    if (status)     where.status = status
    if (positionId) where.positionId = positionId
    const [apps, total] = await Promise.all([
      prisma.jobApplication.findMany({
        where, skip, take: limit,
        orderBy: { appliedDate: 'desc' },
        include: { position: { select: { title: true } } },
      }),
      prisma.jobApplication.count({ where }),
    ])
    return ok(res, apps, buildMeta(page, limit, total))
  } catch (err) { serverError(res, err) }
})

router.post('/applications', async (req, res) => {
  try {
    const app = await prisma.jobApplication.create({ data: req.body })
    return created(res, app)
  } catch (err) { serverError(res, err) }
})

router.put('/applications/:id', requireRoles(...HR_ROLES as any), async (req, res) => {
  try {
    const app = await prisma.jobApplication.update({ where: { id: req.params.id }, data: req.body })
    return ok(res, app)
  } catch (err) { serverError(res, err) }
})

// ── PERFORMANCE RATINGS ──
router.get('/performance', requireRoles(...HR_ROLES as any), async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req)
    const [ratings, total] = await Promise.all([
      prisma.performanceRating.findMany({ skip, take: limit, orderBy: { createdAt: 'desc' } }),
      prisma.performanceRating.count(),
    ])
    return ok(res, ratings, buildMeta(page, limit, total))
  } catch (err) { serverError(res, err) }
})

router.post('/performance', requireRoles(...HR_ROLES as any), async (req, res) => {
  try {
    const rating = await prisma.performanceRating.create({ data: { ...req.body, ratedBy: req.user!.id } })
    return created(res, rating)
  } catch (err) { serverError(res, err) }
})

export default router
