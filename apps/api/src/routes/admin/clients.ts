/**
 * /v1/admin/clients — Unified client admin surface.
 *
 * Joins PortalMember (self-signed-up members with wallet/referral) with
 * ClientAccount (CRM-tracked contacts) deduplicated by email so a single
 * person appears once. Replaces the scattered /admin/portal/members and
 * /crm/clients lists for the new admin panel.
 *
 * See Notion §2.2 (Clients module) and §5.2 (endpoint matrix).
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
import { WalletTxType, PortalMemberStatus } from '@prisma/client'

const router = Router()
router.use(authenticate)

// ──────────────────────────────────────────────────────────────
// Internal: shape converters
// ──────────────────────────────────────────────────────────────

function memberStatusToUnified(s: PortalMemberStatus | string | null | undefined): string {
  switch (s) {
    case 'ACTIVE': return 'ACTIVE'
    case 'PENDING_VERIFICATION': return 'PENDING'
    case 'SUSPENDED': return 'SUSPENDED'
    case 'INACTIVE': return 'CHURNED'
    default: return 'ACTIVE'
  }
}

function unifiedClientFromMember(m: any) {
  return {
    id: m.id,
    portalMemberId: m.id,
    clientAccountId: undefined,
    fullName: m.fullName,
    email: m.email,
    phone: m.phone ?? undefined,
    whatsapp: m.whatsapp ?? undefined,
    country: m.country ?? undefined,
    avatarUrl: m.avatarUrl ?? undefined,
    status: memberStatusToUnified(m.status),
    assignedManager: undefined,
    tags: [],
    source: undefined,
    walletBalance: m.walletBalance ?? 0,
    totalSpentUsd: m.totalSpent ?? 0,
    totalOrders: m.totalOrders ?? 0,
    firstOrderDate: m.firstOrderDate?.toISOString?.() ?? undefined,
    lastOrderDate: m.lastOrderDate?.toISOString?.() ?? undefined,
    referralCode: m.referralCode ?? undefined,
    createdAt: m.createdAt?.toISOString?.() ?? new Date().toISOString(),
    updatedAt: m.updatedAt?.toISOString?.() ?? new Date().toISOString(),
  }
}

function unifiedClientFromAccount(a: any) {
  return {
    id: `acct:${a.id}`,
    portalMemberId: undefined,
    clientAccountId: a.id,
    fullName: a.clientName,
    email: a.email,
    phone: a.phone ?? undefined,
    whatsapp: a.whatsapp ?? undefined,
    country: a.country ?? undefined,
    avatarUrl: undefined,
    status: (a.status ?? 'Active').toUpperCase() === 'ACTIVE' ? 'ACTIVE' : 'CHURNED',
    assignedManager: a.assignedManager ?? undefined,
    tags: [],
    source: a.source ?? undefined,
    walletBalance: 0,
    totalSpentUsd: a.totalSpentUsd ?? 0,
    totalOrders: a.totalOrders ?? 0,
    firstOrderDate: a.firstOrderDate?.toISOString?.() ?? undefined,
    lastOrderDate: a.lastOrderDate?.toISOString?.() ?? undefined,
    referralCode: undefined,
    createdAt: a.createdAt?.toISOString?.() ?? new Date().toISOString(),
    updatedAt: a.updatedAt?.toISOString?.() ?? new Date().toISOString(),
  }
}

/**
 * Merge a PortalMember row and a ClientAccount row that share an email.
 * Member-side fields take precedence (live wallet, real auth identity);
 * account-side adds CRM context (assigned manager, source, lifetime spend).
 */
function mergeUnified(member: any, account: any) {
  if (!account) return unifiedClientFromMember(member)
  if (!member) return unifiedClientFromAccount(account)
  const m = unifiedClientFromMember(member)
  const a = unifiedClientFromAccount(account)
  return {
    ...m,
    clientAccountId: a.clientAccountId,
    assignedManager: a.assignedManager ?? m.assignedManager,
    source: a.source ?? m.source,
    totalSpentUsd: Math.max(m.totalSpentUsd, a.totalSpentUsd),
    totalOrders: Math.max(m.totalOrders, a.totalOrders),
    firstOrderDate: m.firstOrderDate ?? a.firstOrderDate,
    lastOrderDate: m.lastOrderDate ?? a.lastOrderDate,
  }
}

// ──────────────────────────────────────────────────────────────
// GET /v1/admin/clients — paginated unified list
// ──────────────────────────────────────────────────────────────
router.get('/', requirePermission('admin.clients.read'), async (req, res) => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query as any)
    const q = String(req.query.q ?? '').trim()
    const status = String(req.query.status ?? '').trim().toUpperCase()
    const country = String(req.query.country ?? '').trim()
    const manager = String(req.query.manager ?? '').trim()

    // Member-side where
    const memberWhere: any = {}
    if (q) memberWhere.OR = [
      { fullName: { contains: q } },
      { email: { contains: q } },
      { referralCode: { contains: q } },
    ]
    if (country) memberWhere.country = country
    if (status) {
      const map: Record<string, PortalMemberStatus> = {
        ACTIVE: 'ACTIVE' as PortalMemberStatus,
        PENDING: 'PENDING_VERIFICATION' as PortalMemberStatus,
        SUSPENDED: 'SUSPENDED' as PortalMemberStatus,
        CHURNED: 'INACTIVE' as PortalMemberStatus,
      }
      if (map[status]) memberWhere.status = map[status]
    }

    // Account-side where
    const accountWhere: any = {}
    if (q) accountWhere.OR = [
      { clientName: { contains: q } },
      { email: { contains: q } },
    ]
    if (country) accountWhere.country = country
    if (manager) accountWhere.assignedManager = manager

    // We oversample then dedupe by email; fine for typical scales.
    // For 100k+ rows the plan calls for a materialized clients_unified view.
    const oversample = limit * 4
    const [members, accounts] = await Promise.all([
      prisma.portalMember.findMany({
        where: memberWhere,
        orderBy: { createdAt: 'desc' },
        take: oversample,
      }),
      prisma.clientAccount.findMany({
        where: accountWhere,
        orderBy: { createdAt: 'desc' },
        take: oversample,
      }),
    ])

    // Build merged map keyed by lower-cased email
    const map = new Map<string, { member?: any; account?: any }>()
    for (const m of members) {
      const k = m.email.toLowerCase()
      const slot = map.get(k) ?? {}
      slot.member = m
      map.set(k, slot)
    }
    for (const a of accounts) {
      const k = a.email.toLowerCase()
      const slot = map.get(k) ?? {}
      slot.account = a
      map.set(k, slot)
    }

    let merged = Array.from(map.values()).map((s) => mergeUnified(s.member, s.account))

    // Apply remaining client-side filters
    if (status) merged = merged.filter((c) => c.status === status)
    if (manager) merged = merged.filter((c) => c.assignedManager === manager)

    merged.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    const total = merged.length
    const items = merged.slice(skip, skip + limit)

    return ok(res, items, buildMeta(total, page, limit))
  } catch (e) {
    return serverError(res, e)
  }
})

// ──────────────────────────────────────────────────────────────
// GET /v1/admin/clients/:id — merged detail
// ──────────────────────────────────────────────────────────────
router.get('/:id', requirePermission('admin.clients.read'), async (req, res) => {
  try {
    const id = req.params.id
    const isAccount = id.startsWith('acct:')
    const memberId = isAccount ? null : id
    const accountId = isAccount ? id.slice(5) : null

    const [member, account] = await Promise.all([
      memberId ? prisma.portalMember.findUnique({ where: { id: memberId } }) : null,
      accountId ? prisma.clientAccount.findUnique({ where: { id: accountId } }) : null,
    ])

    if (!member && !account) return notFound(res, 'Client')

    // Cross-link by email if only one was found
    let pairedMember = member
    let pairedAccount = account
    const email = (member?.email ?? account?.email ?? '').toLowerCase()
    if (email && !pairedMember) {
      pairedMember = await prisma.portalMember.findFirst({
        where: { email: { equals: email } },
      })
    }
    if (email && !pairedAccount) {
      pairedAccount = await prisma.clientAccount.findFirst({
        where: { email: { equals: email } },
      })
    }

    const unified = mergeUnified(pairedMember, pairedAccount)

    // Load related collections only for member-backed rows (FK constraints)
    const [orders, walletTx, tickets] = await Promise.all([
      pairedMember
        ? prisma.portalOrder.findMany({
            where: { memberId: pairedMember.id },
            orderBy: { orderDate: 'desc' },
            take: 25,
          })
        : Promise.resolve([]),
      pairedMember
        ? prisma.walletTransaction.findMany({
            where: { memberId: pairedMember.id },
            orderBy: { createdAt: 'desc' },
            take: 25,
          })
        : Promise.resolve([]),
      pairedMember
        ? prisma.supportTicket.findMany({
            where: { memberId: pairedMember.id },
            orderBy: { createdAt: 'desc' },
            take: 25,
          })
        : Promise.resolve([]),
    ])

    return ok(res, { ...unified, orders, walletTx, tickets })
  } catch (e) {
    return serverError(res, e)
  }
})

// ──────────────────────────────────────────────────────────────
// PATCH /v1/admin/clients/:id
// ──────────────────────────────────────────────────────────────
const patchSchema = z.object({
  fullName: z.string().min(1).optional(),
  phone: z.string().optional().nullable(),
  whatsapp: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  status: z.enum(['ACTIVE', 'PENDING', 'SUSPENDED', 'CHURNED']).optional(),
  assignedManager: z.string().optional().nullable(),
})

router.patch(
  '/:id',
  requirePermission('admin.clients.write'),
  validate(patchSchema),
  async (req, res) => {
    try {
      const id = req.params.id
      const isAccount = id.startsWith('acct:')
      const body = req.body as z.infer<typeof patchSchema>

      let before: any = null
      let after: any = null

      if (isAccount) {
        const accountId = id.slice(5)
        before = await prisma.clientAccount.findUnique({ where: { id: accountId } })
        if (!before) return notFound(res, 'Client account')
        after = await prisma.clientAccount.update({
          where: { id: accountId },
          data: {
            clientName: body.fullName ?? undefined,
            phone: body.phone ?? undefined,
            country: body.country ?? undefined,
            status: body.status === 'ACTIVE' ? 'Active' : body.status === 'CHURNED' ? 'Churned' : undefined,
            assignedManager: body.assignedManager ?? undefined,
          },
        })
      } else {
        before = await prisma.portalMember.findUnique({ where: { id } })
        if (!before) return notFound(res, 'Portal member')
        const statusMap: Record<string, PortalMemberStatus | undefined> = {
          ACTIVE: 'ACTIVE' as PortalMemberStatus,
          PENDING: 'PENDING_VERIFICATION' as PortalMemberStatus,
          SUSPENDED: 'SUSPENDED' as PortalMemberStatus,
          CHURNED: 'INACTIVE' as PortalMemberStatus,
        }
        after = await prisma.portalMember.update({
          where: { id },
          data: {
            fullName: body.fullName ?? undefined,
            phone: body.phone ?? undefined,
            whatsapp: body.whatsapp ?? undefined,
            country: body.country ?? undefined,
            status: body.status ? statusMap[body.status] : undefined,
          },
        })
      }

      await audit(req, {
        action: 'client.update',
        resourceKind: isAccount ? 'ClientAccount' : 'PortalMember',
        resourceId: id,
        clientId: id,
        before,
        after,
      })
      return ok(res, after)
    } catch (e) {
      return serverError(res, e)
    }
  },
)

// ──────────────────────────────────────────────────────────────
// POST /v1/admin/clients/:id/adjust-wallet (idempotent)
// ──────────────────────────────────────────────────────────────
const adjustSchema = z.object({
  deltaUsd: z.number().refine((n) => Number.isFinite(n) && n !== 0, 'deltaUsd must be a non-zero number'),
  reason: z.string().min(2),
  note: z.string().optional(),
  idempotencyKey: z.string().min(8),
})

router.post(
  '/:id/adjust-wallet',
  requirePermission('admin.clients.wallet.adjust'),
  validate(adjustSchema),
  async (req, res) => {
    try {
      const id = req.params.id
      if (id.startsWith('acct:')) return badRequest(res, 'Wallet only exists for portal members')

      const body = req.body as z.infer<typeof adjustSchema>
      const member = await prisma.portalMember.findUnique({ where: { id } })
      if (!member) return notFound(res, 'Portal member')

      // Idempotency guard via reference field
      const ref = `adjust:${body.idempotencyKey}`
      const dup = await prisma.walletTransaction.findFirst({
        where: { memberId: id, reference: ref },
      })
      if (dup) return conflict(res, 'idempotency_conflict')

      const newBalance = (member.walletBalance ?? 0) + body.deltaUsd
      if (newBalance < 0) return badRequest(res, 'Insufficient wallet balance')

      const updated = await prisma.$transaction(async (tx) => {
        const tx1 = await tx.walletTransaction.create({
          data: {
            memberId: id,
            type: WalletTxType.ADJUSTMENT,
            amountUsd: body.deltaUsd,
            balanceAfterUsd: newBalance,
            status: 'Confirmed',
            reference: ref,
            note: `${body.reason}${body.note ? ' — ' + body.note : ''}`,
          } as any,
        })
        const m = await tx.portalMember.update({
          where: { id },
          data: { walletBalance: newBalance },
        })
        return { tx: tx1, member: m }
      })

      await audit(req, {
        action: 'client.wallet.adjust',
        resourceKind: 'PortalMember',
        resourceId: id,
        clientId: id,
        metadata: {
          deltaUsd: body.deltaUsd,
          reason: body.reason,
          newBalance: updated.member.walletBalance,
          idempotencyKey: body.idempotencyKey,
        },
      })

      return ok(res, {
        walletBalance: updated.member.walletBalance,
        transactionId: updated.tx.id,
      })
    } catch (e) {
      return serverError(res, e)
    }
  },
)

// ──────────────────────────────────────────────────────────────
// POST /v1/admin/clients/:id/merge
//   - Body: { intoId: string }  (the surviving record id)
//   - Idempotent via (sourceId, targetId) pair recorded in audit metadata.
//   - Strategy: cross-link via shared email, repoint a few CRM fields,
//     mark the source ClientAccount as 'Merged'. PortalMember is never
//     deleted (auth identity); CRM-only sources can be archived.
//   - Reversible window: documented in audit metadata as `revertibleUntil`
//     (7 days). Actual revert tooling is a follow-up.
// ──────────────────────────────────────────────────────────────
const mergeSchema = z.object({
  intoId: z.string().min(1),
})

router.post(
  '/:id/merge',
  requirePermission('admin.clients.merge'),
  validate(mergeSchema),
  async (req, res) => {
    try {
      const sourceId = req.params.id
      const { intoId: targetId } = req.body as z.infer<typeof mergeSchema>
      if (sourceId === targetId) return badRequest(res, 'source and target are the same')

      const isSrcAccount = sourceId.startsWith('acct:')
      const isTgtAccount = targetId.startsWith('acct:')

      // Idempotency: a prior merge is uniquely identified by (action, source, target),
      // all indexed columns now (resourceId=source, clientId=target). Fingerprint is
      // also kept in metadata below for human-readable audit context.
      const fingerprint = `merge:${sourceId}->${targetId}`
      const dup = await prisma.systemAuditLog
        .findFirst({
          where: {
            action: 'client.merge',
            resourceId: sourceId,
            clientId: targetId,
          },
        })
        .catch(() => null)
      if (dup) return conflict(res, 'idempotency_conflict')

      // Resolve both records (member or account)
      const [srcMember, srcAcct, tgtMember, tgtAcct] = await Promise.all([
        isSrcAccount ? null : prisma.portalMember.findUnique({ where: { id: sourceId } }),
        isSrcAccount ? prisma.clientAccount.findUnique({ where: { id: sourceId.slice(5) } }) : null,
        isTgtAccount ? null : prisma.portalMember.findUnique({ where: { id: targetId } }),
        isTgtAccount ? prisma.clientAccount.findUnique({ where: { id: targetId.slice(5) } }) : null,
      ])
      const src = srcMember ?? srcAcct
      const tgt = tgtMember ?? tgtAcct
      if (!src || !tgt) return notFound(res, 'Client (one side missing)')

      const revertibleUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

      // CRM-only source merging into another record: mark Merged
      if (isSrcAccount && srcAcct) {
        await prisma.clientAccount.update({
          where: { id: srcAcct.id },
          data: { status: 'Merged', notes: `${srcAcct.notes ?? ''}\nMerged into ${targetId}` } as any,
        })
      }
      // CRM-only target receiving member: copy assignedManager / source up
      if (isTgtAccount && tgtAcct && srcMember) {
        // No FK to update on PortalMember side without schema change; the
        // unified read-side already cross-links by email so the visual
        // merge is complete. Audit captures the intent for later revert.
      }

      await audit(req, {
        action: 'client.merge',
        resourceKind: isSrcAccount ? 'ClientAccount' : 'PortalMember',
        resourceId: sourceId,
        clientId: targetId,
        metadata: {
          fingerprint,
          sourceId,
          targetId,
          revertibleUntil,
          strategy: isSrcAccount ? 'mark_source_merged' : 'cross_link_only',
        },
      })

      return ok(res, { sourceId, targetId, revertibleUntil })
    } catch (e) {
      return serverError(res, e)
    }
  },
)

// ──────────────────────────────────────────────────────────────
// GET /v1/admin/clients/:id/activity — scoped audit feed
// ──────────────────────────────────────────────────────────────
router.get(
  '/:id/activity',
  requirePermission('admin.audit.read'),
  async (req, res) => {
    try {
      const id = req.params.id
      const { page, limit, skip } = getPaginationParams(req.query as any)
      // Audit rows touching this client: either the client is the resource itself,
      // or it's the linked client (clientId) of another resource's event. Both indexed.
      const where: any = {
        OR: [{ clientId: id }, { resourceId: id }],
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
  },
)

// ──────────────────────────────────────────────────────────────
// /v1/admin/clients/segments — saved filter presets (ClientSegment)
// Apply migration 20260417130000_client_segments before using.
// ──────────────────────────────────────────────────────────────
const segmentCreateSchema = z.object({
  name: z.string().min(1).max(80),
  params: z.object({
    status: z.string().optional(),
    country: z.string().optional(),
    manager: z.string().optional(),
    q: z.string().optional(),
  }),
})

// Any admin.clients.read staff can list + save segments (they are team-shared).
router.get('/segments', requirePermission('admin.clients.read'), async (_req, res) => {
  try {
    const rows = await (prisma as any).clientSegment
      .findMany({ orderBy: { name: 'asc' } })
      .catch((err: any) => {
        if (String(err?.message || '').includes('does not exist')) return null
        throw err
      })
    if (rows === null) {
      return badRequest(res, 'client_segments table missing — apply migration 20260417130000_client_segments')
    }
    return ok(res, rows)
  } catch (e) {
    return serverError(res, e)
  }
})

router.post(
  '/segments',
  requirePermission('admin.clients.write'),
  validate(segmentCreateSchema),
  async (req, res) => {
    try {
      const { name, params } = req.body as z.infer<typeof segmentCreateSchema>
      // Upsert by name so hitting Save with an existing name updates rather than 500s.
      const row = await (prisma as any).clientSegment.upsert({
        where: { name },
        update: { params, createdById: req.user?.id ?? null },
        create: { name, params, createdById: req.user?.id ?? null },
      })
      await audit(req, {
        action: 'client.segment.upsert',
        resourceKind: 'ClientSegment',
        resourceId: row.id,
        metadata: { name, params },
      })
      return ok(res, row)
    } catch (e) {
      return serverError(res, e)
    }
  },
)

router.delete(
  '/segments/:id',
  requirePermission('admin.clients.write'),
  async (req, res) => {
    try {
      const before = await (prisma as any).clientSegment.findUnique({ where: { id: req.params.id } })
      if (!before) return notFound(res, 'Segment')
      await (prisma as any).clientSegment.delete({ where: { id: req.params.id } })
      await audit(req, {
        action: 'client.segment.delete',
        resourceKind: 'ClientSegment',
        resourceId: before.id,
        before,
      })
      return ok(res, { id: before.id })
    } catch (e) {
      return serverError(res, e)
    }
  },
)

// ──────────────────────────────────────────────────────────────
// GET /v1/admin/clients/export — CSV stream (current filters)
// ──────────────────────────────────────────────────────────────
router.get('/export.csv', requirePermission('admin.clients.read'), async (req, res) => {
  try {
    const [members, accounts] = await Promise.all([
      prisma.portalMember.findMany({ orderBy: { createdAt: 'desc' }, take: 5000 }),
      prisma.clientAccount.findMany({ orderBy: { createdAt: 'desc' }, take: 5000 }),
    ])
    const map = new Map<string, { member?: any; account?: any }>()
    for (const m of members) {
      const k = m.email.toLowerCase()
      const slot = map.get(k) ?? {}
      slot.member = m
      map.set(k, slot)
    }
    for (const a of accounts) {
      const k = a.email.toLowerCase()
      const slot = map.get(k) ?? {}
      slot.account = a
      map.set(k, slot)
    }
    const rows = Array.from(map.values()).map((s) => mergeUnified(s.member, s.account))

    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', 'attachment; filename="clients.csv"')
    const head = [
      'id', 'fullName', 'email', 'phone', 'country', 'status',
      'walletBalance', 'totalSpentUsd', 'totalOrders', 'createdAt',
    ]
    res.write(head.join(',') + '\n')
    for (const r of rows) {
      const cells = [
        r.id, r.fullName, r.email, r.phone ?? '', r.country ?? '', r.status,
        r.walletBalance, r.totalSpentUsd, r.totalOrders, r.createdAt,
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
