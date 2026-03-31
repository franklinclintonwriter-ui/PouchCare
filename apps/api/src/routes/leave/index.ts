import { Router } from 'express'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { authenticate, requireStaff, requireRoles, MANAGER_ROLES  } from '@/middleware/auth'
import { validate } from '@/middleware/validate'
import { getPagination, paginatedMeta, buildMeta} from '@/utils/pagination'
import { ok, created, badRequest, notFound, forbidden, serverError } from '@/utils/response'

const router = Router()
router.use(authenticate)
router.use(authenticate)

const applySchema = z.object({
  leaveType:  z.string(),
  startDate:  z.string(),
  endDate:    z.string(),
  reason:     z.string().optional(),
})

// GET /v1/leave
router.get('/', requireStaff, async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req)
    const where: any = {}
    if (!MANAGER_ROLES.includes(req.user!.role)) where.staffMemberId = req.user!.id

    const [requests, total] = await Promise.all([
      prisma.leaveRequest.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      prisma.leaveRequest.count({ where }),
    ])
    return ok(res, requests, buildMeta(total, page, limit))
  } catch (err) { serverError(res, err) }
})

// POST /v1/leave/apply
router.post('/apply', requireStaff, validate(applySchema), async (req, res) => {
  try {
    const { leaveType, startDate, endDate, reason } = req.body
    const staff = await prisma.staffMember.findUnique({
      where: { id: req.user!.id }, select: { name: true, branch: true, systemRole: true },
    })

    const start = new Date(startDate)
    const end   = new Date(endDate)
    const totalDays = Math.ceil((end.getTime() - start.getTime()) / 86400000) + 1

    const request = await prisma.leaveRequest.create({
      data: {
        staffMemberId: req.user!.id,
        staffName:     staff?.name || '',
        staffSystemRole: staff?.systemRole,
        branch:        staff?.branch,
        leaveType:     leaveType as any,
        startDate:     start,
        endDate:       end,
        totalDays,
        reason,
      },
    })
    return created(res, request)
  } catch (err) { serverError(res, err) }
})

// PUT /v1/leave/:id/approve
router.put('/:id/approve', requireRoles(...MANAGER_ROLES as any), async (req, res) => {
  try {
    const updated = await prisma.leaveRequest.update({
      where: { id: req.params.id },
      data: { status: 'APPROVED', approvedBy: req.user!.id },
    })
    return ok(res, updated)
  } catch (err) { serverError(res, err) }
})

// PUT /v1/leave/:id/reject
router.put('/:id/reject', requireRoles(...MANAGER_ROLES as any), async (req, res) => {
  try {
    const updated = await prisma.leaveRequest.update({
      where: { id: req.params.id },
      data: { status: 'REJECTED', notes: req.body.note },
    })
    return ok(res, updated)
  } catch (err) { serverError(res, err) }
})

// PUT /v1/leave/:id/cancel
router.put('/:id/cancel', requireStaff, async (req, res) => {
  try {
    const request = await prisma.leaveRequest.findUnique({ where: { id: req.params.id } })
    if (!request) return notFound(res)
    if (request.staffMemberId !== req.user!.id) return forbidden(res)
    if (request.status !== 'PENDING') return badRequest(res, 'Can only cancel pending requests')

    const updated = await prisma.leaveRequest.update({
      where: { id: req.params.id }, data: { status: 'CANCELLED' },
    })
    return ok(res, updated)
  } catch (err) { serverError(res, err) }
})

export default router
