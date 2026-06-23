import { ApprovalStatus, Priority, type SystemRole } from '@prisma/client'
import { Router } from 'express'
import multer from 'multer'
import { z } from 'zod'
import { authenticate, isManager, isCEO, type AuthRequest } from '@/middleware/auth'
import { validate } from '@/middleware/validate'
import prisma from '@/lib/prisma'
import { ok, created, badRequest, notFound, forbidden, serverError, paginated } from '@/lib/response'
import { getPagination, buildMeta } from '@/lib/pagination'
import { uploadFile } from '@/lib/storage'
import { TASK_CATEGORIES, isValidTaskCategory } from './constants'
import { canEditTaskAssignment } from './access'
import { resolveBranchId, isNonBranchLabel } from '@/lib/branchResolve'

const router = Router()
router.use(authenticate)

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024, files: 12 },
})

const taskSchema = z.object({
  title: z.string().min(2),
  priority: z.nativeEnum(Priority).default('MEDIUM'),
  category: z.string().optional(),
  assignedMemberId: z.union([z.string().min(1), z.null()]).optional(),
  assignedManagerId: z.union([z.string().min(1), z.null()]).optional(),
  assignedBranch: z.string().optional(),
  relatedProjectId: z.string().optional(),
  relatedClient: z.string().optional(),
  startDate: z.string().optional(),
  deadline: z.string().optional(),
  estimatedHours: z.number().optional(),
  isRecurring: z.boolean().default(false),
  recurringFrequency: z.string().optional(),
  notes: z.string().optional(),
})

type TaskAttachmentJson = { url: string; name: string; uploadedAt: string }

async function syncAssigneeTaskCount(prevId: string | null | undefined, nextId: string | null | undefined) {
  if (prevId === nextId) return
  if (prevId) {
    await prisma.staffMember.update({
      where: { id: prevId },
      data: { tasksAssigned: { decrement: 1 } },
    }).catch(() => {})
  }
  if (nextId) {
    await prisma.staffMember.update({
      where: { id: nextId },
      data: { tasksAssigned: { increment: 1 } },
    })
  }
}

function parseAttachments(raw: unknown): TaskAttachmentJson[] {
  if (!raw || typeof raw !== 'object') return []
  if (!Array.isArray(raw)) return []
  return raw.filter(
    (x): x is TaskAttachmentJson =>
      !!x &&
      typeof x === 'object' &&
      typeof (x as TaskAttachmentJson).url === 'string' &&
      typeof (x as TaskAttachmentJson).name === 'string',
  )
}

// GET /tasks/meta — categories + branches (for create form)
router.get('/meta', isManager, async (_req, res) => {
  try {
    const branches = await prisma.branch.findMany({
      where: { status: 'Active' },
      select: { id: true, name: true, city: true },
      orderBy: { name: 'asc' },
    })
    return ok(res, { categories: [...TASK_CATEGORIES], branches })
  } catch (e) {
    console.error(e)
    return serverError(res)
  }
})

// GET /tasks
router.get('/', async (req: AuthRequest, res) => {
  try {
    const { page, limit, skip } = getPagination(req)
    const { q, status, approvalStatus, priority, branch, assignedTo, projectId, category, mine } = req.query as Record<
      string,
      string
    >
    const where: Record<string, unknown> = {}

    if (q) where.title = { contains: q }
    if (status) where.status = status
    if (category) where.category = category
    if (approvalStatus) {
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
    if (priority) where.priority = priority
    if (branch) where.assignedBranch = branch

    if (['STAFF', 'INTERN'].includes(req.user!.role)) {
      where.assignedMemberId = req.user!.id
    } else if (mine === 'true' || mine === '1') {
      where.assignedMemberId = req.user!.id
    } else if (assignedTo) {
      where.assignedMemberId = assignedTo
    }

    if (projectId) {
      const projectScope = { relatedProjectId: projectId }
      const existing = { ...where }
      if (Object.keys(existing).length === 0) {
        Object.assign(where, projectScope)
      } else {
        Object.keys(where).forEach((k) => delete where[k])
        where.AND = [existing, projectScope]
      }
    }

    const [data, total] = await Promise.all([
      prisma.task.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ priority: 'asc' }, { deadline: 'asc' }],
        include: {
          assignedMember: { select: { id: true, name: true } },
          assignedManager: { select: { id: true, name: true } },
        },
      }),
      prisma.task.count({ where }),
    ])
    return paginated(res, data, buildMeta(total, page, limit))
  } catch (e) {
    console.error(e)
    return serverError(res)
  }
})

// GET /tasks/:id
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const task = await prisma.task.findUnique({
      where: { id: req.params.id },
      include: {
        assignedMember: { select: { id: true, name: true } },
        assignedManager: { select: { id: true, name: true } },
        comments: { orderBy: { createdAt: 'asc' } },
      },
    })
    if (!task) return notFound(res, 'Task')
    if (['STAFF', 'INTERN'].includes(req.user!.role) && task.assignedMemberId !== req.user!.id)
      return notFound(res, 'Task')
    return ok(res, task)
  } catch {
    return serverError(res)
  }
})

// POST /tasks — CEO/Manager creates
router.post('/', isManager, validate(taskSchema), async (req: AuthRequest, res) => {
  try {
    const body = req.body as z.infer<typeof taskSchema> & { relatedProjectId?: string }
    let relatedProject: string | undefined
    if (body.relatedProjectId) {
      const p = await prisma.project.findUnique({
        where: { id: body.relatedProjectId },
        select: { id: true, name: true },
      })
      if (!p) return badRequest(res, 'Invalid projectId')
      relatedProject = p.name
    }

    const cat =
      body.category && isValidTaskCategory(body.category)
        ? body.category
        : body.category
          ? 'Other'
          : undefined

    let assignedBranch: string | undefined
    let branchId: string | null = null
    if (body.assignedBranch !== undefined) {
      const trimmed = body.assignedBranch.trim()
      branchId = await resolveBranchId(body.assignedBranch)
      if (trimmed && !branchId && !isNonBranchLabel(trimmed)) return badRequest(res, 'Unknown branch')
      assignedBranch = trimmed || undefined
    } else {
      if (body.assignedMemberId) {
        const assignee = await prisma.staffMember.findUnique({
          where: { id: body.assignedMemberId },
          select: { branchId: true, branch: true },
        })
        branchId = assignee?.branchId ?? null
        assignedBranch = assignee?.branch?.trim() || undefined
      }
      if (!branchId && body.assignedManagerId) {
        const manager = await prisma.staffMember.findUnique({
          where: { id: body.assignedManagerId },
          select: { branchId: true, branch: true },
        })
        branchId = manager?.branchId ?? null
        if (!assignedBranch) assignedBranch = manager?.branch?.trim() || undefined
      }
    }

    const data = {
      title: body.title,
      priority: body.priority,
      category: cat ?? undefined,
      assignedMemberId: body.assignedMemberId || undefined,
      assignedManagerId: body.assignedManagerId || undefined,
      assignedBranch,
      branchId: branchId || undefined,
      relatedProject,
      relatedProjectId: body.relatedProjectId || undefined,
      relatedClient: body.relatedClient || undefined,
      startDate: body.startDate ? new Date(body.startDate) : undefined,
      deadline: body.deadline ? new Date(body.deadline) : undefined,
      estimatedHours: body.estimatedHours,
      isRecurring: body.isRecurring,
      recurringFrequency: body.recurringFrequency || undefined,
      notes: body.notes || undefined,
      createdByRole: req.user!.role,
    }

    const task = await prisma.task.create({ data })
    if (task.assignedMemberId) {
      await prisma.staffMember.update({
        where: { id: task.assignedMemberId },
        data: { tasksAssigned: { increment: 1 } },
      })
    }
    return created(res, task)
  } catch (e) {
    console.error(e)
    return serverError(res)
  }
})

const staffUpdateSchema = z.object({
  progress: z.number().min(0).max(100).optional(),
  notes: z.string().optional(),
  actualHours: z.number().optional(),
  status: z.enum(['NOT_STARTED', 'IN_PROGRESS']).optional(),
})

// PUT /tasks/:id
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const task = await prisma.task.findUnique({ where: { id: req.params.id } })
    if (!task) return notFound(res, 'Task')

    if (['STAFF', 'INTERN'].includes(req.user!.role)) {
      if (task.assignedMemberId !== req.user!.id) return forbidden(res)
      const parsed = staffUpdateSchema.safeParse(req.body)
      if (!parsed.success) return badRequest(res, 'Invalid update')
      const { progress, notes, actualHours, status } = parsed.data
      const data: Record<string, unknown> = {}
      if (typeof progress === 'number') {
        data.progress = progress
        data.progressUpdatedAt = new Date()
      }
      if (notes !== undefined) data.notes = notes
      if (actualHours !== undefined) data.actualHours = actualHours
      if (status === 'IN_PROGRESS' && task.status === 'NOT_STARTED') {
        data.status = 'IN_PROGRESS'
      }
      const updated = await prisma.task.update({ where: { id: req.params.id }, data })
      return ok(res, updated)
    }

    if (!['CEO', 'CO_MD', 'OP_MANAGER', 'HR_MANAGER', 'BRANCH_MANAGER'].includes(req.user!.role)) {
      return forbidden(res)
    }

    const partial = taskSchema.partial().safeParse(req.body)
    if (!partial.success) return badRequest(res, 'Invalid payload')

    const body = partial.data
    const isBranchOnly = req.user!.role === 'BRANCH_MANAGER'
    if (isBranchOnly) {
      const okAssign = await canEditTaskAssignment(req.user!.id, req.user!.role as SystemRole, task)
      if (!okAssign) return forbidden(res, 'Not allowed to edit this task')
      const data: Record<string, unknown> = {}
      if (body.assignedMemberId !== undefined) {
        await syncAssigneeTaskCount(task.assignedMemberId, body.assignedMemberId || null)
        data.assignedMemberId = body.assignedMemberId || null
      }
      if (body.assignedManagerId !== undefined) data.assignedManagerId = body.assignedManagerId || null
      if (body.notes !== undefined) data.notes = body.notes
      if (body.deadline !== undefined) data.deadline = body.deadline ? new Date(body.deadline) : null
      if (body.priority !== undefined) data.priority = body.priority
      const updated = await prisma.task.update({ where: { id: req.params.id }, data })
      return ok(res, updated)
    }

    let relatedProject: string | undefined | null = undefined
    if (body.relatedProjectId !== undefined) {
      if (body.relatedProjectId) {
        const p = await prisma.project.findUnique({
          where: { id: body.relatedProjectId },
          select: { id: true, name: true },
        })
        if (!p) return badRequest(res, 'Invalid projectId')
        relatedProject = p.name
      } else {
        relatedProject = null
      }
    }

    const cat =
      body.category !== undefined
        ? body.category && isValidTaskCategory(body.category)
          ? body.category
          : body.category
            ? 'Other'
            : null
        : undefined

    const data: Record<string, unknown> = {}
    const keys = [
      'title',
      'priority',
      'assignedMemberId',
      'assignedManagerId',
      'relatedClient',
      'estimatedHours',
      'isRecurring',
      'recurringFrequency',
      'notes',
    ] as const
    for (const k of keys) {
      if (body[k] !== undefined) data[k] = body[k]
    }
    if (cat !== undefined) data.category = cat
    if (relatedProject !== undefined) data.relatedProject = relatedProject
    if (body.relatedProjectId !== undefined) {
      data.relatedProjectId = body.relatedProjectId || null
    }
    if (body.startDate !== undefined) data.startDate = body.startDate ? new Date(body.startDate) : null
    if (body.deadline !== undefined) data.deadline = body.deadline ? new Date(body.deadline) : null
    if (body.assignedBranch !== undefined) {
      const trimmed = body.assignedBranch?.trim() ?? ''
      const branchId = await resolveBranchId(body.assignedBranch)
      // Allow the "Company — Global" sentinel / blanks (→ branchId null); reject only real typos.
      if (trimmed && !branchId && !isNonBranchLabel(trimmed)) return badRequest(res, 'Unknown branch')
      data.branchId = branchId
      data.assignedBranch = trimmed || null
    }

    const nextMemberId =
      body.assignedMemberId !== undefined ? body.assignedMemberId || null : undefined
    if (nextMemberId !== undefined) {
      await syncAssigneeTaskCount(task.assignedMemberId, nextMemberId)
    }

    const updated = await prisma.task.update({
      where: { id: req.params.id },
      data: data as any,
    })
    return ok(res, updated)
  } catch (e) {
    console.error(e)
    return serverError(res)
  }
})

// POST /tasks/:id/attachments — add documents (managers + assignee)
router.post(
  '/:id/attachments',
  upload.array('files', 10),
  async (req: AuthRequest, res) => {
    try {
      const task = await prisma.task.findUnique({ where: { id: req.params.id } })
      if (!task) return notFound(res, 'Task')

      const isAssignee = task.assignedMemberId === req.user!.id
      const isMgr = ['CEO', 'CO_MD', 'OP_MANAGER', 'HR_MANAGER', 'BRANCH_MANAGER'].includes(req.user!.role)
      if (!isAssignee && !isMgr) return forbidden(res)
      if (isMgr && req.user!.role === 'BRANCH_MANAGER') {
        const ok = await canEditTaskAssignment(req.user!.id, req.user!.role as SystemRole, task)
        if (!ok) return forbidden(res)
      }

      const files = req.files as Express.Multer.File[] | undefined
      if (!files?.length) return badRequest(res, 'No files')

      const existing = parseAttachments(task.taskAttachments)
      const merged: TaskAttachmentJson[] = [...existing]

      for (const file of files) {
        const result = await uploadFile(file.buffer, file.originalname, file.mimetype, {
          folder: 'tasks',
          maxSizeMb: 20,
        })
        merged.push({
          url: result.fileUrl,
          name: file.originalname,
          uploadedAt: new Date().toISOString(),
        })
      }

      const capped = merged.slice(-25)
      const updated = await prisma.task.update({
        where: { id: req.params.id },
        data: { taskAttachments: capped as unknown as object },
      })
      return ok(res, updated)
    } catch (e) {
      console.error(e)
      return serverError(res)
    }
  },
)

// DELETE /tasks/:id — CEO only
router.delete('/:id', isCEO, async (req, res) => {
  try {
    await prisma.task.delete({ where: { id: req.params.id } })
    return ok(res, { message: 'Task deleted' })
  } catch {
    return serverError(res)
  }
})

// ── Approval Workflow ─────────────────────────────────

router.post('/:id/submit', async (req: AuthRequest, res) => {
  try {
    const task = await prisma.task.findUnique({ where: { id: req.params.id } })
    if (!task) return notFound(res, 'Task')
    if (task.assignedMemberId !== req.user!.id) return forbidden(res)
    if (task.approvalStatus !== ApprovalStatus.WAITING) return badRequest(res, 'Task already submitted')

    const updated = await prisma.task.update({
      where: { id: req.params.id },
      data: {
        approvalStatus: ApprovalStatus.SUBMITTED,
        status: 'REVIEW',
        staffSubmissionNote: req.body.note,
        actualHours: req.body.actualHours,
        progress: req.body.progress ?? 100,
        progressUpdatedAt: new Date(),
      },
    })
    return ok(res, updated)
  } catch {
    return serverError(res)
  }
})

router.post('/:id/approve', isManager, async (req: AuthRequest, res) => {
  try {
    const task = await prisma.task.findUnique({ where: { id: req.params.id } })
    if (!task) return notFound(res, 'Task')
    if (!([ApprovalStatus.SUBMITTED, ApprovalStatus.ESCALATED] as ApprovalStatus[]).includes(task.approvalStatus))
      return badRequest(res, 'Task not in a reviewable state')

    const updated = await prisma.task.update({
      where: { id: req.params.id },
      data: {
        approvalStatus: ApprovalStatus.APPROVED_MGR,
        managerApprovedBy: req.user!.id,
        managerApprovedDate: new Date(),
        managerApprovalNote: req.body.note,
      },
    })
    return ok(res, updated)
  } catch {
    return serverError(res)
  }
})

router.post('/:id/reject', isManager, async (req: AuthRequest, res) => {
  try {
    const task = await prisma.task.findUnique({ where: { id: req.params.id } })
    if (!task) return notFound(res, 'Task')

    const updated = await prisma.task.update({
      where: { id: req.params.id },
      data: {
        approvalStatus: ApprovalStatus.REJECTED_MGR,
        status: 'IN_PROGRESS',
        managerApprovedBy: req.user!.id,
        managerApprovedDate: new Date(),
        managerApprovalNote: req.body.note,
      },
    })
    return ok(res, updated)
  } catch {
    return serverError(res)
  }
})

router.post('/:id/escalate', isManager, async (req, res) => {
  try {
    const updated = await prisma.task.update({
      where: { id: req.params.id },
      data: { approvalStatus: ApprovalStatus.ESCALATED },
    })
    return ok(res, updated)
  } catch {
    return serverError(res)
  }
})

router.post('/:id/verify', isCEO, async (req: AuthRequest, res) => {
  try {
    const task = await prisma.task.findUnique({ where: { id: req.params.id } })
    if (!task) return notFound(res, 'Task')

    const updated = await prisma.task.update({
      where: { id: req.params.id },
      data: {
        approvalStatus: ApprovalStatus.VERIFIED,
        status: 'DONE',
        ceoVerified: true,
        ceoVerifiedDate: new Date(),
        completedDate: new Date(),
      },
    })

    if (task.assignedMemberId) {
      await prisma.staffMember.update({
        where: { id: task.assignedMemberId },
        data: { tasksCompleted: { increment: 1 } },
      })
    }
    return ok(res, updated)
  } catch {
    return serverError(res)
  }
})

router.post(
  '/:id/rate',
  isCEO,
  validate(z.object({ rating: z.number().min(1).max(10), note: z.string().optional() })),
  async (req: AuthRequest, res) => {
    try {
      const task = await prisma.task.findUnique({ where: { id: req.params.id } })
      if (!task) return notFound(res, 'Task')

      const updated = await prisma.task.update({
        where: { id: req.params.id },
        data: { ceoWorkRating: req.body.rating, ceoRatingNote: req.body.note, ceoRatedDate: new Date() },
      })

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
    } catch {
      return serverError(res)
    }
  },
)

router.get('/:id/comments', async (req, res) => {
  try {
    const comments = await prisma.taskComment.findMany({
      where: { taskId: req.params.id },
      orderBy: { createdAt: 'asc' },
    })
    return ok(res, comments)
  } catch {
    return serverError(res)
  }
})

router.post('/:id/comments', validate(z.object({ content: z.string().min(1) })), async (req: AuthRequest, res) => {
  try {
    const author = await prisma.staffMember.findUnique({ where: { id: req.user!.id }, select: { name: true } })
    const comment = await prisma.taskComment.create({
      data: {
        taskId: req.params.id,
        authorId: req.user!.id,
        authorName: author?.name || 'Unknown',
        content: req.body.content,
      },
    })
    return created(res, comment)
  } catch {
    return serverError(res)
  }
})

export default router
