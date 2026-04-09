import { Router } from 'express'
import prisma from '@/lib/prisma'
import { authenticate, requireStaff, requireRoles, SENIOR_ROLES } from '@/middleware/auth'
import { requirePermission } from '@/middleware/rbac'
import { validate } from '@/middleware/validate'
import { getPagination, buildMeta } from '@/utils/pagination'
import { ok, created, notFound, serverError } from '@/utils/response'
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

// ── DOMAINS ──
router.get('/domains', requireStaff, async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req)
    const { status } = req.query as Record<string, string>
    const where: any = {}
    if (status) where.status = status
    const [domains, total] = await Promise.all([
      prisma.domain.findMany({ where, skip, take: limit, orderBy: { expiryDate: 'asc' } }),
      prisma.domain.count({ where }),
    ])
    return ok(res, domains, buildMeta(total, page, limit))
  } catch (err) { serverError(res, err) }
})

router.post('/domains', requireRoles(...SENIOR_ROLES as any), async (req, res) => {
  try {
    const domain = await prisma.domain.create({
      data: {
        ...req.body,
        expiryDate:      req.body.expiryDate      ? new Date(req.body.expiryDate)      : undefined,
        registrationDate: req.body.registrationDate ? new Date(req.body.registrationDate) : undefined,
      },
    })
    return created(res, domain)
  } catch (err) { serverError(res, err) }
})

router.get('/domains/:id', requireStaff, async (req, res) => {
  try {
    const domain = await prisma.domain.findUnique({ where: { id: req.params.id } })
    if (!domain) return notFound(res)
    return ok(res, domain)
  } catch (err) { serverError(res, err) }
})

router.put('/domains/:id', requireRoles(...SENIOR_ROLES as any), async (req, res) => {
  try {
    const domain = await prisma.domain.update({ where: { id: req.params.id }, data: req.body })
    return ok(res, domain)
  } catch (err) { serverError(res, err) }
})

router.delete('/domains/:id', requireRoles(...SENIOR_ROLES as any), async (req, res) => {
  try {
    await prisma.domain.delete({ where: { id: req.params.id } })
    return ok(res, { message: 'Domain deleted' })
  } catch (err) { serverError(res, err) }
})

// ── SERVERS ──
router.get('/servers', requireStaff, async (req, res) => {
  try {
    const servers = await prisma.server.findMany({ orderBy: { name: 'asc' } })
    return ok(res, servers)
  } catch (err) { serverError(res, err) }
})

router.post('/servers', requireRoles(...SENIOR_ROLES as any), async (req, res) => {
  try {
    const server = await prisma.server.create({ data: req.body })
    return created(res, server)
  } catch (err) { serverError(res, err) }
})

router.get('/servers/:id', requireStaff, async (req, res) => {
  try {
    const server = await prisma.server.findUnique({ where: { id: req.params.id } })
    if (!server) return notFound(res)
    return ok(res, server)
  } catch (err) { serverError(res, err) }
})

router.put('/servers/:id', requireRoles(...SENIOR_ROLES as any), async (req, res) => {
  try {
    const server = await prisma.server.update({ where: { id: req.params.id }, data: req.body })
    return ok(res, server)
  } catch (err) { serverError(res, err) }
})

router.delete('/servers/:id', requireRoles(...SENIOR_ROLES as any), async (req, res) => {
  try {
    await prisma.server.delete({ where: { id: req.params.id } })
    return ok(res, { message: 'Server deleted' })
  } catch (err) { serverError(res, err) }
})

// ── WEBSITES ──
router.get('/websites', requireStaff, async (req, res) => {
  try {
    const websites = await prisma.website.findMany({ orderBy: { name: 'asc' } })
    return ok(res, websites)
  } catch (err) { serverError(res, err) }
})

router.post('/websites', requireRoles(...SENIOR_ROLES as any), async (req, res) => {
  try {
    const website = await prisma.website.create({ data: req.body })
    return created(res, website)
  } catch (err) { serverError(res, err) }
})

router.get('/websites/:id', requireStaff, async (req, res) => {
  try {
    const website = await prisma.website.findUnique({ where: { id: req.params.id } })
    if (!website) return notFound(res)
    return ok(res, website)
  } catch (err) { serverError(res, err) }
})

router.put('/websites/:id', requireRoles(...SENIOR_ROLES as any), async (req, res) => {
  try {
    const website = await prisma.website.update({ where: { id: req.params.id }, data: req.body })
    return ok(res, website)
  } catch (err) { serverError(res, err) }
})

router.delete('/websites/:id', requireRoles(...SENIOR_ROLES as any), async (req, res) => {
  try {
    await prisma.website.delete({ where: { id: req.params.id } })
    return ok(res, { message: 'Website deleted' })
  } catch (err) { serverError(res, err) }
})

// ── CAMERA DEVICES (CCTV) ──
// Register `/cameras/summary` before `/cameras/:id` so `summary` is not parsed as an id.

router.get('/cameras/summary', requirePermission('monitor.view'), async (_req, res) => {
  try {
    const [statusGroups, branches] = await Promise.all([
      prisma.cameraDevice.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),
      prisma.branch.findMany({
        orderBy: { name: 'asc' },
        include: {
          cameraDevices: { select: { status: true } },
        },
      }),
    ])

    const countFor = (s: string) =>
      statusGroups.find((g) => g.status === s)?._count._all ?? 0

    const totalCameras = statusGroups.reduce((acc, g) => acc + g._count._all, 0)
    const offlineCameras = countFor('offline')
    const recordingCameras = countFor('recording')
    const onlineCameras = totalCameras - offlineCameras

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
    })
  } catch (err) {
    return serverError(res, err)
  }
})

router.get('/cameras', requirePermission('monitor.view'), async (req, res) => {
  try {
    const { branchId, status } = req.query as Record<string, string>
    const { page, limit, skip } = getPagination(req)
    const where: Record<string, unknown> = {}
    if (branchId) where.branchId = branchId
    if (status) where.status = status
    const [cameras, total] = await Promise.all([
      prisma.cameraDevice.findMany({
        where: where as any,
        skip,
        take: limit,
        orderBy: { label: 'asc' },
      }),
      prisma.cameraDevice.count({ where: where as any }),
    ])
    return ok(res, cameras, buildMeta(total, page, limit))
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

router.get('/cameras/:id', requirePermission('monitor.view'), async (req, res) => {
  try {
    const camera = await prisma.cameraDevice.findUnique({ where: { id: req.params.id } })
    if (!camera) return notFound(res, 'Camera')
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
