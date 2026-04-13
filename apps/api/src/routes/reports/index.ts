import { Router } from 'express'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { authenticate, requireStaff, requireRoles, MANAGER_ROLES, type AuthRequest } from '@/middleware/auth'
import type { Prisma, SystemRole } from '@prisma/client'
import { canManagerAccessStaffMember, mergeDailyReportWhereForManager } from '@/lib/teamBranchScope'
import { validate } from '@/middleware/validate'
import { getPagination, paginatedMeta, buildMeta} from '@/utils/pagination'
import { ok, created, badRequest, notFound, serverError, forbidden } from '@/utils/response'

const router = Router()
router.use(authenticate)
const submitSchema = z.object({
  tasksCompleted:  z.string().min(1),
  plannedTomorrow: z.string().min(1),
  blockers:        z.string().optional(),
  hoursWorked:     z.number().min(0.5).max(24),
  overtimeHours:   z.number().optional().default(0),
  mood:            z.string().optional(),
  relatedClient:   z.string().optional(),
})

// GET /v1/reports/daily
router.get('/daily', requireStaff, async (req: AuthRequest, res) => {
  try {
    const { page, limit, skip } = getPagination(req)
    const role = req.user!.role as SystemRole
    let where: Prisma.DailyReportWhereInput = {}
    if (!MANAGER_ROLES.includes(role)) {
      where.staffMemberId = req.user!.id
    } else {
      where = await mergeDailyReportWhereForManager(req, {})
    }
    const [reports, total] = await Promise.all([
      prisma.dailyReport.findMany({ where, skip, take: limit, orderBy: { reportDate: 'desc' } }),
      prisma.dailyReport.count({ where }),
    ])
    return ok(res, reports, buildMeta(total, page, limit))
  } catch (err) { serverError(res, err) }
})

// POST /v1/reports/daily
router.post('/daily', requireStaff, validate(submitSchema), async (req, res) => {
  try {
    const today = new Date(); today.setHours(0,0,0,0)
    const existing = await prisma.dailyReport.findFirst({
      where: { staffMemberId: req.user!.id, reportDate: today },
    })
    if (existing) return badRequest(res, 'Report already submitted for today')

    const staff = await prisma.staffMember.findUnique({
      where: { id: req.user!.id }, select: { name: true, branch: true, systemRole: true },
    })

    const report = await prisma.dailyReport.create({
      data: {
        staffMemberId: req.user!.id,
        submitterName:   staff?.name || '',
        submitterRole:   staff?.systemRole,
        branch:          staff?.branch,
        reportDate:      today,
        tasksCompleted:  req.body.tasksCompleted,
        plannedTomorrow: req.body.plannedTomorrow,
        blockers:        req.body.blockers,
        hoursWorked:     req.body.hoursWorked,
        overtimeHours:   req.body.overtimeHours,
        mood:            req.body.mood,
        relatedClient:   req.body.relatedClient,
        loginIp:         req.ip,
      },
    })
    return created(res, report)
  } catch (err) { serverError(res, err) }
})

// GET /v1/reports/daily/:id
router.get('/daily/:id', requireStaff, async (req: AuthRequest, res) => {
  try {
    const report = await prisma.dailyReport.findUnique({ where: { id: req.params.id } })
    if (!report) return notFound(res)
    const role = req.user!.role as SystemRole
    if (!MANAGER_ROLES.includes(role) && report.staffMemberId !== req.user!.id)
      return notFound(res)
    if (MANAGER_ROLES.includes(role)) {
      const okScope = await canManagerAccessStaffMember(req.user!.id, role, report.staffMemberId)
      if (!okScope) return notFound(res)
    }
    return ok(res, report)
  } catch (err) { serverError(res, err) }
})

// DELETE /v1/reports/daily/:id
router.delete('/daily/:id', requireRoles(...MANAGER_ROLES as any), async (req: AuthRequest, res) => {
  try {
    const row = await prisma.dailyReport.findUnique({
      where: { id: req.params.id },
      select: { id: true, staffMemberId: true },
    })
    if (!row) return notFound(res)
    const role = req.user!.role as SystemRole
    const okScope = await canManagerAccessStaffMember(req.user!.id, role, row.staffMemberId)
    if (!okScope) return forbidden(res, 'Cannot delete this report')
    await prisma.dailyReport.delete({ where: { id: req.params.id } })
    return ok(res, { message: 'Report deleted' })
  } catch (err) { serverError(res, err) }
})

// PUT /v1/reports/daily/:id/review
router.put('/daily/:id/review', requireRoles(...MANAGER_ROLES as any), async (req: AuthRequest, res) => {
  try {
    const row = await prisma.dailyReport.findUnique({
      where: { id: req.params.id },
      select: { id: true, staffMemberId: true },
    })
    if (!row) return notFound(res)
    const role = req.user!.role as SystemRole
    const okScope = await canManagerAccessStaffMember(req.user!.id, role, row.staffMemberId)
    if (!okScope) return forbidden(res, 'Cannot review this report')
    const updated = await prisma.dailyReport.update({
      where: { id: req.params.id },
      data: { managerReviewNote: req.body.note, status: 'Reviewed' },
    })
    return ok(res, updated)
  } catch (err) { serverError(res, err) }
})

export default router
