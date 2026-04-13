import { Router } from 'express'
import { z } from 'zod'
import type { Prisma } from '@prisma/client'
import { authenticate, isManager, isCEO, type AuthRequest } from '@/middleware/auth'
import { validate } from '@/middleware/validate'
import prisma from '@/lib/prisma'
import { canAccessProject, isGlobalProjectRole, projectWhereForRequest } from '@/lib/projectScope'
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

    if (role === 'BRANCH_MANAGER' && branch?.trim()) {
      const me = await prisma.staffMember.findUnique({
        where: { id: req.user!.id },
        select: { branch: true },
      })
      const mine = me?.branch?.trim()
      if (mine && branch.trim() !== mine) return forbidden(res, 'Cannot filter another branch')
    }

    const filter: Prisma.ProjectWhereInput = {}
    if (q) filter.name = { contains: q, mode: 'insensitive' }
    if (status) filter.status = status as ProjectStatus
    if (priority) filter.priority = priority as Priority
    if (branch) filter.assignedBranch = branch

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
    if (req.user!.role === 'BRANCH_MANAGER') {
      const me = await prisma.staffMember.findUnique({
        where: { id: req.user!.id },
        select: { branch: true },
      })
      const mine = me?.branch?.trim()
      const assigned = (req.body.assignedBranch as string | undefined)?.trim()
      if (mine && assigned && assigned !== mine) return forbidden(res, 'Cannot assign another branch')
    }
    const project = await prisma.project.create({
      data: { ...req.body, createdByRole: req.user!.role, startDate: req.body.startDate ? new Date(req.body.startDate) : undefined, deadline: req.body.deadline ? new Date(req.body.deadline) : undefined },
    })
    return created(res, project)
  } catch { return serverError(res) }
})

router.put('/:id', isManager, validate(schema.partial()), async (req: AuthRequest, res) => {
  try {
    const allowed = await canAccessProject(req, req.params.id)
    if (!allowed) return notFound(res, 'Project')
    const project = await prisma.project.update({ where: { id: req.params.id }, data: req.body })
    return ok(res, project)
  } catch { return serverError(res) }
})

router.delete('/:id', isCEO, async (req, res) => {
  try {
    await prisma.project.update({ where: { id: req.params.id }, data: { status: 'CANCELLED' } })
    return ok(res, { message: 'Project cancelled' })
  } catch { return serverError(res) }
})

export default router
