import { Router } from 'express'
import { z } from 'zod'
import type { Prisma, SystemRole } from '@prisma/client'
import { authenticate, isCEO, type AuthRequest } from '@/middleware/auth'
import { requirePermission } from '@/middleware/rbac'
import { validate } from '@/middleware/validate'
import prisma from '@/lib/prisma'
import { audit } from '@/lib/auditLog'
import {
  canManagerAccessStaffMember,
  mergePayrollWhereForManager,
} from '@/lib/teamBranchScope'
import { ok, created, notFound, serverError, paginated, forbidden } from '@/lib/response'
import { getPagination, buildMeta } from '@/lib/pagination'

const router = Router()
router.use(authenticate, requirePermission('payroll.access'))

const schema = z.object({
  staffMemberId: z.string().uuid(),
  month:         z.string(),
  year:          z.number().int(),
  baseSalary:    z.number(),
  bonus:         z.number().default(0),
  deductions:    z.number().default(0),
  paymentMethod: z.string().optional(),
  notes:         z.string().optional(),
})

// GET /payroll
router.get('/', async (req: AuthRequest, res) => {
  try {
    const { page, limit, skip } = getPagination(req)
    const { staffMemberId, memberId, month, year } = req.query as Record<string, string>
    const role = req.user!.role as SystemRole
    const filterId = staffMemberId || memberId
    if (filterId) {
      const allowed = await canManagerAccessStaffMember(req.user!.id, role, filterId)
      if (!allowed) return forbidden(res, 'Cannot access payroll for this staff member')
    }

    const where: Prisma.PayrollWhereInput = {}
    if (filterId) where.staffMemberId = filterId
    if (month) where.month = month
    if (year) where.year = parseInt(year, 10)

    const scoped = await mergePayrollWhereForManager(req, where)

    const [data, total] = await Promise.all([
      prisma.payroll.findMany({
        where: scoped,
        skip,
        take: limit,
        orderBy: [{ year: 'desc' }, { month: 'asc' }],
      }),
      prisma.payroll.count({ where: scoped }),
    ])
    return paginated(res, data, buildMeta(total, page, limit))
  } catch { return serverError(res) }
})

// POST /payroll — process payroll
router.post('/', validate(schema), async (req: AuthRequest, res) => {
  try {
    const role = req.user!.role as SystemRole
    const okScope = await canManagerAccessStaffMember(
      req.user!.id,
      role,
      req.body.staffMemberId,
    )
    if (!okScope) return forbidden(res, 'Cannot process payroll for this staff member')

    const member = await prisma.staffMember.findUnique({ where: { id: req.body.staffMemberId } })
    if (!member) return notFound(res, 'Member')
    const { bonus = 0, deductions = 0, staffMemberId } = req.body
    const netSalary = req.body.baseSalary + bonus - deductions

    const payroll = await prisma.payroll.create({
      data: {
        staffMemberId,
        month: req.body.month,
        year: req.body.year,
        baseSalary: req.body.baseSalary,
        bonus,
        deductions,
        netSalary,
        paymentMethod: req.body.paymentMethod,
        notes: req.body.notes,
        staffName: member.name,
        systemRole: member.systemRole,
        branch: member.branch || '',
      },
    })
    await audit(req, {
      action: 'payroll.create',
      resourceKind: 'Payroll',
      resourceId: payroll.id,
      after: payroll,
    })
    return created(res, payroll)
  } catch (e) { console.error(e); return serverError(res) }
})

// GET /payroll/:id
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const record = await prisma.payroll.findUnique({ where: { id: req.params.id } })
    if (!record) return notFound(res, 'Payroll record')
    const role = req.user!.role as SystemRole
    const allowed = await canManagerAccessStaffMember(
      req.user!.id,
      role,
      record.staffMemberId,
    )
    if (!allowed) return notFound(res, 'Payroll record')
    return ok(res, record)
  } catch { return serverError(res) }
})

// PUT /payroll/:id — edit a payroll record
router.put('/:id', requirePermission('payroll.access'), async (req: AuthRequest, res) => {
  try {
    const { bonus, deductions, baseSalary, ...rest } = req.body
    const existing = await prisma.payroll.findUnique({ where: { id: req.params.id } })
    if (!existing) return notFound(res, 'Payroll record')
    const role = req.user!.role as SystemRole
    const okScope = await canManagerAccessStaffMember(
      req.user!.id,
      role,
      existing.staffMemberId,
    )
    if (!okScope) return forbidden(res, 'Cannot edit this payroll record')
    const base = baseSalary ?? existing.baseSalary
    const b    = bonus      ?? existing.bonus ?? 0
    const d    = deductions ?? existing.deductions ?? 0
    const netSalary = base + b - d
    const record = await prisma.payroll.update({
      where: { id: req.params.id },
      data:  { ...rest, baseSalary: base, bonus: b, deductions: d, netSalary },
    })
    await audit(req, {
      action: 'payroll.update',
      resourceKind: 'Payroll',
      resourceId: record.id,
      before: existing,
      after: record,
    })
    return ok(res, record)
  } catch { return serverError(res) }
})

// DELETE /payroll/:id
router.delete('/:id', isCEO, async (req: AuthRequest, res) => {
  try {
    await prisma.payroll.delete({ where: { id: req.params.id } })
    await audit(req, {
      action: 'payroll.delete',
      resourceKind: 'Payroll',
      resourceId: req.params.id,
    })
    return ok(res, { message: 'Payroll record deleted' })
  } catch { return serverError(res) }
})

// PUT /payroll/:id/mark-paid
router.put('/:id/mark-paid', isCEO, async (req: AuthRequest, res) => {
  try {
    const record = await prisma.payroll.update({
      where: { id: req.params.id },
      data: { paymentStatus: 'Paid', paymentDate: new Date(), paymentMethod: req.body.paymentMethod },
    })
    await audit(req, {
      action: 'payroll.markpaid',
      resourceKind: 'Payroll',
      resourceId: record.id,
      after: record,
    })
    return ok(res, record)
  } catch { return serverError(res) }
})

export default router
