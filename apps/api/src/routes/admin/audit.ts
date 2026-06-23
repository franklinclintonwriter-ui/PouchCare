/**
 * /v1/admin/audit — read-only access to SystemAuditLog with filters + CSV export.
 * Powered by the audit() helper that every admin write calls.
 * See Notion §5.5 (Audit contract).
 */
import { Router } from 'express'
import prisma from '@/lib/prisma'
import { authenticate } from '@/middleware/auth'
import { requirePermission } from '@/middleware/rbac'
import { ok, serverError } from '@/lib/response'
import { getPaginationParams, buildMeta } from '@/lib/pagination'

const router = Router()
router.use(authenticate)

// GET /v1/admin/audit — filterable list
router.get('/', requirePermission('admin.audit.read'), async (req, res) => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query as any)
    const action = String(req.query.action ?? '').trim()
    const resourceKind = String(req.query.resourceKind ?? '').trim()
    const actorId = String(req.query.actorId ?? '').trim()
    const since = String(req.query.since ?? '').trim()
    const until = String(req.query.until ?? '').trim()

    const where: any = {}
    if (action) where.action = { contains: action }
    if (resourceKind) where.resourceKind = resourceKind
    if (actorId) where.actorId = actorId
    if (since || until) {
      where.createdAt = {}
      if (since) where.createdAt.gte = new Date(since)
      if (until) where.createdAt.lte = new Date(until)
    }

    const [items, total] = await Promise.all([
      prisma.systemAuditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.systemAuditLog.count({ where }),
    ])
    return ok(res, items, buildMeta(total, page, limit))
  } catch (e) {
    return serverError(res, e)
  }
})

// GET /v1/admin/audit/export.csv
router.get('/export.csv', requirePermission('admin.audit.read'), async (_req, res) => {
  try {
    const items = await prisma.systemAuditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10000,
    })
    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', 'attachment; filename="audit.csv"')
    const head = ['createdAt', 'actorId', 'actorRole', 'action', 'resourceKind', 'resourceId', 'ip']
    res.write(head.join(',') + '\n')
    for (const r of items as any[]) {
      const cells = [
        r.createdAt?.toISOString?.() ?? '',
        r.actorId ?? '',
        r.actorRole ?? '',
        r.action ?? '',
        r.resourceKind ?? '',
        r.resourceId ?? '',
        r.ip ?? '',
      ].map((v) => {
        const s = String(v ?? '')
        return /[,"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
      })
      res.write(cells.join(',') + '\n')
    }
    res.end()
  } catch (e) {
    return serverError(res, e)
  }
})

export default router
