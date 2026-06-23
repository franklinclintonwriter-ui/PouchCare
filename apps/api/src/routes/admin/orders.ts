/**
 * /v1/admin/orders — Unified order admin surface.
 *
 * Collapses PortalOrder, SalesOrder, and ApkJob into a single managerial
 * queue keyed by `${kind}:${uuid}`. The status DAG lives in
 * @pouchcare/types so frontend and backend agree on legal transitions.
 *
 * See Notion §2.3 (Orders module) and §5.2 (endpoint matrix).
 */
import { Router } from 'express'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { authenticate } from '@/middleware/auth'
import { requirePermission } from '@/middleware/rbac'
import { validate } from '@/middleware/validate'
import {
  ok,
  badRequest,
  notFound,
  serverError,
  conflict,
} from '@/lib/response'
import { getPaginationParams, buildMeta } from '@/lib/pagination'
import { audit } from '@/lib/auditLog'
import { OrderStatus, WalletTxType } from '@prisma/client'

type Kind = 'portal' | 'sales' | 'apk'
type AdminStatus =
  | 'DRAFT' | 'PENDING' | 'IN_PROGRESS' | 'DELIVERED'
  | 'IN_REVISION' | 'COMPLETED' | 'CANCELLED' | 'REFUNDED' | 'DISPUTED'

const router = Router()
router.use(authenticate)

// ──────────────────────────────────────────────────────────────
// Status DAG (mirror of @pouchcare/types ORDER_STATUS_DAG to avoid
// runtime import while @pouchcare/types may not be built into dist)
// ──────────────────────────────────────────────────────────────
const DAG: Record<AdminStatus, AdminStatus[]> = {
  DRAFT: ['PENDING', 'CANCELLED'],
  PENDING: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['DELIVERED', 'CANCELLED'],
  DELIVERED: ['IN_REVISION', 'COMPLETED', 'DISPUTED'],
  IN_REVISION: ['DELIVERED', 'CANCELLED'],
  COMPLETED: ['REFUNDED', 'DISPUTED'],
  CANCELLED: [],
  REFUNDED: [],
  DISPUTED: ['REFUNDED', 'COMPLETED'],
}

function canTransition(from: AdminStatus, to: AdminStatus): boolean {
  return (DAG[from] ?? []).includes(to)
}

// ──────────────────────────────────────────────────────────────
// Cross-source mappers
// ──────────────────────────────────────────────────────────────

function mapPortalOrderStatus(s: OrderStatus | string): AdminStatus {
  const v = String(s).toUpperCase()
  if (v === 'PROCESSING') return 'IN_PROGRESS'
  if (v in DAG) return v as AdminStatus
  if (v === 'PENDING') return 'PENDING'
  if (v === 'COMPLETED') return 'COMPLETED'
  if (v === 'CANCELLED') return 'CANCELLED'
  if (v === 'DELIVERED') return 'DELIVERED'
  return 'PENDING'
}

function fromPortalOrder(o: any): any {
  return {
    id: `portal:${o.id}`,
    kind: 'portal',
    displayId: `PO-${String(o.orderId ?? '').padStart(4, '0')}`,
    client: {
      id: o.memberId,
      fullName: o.member?.fullName ?? o.memberEmail ?? '—',
      email: o.memberEmail,
      avatarUrl: o.member?.avatarUrl ?? undefined,
    },
    service: { id: undefined, name: o.service ?? '—', kind: 'portal' },
    status: mapPortalOrderStatus(o.status),
    paymentStatus: (o.paymentStatus ?? 'PENDING').toUpperCase(),
    amountUsd: o.amountUsd ?? 0,
    amountBdt: undefined,
    quantity: o.quantity ?? 1,
    requirements: o.requirements ?? undefined,
    deliveryLink: o.deliveryLink ?? undefined,
    deadline: o.deadline?.toISOString?.() ?? undefined,
    assigneeId: undefined,
    revisionCount: o.revisionCount ?? 0,
    rating: o.rating ?? undefined,
    reviewNote: o.reviewNote ?? undefined,
    orderedAt: o.orderDate?.toISOString?.() ?? new Date().toISOString(),
    deliveredAt: o.deliveryDate?.toISOString?.() ?? undefined,
  }
}

function fromSalesOrder(o: any): any {
  return {
    id: `sales:${o.id}`,
    kind: 'sales',
    displayId: `SO-${String(o.id).slice(0, 6)}`,
    client: {
      id: o.clientId ?? o.id,
      fullName: o.clientName ?? '—',
      email: o.clientEmail ?? '',
      avatarUrl: undefined,
    },
    service: { id: undefined, name: o.serviceName ?? '—', kind: 'sales' },
    status: mapPortalOrderStatus((o.status ?? 'PENDING').toString().toUpperCase()),
    paymentStatus: (o.paymentStatus ?? 'PENDING').toUpperCase(),
    amountUsd: o.amountUsd ?? o.totalUsd ?? 0,
    amountBdt: o.amountBdt ?? undefined,
    quantity: 1,
    requirements: o.notes ?? undefined,
    deliveryLink: undefined,
    deadline: o.deadline?.toISOString?.() ?? undefined,
    assigneeId: o.assigneeId ?? undefined,
    revisionCount: 0,
    rating: undefined,
    reviewNote: undefined,
    orderedAt: o.orderDate?.toISOString?.() ?? o.createdAt?.toISOString?.() ?? new Date().toISOString(),
    deliveredAt: o.deliveredAt?.toISOString?.() ?? undefined,
  }
}

function fromApkJob(j: any): any {
  const apkStatus = String(j.status ?? 'PENDING').toUpperCase()
  const status: AdminStatus =
    apkStatus === 'BUILDING' ? 'IN_PROGRESS' :
    apkStatus === 'COMPLETED' ? 'COMPLETED' :
    apkStatus === 'FAILED' ? 'DISPUTED' :
    apkStatus === 'CANCELLED' ? 'CANCELLED' :
    'PENDING'
  return {
    id: `apk:${j.id}`,
    kind: 'apk',
    displayId: `APK-${String(j.id).slice(0, 6)}`,
    client: {
      id: j.memberId ?? j.id,
      fullName: j.memberName ?? j.memberEmail ?? '—',
      email: j.memberEmail ?? '',
      avatarUrl: undefined,
    },
    service: { id: undefined, name: 'Web-to-APK', kind: 'apk' },
    status,
    paymentStatus: 'PAID',
    amountUsd: j.priceUsd ?? 0,
    amountBdt: undefined,
    quantity: 1,
    requirements: j.sourceUrl ?? undefined,
    deliveryLink: j.artifactUrl ?? undefined,
    deadline: undefined,
    assigneeId: undefined,
    revisionCount: 0,
    rating: undefined,
    reviewNote: undefined,
    orderedAt: j.createdAt?.toISOString?.() ?? new Date().toISOString(),
    deliveredAt: j.completedAt?.toISOString?.() ?? undefined,
  }
}

// ──────────────────────────────────────────────────────────────
// GET /v1/admin/orders
// ──────────────────────────────────────────────────────────────
router.get('/', requirePermission('admin.orders.read'), async (req, res) => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query as any)
    const kind = String(req.query.kind ?? '').toLowerCase() as Kind | ''
    const status = String(req.query.status ?? '').toUpperCase()
    const q = String(req.query.q ?? '').trim()

    const wantPortal = !kind || kind === 'portal'
    const wantSales = !kind || kind === 'sales'
    const wantApk = !kind || kind === 'apk'

    const portalWhere: any = {}
    if (q) portalWhere.OR = [
      { memberEmail: { contains: q } },
      { service: { contains: q } },
    ]

    const salesWhere: any = {}
    if (q) salesWhere.OR = [
      { clientName: { contains: q } },
      { serviceName: { contains: q } },
    ].filter(Boolean)

    const apkWhere: any = {}

    const oversample = limit * 4
    const [portal, sales, apk] = await Promise.all([
      wantPortal
        ? prisma.portalOrder.findMany({
            where: portalWhere,
            orderBy: { orderDate: 'desc' },
            take: oversample,
            include: { member: { select: { fullName: true, avatarUrl: true } } } as any,
          })
        : Promise.resolve([]),
      wantSales
        ? prisma.salesOrder.findMany({
            where: salesWhere,
            orderBy: { createdAt: 'desc' },
            take: oversample,
          })
        : Promise.resolve([]),
      wantApk
        ? prisma.apkJob.findMany({
            where: apkWhere,
            orderBy: { createdAt: 'desc' },
            take: oversample,
          })
        : Promise.resolve([]),
    ])

    let merged: any[] = [
      ...portal.map(fromPortalOrder),
      ...sales.map(fromSalesOrder),
      ...apk.map(fromApkJob),
    ]
    if (status) merged = merged.filter((o) => o.status === status)
    merged.sort((a, b) => (a.orderedAt < b.orderedAt ? 1 : -1))

    const total = merged.length
    const items = merged.slice(skip, skip + limit)
    return ok(res, items, buildMeta(total, page, limit))
  } catch (e) {
    return serverError(res, e)
  }
})

// ──────────────────────────────────────────────────────────────
// GET /v1/admin/orders/:kind/:id
// ──────────────────────────────────────────────────────────────
router.get('/:kind/:id', requirePermission('admin.orders.read'), async (req, res) => {
  try {
    const { kind, id } = req.params
    if (kind === 'portal') {
      const o = await prisma.portalOrder.findUnique({
        where: { id },
        include: { member: { select: { fullName: true, avatarUrl: true } } } as any,
      })
      if (!o) return notFound(res, 'Order')
      return ok(res, fromPortalOrder(o))
    }
    if (kind === 'sales') {
      const o = await prisma.salesOrder.findUnique({ where: { id } })
      if (!o) return notFound(res, 'Order')
      return ok(res, fromSalesOrder(o))
    }
    if (kind === 'apk') {
      const j = await prisma.apkJob.findUnique({ where: { id } })
      if (!j) return notFound(res, 'Order')
      return ok(res, fromApkJob(j))
    }
    return badRequest(res, 'Unknown order kind')
  } catch (e) {
    return serverError(res, e)
  }
})

// ──────────────────────────────────────────────────────────────
// POST /v1/admin/orders/:kind/:id/advance
// ──────────────────────────────────────────────────────────────
const advanceSchema = z.object({
  to: z.enum([
    'DRAFT', 'PENDING', 'IN_PROGRESS', 'DELIVERED',
    'IN_REVISION', 'COMPLETED', 'CANCELLED', 'REFUNDED', 'DISPUTED',
  ]),
  note: z.string().optional(),
  deliveryLink: z.string().url().optional(),
})

router.post(
  '/:kind/:id/advance',
  requirePermission('admin.orders.write'),
  validate(advanceSchema),
  async (req, res) => {
    try {
      const { kind, id } = req.params
      const { to, note, deliveryLink } = req.body as z.infer<typeof advanceSchema>

      if (kind === 'portal') {
        const before = await prisma.portalOrder.findUnique({ where: { id } })
        if (!before) return notFound(res, 'Order')
        const from = mapPortalOrderStatus(before.status)
        if (!canTransition(from, to)) {
          return badRequest(res, `Illegal transition ${from} -> ${to}. Allowed: ${(DAG[from] ?? []).join(', ')}`)
        }
        const after = await prisma.portalOrder.update({
          where: { id },
          data: {
            status: to as OrderStatus,
            deliveryLink: deliveryLink ?? before.deliveryLink ?? undefined,
            deliveryDate: to === 'DELIVERED' ? new Date() : before.deliveryDate ?? undefined,
            notes: note ? `${before.notes ?? ''}\n[${new Date().toISOString()}] ${note}` : before.notes ?? undefined,
          } as any,
        })
        await audit(req, {
          action: 'order.advance',
          resourceKind: 'PortalOrder',
          resourceId: id,
          clientId: before.memberId,
          before: { status: from },
          after: { status: to },
          metadata: { note, deliveryLink },
        })
        return ok(res, fromPortalOrder(after))
      }

      if (kind === 'sales') {
        const before = await prisma.salesOrder.findUnique({ where: { id } })
        if (!before) return notFound(res, 'Order')
        const from = mapPortalOrderStatus((before.status ?? 'PENDING').toString().toUpperCase())
        if (!canTransition(from, to)) {
          return badRequest(res, `Illegal transition ${from} -> ${to}. Allowed: ${(DAG[from] ?? []).join(', ')}`)
        }
        const after = await prisma.salesOrder.update({
          where: { id },
          data: { status: to } as any,
        })
        await audit(req, {
          action: 'order.advance',
          resourceKind: 'SalesOrder',
          resourceId: id,
          before: { status: from },
          after: { status: to },
          metadata: { note },
        })
        return ok(res, fromSalesOrder(after))
      }

      if (kind === 'apk') {
        const before = await prisma.apkJob.findUnique({ where: { id } })
        if (!before) return notFound(res, 'Order')
        // Map admin status back to ApkJob status vocabulary
        const apkTarget =
          to === 'IN_PROGRESS' ? 'BUILDING' :
          to === 'COMPLETED' ? 'COMPLETED' :
          to === 'CANCELLED' ? 'CANCELLED' :
          to === 'DISPUTED' ? 'FAILED' :
          'PENDING'
        const after = await prisma.apkJob.update({
          where: { id },
          data: { status: apkTarget as any, ...(to === 'COMPLETED' ? { completedAt: new Date() } : {}) } as any,
        })
        await audit(req, {
          action: 'order.advance',
          resourceKind: 'ApkJob',
          resourceId: id,
          before: { status: before.status },
          after: { status: apkTarget },
          metadata: { note },
        })
        return ok(res, fromApkJob(after))
      }

      return badRequest(res, `Unknown order kind=${kind}`)
    } catch (e) {
      return serverError(res, e)
    }
  },
)

// ──────────────────────────────────────────────────────────────
// POST /v1/admin/orders — staff-creates-on-behalf-of-client
// ──────────────────────────────────────────────────────────────
const createSchema = z.object({
  memberId: z.string().min(1),
  serviceName: z.string().min(1),
  amountUsd: z.number().positive(),
  quantity: z.number().int().positive().default(1),
  requirements: z.string().optional(),
  deadline: z.string().optional(),       // ISO datetime
  paymentMethod: z.enum(['WALLET', 'INVOICE']).default('WALLET'),
})

router.post(
  '/',
  requirePermission('admin.orders.write'),
  validate(createSchema),
  async (req, res) => {
    try {
      const body = req.body as z.infer<typeof createSchema>
      const member = await prisma.portalMember.findUnique({ where: { id: body.memberId } })
      if (!member) return notFound(res, 'Member')

      if (body.paymentMethod === 'WALLET' && (member.walletBalance ?? 0) < body.amountUsd * body.quantity) {
        return badRequest(res, 'Insufficient wallet balance')
      }
      const total = body.amountUsd * body.quantity

      const order = await prisma.$transaction(async (tx) => {
        const created = await tx.portalOrder.create({
          data: {
            memberId: member.id,
            memberEmail: member.email,
            service: body.serviceName,
            amountUsd: total,
            quantity: body.quantity,
            requirements: body.requirements,
            deadline: body.deadline ? new Date(body.deadline) : undefined,
            status: OrderStatus.PENDING,
            paymentStatus: body.paymentMethod === 'WALLET' ? 'Paid' : 'Pending',
          } as any,
        })
        if (body.paymentMethod === 'WALLET') {
          const newBal = (member.walletBalance ?? 0) - total
          await tx.walletTransaction.create({
            data: {
              memberId: member.id,
              type: WalletTxType.ORDER_PAYMENT,
              amountUsd: -total,
              balanceAfterUsd: newBal,
              status: 'Confirmed',
              reference: `Staff order #${created.orderId}`,
            } as any,
          })
          await tx.portalMember.update({
            where: { id: member.id },
            data: {
              walletBalance: newBal,
              totalOrders: { increment: 1 },
              totalSpent: { increment: total },
            },
          })
        }
        return created
      })

      await audit(req, {
        action: 'order.create',
        resourceKind: 'PortalOrder',
        resourceId: order.id,
        clientId: member.id,
        metadata: { staffCreated: true, amountUsd: total, paymentMethod: body.paymentMethod },
      })

      return ok(res, fromPortalOrder(order))
    } catch (e) {
      return serverError(res, e)
    }
  },
)

// ──────────────────────────────────────────────────────────────
// POST /v1/admin/orders/bulk
//   - { ids: ['portal:uuid', ...], action: 'advance'|'cancel', to?: AdminStatus }
// Each item produces its own audit entry; per-item failures are
// reported in the response without aborting the batch.
// ──────────────────────────────────────────────────────────────
const bulkSchema = z.object({
  ids: z.array(z.string().min(1)).min(1).max(200),
  action: z.enum(['advance', 'cancel']),
  to: z
    .enum([
      'DRAFT', 'PENDING', 'IN_PROGRESS', 'DELIVERED',
      'IN_REVISION', 'COMPLETED', 'CANCELLED', 'REFUNDED', 'DISPUTED',
    ])
    .optional(),
})

router.post(
  '/bulk',
  requirePermission('admin.orders.write'),
  validate(bulkSchema),
  async (req, res) => {
    try {
      const body = req.body as z.infer<typeof bulkSchema>
      const target: AdminStatus = body.action === 'cancel' ? 'CANCELLED' : (body.to ?? 'PENDING')

      const results: Array<{ id: string; ok: boolean; error?: string }> = []

      for (const compositeId of body.ids) {
        const [kind, ...rest] = compositeId.split(':')
        const id = rest.join(':')
        try {
          if (kind === 'portal') {
            const before = await prisma.portalOrder.findUnique({ where: { id } })
            if (!before) { results.push({ id: compositeId, ok: false, error: 'not_found' }); continue }
            const from = mapPortalOrderStatus(before.status)
            if (!canTransition(from, target)) {
              results.push({ id: compositeId, ok: false, error: `illegal:${from}->${target}` })
              continue
            }
            await prisma.portalOrder.update({
              where: { id },
              data: { status: target as OrderStatus } as any,
            })
            await audit(req, {
              action: 'order.bulk.' + body.action,
              resourceKind: 'PortalOrder',
              resourceId: id,
              clientId: before.memberId,
              before: { status: from },
              after: { status: target },
            })
            results.push({ id: compositeId, ok: true })
          } else if (kind === 'sales') {
            const before = await prisma.salesOrder.findUnique({ where: { id } })
            if (!before) { results.push({ id: compositeId, ok: false, error: 'not_found' }); continue }
            const from = mapPortalOrderStatus((before.status ?? 'PENDING').toString().toUpperCase())
            if (!canTransition(from, target)) {
              results.push({ id: compositeId, ok: false, error: `illegal:${from}->${target}` })
              continue
            }
            await prisma.salesOrder.update({ where: { id }, data: { status: target } as any })
            await audit(req, {
              action: 'order.bulk.' + body.action,
              resourceKind: 'SalesOrder',
              resourceId: id,
              before: { status: from },
              after: { status: target },
            })
            results.push({ id: compositeId, ok: true })
          } else {
            results.push({ id: compositeId, ok: false, error: `unsupported_kind:${kind}` })
          }
        } catch (e: any) {
          results.push({ id: compositeId, ok: false, error: e?.message ?? 'unknown' })
        }
      }

      const okCount = results.filter((r) => r.ok).length
      return ok(res, { okCount, total: results.length, results })
    } catch (e) {
      return serverError(res, e)
    }
  },
)

// ──────────────────────────────────────────────────────────────
// GET /v1/admin/orders/export.csv
// ──────────────────────────────────────────────────────────────
router.get('/export.csv', requirePermission('admin.orders.read'), async (_req, res) => {
  try {
    const [portal, sales, apk] = await Promise.all([
      prisma.portalOrder.findMany({
        orderBy: { orderDate: 'desc' },
        take: 5000,
        include: { member: { select: { fullName: true } } } as any,
      }),
      prisma.salesOrder.findMany({ orderBy: { createdAt: 'desc' }, take: 5000 }),
      prisma.apkJob.findMany({ orderBy: { createdAt: 'desc' }, take: 5000 }),
    ])
    const rows = [
      ...portal.map(fromPortalOrder),
      ...sales.map(fromSalesOrder),
      ...apk.map(fromApkJob),
    ]
    rows.sort((a: any, b: any) => (a.orderedAt < b.orderedAt ? 1 : -1))

    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', 'attachment; filename="orders.csv"')
    const head = [
      'id', 'displayId', 'kind', 'clientName', 'clientEmail', 'service',
      'status', 'paymentStatus', 'amountUsd', 'quantity', 'orderedAt', 'deliveredAt',
    ]
    res.write(head.join(',') + '\n')
    for (const r of rows as any[]) {
      const cells = [
        r.id, r.displayId, r.kind,
        r.client?.fullName ?? '', r.client?.email ?? '',
        r.service?.name ?? '', r.status, r.paymentStatus,
        r.amountUsd ?? 0, r.quantity ?? 1,
        r.orderedAt ?? '', r.deliveredAt ?? '',
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

// ──────────────────────────────────────────────────────────────
// POST /v1/admin/orders/:kind/:id/refund (idempotent)
// ──────────────────────────────────────────────────────────────
const refundSchema = z.object({
  amountUsd: z.number().positive(),
  method: z.enum(['WALLET', 'INVOICE_VOID', 'EXTERNAL']),
  reason: z.string().min(2),
  idempotencyKey: z.string().min(8),
})

router.post(
  '/:kind/:id/refund',
  requirePermission('admin.orders.refund'),
  validate(refundSchema),
  async (req, res) => {
    try {
      const { kind, id } = req.params
      const body = req.body as z.infer<typeof refundSchema>
      if (kind !== 'portal') return badRequest(res, `refund only wired for portal kind`)

      const order = await prisma.portalOrder.findUnique({ where: { id } })
      if (!order) return notFound(res, 'Order')

      const ref = `refund:${body.idempotencyKey}`
      const dup = await prisma.walletTransaction.findFirst({
        where: { memberId: order.memberId, reference: ref },
      })
      if (dup) return conflict(res, 'idempotency_conflict')

      let walletDelta: number | undefined
      if (body.method === 'WALLET') {
        const m = await prisma.portalMember.findUnique({ where: { id: order.memberId } })
        if (!m) return notFound(res, 'Member')
        const newBal = (m.walletBalance ?? 0) + body.amountUsd
        await prisma.$transaction([
          prisma.walletTransaction.create({
            data: {
              memberId: order.memberId,
              type: WalletTxType.REFUND,
              amountUsd: body.amountUsd,
              balanceAfterUsd: newBal,
              status: 'Confirmed',
              reference: ref,
              note: body.reason,
            } as any,
          }),
          prisma.portalMember.update({
            where: { id: order.memberId },
            data: { walletBalance: newBal },
          }),
          prisma.portalOrder.update({
            where: { id },
            data: { status: OrderStatus.REFUNDED, paymentStatus: 'Refunded' } as any,
          }),
        ])
        walletDelta = body.amountUsd
      } else {
        await prisma.portalOrder.update({
          where: { id },
          data: { status: OrderStatus.REFUNDED, paymentStatus: 'Refunded' } as any,
        })
      }

      await audit(req, {
        action: 'order.refund',
        resourceKind: 'PortalOrder',
        resourceId: id,
        clientId: order.memberId,
        metadata: {
          amountUsd: body.amountUsd,
          method: body.method,
          reason: body.reason,
          idempotencyKey: body.idempotencyKey,
        },
      })

      return ok(res, { orderStatus: 'REFUNDED', refundId: ref, walletDelta })
    } catch (e) {
      return serverError(res, e)
    }
  },
)

export default router
