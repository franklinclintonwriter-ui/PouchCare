import { ApprovalStatus, Priority, type Prisma, type SystemRole } from '@prisma/client'
import { Router } from 'express'
import multer from 'multer'
import { z } from 'zod'
import { authenticate, isManager, isCEO, type AuthRequest } from '@/middleware/auth'
import { requirePermission } from '@/middleware/rbac'
import { validate } from '@/middleware/validate'
import prisma from '@/lib/prisma'
import { audit } from '@/lib/auditLog'
import { ok, created, badRequest, notFound, forbidden, serverError, paginated } from '@/lib/response'
import { getPagination, buildMeta } from '@/lib/pagination'
import { uploadFile } from '@/lib/storage'
import {
  canApproveTask,
  canEscalateTask,
  canRateTask,
  canRejectTask,
  canSubmitTask,
  canVerifyTask,
  TASK_WORKFLOW_TRANSITIONS,
} from '@/lib/taskStateMachine'
import { TASK_CATEGORIES, isValidTaskCategory } from './constants'
import {
  branchFromAssignees,
  canBranchManagerAssignMember,
  canBranchManagerTouchBranch,
  canEditTaskAssignment,
  canReadTask,
  mergeTaskWhereForUser,
} from './access'
import { resolveBranchId, isNonBranchLabel, branchesMatch } from '@/lib/branchResolve'

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

async function syncBranchOnAssigneeChange(
  task: { assignedMemberId: string | null; assignedManagerId: string | null },
  body: Partial<z.infer<typeof taskSchema>>,
  data: Record<string, unknown>,
) {
  if (body.assignedBranch !== undefined) return
  const memberChanged = body.assignedMemberId !== undefined
  const managerChanged = body.assignedManagerId !== undefined
  if (!memberChanged && !managerChanged) return
  const nextMemberId = memberChanged ? body.assignedMemberId || null : task.assignedMemberId
  const nextManagerId = managerChanged ? body.assignedManagerId || null : task.assignedManagerId
  const { branchId, assignedBranch } = await branchFromAssignees(nextMemberId, nextManagerId)
  data.branchId = branchId
  data.assignedBranch = assignedBranch ?? null
}

function buildTaskListWhere(
  query: Record<string, string>,
): Prisma.TaskWhereInput {
  const { q, status, approvalStatus, priority, branch, assignedTo, projectId, category } = query
  const where: Prisma.TaskWhereInput = {}

  if (q) where.title = { contains: q }
  if (status) where.status = status as any
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
    where.approvalStatus = (statusMap[approvalStatus] || approvalStatus) as any
  }
  if (priority) where.priority = priority as any
  if (branch) where.assignedBranch = branch
  if (assignedTo) where.assignedMemberId = assignedTo

  if (projectId) {
    const projectScope: Prisma.TaskWhereInput = { relatedProjectId: projectId }
    return Object.keys(where).length === 0 ? projectScope : { AND: [where, projectScope] }
  }

  return where
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
    const query = req.query as Record<string, string>
    const mine = query.mine === 'true' || query.mine === '1'
    const where = await mergeTaskWhereForUser(req, buildTaskListWhere(query), { mine })

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

// GET /tasks/mine
router.get('/mine', async (req: AuthRequest, res) => {
  try {
    const { page, limit, skip } = getPagination(req)
    const query = req.query as Record<string, string>
    const where = await mergeTaskWhereForUser(req, buildTaskListWhere(query), { mine: true })

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
    const readable = await canReadTask(req, task)
    if (!readable) return notFound(res, 'Task')
    return ok(res, task)
  } catch {
    return serverError(res)
  }
})

// POST /tasks — CEO/Manager creates
router.post('/', requirePermission('task.create'), validate(taskSchema), async (req: AuthRequest, res) => {
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
      const derived = await branchFromAssignees(body.assignedMemberId, body.assignedManagerId)
      branchId = derived.branchId
      assignedBranch = derived.assignedBranch
    }

    const isBranchManager = req.user!.role === 'BRANCH_MANAGER'
    if (isBranchManager) {
      if (body.assignedMemberId) {
        const canAssignMember = await canBranchManagerAssignMember(req.user!.id, body.assignedMemberId)
        if (!canAssignMember) return forbidden(res, 'Not allowed to create task outside your branch')
      }
      const scoped = await canBranchManagerTouchBranch(req.user!.id, {
        branchId,
        branch: assignedBranch,
      })
      if (!scoped) return forbidden(res, 'Not allowed to create task outside your branch')
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
    await audit(req, {
      action: 'task.create',
      resourceKind: 'Task',
      resourceId: task.id,
      after: task,
    })
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

const bulkAssignSchema = z.object({
  ids: z.array(z.string().min(1)).min(1).max(200),
  assignedMemberId: z.union([z.string().min(1), z.null()]).optional(),
  assignedManagerId: z.union([z.string().min(1), z.null()]).optional(),
}).refine(
  (value) => value.assignedMemberId !== undefined || value.assignedManagerId !== undefined,
  { message: 'At least one assignment field is required' },
)

// POST /tasks/bulk/assign — batch assign/reassign tasks
router.post('/bulk/assign', requirePermission('task.assign'), validate(bulkAssignSchema), async (req: AuthRequest, res) => {
  try {
    const body = req.body as z.infer<typeof bulkAssignSchema>
    const results: Array<{ id: string; ok: boolean; error?: string }> = []

    for (const id of body.ids) {
      try {
        const task = await prisma.task.findUnique({ where: { id } })
        if (!task) {
          results.push({ id, ok: false, error: 'not_found' })
          continue
        }

        if (req.user!.role === 'BRANCH_MANAGER') {
          const editable = await canEditTaskAssignment(req.user!.id, req.user!.role as SystemRole, task)
          if (!editable) {
            results.push({ id, ok: false, error: 'forbidden' })
            continue
          }
        }

        const nextMemberId = body.assignedMemberId !== undefined ? body.assignedMemberId || null : task.assignedMemberId
        const nextManagerId = body.assignedManagerId !== undefined ? body.assignedManagerId || null : task.assignedManagerId

        if (req.user!.role === 'BRANCH_MANAGER' && nextMemberId) {
          const canAssignMember = await canBranchManagerAssignMember(req.user!.id, nextMemberId)
          if (!canAssignMember) {
            results.push({ id, ok: false, error: 'member_outside_branch' })
            continue
          }
        }

        const targetBranch = await branchFromAssignees(nextMemberId, nextManagerId)
        if (req.user!.role === 'BRANCH_MANAGER') {
          const scoped = await canBranchManagerTouchBranch(req.user!.id, {
            branchId: targetBranch.branchId,
            branch: targetBranch.assignedBranch,
          })
          if (!scoped) {
            results.push({ id, ok: false, error: 'target_outside_branch' })
            continue
          }
        }

        const data: Record<string, unknown> = {}
        if (body.assignedMemberId !== undefined) data.assignedMemberId = nextMemberId
        if (body.assignedManagerId !== undefined) data.assignedManagerId = nextManagerId
        data.branchId = targetBranch.branchId
        data.assignedBranch = targetBranch.assignedBranch ?? null

        await syncAssigneeTaskCount(task.assignedMemberId, nextMemberId)
        const updated = await prisma.task.update({ where: { id }, data: data as any })
        await audit(req, {
          action: 'task.bulk.assign',
          resourceKind: 'Task',
          resourceId: updated.id,
          before: task,
          after: updated,
        })
        results.push({ id, ok: true })
      } catch (error: any) {
        results.push({ id, ok: false, error: error?.message ?? 'unknown' })
      }
    }

    const okCount = results.filter((result) => result.ok).length
    return ok(res, { okCount, total: results.length, results })
  } catch (e) {
    console.error(e)
    return serverError(res)
  }
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
      await audit(req, {
        action: 'task.update',
        resourceKind: 'Task',
        resourceId: updated.id,
        before: task,
        after: updated,
      })
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
      await syncBranchOnAssigneeChange(task, body, data)
      if (body.notes !== undefined) data.notes = body.notes
      if (body.deadline !== undefined) data.deadline = body.deadline ? new Date(body.deadline) : null
      if (body.priority !== undefined) data.priority = body.priority
      const updated = await prisma.task.update({ where: { id: req.params.id }, data })
      await audit(req, {
        action: 'task.update',
        resourceKind: 'Task',
        resourceId: updated.id,
        before: task,
        after: updated,
      })
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

    await syncBranchOnAssigneeChange(task, body, data)

    const nextMemberId =
      body.assignedMemberId !== undefined ? body.assignedMemberId || null : undefined
    if (nextMemberId !== undefined) {
      await syncAssigneeTaskCount(task.assignedMemberId, nextMemberId)
    }

    const updated = await prisma.task.update({
      where: { id: req.params.id },
      data: data as any,
    })
    await audit(req, {
      action: 'task.update',
      resourceKind: 'Task',
      resourceId: updated.id,
      before: task,
      after: updated,
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
      await audit(req, {
        action: 'task.attachment.update',
        resourceKind: 'Task',
        resourceId: updated.id,
        before: task,
        after: updated,
      })
      return ok(res, updated)
    } catch (e) {
      console.error(e)
      return serverError(res)
    }
  },
)

// DELETE /tasks/:id — CEO only
router.delete('/:id', requirePermission('task.delete'), async (req, res) => {
  try {
    const task = await prisma.task.delete({ where: { id: req.params.id } })
    await audit(req as AuthRequest, {
      action: 'task.delete',
      resourceKind: 'Task',
      resourceId: task.id,
      before: task,
    })
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
    const state = canSubmitTask(task)
    if (!state.ok) return badRequest(res, state.error)

    const updated = await prisma.task.update({
      where: { id: req.params.id },
      data: {
        ...TASK_WORKFLOW_TRANSITIONS.submit,
        staffSubmissionNote: req.body.note,
        actualHours: req.body.actualHours,
        progress: req.body.progress ?? 100,
        progressUpdatedAt: new Date(),
      },
    })
    await audit(req, {
      action: 'task.submit',
      resourceKind: 'Task',
      resourceId: updated.id,
      before: task,
      after: updated,
    })
    return ok(res, updated)
  } catch {
    return serverError(res)
  }
})

router.post('/:id/approve', requirePermission('task.approve'), async (req: AuthRequest, res) => {
  try {
    const task = await prisma.task.findUnique({ where: { id: req.params.id } })
    if (!task) return notFound(res, 'Task')
    if (req.user!.role === 'BRANCH_MANAGER') {
      const ok = await canEditTaskAssignment(req.user!.id, req.user!.role as SystemRole, task)
      if (!ok) return forbidden(res)
    }
    const state = canApproveTask(task)
    if (!state.ok) return badRequest(res, state.error)

    const updated = await prisma.task.update({
      where: { id: req.params.id },
      data: {
        ...TASK_WORKFLOW_TRANSITIONS.approve,
        managerApprovedBy: req.user!.id,
        managerApprovedDate: new Date(),
        managerApprovalNote: req.body.note,
      },
    })
    await audit(req, {
      action: 'task.approve',
      resourceKind: 'Task',
      resourceId: updated.id,
      before: task,
      after: updated,
    })
    return ok(res, updated)
  } catch {
    return serverError(res)
  }
})

router.post('/:id/reject', requirePermission('task.approve'), async (req: AuthRequest, res) => {
  try {
    const task = await prisma.task.findUnique({ where: { id: req.params.id } })
    if (!task) return notFound(res, 'Task')
    if (req.user!.role === 'BRANCH_MANAGER') {
      const ok = await canEditTaskAssignment(req.user!.id, req.user!.role as SystemRole, task)
      if (!ok) return forbidden(res)
    }

    const state = canRejectTask(task)
    if (!state.ok) return badRequest(res, state.error)

    const updated = await prisma.task.update({
      where: { id: req.params.id },
      data: {
        ...TASK_WORKFLOW_TRANSITIONS.reject,
        managerApprovedBy: req.user!.id,
        managerApprovedDate: new Date(),
        managerApprovalNote: req.body.note,
      },
    })
    await audit(req, {
      action: 'task.reject',
      resourceKind: 'Task',
      resourceId: updated.id,
      before: task,
      after: updated,
    })
    return ok(res, updated)
  } catch {
    return serverError(res)
  }
})

router.post('/:id/escalate', requirePermission('task.approve'), async (req, res) => {
  try {
    const task = await prisma.task.findUnique({ where: { id: req.params.id } })
    if (!task) return notFound(res, 'Task')
    if (req.user!.role === 'BRANCH_MANAGER') {
      const ok = await canEditTaskAssignment(req.user!.id, req.user!.role as SystemRole, task)
      if (!ok) return forbidden(res)
    }
    const state = canEscalateTask(task)
    if (!state.ok) return badRequest(res, state.error)

    const updated = await prisma.task.update({
      where: { id: req.params.id },
      data: TASK_WORKFLOW_TRANSITIONS.escalate,
    })
    await audit(req as AuthRequest, {
      action: 'task.escalate',
      resourceKind: 'Task',
      resourceId: updated.id,
      before: task,
      after: updated,
    })
    return ok(res, updated)
  } catch {
    return serverError(res)
  }
})

router.post('/:id/verify', requirePermission('task.verify'), async (req: AuthRequest, res) => {
  try {
    const task = await prisma.task.findUnique({ where: { id: req.params.id } })
    if (!task) return notFound(res, 'Task')

    const state = canVerifyTask(task)
    if (!state.ok) return badRequest(res, state.error)

    const updated = await prisma.task.update({
      where: { id: req.params.id },
      data: {
        ...TASK_WORKFLOW_TRANSITIONS.verify,
        ceoVerified: true,
        ceoVerifiedDate: new Date(),
        completedDate: new Date(),
      },
    })
    await audit(req, {
      action: 'task.verify',
      resourceKind: 'Task',
      resourceId: updated.id,
      before: task,
      after: updated,
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
  requirePermission('task.verify'),
  validate(z.object({ rating: z.number().min(1).max(10), note: z.string().optional() })),
  async (req: AuthRequest, res) => {
    try {
      const task = await prisma.task.findUnique({ where: { id: req.params.id } })
      if (!task) return notFound(res, 'Task')
      const state = canRateTask(task)
      if (!state.ok) return badRequest(res, state.error)

      const updated = await prisma.task.update({
        where: { id: req.params.id },
        data: { ceoWorkRating: req.body.rating, ceoRatingNote: req.body.note, ceoRatedDate: new Date() },
      })
      await audit(req, {
        action: 'task.rate',
        resourceKind: 'Task',
        resourceId: updated.id,
        before: task,
        after: updated,
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

router.get('/:id/comments', async (req: AuthRequest, res) => {
  try {
    const task = await prisma.task.findUnique({ where: { id: req.params.id } })
    if (!task) return notFound(res, 'Task')
    const readable = await canReadTask(req, task)
    if (!readable) return notFound(res, 'Task')

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
    const task = await prisma.task.findUnique({ where: { id: req.params.id } })
    if (!task) return notFound(res, 'Task')
    const readable = await canReadTask(req, task)
    if (!readable) return notFound(res, 'Task')

    const author = await prisma.staffMember.findUnique({ where: { id: req.user!.id }, select: { name: true } })
    const comment = await prisma.taskComment.create({
      data: {
        taskId: req.params.id,
        authorId: req.user!.id,
        authorName: author?.name || 'Unknown',
        content: req.body.content,
      },
    })
    await audit(req, {
      action: 'task.comment.create',
      resourceKind: 'TaskComment',
      resourceId: comment.id,
      metadata: { taskId: req.params.id },
      after: comment,
    })
    return created(res, comment)
  } catch {
    return serverError(res)
  }
})

export default router
