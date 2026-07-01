import { Router } from 'express'
import { z } from 'zod'
import type { Prisma } from '@prisma/client'
import { authenticate, isManager, isCEO, type AuthRequest } from '@/middleware/auth'
import { validate } from '@/middleware/validate'
import prisma from '@/lib/prisma'
import { audit } from '@/lib/auditLog'
import { canAccessProject, isGlobalProjectRole, projectWhereForRequest } from '@/lib/projectScope'
import { isNonBranchLabel, resolveBranchId } from '@/lib/branchResolve'
import { ok, created, notFound, serverError, paginated, forbidden } from '@/lib/response'
import { getPagination, paginatedMeta, buildMeta} from '@/lib/pagination'
import { ProjectStatus, Priority, ApprovalStatus, type SystemRole } from '@prisma/client'

const router = Router()
router.use(authenticate)

const schema = z.object({
  name:           z.string().min(2),
  projectType:    z.string().optional(),
  serviceType:    z.string().optional(),
  priority:       z.nativeEnum(Priority).default('MEDIUM'),
  clientName:     z.string().optional(),
  clientEmail:    z.string().email().optional(),
  assignedBranch: z.string().optional(),
  assignedTo:     z.string().optional(),
  startDate:      z.string().optional(),
  deadline:       z.string().optional(),
  price:          z.number().optional(),
  notes:          z.string().optional(),
})

router.get('/', async (req: AuthRequest, res) => {
  try {
    const { page, limit, skip } = getPagination(req)
    const { q, status, priority, branch } = req.query as Record<string, string>
    const role = req.user!.role as SystemRole
    const branchId = branch ? await resolveBranchId(branch) : null

    if (role === 'BRANCH_MANAGER' && branch?.trim()) {
      const me = await prisma.staffMember.findUnique({
        where: { id: req.user!.id },
        select: { branchId: true },
      })
      if (!me?.branchId) return forbidden(res, 'No branch assigned')
      if (!branchId && !isNonBranchLabel(branch)) return forbidden(res, 'Cannot filter another branch')
      if (branchId && branchId !== me.branchId) return forbidden(res, 'Cannot filter another branch')
    }

    const filter: Prisma.ProjectWhereInput = {}
    if (q) filter.name = { contains: q }
    if (status) filter.status = status as ProjectStatus
    if (priority) filter.priority = priority as Priority
    if (branchId) filter.branchId = branchId

    const scopeW = await projectWhereForRequest(req.user!.id, role)
    let where: Prisma.ProjectWhereInput
    if (isGlobalProjectRole(role)) {
      where = filter
    } else {
      where =
        Object.keys(filter).length === 0
          ? scopeW
          : { AND: [filter, scopeW] }
    }

    const [data, total] = await Promise.all([
      prisma.project.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      prisma.project.count({ where }),
    ])
    return paginated(res, data, buildMeta(total, page, limit))
  } catch { return serverError(res) }
})

router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const allowed = await canAccessProject(req, req.params.id)
    if (!allowed) return notFound(res, 'Project')
    const project = await prisma.project.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        projectId: true,
        name: true,
        status: true,
        priority: true,
        clientName: true,
        notes: true,
        startDate: true,
        deadline: true,
        progress: true,
        price: true,
        paidAmount: true,
        paymentStatus: true,
        assignedTo: true,
        createdAt: true,
      },
    })
    if (!project) return notFound(res, 'Project')
    return ok(res, project)
  } catch { return serverError(res) }
})

router.post('/', isManager, validate(schema), async (req: AuthRequest, res) => {
  try {
    const assigned = (req.body.assignedBranch as string | undefined)?.trim()
    const branchId = assigned ? await resolveBranchId(assigned) : null
    if (assigned && !branchId && !isNonBranchLabel(assigned)) return forbidden(res, 'Unknown branch')

    if (req.user!.role === 'BRANCH_MANAGER') {
      const me = await prisma.staffMember.findUnique({
        where: { id: req.user!.id },
        select: { branchId: true },
      })
      if (!me?.branchId) return forbidden(res, 'No branch assigned')
      if (branchId && branchId !== me.branchId) return forbidden(res, 'Cannot assign another branch')
    }
    const project = await prisma.project.create({
      data: {
        ...req.body,
        branchId: branchId || undefined,
        createdByRole: req.user!.role,
        startDate: req.body.startDate ? new Date(req.body.startDate) : undefined,
        deadline: req.body.deadline ? new Date(req.body.deadline) : undefined,
      },
    })
    await audit(req, {
      action: 'project.create',
      resourceKind: 'Project',
      resourceId: project.id,
      after: project,
    })
    return created(res, project)
  } catch { return serverError(res) }
})

router.put('/:id', isManager, validate(schema.partial()), async (req: AuthRequest, res) => {
  try {
    const allowed = await canAccessProject(req, req.params.id)
    if (!allowed) return notFound(res, 'Project')
    const assigned = (req.body.assignedBranch as string | undefined)?.trim()
    const branchId = req.body.assignedBranch !== undefined
      ? assigned
        ? await resolveBranchId(assigned)
        : null
      : undefined
    if (assigned && !branchId && !isNonBranchLabel(assigned)) return forbidden(res, 'Unknown branch')

    if (req.user!.role === 'BRANCH_MANAGER' && branchId !== undefined) {
      const me = await prisma.staffMember.findUnique({
        where: { id: req.user!.id },
        select: { branchId: true },
      })
      if (!me?.branchId) return forbidden(res, 'No branch assigned')
      if (branchId && branchId !== me.branchId) return forbidden(res, 'Cannot assign another branch')
    }

    const project = await prisma.project.update({
      where: { id: req.params.id },
      data: {
        ...req.body,
        ...(branchId !== undefined ? { branchId } : {}),
      },
    })
    await audit(req, {
      action: 'project.update',
      resourceKind: 'Project',
      resourceId: project.id,
      after: project,
    })
    return ok(res, project)
  } catch { return serverError(res) }
})

router.delete('/:id', isCEO, async (req, res) => {
  try {
    const project = await prisma.project.update({ where: { id: req.params.id }, data: { status: 'CANCELLED' } })
    await audit(req as AuthRequest, {
      action: 'project.cancel',
      resourceKind: 'Project',
      resourceId: project.id,
      after: project,
    })
    return ok(res, { message: 'Project cancelled' })
  } catch { return serverError(res) }
})

export default router
