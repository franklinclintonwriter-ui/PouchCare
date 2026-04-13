import { Router } from 'express'
import { SystemRole } from '@prisma/client'
import prisma from '@/lib/prisma'
import {
  propagateBranchNameChange,
  countReferencesToBranchName,
} from '@/lib/branchRename'
import type { AuthRequest } from '@/middleware/auth'
import { authenticate } from '@/middleware/auth'
import { requirePermission } from '@/middleware/rbac'
import { isStaffAllowed } from '@/lib/managementPermissions'
import { resolveMonitorBranchScope } from '@/lib/monitorBranchScope'
import { validate } from '@/middleware/validate'
import { ok, created, notFound, serverError, forbidden } from '@/lib/response'
import { getPaginationParams, buildMeta } from '@/lib/pagination'
import { env } from '@/config/env'
import { branchCreateSchema, branchUpdateSchema } from '@/routes/admin/branchSchemas'

const router = Router()
router.use(authenticate)

// Branches
router.get('/branches', requirePermission('staff.branches'), async (req, res) => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query as any)
    const q = String(req.query.q ?? '').trim()
    const status = String(req.query.status ?? '').trim()
    const where: any = {}
    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { city: { contains: q, mode: 'insensitive' } },
        { country: { contains: q, mode: 'insensitive' } },
      ]
    }
    if (status) where.status = status
    const [items, total] = await Promise.all([
      prisma.branch.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: limit }),
      prisma.branch.count({ where }),
    ])
    return ok(res, items, buildMeta(total, page, limit))
  } catch (err) { return serverError(res, err) }
})

router.get('/branches/:id/members', requirePermission('staff.branches'), async (req, res) => {
  try {
    const { id } = req.params
    const branch = await prisma.branch.findUnique({ where: { id } })
    if (!branch) return notFound(res, 'Branch')
    const { page, limit, skip } = getPaginationParams(req.query as any)
    const q = String(req.query.q ?? '').trim()
    const where: Record<string, unknown> = { branch: branch.name }
    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { jobRole: { contains: q, mode: 'insensitive' } },
      ]
    }
    const [items, total] = await Promise.all([
      prisma.staffMember.findMany({
        where: where as any,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        select: {
          id: true, memberId: true, name: true, email: true,
          systemRole: true, status: true, branch: true, jobRole: true,
          primarySkill: true, joinDate: true, salary: true,
          averageTaskRating: true, ceoPerformanceRating: true,
          tasksCompleted: true, phone: true, whatsapp: true,
        },
      }),
      prisma.staffMember.count({ where: where as any }),
    ])
    return ok(res, items, buildMeta(total, page, limit))
  } catch (err) { return serverError(res, err) }
})

router.get('/branches/:id', async (req: AuthRequest, res) => {
  try {
    if (!req.user || req.user.type !== 'staff') return forbidden(res, 'Staff access required')
    const { id } = req.params
    const canAdmin = await isStaffAllowed(req.user.role, 'staff.branches')
    const scope = await resolveMonitorBranchScope(req.user.id, req.user.role)
    if (!canAdmin) {
      if (scope.kind !== 'branch' || scope.branchId !== id) {
        return forbidden(res, 'Branch access denied')
      }
    }
    const branch = await prisma.branch.findUnique({ where: { id } })
    if (!branch) return notFound(res, 'Branch')

    const branchName = branch.name

    const [refs, roleGroups, statusGroups, agg] = await Promise.all([
      countReferencesToBranchName(prisma, branchName),
      prisma.staffMember.groupBy({
        by: ['systemRole'],
        where: { branch: branchName },
        _count: { _all: true },
      }),
      prisma.staffMember.groupBy({
        by: ['status'],
        where: { branch: branchName },
        _count: { _all: true },
      }),
      prisma.staffMember.aggregate({
        where: { branch: branchName },
        _sum: { tasksCompleted: true },
        _avg: { averageTaskRating: true },
      }),
    ])

    const memberCount = refs.staffMembers

    const byRole: Record<string, number> = {}
    for (const g of roleGroups) {
      byRole[g.systemRole] = g._count._all
    }

    let activeCount = 0
    for (const g of statusGroups) {
      if ((g.status || '').toLowerCase() === 'active') activeCount += g._count._all
    }

    const totalTasksCompleted = agg._sum.tasksCompleted ?? 0
    const rawAvg = agg._avg.averageTaskRating
    const avgTaskRating =
      rawAvg != null && !Number.isNaN(Number(rawAvg))
        ? Math.round(Number(rawAvg) * 100) / 100
        : null

    let managerMember: {
      id: string
      name: string
      email: string
      systemRole: string
      jobRole: string | null
    } | null = null

    if (branch.branchManager?.trim()) {
      const byName = await prisma.staffMember.findFirst({
        where: {
          branch: branchName,
          name: { equals: branch.branchManager.trim(), mode: 'insensitive' },
        },
        select: { id: true, name: true, email: true, systemRole: true, jobRole: true },
      })
      managerMember = byName
    }
    if (!managerMember) {
      const bm = await prisma.staffMember.findFirst({
        where: { branch: branchName, systemRole: SystemRole.BRANCH_MANAGER },
        select: { id: true, name: true, email: true, systemRole: true, jobRole: true },
      })
      managerMember = bm
    }

    if (branch.staffCount !== memberCount) {
      await prisma.branch.update({ where: { id }, data: { staffCount: memberCount } })
    }

    return ok(res, {
      branch: { ...branch, staffCount: memberCount },
      stats: {
        memberCount,
        activeCount,
        byRole,
        totalTasksCompleted,
        avgTaskRating,
      },
      managerMember,
      references: refs,
    })
  } catch (err) { return serverError(res, err) }
})

router.post('/branches', requirePermission('staff.branches'), validate(branchCreateSchema), async (req, res) => {
  try {
    const item = await prisma.branch.create({ data: req.body })
    return created(res, item)
  } catch (err) { return serverError(res, err) }
})

router.put('/branches/:id', requirePermission('staff.branches'), validate(branchUpdateSchema), async (req, res) => {
  try {
    const { id } = req.params
    const existing = await prisma.branch.findUnique({ where: { id } })
    if (!existing) return notFound(res, 'Branch')

    const data = req.body as Record<string, unknown>
    const nameChange =
      typeof data.name === 'string' && data.name.trim() !== '' && data.name !== existing.name

    if (nameChange) {
      const newName = String(data.name).trim()
      await prisma.$transaction(async (tx) => {
        await propagateBranchNameChange(tx, existing.name, newName)
        await tx.branch.update({ where: { id }, data: data as any })
      })
    } else {
      await prisma.branch.update({ where: { id }, data: data as any })
    }

    const item = await prisma.branch.findUnique({ where: { id } })
    return ok(res, item)
  } catch (err) { return serverError(res, err) }
})

/**
 * GET /branches/:id/manager-candidates
 * Returns staff members at this branch who could be set as the branch manager.
 * Includes: name, id, systemRole, jobRole, status.
 */
router.get('/branches/:id/manager-candidates', requirePermission('staff.branches'), async (req, res) => {
  try {
    const { id } = req.params
    const branch = await prisma.branch.findUnique({ where: { id } })
    if (!branch) return notFound(res, 'Branch')

    const candidates = await prisma.staffMember.findMany({
      where: {
        branch: branch.name,
        status: { in: ['Active', 'active', 'ACTIVE'] },
      },
      orderBy: [{ systemRole: 'asc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        systemRole: true,
        jobRole: true,
        status: true,
        email: true,
      },
    })
    return ok(res, candidates)
  } catch (err) { return serverError(res, err) }
})

/**
 * GET /staff-for-manager
 * Returns all active staff for selecting a manager when creating a new branch.
 * Optional: ?branch=<branchName> to filter by existing branch assignment.
 */
router.get('/staff-for-manager', requirePermission('staff.branches'), async (req, res) => {
  try {
    const branchName = String(req.query.branch ?? '').trim()
    const where: Record<string, unknown> = {
      status: { in: ['Active', 'active', 'ACTIVE'] },
    }
    if (branchName) {
      where.branch = branchName
    }
    const staff = await prisma.staffMember.findMany({
      where: where as any,
      orderBy: [{ branch: 'asc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        systemRole: true,
        jobRole: true,
        branch: true,
        email: true,
      },
    })
    return ok(res, staff)
  } catch (err) { return serverError(res, err) }
})

// Devices
router.get('/devices', requirePermission('assets.devices'), async (req, res) => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query as any)
    const q = String(req.query.q ?? '').trim()
    const status = String(req.query.status ?? '').trim()
    const where: any = {}
    if (q) {
      where.OR = [
        { deviceName: { contains: q, mode: 'insensitive' } },
        { deviceType: { contains: q, mode: 'insensitive' } },
        { ipAddress: { contains: q, mode: 'insensitive' } },
      ]
    }
    if (status) where.status = status
    const [items, total] = await Promise.all([
      prisma.device.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: limit }),
      prisma.device.count({ where }),
    ])
    return ok(res, items, buildMeta(total, page, limit))
  } catch (err) { return serverError(res, err) }
})

router.get('/devices/:id', requirePermission('assets.devices'), async (req, res) => {
  try {
    const item = await prisma.device.findUnique({ where: { id: req.params.id } })
    if (!item) return notFound(res)
    return ok(res, item)
  } catch (err) { return serverError(res, err) }
})

router.post('/devices', requirePermission('assets.devices'), async (req, res) => {
  try {
    const item = await prisma.device.create({ data: req.body })
    return created(res, item)
  } catch (err) { return serverError(res, err) }
})

router.put('/devices/:id', requirePermission('assets.devices'), async (req, res) => {
  try {
    const item = await prisma.device.update({ where: { id: req.params.id }, data: req.body })
    return ok(res, item)
  } catch (err) { return serverError(res, err) }
})

router.delete('/devices/:id', requirePermission('assets.devices'), async (req, res) => {
  try {
    await prisma.device.delete({ where: { id: req.params.id } })
    return ok(res, { message: 'Device deleted' })
  } catch (err) { return serverError(res, err) }
})

// Client Accounts
router.get('/client-accounts', requirePermission('crm.client_accounts'), async (req, res) => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query as any)
    const q = String(req.query.q ?? '').trim()
    const status = String(req.query.status ?? '').trim()
    const where: any = {}
    if (q) {
      where.OR = [
        { clientName: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { country: { contains: q, mode: 'insensitive' } },
      ]
    }
    if (status) where.status = status
    const [items, total] = await Promise.all([
      prisma.clientAccount.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: limit }),
      prisma.clientAccount.count({ where }),
    ])
    return ok(res, items, buildMeta(total, page, limit))
  } catch (err) { return serverError(res, err) }
})

router.get('/client-accounts/:id', requirePermission('crm.client_accounts'), async (req, res) => {
  try {
    const item = await prisma.clientAccount.findUnique({ where: { id: req.params.id } })
    if (!item) return notFound(res)
    return ok(res, item)
  } catch (err) { return serverError(res, err) }
})

router.post('/client-accounts', requirePermission('crm.client_accounts'), async (req, res) => {
  try {
    const item = await prisma.clientAccount.create({ data: req.body })
    return created(res, item)
  } catch (err) { return serverError(res, err) }
})

router.put('/client-accounts/:id', requirePermission('crm.client_accounts'), async (req, res) => {
  try {
    const item = await prisma.clientAccount.update({ where: { id: req.params.id }, data: req.body })
    return ok(res, item)
  } catch (err) { return serverError(res, err) }
})

router.delete('/client-accounts/:id', requirePermission('crm.client_accounts'), async (req, res) => {
  try {
    await prisma.clientAccount.delete({ where: { id: req.params.id } })
    return ok(res, { message: 'Client account deleted' })
  } catch (err) { return serverError(res, err) }
})

// Exchange Rates

/** GET /admin/exchange-rates/latest — returns the most recent exchange rate (no permission required for staff) */
router.get('/exchange-rates/latest', async (_req, res) => {
  try {
    const latest = await prisma.exchangeRate.findFirst({
      orderBy: { effectiveDate: 'desc' },
    })
    if (!latest) {
      return ok(res, {
        usdToBdt: env.DEFAULT_USD_TO_BDT,
        usdToAed: 3.67,
        bdtToAed: null,
        effectiveDate: new Date().toISOString(),
      })
    }
    return ok(res, latest)
  } catch (err) { return serverError(res, err) }
})

router.get('/exchange-rates', requirePermission('finance.exchange_rates'), async (req, res) => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query as any)
    const [items, total] = await Promise.all([
      prisma.exchangeRate.findMany({ orderBy: { effectiveDate: 'desc' }, skip, take: limit }),
      prisma.exchangeRate.count(),
    ])
    return ok(res, items, buildMeta(total, page, limit))
  } catch (err) { return serverError(res, err) }
})

router.post('/exchange-rates', requirePermission('finance.exchange_rates'), async (req, res) => {
  try {
    const payload = { ...req.body }
    if (payload.effectiveDate) payload.effectiveDate = new Date(payload.effectiveDate)
    const item = await prisma.exchangeRate.create({ data: payload })
    return created(res, item)
  } catch (err) { return serverError(res, err) }
})

router.put('/exchange-rates/:id', requirePermission('finance.exchange_rates'), async (req, res) => {
  try {
    const payload = { ...req.body }
    if (payload.effectiveDate) payload.effectiveDate = new Date(payload.effectiveDate)
    const item = await prisma.exchangeRate.update({ where: { id: req.params.id }, data: payload })
    return ok(res, item)
  } catch (err) { return serverError(res, err) }
})

router.delete('/exchange-rates/:id', requirePermission('finance.exchange_rates'), async (req, res) => {
  try {
    await prisma.exchangeRate.delete({ where: { id: req.params.id } })
    return ok(res, { message: 'Exchange rate deleted' })
  } catch (err) { return serverError(res, err) }
})

export default router
