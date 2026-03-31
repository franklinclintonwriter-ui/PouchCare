import { ApprovalStatus, OrderStatus, WalletTxType, Priority } from '@prisma/client'
import { Router } from 'express'
import { z } from 'zod'
import { authenticate, isManager, isCEO, type AuthRequest } from '@/middleware/auth'
import { validate } from '@/middleware/validate'
import prisma from '@/lib/prisma'
import { ok, created, badRequest, notFound, forbidden, serverError, paginated } from '@/lib/response'
import { getPagination, paginatedMeta, buildMeta} from '@/lib/pagination'

const router = Router()
router.use(authenticate)

const taskSchema = z.object({
  title:              z.string().min(2),
  priority:           z.nativeEnum(Priority).default('MEDIUM'),
  category:           z.string().optional(),
  assignedMemberId:   z.string().optional(),
  assignedManagerId:  z.string().optional(),
  assignedBranch:     z.string().optional(),
  relatedProjectId:   z.string().optional(),
  relatedClient:      z.string().optional(),
  startDate:          z.string().optional(),
  deadline:           z.string().optional(),
  estimatedHours:     z.number().optional(),
  isRecurring:        z.boolean().default(false),
  recurringFrequency: z.string().optional(),
  notes:              z.string().optional(),
})

// GET /tasks
router.get('/', async (req: AuthRequest, res) => {
  try {
    const { page, limit, skip } = getPagination(req)
    const { q, status, approvalStatus, priority, branch, assignedTo } = req.query as Record<string, string>
    const where: any = {}

    if (q)              where.title = { contains: q, mode: 'insensitive' }
    if (status)         where.status = status
    if (approvalStatus) {
      // Map display strings to enum values
      const statusMap: Record<string, string> = {
        'Waiting for Submission': 'WAITING',
        'Submitted by Staff': 'SUBMITTED',
        'Approved by Manager': 'APPROVED_MGR',
        'Rejected by Manager': 'REJECTED_MGR',
        'Escalated to CEO': 'ESCALATED',
        'Completed & Verified': 'VERIFIED',
      }
      where.approvalStatus = statusMap[approvalStatus] || approvalStatus
    }
    if (priority)       where.priority = priority
    if (branch)         where.assignedBranch = branch

    // Staff only see their own tasks
    if (['STAFF', 'INTERN'].includes(req.user!.role)) {
      where.assignedMemberId = req.user!.id
    } else if (assignedTo) {
      where.assignedMemberId = assignedTo
    }

    const [data, total] = await Promise.all([
      prisma.task.findMany({
        where, skip, take: limit,
        orderBy: [{ priority: 'asc' }, { deadline: 'asc' }],
        include: {
          assignedMember:  { select: { id: true, name: true } },
          assignedManager: { select: { id: true, name: true } },
        },
      }),
      prisma.task.count({ where }),
    ])
    return paginated(res, data, buildMeta(total, page, limit))
  } catch (e) { console.error(e); return serverError(res) }
})

// GET /tasks/:id
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const task = await prisma.task.findUnique({
      where: { id: req.params.id },
      include: {
        assignedMember:  { select: { id: true, name: true } },
        assignedManager: { select: { id: true, name: true } },
        comments:        { orderBy: { createdAt: 'asc' } },
        // project include removed - use projectId,
      },
    })
    if (!task) return notFound(res, 'Task')
    // Staff can only see own tasks
    if (['STAFF', 'INTERN'].includes(req.user!.role) && task.assignedMemberId !== req.user!.id)
      return notFound(res, 'Task')
    return ok(res, task)
  } catch { return serverError(res) }
})

// POST /tasks — CEO/Manager creates
router.post('/', isManager, validate(taskSchema), async (req: AuthRequest, res) => {
  try {
    const task = await prisma.task.create({
      data: {
        ...req.body,
        createdByRole: req.user!.role,
        startDate:     req.body.startDate  ? new Date(req.body.startDate)  : undefined,
        deadline:      req.body.deadline   ? new Date(req.body.deadline)   : undefined,
      },
    })
    // Increment assignee's task count
    if (task.assignedMemberId) {
      await prisma.staffMember.update({ where: { id: task.assignedMemberId }, data: { tasksAssigned: { increment: 1 } } })
    }
    return created(res, task)
  } catch (e) { console.error(e); return serverError(res) }
})

// PUT /tasks/:id
router.put('/:id', validate(taskSchema.partial()), async (req: AuthRequest, res) => {
  try {
    const task = await prisma.task.findUnique({ where: { id: req.params.id } })
    if (!task) return notFound(res, 'Task')

    // Staff can only update own tasks (progress + notes only)
    if (['STAFF', 'INTERN'].includes(req.user!.role)) {
      if (task.assignedMemberId !== req.user!.id) return forbidden(res)
      const { progress, notes, actualHours } = req.body
      const updated = await prisma.task.update({ where: { id: req.params.id }, data: { progress, notes, actualHours } })
      return ok(res, updated)
    }

    const updated = await prisma.task.update({
      where: { id: req.params.id },
      data: {
        ...req.body,
        startDate: req.body.startDate ? new Date(req.body.startDate) : undefined,
        deadline:  req.body.deadline  ? new Date(req.body.deadline)  : undefined,
      },
    })
    return ok(res, updated)
  } catch { return serverError(res) }
})

// DELETE /tasks/:id — CEO only
router.delete('/:id', isCEO, async (req, res) => {
  try {
    await prisma.task.delete({ where: { id: req.params.id } })
    return ok(res, { message: 'Task deleted' })
  } catch { return serverError(res) }
})

// ── Approval Workflow ─────────────────────────────────

// POST /tasks/:id/submit — Staff submits for review
router.post('/:id/submit', async (req: AuthRequest, res) => {
  try {
    const task = await prisma.task.findUnique({ where: { id: req.params.id } })
    if (!task) return notFound(res, 'Task')
    if (task.assignedMemberId !== req.user!.id) return forbidden(res)
    if (task.approvalStatus !== ApprovalStatus.WAITING) return badRequest(res, 'Task already submitted')

    const updated = await prisma.task.update({
      where: { id: req.params.id },
      data: {
        approvalStatus:     ApprovalStatus.SUBMITTED,
        status:             'REVIEW',
        staffSubmissionNote: req.body.note,
        actualHours:        req.body.actualHours,
        progress:           req.body.progress || 100,
      },
    })
    return ok(res, updated)
  } catch { return serverError(res) }
})

// POST /tasks/:id/approve — Manager approves
router.post('/:id/approve', isManager, async (req: AuthRequest, res) => {
  try {
    const task = await prisma.task.findUnique({ where: { id: req.params.id } })
    if (!task) return notFound(res, 'Task')
    if (!([ApprovalStatus.SUBMITTED, ApprovalStatus.ESCALATED] as ApprovalStatus[]).includes(task.approvalStatus))
      return badRequest(res, 'Task not in a reviewable state')

    const updated = await prisma.task.update({
      where: { id: req.params.id },
      data: {
        approvalStatus:     ApprovalStatus.APPROVED_MGR,
        managerApprovedBy:  req.user!.id,
        managerApprovedDate: new Date(),
        managerApprovalNote: req.body.note,
      },
    })
    return ok(res, updated)
  } catch { return serverError(res) }
})

// POST /tasks/:id/reject — Manager rejects
router.post('/:id/reject', isManager, async (req: AuthRequest, res) => {
  try {
    const task = await prisma.task.findUnique({ where: { id: req.params.id } })
    if (!task) return notFound(res, 'Task')

    const updated = await prisma.task.update({
      where: { id: req.params.id },
      data: {
        approvalStatus:     ApprovalStatus.REJECTED_MGR,
        status:             'IN_PROGRESS',
        managerApprovedBy:  req.user!.id,
        managerApprovedDate: new Date(),
        managerApprovalNote: req.body.note,
      },
    })
    return ok(res, updated)
  } catch { return serverError(res) }
})

// POST /tasks/:id/escalate — Escalate to CEO
router.post('/:id/escalate', isManager, async (req, res) => {
  try {
    const updated = await prisma.task.update({
      where: { id: req.params.id },
      data: { approvalStatus: ApprovalStatus.ESCALATED },
    })
    return ok(res, updated)
  } catch { return serverError(res) }
})

// POST /tasks/:id/verify — CEO verifies
router.post('/:id/verify', isCEO, async (req: AuthRequest, res) => {
  try {
    const task = await prisma.task.findUnique({ where: { id: req.params.id } })
    if (!task) return notFound(res, 'Task')

    const updated = await prisma.task.update({
      where: { id: req.params.id },
      data: {
        approvalStatus:  ApprovalStatus.VERIFIED,
        status:          'DONE',
        ceoVerified:     true,
        ceoVerifiedDate: new Date(),
        completedDate:   new Date(),
      },
    })

    // Update assignee's completed count
    if (task.assignedMemberId) {
      await prisma.staffMember.update({ where: { id: task.assignedMemberId }, data: { tasksCompleted: { increment: 1 } } })
    }
    return ok(res, updated)
  } catch { return serverError(res) }
})

// POST /tasks/:id/rate — CEO rates 1-10
router.post('/:id/rate', isCEO, validate(z.object({ rating: z.number().min(1).max(10), note: z.string().optional() })), async (req: AuthRequest, res) => {
  try {
    const task = await prisma.task.findUnique({ where: { id: req.params.id } })
    if (!task) return notFound(res, 'Task')

    const updated = await prisma.task.update({
      where: { id: req.params.id },
      data: { ceoWorkRating: req.body.rating, ceoRatingNote: req.body.note, ceoRatedDate: new Date() },
    })

    // Update member's average rating
    if (task.assignedMemberId) {
      const rated = await prisma.task.findMany({
        where: { assignedMemberId: task.assignedMemberId, ceoWorkRating: { not: null } },
        select: { ceoWorkRating: true },
      })
      const avg = rated.reduce((s, t) => s + (t.ceoWorkRating || 0), 0) / rated.length
      await prisma.staffMember.update({
        where: { id: task.assignedMemberId },
        data: { averageTaskRating: parseFloat(avg.toFixed(2)), totalTasksRated: rated.length },
      })
    }
    return ok(res, updated)
  } catch { return serverError(res) }
})

// ── Comments ──────────────────────────────────────────

// GET /tasks/:id/comments
router.get('/:id/comments', async (req, res) => {
  try {
    const comments = await prisma.taskComment.findMany({
      where: { taskId: req.params.id }, orderBy: { createdAt: 'asc' },
    })
    return ok(res, comments)
  } catch { return serverError(res) }
})

// POST /tasks/:id/comments
router.post('/:id/comments', validate(z.object({ content: z.string().min(1) })), async (req: AuthRequest, res) => {
  try {
    const author = await prisma.staffMember.findUnique({ where: { id: req.user!.id }, select: { name: true } })
    const comment = await prisma.taskComment.create({
      data: { taskId: req.params.id, authorId: req.user!.id, authorName: author?.name || 'Unknown', content: req.body.content },
    })
    return created(res, comment)
  } catch { return serverError(res) }
})

export default router
