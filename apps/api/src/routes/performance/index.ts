import { Router } from 'express'
import { z } from 'zod'
import { authenticate, isManager, isCEO, type AuthRequest } from '@/middleware/auth'
import { validate } from '@/middleware/validate'
import prisma from '@/lib/prisma'
import { ok, created, notFound, serverError, paginated } from '@/lib/response'
import { getPagination, paginatedMeta, buildMeta} from '@/lib/pagination'
import { SystemRole } from '@prisma/client'

const router = Router()
router.use(authenticate)

const rateSchema = z.object({
  memberId:     z.string(),
  reviewPeriod: z.string(),
  reviewQuarter:z.string().optional(),
  reviewYear:   z.number().int(),
  overallRating:z.number().min(1).max(10),
  taskQuality:  z.number().min(1).max(10).optional(),
  communication:z.number().min(1).max(10).optional(),
  punctuality:  z.number().min(1).max(10).optional(),
  teamwork:     z.number().min(1).max(10).optional(),
  notes:        z.string().optional(),
})

// GET /performance — own or all
router.get('/', async (req: AuthRequest, res) => {
  try {
    const { page, limit, skip } = getPagination(req)
    const where: any = {}
    if (['STAFF', 'INTERN'].includes(req.user!.role)) where.staffMemberId = req.user!.id
    else if (req.query.memberId) where.staffMemberId = String(req.query.memberId ?? "")

    const [data, total] = await Promise.all([
      prisma.performanceRating.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      prisma.performanceRating.count({ where }),
    ])
    return paginated(res, data, buildMeta(limit, total, page))
  } catch { return serverError(res) }
})

// POST /performance — CEO/manager rates
router.post('/', isManager, validate(rateSchema), async (req: AuthRequest, res) => {
  try {
    const member = await prisma.staffMember.findUnique({ where: { id: req.body.memberId } })
    if (!member) return notFound(res, 'Member')

    const rating = await prisma.performanceRating.create({
      data: { staffMemberId: req.body.memberId, reviewPeriod: req.body.reviewPeriod, reviewQuarter: req.body.reviewQuarter, reviewYear: req.body.reviewYear, overallRating: req.body.overallRating, taskQuality: req.body.taskQuality, communication: req.body.communication, punctuality: req.body.punctuality, teamwork: req.body.teamwork, notes: req.body.notes, staffName: member.name, systemRole: member.systemRole, branch: member.branch || '', ratedBy: req.user!.role },
    })

    // Update member's average rating
    const all = await prisma.performanceRating.findMany({ where: { staffMemberId: req.body.memberId }, select: { overallRating: true } })
    const avg = all.reduce((s, r) => s + r.overallRating, 0) / all.length
    await prisma.staffMember.update({
      where: { id: req.body.memberId },
      data: { ceoPerformanceRating: parseFloat(avg.toFixed(2)), ceoLastRatedDate: new Date(), totalTasksRated: all.length },
    })

    return created(res, rating)
  } catch (e) { console.error(e); return serverError(res) }
})

export default router
