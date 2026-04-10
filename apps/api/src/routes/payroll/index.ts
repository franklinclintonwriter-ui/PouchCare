import { Router } from 'express'
import { z } from 'zod'
import { authenticate, isCEO, type AuthRequest } from '@/middleware/auth'
import { requirePermission } from '@/middleware/rbac'
import { validate } from '@/middleware/validate'
import prisma from '@/lib/prisma'
import { ok, created, notFound, serverError, paginated } from '@/lib/response'
import { getPagination, paginatedMeta, buildMeta} from '@/lib/pagination'

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
    const where: any = {}
    // Support both staffMemberId and memberId (legacy) for filtering
    if (staffMemberId) where.staffMemberId = staffMemberId
    else if (memberId) where.staffMemberId = memberId
    if (month)    where.month = month
    if (year)     where.year = parseInt(year)

    const [data, total] = await Promise.all([
      prisma.payroll.findMany({ where, skip, take: limit, orderBy: [{ year: 'desc' }, { month: 'asc' }] }),
      prisma.payroll.count({ where }),
    ])
    return paginated(res, data, buildMeta(total, page, limit))
  } catch { return serverError(res) }
})

// POST /payroll — process payroll
router.post('/', validate(schema), async (req: AuthRequest, res) => {
  try {
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
    return created(res, payroll)
  } catch (e) { console.error(e); return serverError(res) }
})

// GET /payroll/:id
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const record = await prisma.payroll.findUnique({ where: { id: req.params.id } })
    if (!record) return notFound(res, 'Payroll record')
    return ok(res, record)
  } catch { return serverError(res) }
})

// PUT /payroll/:id — edit a payroll record
router.put('/:id', requirePermission('payroll.access'), async (req: AuthRequest, res) => {
  try {
    const { bonus, deductions, baseSalary, ...rest } = req.body
    const existing = await prisma.payroll.findUnique({ where: { id: req.params.id } })
    if (!existing) return notFound(res, 'Payroll record')
    const base = baseSalary ?? existing.baseSalary
    const b    = bonus      ?? existing.bonus ?? 0
    const d    = deductions ?? existing.deductions ?? 0
    const netSalary = base + b - d
    const record = await prisma.payroll.update({
      where: { id: req.params.id },
      data:  { ...rest, baseSalary: base, bonus: b, deductions: d, netSalary },
    })
    return ok(res, record)
  } catch { return serverError(res) }
})

// DELETE /payroll/:id
router.delete('/:id', isCEO, async (req: AuthRequest, res) => {
  try {
    await prisma.payroll.delete({ where: { id: req.params.id } })
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
    return ok(res, record)
  } catch { return serverError(res) }
})

export default router
