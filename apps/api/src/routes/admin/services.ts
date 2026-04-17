/**
 * /v1/admin/services — admin-scoped read + per-service performance aggregates.
 * The CRUD writes still flow through the existing public /v1/services route
 * (which already enforces senior-staff RBAC) — this file adds:
 *   - GET /v1/admin/services           : admin-aware list (includes Inactive)
 *   - GET /v1/admin/services/:id        : single record
 *   - GET /v1/admin/services/:id/performance : aggregates over PortalOrder
 */
import { Router } from 'express'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { authenticate } from '@/middleware/auth'
import { requirePermission } from '@/middleware/rbac'
import { validate } from '@/middleware/validate'
import { audit } from '@/lib/auditLog'
import { ok, created, notFound, badRequest, serverError } from '@/lib/response'

const router = Router()
router.use(authenticate)

// GET /v1/admin/services — admin list (status optional; defaults to all)
router.get('/', requirePermission('admin.services.read'), async (req, res) => {
  try {
    const status = String(req.query.status ?? '').trim()
    const category = String(req.query.category ?? '').trim()
    const where: any = {}
    if (status) where.status = status
    if (category) where.category = category
    const services = await prisma.service.findMany({
      where,
      orderBy: [{ featured: 'desc' }, { displayOrder: 'asc' }, { name: 'asc' }],
    })
    return ok(res, services)
  } catch (e) {
    return serverError(res, e)
  }
})

// GET /v1/admin/services/:id
router.get('/:id', requirePermission('admin.services.read'), async (req, res) => {
  try {
    const svc = await prisma.service.findUnique({ where: { id: req.params.id } })
    if (!svc) return notFound(res, 'Service')
    return ok(res, svc)
  } catch (e) {
    return serverError(res, e)
  }
})

// GET /v1/admin/services/:id/performance
//   Aggregates from PortalOrder (`service` field stores the name) over the last
//   30/90/365-day windows. Cheap because PortalOrder is already indexed.
router.get(
  '/:id/performance',
  requirePermission('admin.services.read'),
  async (req, res) => {
    try {
      const svc = await prisma.service.findUnique({ where: { id: req.params.id } })
      if (!svc) return notFound(res, 'Service')

      const now = new Date()
      const window = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
      const w30 = window(30)
      const w90 = window(90)

      const baseWhere = { service: svc.name }

      const [count30, count90, total30Agg, total90Agg, ratingAgg, statusGroups] = await Promise.all([
        prisma.portalOrder.count({ where: { ...baseWhere, orderDate: { gte: w30 } } }),
        prisma.portalOrder.count({ where: { ...baseWhere, orderDate: { gte: w90 } } }),
        prisma.portalOrder.aggregate({
          _sum: { amountUsd: true },
          where: { ...baseWhere, orderDate: { gte: w30 } },
        }),
        prisma.portalOrder.aggregate({
          _sum: { amountUsd: true },
          where: { ...baseWhere, orderDate: { gte: w90 } },
        }),
        prisma.portalOrder.aggregate({
          _avg: { rating: true },
          where: { ...baseWhere, rating: { not: null } as any },
        }),
        prisma.portalOrder.groupBy({
          by: ['status'],
          _count: { _all: true },
          where: baseWhere,
        }),
      ])

      const byStatus: Record<string, number> = {}
      for (const g of statusGroups as any[]) {
        byStatus[String(g.status)] = g._count._all
      }

      return ok(res, {
        serviceId: svc.id,
        serviceName: svc.name,
        orders30d: count30,
        orders90d: count90,
        revenue30dUsd: total30Agg._sum.amountUsd ?? 0,
        revenue90dUsd: total90Agg._sum.amountUsd ?? 0,
        avgRating: (ratingAgg as any)._avg?.rating ?? null,
        byStatus,
        generatedAt: now.toISOString(),
      })
    } catch (e) {
      return serverError(res, e)
    }
  },
)

// ──────────────────────────────────────────────────────────────
// /v1/admin/services/:id/plans — ServicePlan CRUD
// Apply migration 20260417120000_service_plans before using.
// ──────────────────────────────────────────────────────────────

const planCreateSchema = z.object({
  name: z.string().min(1).max(120),
  priceUsd: z.number().nonnegative(),
  priceBdt: z.number().nonnegative().optional(),
  deliveryDays: z.number().int().positive().optional(),
  features: z.array(z.string()).optional(),
  isPopular: z.boolean().optional(),
  displayOrder: z.number().int().optional(),
})
const planUpdateSchema = planCreateSchema.partial()

// GET /v1/admin/services/:id/plans
router.get('/:id/plans', requirePermission('admin.services.read'), async (req, res) => {
  try {
    const plans = await (prisma as any).servicePlan
      .findMany({
        where: { serviceId: req.params.id },
        orderBy: [{ displayOrder: 'asc' }, { priceUsd: 'asc' }],
      })
      .catch((err: any) => {
        // ServicePlan table not migrated yet — surface a clear message.
        if (String(err?.message || '').includes('does not exist')) return null
        throw err
      })
    if (plans === null) {
      return badRequest(res, 'service_plans table missing — apply migration 20260417120000_service_plans')
    }
    return ok(res, plans)
  } catch (e) {
    return serverError(res, e)
  }
})

// POST /v1/admin/services/:id/plans
router.post(
  '/:id/plans',
  requirePermission('admin.services.write'),
  validate(planCreateSchema),
  async (req, res) => {
    try {
      const svc = await prisma.service.findUnique({ where: { id: req.params.id } })
      if (!svc) return notFound(res, 'Service')
      const body = req.body as z.infer<typeof planCreateSchema>
      const plan = await (prisma as any).servicePlan.create({
        data: {
          serviceId: svc.id,
          name: body.name,
          priceUsd: body.priceUsd,
          priceBdt: body.priceBdt,
          deliveryDays: body.deliveryDays,
          features: body.features ?? [],
          isPopular: body.isPopular ?? false,
          displayOrder: body.displayOrder ?? 0,
        },
      })
      await audit(req, {
        action: 'service.plan.create',
        resourceKind: 'ServicePlan',
        resourceId: plan.id,
        metadata: { serviceId: svc.id, name: plan.name, priceUsd: plan.priceUsd },
      })
      return created(res, plan)
    } catch (e) {
      return serverError(res, e)
    }
  },
)

// PATCH /v1/admin/services/:id/plans/:planId
router.patch(
  '/:id/plans/:planId',
  requirePermission('admin.services.write'),
  validate(planUpdateSchema),
  async (req, res) => {
    try {
      const before = await (prisma as any).servicePlan.findUnique({ where: { id: req.params.planId } })
      if (!before || before.serviceId !== req.params.id) return notFound(res, 'Plan')
      const after = await (prisma as any).servicePlan.update({
        where: { id: req.params.planId },
        data: req.body,
      })
      await audit(req, {
        action: 'service.plan.update',
        resourceKind: 'ServicePlan',
        resourceId: after.id,
        before, after,
      })
      return ok(res, after)
    } catch (e) {
      return serverError(res, e)
    }
  },
)

// DELETE /v1/admin/services/:id/plans/:planId
router.delete(
  '/:id/plans/:planId',
  requirePermission('admin.services.write'),
  async (req, res) => {
    try {
      const before = await (prisma as any).servicePlan.findUnique({ where: { id: req.params.planId } })
      if (!before || before.serviceId !== req.params.id) return notFound(res, 'Plan')
      await (prisma as any).servicePlan.delete({ where: { id: req.params.planId } })
      await audit(req, {
        action: 'service.plan.delete',
        resourceKind: 'ServicePlan',
        resourceId: before.id,
        before,
      })
      return ok(res, { id: before.id })
    } catch (e) {
      return serverError(res, e)
    }
  },
)

export default router
