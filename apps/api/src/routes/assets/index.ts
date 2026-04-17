import { Router } from 'express'
import prisma from '@/lib/prisma'
import { authenticate, requireStaff, requireRoles, SENIOR_ROLES, type AuthRequest } from '@/middleware/auth'
import { requirePermission } from '@/middleware/rbac'
import {
  resolveMonitorBranchScope,
  cameraWhereForScope,
  assertCameraBranchAccess,
} from '@/lib/monitorBranchScope'
import { validate } from '@/middleware/validate'
import { getPagination, buildMeta } from '@/utils/pagination'
import { ok, created, notFound, serverError, forbidden } from '@/utils/response'
import {
  cameraCreateSchema,
  cameraUpdateSchema,
  cameraStatusPatchSchema,
} from '@/routes/assets/cameraSchemas'
import vigiRoutes from '@/routes/assets/vigiRoutes'
import cameraStreamRoutes from '@/routes/assets/cameraStreamRoutes'

const router = Router()
router.use(authenticate)

router.use(cameraStreamRoutes)
router.use('/vigi', vigiRoutes)

// ─────────────────────────────────────────────────────────────────────────────
// STAFF ASSETS (domains / servers / websites below): Management dashboard inventory
// for PouchCare **internal** company operations — not the client portal product.
//
// - Auth: `requireStaff` for reads; `SENIOR_ROLES` for writes.
// - Client-facing flows use `/v1/portal/hosting/*` and `/v1/portal/websites` (portal member scope).
// - Prisma `Domain` / `Website` may also hold rows with `portalMemberId` (customer-owned);
//   staff routes here return the full table for operations — do not assume every row is
//   "internal only" without filtering if you add stricter separation later.
// ─────────────────────────────────────────────────────────────────────────────

// ── DOMAINS (staff — internal ops registry) ──────────────────

const MANAGER_PLUS = ['CEO', 'CO_MD', 'OP_MANAGER', 'HR_MANAGER', 'BRANCH_MANAGER']

function domainWhere(req: AuthRequest, extra: Record<string, unknown> = {}) {
  const role = String((req as any).user?.role ?? '')
  const userId = (req as any).user?.id
  const base: any = { ...extra }
  if (!MANAGER_PLUS.includes(role)) {
    base.OR = [{ assignedStaffId: userId }, { lifecycleStatus: 'COMPLETED' }]
  }
  return base
}

async function calcDomainLifecycle(domainId: string) {
  const domain = await prisma.domain.findUnique({ where: { id: domainId } })
  if (!domain) return
  const linkedWebsite = await prisma.website.findFirst({ where: { domainId: domainId, status: 'Live' } })
  let status = 'INCOMPLETE'
  if (linkedWebsite && (linkedWebsite.serverId || linkedWebsite.hostedOn)) {
    status = 'COMPLETED'
  } else if (domain.assignedStaffId || domain.assignedTo) {
    status = 'IN_PROGRESS'
  }
  if (domain.lifecycleStatus !== status) {
    await prisma.domain.update({ where: { id: domainId }, data: { lifecycleStatus: status } })
  }
}

router.get('/domains/stats', requireStaff, async (req: AuthRequest, res) => {
  try {
    const where = domainWhere(req)
    const [total, completed, inProgress, incomplete, expiringSoon] = await Promise.all([
      prisma.domain.count({ where }),
      prisma.domain.count({ where: { ...where, lifecycleStatus: 'COMPLETED' } }),
      prisma.domain.count({ where: { ...where, lifecycleStatus: 'IN_PROGRESS' } }),
      prisma.domain.count({ where: { ...where, lifecycleStatus: 'INCOMPLETE' } }),
      prisma.domain.count({ where: { ...where, expiryDate: { lte: new Date(Date.now() + 30 * 86400000), gt: new Date() } } }),
    ])
    return ok(res, { total, completed, inProgress, incomplete, expiringSoon })
  } catch (err) { return serverError(res, err) }
})

router.get('/domains', requireStaff, async (req: AuthRequest, res) => {
  try {
    const { page, limit, skip } = getPagination(req)
    const { status, lifecycleStatus } = req.query as Record<string, string>
    const extra: any = {}
    if (status) extra.status = status
    if (lifecycleStatus) extra.lifecycleStatus = lifecycleStatus
    const where = domainWhere(req, extra)
    const [domains, total] = await Promise.all([
      prisma.domain.findMany({ where, skip, take: limit, orderBy: { expiryDate: 'asc' } }),
      prisma.domain.count({ where }),
    ])
    return ok(res, domains, buildMeta(total, page, limit))
  } catch (err) { return serverError(res, err) }
})

router.post('/domains', requireRoles(...SENIOR_ROLES as any), async (req, res) => {
  try {
    const domain = await prisma.domain.create({
      data: {
        ...req.body,
        expiryDate: req.body.expiryDate ? new Date(req.body.expiryDate) : undefined,
        registrationDate: req.body.registrationDate ? new Date(req.body.registrationDate) : undefined,
      },
    })
    return created(res, domain)
  } catch (err) { return serverError(res, err) }
})

router.get('/domains/:id', requireStaff, async (req: AuthRequest, res) => {
  try {
    const domain = await prisma.domain.findUnique({ where: { id: req.params.id } })
    if (!domain) return notFound(res)
    const role = String((req as any).user?.role ?? '')
    const userId = (req as any).user?.id
    if (!MANAGER_PLUS.includes(role) && domain.assignedStaffId !== userId && domain.lifecycleStatus !== 'COMPLETED') {
      return forbidden(res, 'You can only view assigned or completed domains')
    }
    const linkedWebsite = await prisma.website.findFirst({ where: { domainId: domain.id }, select: { id: true, name: true, url: true, status: true, platform: true } })
    const linkedServer = domain.hostingServer ? await prisma.server.findFirst({ where: { name: domain.hostingServer }, select: { id: true, name: true, status: true, ipAddress: true } }) : null
    return ok(res, { ...domain, linkedWebsite, linkedServer })
  } catch (err) { return serverError(res, err) }
})

router.put('/domains/:id', requireRoles(...SENIOR_ROLES as any), async (req, res) => {
  try {
    const data = { ...req.body }
    if (data.expiryDate) data.expiryDate = new Date(data.expiryDate)
    if (data.registrationDate) data.registrationDate = new Date(data.registrationDate)
    const domain = await prisma.domain.update({ where: { id: req.params.id }, data })
    await calcDomainLifecycle(domain.id)
    const updated = await prisma.domain.findUnique({ where: { id: domain.id } })
    return ok(res, updated)
  } catch (err) { return serverError(res, err) }
})

router.delete('/domains/:id', requireRoles(...SENIOR_ROLES as any), async (req, res) => {
  try {
    await prisma.domain.delete({ where: { id: req.params.id } })
    return ok(res, { message: 'Domain deleted' })
  } catch (err) { return serverError(res, err) }
})

// ── SERVERS (staff — PouchCare internal infrastructure only; no portal parallel route) ──
router.get('/servers', requireStaff, async (req, res) => {
  try {
    const servers = await prisma.server.findMany({ orderBy: { name: 'asc' } })
    return ok(res, servers)
  } catch (err) { return serverError(res, err) }
})

router.post('/servers', requireRoles(...SENIOR_ROLES as any), async (req, res) => {
  try {
    const server = await prisma.server.create({ data: req.body })
    return created(res, server)
  } catch (err) { return serverError(res, err) }
})

router.get('/servers/:id', requireStaff, async (req, res) => {
  try {
    const server = await prisma.server.findUnique({ where: { id: req.params.id } })
    if (!server) return notFound(res)
    return ok(res, server)
  } catch (err) { return serverError(res, err) }
})

router.put('/servers/:id', requireRoles(...SENIOR_ROLES as any), async (req, res) => {
  try {
    const server = await prisma.server.update({ where: { id: req.params.id }, data: req.body })
    return ok(res, server)
  } catch (err) { return serverError(res, err) }
})

router.delete('/servers/:id', requireRoles(...SENIOR_ROLES as any), async (req, res) => {
  try {
    await prisma.server.delete({ where: { id: req.params.id } })
    return ok(res, { message: 'Server deleted' })
  } catch (err) { return serverError(res, err) }
})

// ── WEBSITES (staff — internal inventory) ─────────────────────

function websiteWhere(req: AuthRequest, extra: Record<string, unknown> = {}) {
  const role = String((req as any).user?.role ?? '')
  const userId = (req as any).user?.id
  const base: any = { ...extra }
  if (!MANAGER_PLUS.includes(role)) {
    base.assignedStaffId = userId
  }
  return base
}

router.get('/websites/stats', requireStaff, async (req: AuthRequest, res) => {
  try {
    const where = websiteWhere(req)
    const [total, live, staging, down, maintenance] = await Promise.all([
      prisma.website.count({ where }),
      prisma.website.count({ where: { ...where, status: 'Live' } }),
      prisma.website.count({ where: { ...where, status: 'Staging' } }),
      prisma.website.count({ where: { ...where, status: 'Down' } }),
      prisma.website.count({ where: { ...where, status: 'Maintenance' } }),
    ])
    const platforms = await prisma.website.groupBy({ by: ['platform'], where, _count: true })
    return ok(res, { total, live, staging, down, maintenance, platforms: platforms.map((p) => ({ platform: p.platform ?? 'Unknown', count: p._count })) })
  } catch (err) { return serverError(res, err) }
})

router.get('/websites', requireStaff, async (req: AuthRequest, res) => {
  try {
    const { page, limit, skip } = getPagination(req)
    const { status, platform } = req.query as Record<string, string>
    const extra: any = {}
    if (status) extra.status = status
    if (platform) extra.platform = platform
    const where = websiteWhere(req, extra)
    const [websites, total] = await Promise.all([
      prisma.website.findMany({ where, skip, take: limit, orderBy: { name: 'asc' } }),
      prisma.website.count({ where }),
    ])
    return ok(res, websites, buildMeta(total, page, limit))
  } catch (err) { return serverError(res, err) }
})

router.post('/websites', requireRoles(...SENIOR_ROLES as any), async (req, res) => {
  try {
    const { domainId, serverId } = req.body
    if (domainId) {
      const domain = await prisma.domain.findUnique({ where: { id: domainId } })
      if (!domain) return serverError(res, new Error('Domain not found in system. Add the domain first.'))
    }
    if (serverId) {
      const server = await prisma.server.findUnique({ where: { id: serverId } })
      if (!server) return serverError(res, new Error('Server not found in system.'))
    }
    const website = await prisma.website.create({ data: req.body })
    if (domainId) await calcDomainLifecycle(domainId)
    return created(res, website)
  } catch (err) { return serverError(res, err) }
})

router.get('/websites/:id', requireStaff, async (req: AuthRequest, res) => {
  try {
    const website = await prisma.website.findUnique({ where: { id: req.params.id } })
    if (!website) return notFound(res)
    const role = String((req as any).user?.role ?? '')
    const userId = (req as any).user?.id
    if (!MANAGER_PLUS.includes(role) && website.assignedStaffId !== userId) {
      return forbidden(res, 'You can only view assigned websites')
    }
    const linkedDomain = website.domainId ? await prisma.domain.findUnique({ where: { id: website.domainId }, select: { id: true, domainName: true, status: true, lifecycleStatus: true, sslStatus: true } }) : null
    const linkedServer = website.serverId ? await prisma.server.findUnique({ where: { id: website.serverId }, select: { id: true, name: true, status: true, ipAddress: true, provider: true } }) : null
    return ok(res, { ...website, linkedDomain, linkedServer })
  } catch (err) { return serverError(res, err) }
})

router.put('/websites/:id', requireRoles(...SENIOR_ROLES as any), async (req, res) => {
  try {
    const { domainId, serverId } = req.body
    if (domainId) {
      const domain = await prisma.domain.findUnique({ where: { id: domainId } })
      if (!domain) return serverError(res, new Error('Domain not found in system'))
    }
    const website = await prisma.website.update({ where: { id: req.params.id }, data: req.body })
    if (domainId || website.domainId) await calcDomainLifecycle(domainId || website.domainId!)
    return ok(res, website)
  } catch (err) { return serverError(res, err) }
})

router.delete('/websites/:id', requireRoles(...SENIOR_ROLES as any), async (req, res) => {
  try {
    const website = await prisma.website.findUnique({ where: { id: req.params.id } })
    await prisma.website.delete({ where: { id: req.params.id } })
    if (website?.domainId) await calcDomainLifecycle(website.domainId)
    return ok(res, { message: 'Website deleted' })
  } catch (err) { return serverError(res, err) }
})

// ── CAMERA DEVICES (CCTV) ──
// Register `/cameras/summary` and `/cameras/export` before `/cameras/:id` so those segments are not parsed as ids.

const CAMERA_EXPORT_MAX = 2500

function cameraListOrderBy(sort: string | undefined) {
  const sortKey = sort ?? 'label_asc'
  if (sortKey === 'label_desc') return { label: 'desc' as const }
  if (sortKey === 'status') return [{ status: 'asc' as const }, { label: 'asc' as const }]
  if (sortKey === 'updated_desc') return { updatedAt: 'desc' as const }
  if (sortKey === 'updated_asc') return { updatedAt: 'asc' as const }
  return { label: 'asc' as const }
}

/** Shared list filters for GET /cameras and GET /cameras/export. `excludeOffline` wins over `status`. */
function buildCameraListWhereAndOrder(query: Record<string, string | undefined>) {
  const { branchId, status, q, source, sort, excludeOffline } = query
  const where: Record<string, unknown> = {}
  if (branchId) where.branchId = branchId
  const excl = excludeOffline === 'true' || excludeOffline === '1'
  if (excl) {
    where.status = { not: 'offline' }
  } else if (status) {
    where.status = status
  }
  if (source && (source === 'manual' || source === 'vigi')) where.source = source
  const qTrim = q?.trim()
  if (qTrim) {
    where.OR = [
      { label: { contains: qTrim, mode: 'insensitive' } },
      { location: { contains: qTrim, mode: 'insensitive' } },
      { notes: { contains: qTrim, mode: 'insensitive' } },
    ]
  }
  const orderBy = cameraListOrderBy(sort)
  return { where, orderBy }
}

function csvEscapeCell(value: unknown): string {
  if (value == null) return ''
  const s = value instanceof Date ? value.toISOString() : String(value)
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

router.get('/cameras/summary', requirePermission('monitor.view'), async (req: AuthRequest, res) => {
  try {
    if (!req.user || req.user.type !== 'staff') return forbidden(res, 'Staff access required')
    const scope = await resolveMonitorBranchScope(req.user.id, req.user.role)
    if (scope.kind === 'unassigned') {
      return ok(res, {
        totals: {
          totalCameras: 0,
          onlineCameras: 0,
          recordingCameras: 0,
          offlineCameras: 0,
          totalBranches: 0,
          onlineBranches: 0,
        },
        branches: [],
        insights: {
          manualCameras: 0,
          vigiCameras: 0,
          vigiNvrIntegrations: 0,
          motionEventsLast24h: 0,
          lastMotionAt: null,
          lastPingAt: null,
          onlineButStalePing: 0,
        },
        alerts: { branchesNeedingAttention: [], alertCount: 0 },
      })
    }

    const camWhere = cameraWhereForScope(scope)
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

    const branchInclude = {
      orderBy: { name: 'asc' as const },
      include: {
        cameraDevices: { select: { status: true } },
      },
    }
    const branchesQuery =
      scope.kind === 'branch'
        ? prisma.branch.findMany({ where: { id: scope.branchId }, ...branchInclude })
        : prisma.branch.findMany(branchInclude)

    const [
      statusGroups,
      sourceGroups,
      branches,
      vigiIntegrationCount,
      aggMotion,
      aggPing,
      motion24h,
      stalePingCount,
    ] = await Promise.all([
      prisma.cameraDevice.groupBy({
        by: ['status'],
        where: camWhere,
        _count: { _all: true },
      }),
      prisma.cameraDevice.groupBy({
        by: ['source'],
        where: camWhere,
        _count: { _all: true },
      }),
      branchesQuery,
      scope.kind === 'branch'
        ? prisma.vigiNvrIntegration.count({ where: { branchId: scope.branchId } })
        : prisma.vigiNvrIntegration.count(),
      prisma.cameraDevice.aggregate({ where: camWhere, _max: { lastMotionAt: true } }),
      prisma.cameraDevice.aggregate({ where: camWhere, _max: { lastPingAt: true } }),
      prisma.cameraDevice.count({
        where: { ...camWhere, lastMotionAt: { gte: dayAgo } },
      }),
      prisma.cameraDevice.count({
        where: {
          ...camWhere,
          status: { not: 'offline' },
          OR: [{ lastPingAt: null }, { lastPingAt: { lt: weekAgo } }],
        },
      }),
    ])

    const countFor = (s: string) =>
      statusGroups.find((g) => g.status === s)?._count._all ?? 0

    const countSource = (src: string) =>
      sourceGroups.find((g) => g.source === src)?._count._all ?? 0

    const totalCameras = statusGroups.reduce((acc, g) => acc + g._count._all, 0)
    const offlineCameras = countFor('offline')
    const recordingCameras = countFor('recording')
    const onlineCameras = totalCameras - offlineCameras
    const manualCameras = countSource('manual')
    const vigiCameras = countSource('vigi')

    const branchRows = branches.map((b) => {
      const cams = b.cameraDevices
      const total = cams.length
      const online = cams.filter((c) => c.status !== 'offline').length
      const offline = cams.filter((c) => c.status === 'offline').length
      const recording = cams.filter((c) => c.status === 'recording').length
      let status: 'online' | 'partial' | 'offline' = 'online'
      if (total === 0) status = 'online'
      else if (online === 0) status = 'offline'
      else if (online < total) status = 'partial'
      return {
        id: b.id,
        name: b.name,
        city: b.city,
        country: b.country,
        address: b.address,
        totalCameras: total,
        onlineCameras: online,
        offlineCameras: offline,
        recordingCameras: recording,
        status,
      }
    })

    const totalBranches = branches.length
    const onlineBranches = branchRows.filter((r) => r.status === 'online').length

    const branchesNeedingAttention = [...branchRows]
      .filter((r) => r.offlineCameras > 0)
      .sort((a, b) => b.offlineCameras - a.offlineCameras)
      .slice(0, 8)
      .map((r) => ({
        branchId: r.id,
        name: r.name,
        offlineCount: r.offlineCameras,
        totalCameras: r.totalCameras,
      }))

    return ok(res, {
      totals: {
        totalCameras,
        onlineCameras,
        recordingCameras,
        offlineCameras,
        totalBranches,
        onlineBranches,
      },
      branches: branchRows,
      insights: {
        manualCameras,
        vigiCameras,
        vigiNvrIntegrations: vigiIntegrationCount,
        motionEventsLast24h: motion24h,
        lastMotionAt: aggMotion._max.lastMotionAt?.toISOString() ?? null,
        lastPingAt: aggPing._max.lastPingAt?.toISOString() ?? null,
        onlineButStalePing: stalePingCount,
      },
      alerts: {
        branchesNeedingAttention,
        alertCount: branchesNeedingAttention.length,
      },
    })
  } catch (err) {
    return serverError(res, err)
  }
})

router.get('/cameras', requirePermission('monitor.view'), async (req: AuthRequest, res) => {
  try {
    if (!req.user || req.user.type !== 'staff') return forbidden(res, 'Staff access required')
    const scope = await resolveMonitorBranchScope(req.user.id, req.user.role)
    if (scope.kind === 'unassigned') {
      const { page, limit, skip } = getPagination(req.query as Record<string, any>)
      return ok(res, [], buildMeta(0, page, limit))
    }
    const query = { ...(req.query as Record<string, string | undefined>) }
    if (scope.kind === 'branch') {
      if (query.branchId && query.branchId !== scope.branchId) return forbidden(res, 'Cannot access another branch')
      query.branchId = scope.branchId
    }
    const { page, limit, skip } = getPagination(query as Record<string, any>)
    const { where, orderBy } = buildCameraListWhereAndOrder(query)

    const [cameras, total] = await Promise.all([
      prisma.cameraDevice.findMany({
        where: where as any,
        skip,
        take: limit,
        orderBy: orderBy as any,
      }),
      prisma.cameraDevice.count({ where: where as any }),
    ])
    return ok(res, cameras, buildMeta(total, page, limit))
  } catch (err) {
    return serverError(res, err)
  }
})

/** CSV export — same filters as GET /cameras (up to CAMERA_EXPORT_MAX rows). */
router.get('/cameras/export', requirePermission('monitor.view'), async (req: AuthRequest, res) => {
  try {
    if (!req.user || req.user.type !== 'staff') return forbidden(res, 'Staff access required')
    const scope = await resolveMonitorBranchScope(req.user.id, req.user.role)
    if (scope.kind === 'unassigned') {
      res.setHeader('Content-Type', 'text/csv; charset=utf-8')
      res.setHeader('Content-Disposition', 'attachment; filename="cameras-empty.csv"')
      return res.send('\uFEFFid\n')
    }
    const query = { ...(req.query as Record<string, string | undefined>) }
    if (scope.kind === 'branch') {
      if (query.branchId && query.branchId !== scope.branchId) return forbidden(res, 'Cannot access another branch')
      query.branchId = scope.branchId
    }
    const { where, orderBy } = buildCameraListWhereAndOrder(query)
    const rows = await prisma.cameraDevice.findMany({
      where: where as any,
      orderBy: orderBy as any,
      take: CAMERA_EXPORT_MAX,
    })

    const header = [
      'id',
      'branchId',
      'branchName',
      'label',
      'location',
      'status',
      'source',
      'vigiChannel',
      'resolution',
      'fps',
      'ipAddress',
      'lastPingAt',
      'lastMotionAt',
      'updatedAt',
      'notes',
    ]
    const lines = [header.join(',')]
    for (const r of rows) {
      lines.push(
        [
          csvEscapeCell(r.id),
          csvEscapeCell(r.branchId),
          csvEscapeCell(r.branchName),
          csvEscapeCell(r.label),
          csvEscapeCell(r.location),
          csvEscapeCell(r.status),
          csvEscapeCell(r.source),
          csvEscapeCell(r.vigiChannel),
          csvEscapeCell(r.resolution),
          csvEscapeCell(r.fps),
          csvEscapeCell(r.ipAddress),
          csvEscapeCell(r.lastPingAt),
          csvEscapeCell(r.lastMotionAt),
          csvEscapeCell(r.updatedAt),
          csvEscapeCell(r.notes),
        ].join(','),
      )
    }
    const branchBit = (req.query.branchId as string | undefined)?.slice(0, 8) ?? 'all'
    const filename = `cameras-${branchBit}-${new Date().toISOString().slice(0, 10)}.csv`
    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.send('\uFEFF' + lines.join('\n') + '\n')
  } catch (err) {
    return serverError(res, err)
  }
})

router.post(
  '/cameras',
  requireRoles(...SENIOR_ROLES as any),
  validate(cameraCreateSchema),
  async (req, res) => {
    try {
      const body = req.body as import('zod').infer<typeof cameraCreateSchema>
      const branch = await prisma.branch.findUnique({ where: { id: body.branchId } })
      if (!branch) return notFound(res, 'Branch')
      const camera = await prisma.cameraDevice.create({
        data: {
          ...body,
          branchName: body.branchName ?? branch.name,
        },
      })
      return created(res, camera)
    } catch (err) {
      return serverError(res, err)
    }
  },
)

/** PATCH /cameras/:id/ping — mark camera as seen (updates lastPingAt). Any operator can heartbeat a feed check. */
router.patch('/cameras/:id/ping', requirePermission('monitor.view'), async (req: AuthRequest, res) => {
  try {
    const existing = await prisma.cameraDevice.findUnique({ where: { id: req.params.id } })
    if (!existing) return notFound(res, 'Camera')
    if (!(await assertCameraBranchAccess(req, res, existing.branchId))) return
    const camera = await prisma.cameraDevice.update({
      where: { id: req.params.id },
      data: { lastPingAt: new Date() },
    })
    return ok(res, camera)
  } catch (err: any) {
    if (err?.code === 'P2025') return notFound(res, 'Camera')
    return serverError(res, err)
  }
})

router.get('/cameras/:id', requirePermission('monitor.view'), async (req: AuthRequest, res) => {
  try {
    const camera = await prisma.cameraDevice.findUnique({ where: { id: req.params.id } })
    if (!camera) return notFound(res, 'Camera')
    if (!(await assertCameraBranchAccess(req, res, camera.branchId))) return
    return ok(res, camera)
  } catch (err) {
    return serverError(res, err)
  }
})

router.put(
  '/cameras/:id',
  requireRoles(...SENIOR_ROLES as any),
  validate(cameraUpdateSchema),
  async (req, res) => {
    try {
      const body = req.body as Record<string, unknown>
      if (body.branchId) {
        const branch = await prisma.branch.findUnique({ where: { id: body.branchId as string } })
        if (!branch) return notFound(res, 'Branch')
      }
      const camera = await prisma.cameraDevice.update({
        where: { id: req.params.id },
        data: body as any,
      })
      return ok(res, camera)
    } catch (err: any) {
      if (err?.code === 'P2025') return notFound(res, 'Camera')
      return serverError(res, err)
    }
  },
)

router.delete('/cameras/:id', requireRoles(...SENIOR_ROLES as any), async (req, res) => {
  try {
    await prisma.cameraDevice.delete({ where: { id: req.params.id } })
    return ok(res, { message: 'Camera deleted' })
  } catch (err: any) {
    if (err?.code === 'P2025') return notFound(res, 'Camera')
    return serverError(res, err)
  }
})

router.patch(
  '/cameras/:id/status',
  requireRoles(...SENIOR_ROLES as any),
  validate(cameraStatusPatchSchema),
  async (req, res) => {
    try {
      const { status } = req.body as { status: string }
      const camera = await prisma.cameraDevice.update({
        where: { id: req.params.id },
        data: { status, lastPingAt: new Date() },
      })
      return ok(res, camera)
    } catch (err: any) {
      if (err?.code === 'P2025') return notFound(res, 'Camera')
      return serverError(res, err)
    }
  },
)

export default router
