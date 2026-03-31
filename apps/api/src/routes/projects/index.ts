import { Router } from 'express'
import { z } from 'zod'
import { authenticate, isManager, isCEO, type AuthRequest } from '@/middleware/auth'
import { validate } from '@/middleware/validate'
import prisma from '@/lib/prisma'
import { ok, created, notFound, serverError, paginated } from '@/lib/response'
import { getPagination, paginatedMeta, buildMeta} from '@/lib/pagination'
import { ProjectStatus, Priority, ApprovalStatus } from '@prisma/client'

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
    const where: any = {}
    if (q)        where.name = { contains: q, mode: 'insensitive' }
    if (status)   where.status = status
    if (priority) where.priority = priority
    if (branch)   where.assignedBranch = branch
    const [data, total] = await Promise.all([
      prisma.project.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      prisma.project.count({ where }),
    ])
    return paginated(res, data, buildMeta(limit, total, page))
  } catch { return serverError(res) }
})

router.get('/:id', async (req, res) => {
  try {
    const project = await prisma.project.findUnique({ where: { id: req.params.id }, select: { id: true, projectId: true, name: true, status: true, priority: true, clientName: true, deadline: true, progress: true, paymentStatus: true, assignedTo: true } })
    if (!project) return notFound(res, 'Project')
    return ok(res, project)
  } catch { return serverError(res) }
})

router.post('/', isManager, validate(schema), async (req: AuthRequest, res) => {
  try {
    const project = await prisma.project.create({
      data: { ...req.body, createdByRole: req.user!.role, startDate: req.body.startDate ? new Date(req.body.startDate) : undefined, deadline: req.body.deadline ? new Date(req.body.deadline) : undefined },
    })
    return created(res, project)
  } catch { return serverError(res) }
})

router.put('/:id', isManager, validate(schema.partial()), async (req, res) => {
  try {
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
