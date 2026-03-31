import { Router } from 'express'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { authenticate, requireStaff, requireRoles, MANAGER_ROLES  } from '@/middleware/auth'
import { validate } from '@/middleware/validate'
import { getPagination, paginatedMeta, buildMeta} from '@/utils/pagination'
import { ok, created, badRequest, notFound, serverError } from '@/utils/response'

const router = Router()
router.use(authenticate)

// GET /v1/attendance
router.get('/', requireStaff, async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req.query as Record<string, string>)
    const { memberId, startDate, endDate, date, status } = req.query as Record<string, string>

    const where: any = {}
    if (!MANAGER_ROLES.includes(req.user!.role)) where.staffMemberId = req.user!.id
    else if (memberId) where.staffMemberId = memberId

    if (status) where.status = status
    if (date) {
      const day = new Date(date)
      const next = new Date(day)
      next.setDate(day.getDate() + 1)
      where.date = { gte: day, lt: next }
    } else if (startDate || endDate) {
      where.date = {}
      if (startDate) where.date.gte = new Date(startDate)
      if (endDate)   where.date.lte = new Date(endDate)
    }

    const [records, total] = await Promise.all([
      prisma.attendance.findMany({ where, skip, take: limit, orderBy: { date: 'desc' } }),
      prisma.attendance.count({ where }),
    ])
    return ok(res, records, buildMeta(total, page, limit))
  } catch (err) { serverError(res, err) }
})

// GET /v1/attendance/today
router.get('/today', requireStaff, async (req, res) => {
  try {
    const today = new Date(); today.setHours(0,0,0,0)
    const record = await prisma.attendance.findFirst({
      where: { staffMemberId: req.user!.id, date: today },
    })
    return ok(res, record)
  } catch (err) { serverError(res, err) }
})

// POST /v1/attendance/checkin
router.post('/checkin', requireStaff, async (req, res) => {
  try {
    const today = new Date(); today.setHours(0,0,0,0)
    const existing = await prisma.attendance.findFirst({
      where: { staffMemberId: req.user!.id, date: today },
    })
    if (existing?.checkInTime) return badRequest(res, 'Already checked in today')

    const staff = await prisma.staffMember.findUnique({
      where: { id: req.user!.id },
      select: { name: true, branch: true, systemRole: true },
    })

    const now = new Date()
    const hour = now.getHours()
    const isLate = hour >= 10 // Late if after 10am

    const record = existing
      ? await prisma.attendance.update({
          where: { id: existing.id },
          data: { checkInTime: now, status: isLate ? 'LATE' : 'PRESENT', loginIp: req.ip },
        })
      : await prisma.attendance.create({
          data: {
            staffMemberId: req.user!.id,
            name:          staff?.name || '',
            branch:        staff?.branch,
            staffSystemRole: staff?.systemRole,
            date:          today,
            status:        isLate ? 'LATE' : 'PRESENT',
            workType:      (req.body.workType as any) || 'OFFICE',
            checkInTime:   now,
            loginIp:       req.ip,
          },
        })
    return ok(res, record)
  } catch (err) { serverError(res, err) }
})

// POST /v1/attendance/checkout
router.post('/checkout', requireStaff, async (req, res) => {
  try {
    const today = new Date(); today.setHours(0,0,0,0)
    const record = await prisma.attendance.findFirst({
      where: { staffMemberId: req.user!.id, date: today },
    })
    if (!record?.checkInTime) return badRequest(res, 'No check-in found for today')
    if (record.checkOutTime)  return badRequest(res, 'Already checked out today')

    const now = new Date()
    const hoursWorked = (now.getTime() - record.checkInTime.getTime()) / 3600000
    const regularHours = Math.min(hoursWorked, 8)
    const overtime = Math.max(0, hoursWorked - 8)

    const updated = await prisma.attendance.update({
      where: { id: record.id },
      data: { checkOutTime: now, hoursWorked: parseFloat(regularHours.toFixed(2)), overtimeHours: parseFloat(overtime.toFixed(2)) },
    })
    return ok(res, updated)
  } catch (err) { serverError(res, err) }
})

// PUT /v1/attendance/:id
router.put('/:id', requireRoles(...MANAGER_ROLES as any), async (req, res) => {
  try {
    const record = await prisma.attendance.update({
      where: { id: req.params.id },
      data: { ...req.body, approvedBy: req.user!.id },
    })
    return ok(res, record)
  } catch (err) { serverError(res, err) }
})

// GET /v1/attendance/:staffId
router.get('/:staffId', requireRoles(...MANAGER_ROLES as any), async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req)
    const [records, total] = await Promise.all([
      prisma.attendance.findMany({
        where: { staffMemberId: req.params.staffId },
        skip, take: limit, orderBy: { date: 'desc' },
      }),
      prisma.attendance.count({ where: { staffMemberId: req.params.staffId } }),
    ])
    return ok(res, records, buildMeta(total, page, limit))
  } catch (err) { serverError(res, err) }
})

export default router
