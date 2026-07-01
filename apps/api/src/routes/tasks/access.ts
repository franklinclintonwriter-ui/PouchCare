import type { Prisma, SystemRole, Task } from '@prisma/client'
import prisma from '@/lib/prisma'
import type { AuthRequest } from '@/middleware/auth'
import { branchesMatch } from '@/lib/branchResolve'

const SENIOR: SystemRole[] = ['CEO', 'CO_MD', 'OP_MANAGER']

function andWhere<T extends Prisma.TaskWhereInput>(
  base: T,
  extra: Prisma.TaskWhereInput,
): Prisma.TaskWhereInput {
  if (Object.keys(base).length === 0) return extra
  return { AND: [base, extra] }
}

export async function mergeTaskWhereForUser(
  req: AuthRequest,
  base: Prisma.TaskWhereInput,
  options?: { mine?: boolean },
): Promise<Prisma.TaskWhereInput> {
  if (!req.user || req.user.type !== 'staff') return base

  const role = req.user.role as SystemRole
  if (options?.mine || role === 'STAFF' || role === 'INTERN') {
    return andWhere(base, { assignedMemberId: req.user.id })
  }

  if (role !== 'BRANCH_MANAGER') return base

  const me = await prisma.staffMember.findUnique({
    where: { id: req.user.id },
    select: { branchId: true },
  })
  if (!me?.branchId) return { id: { in: [] } }
  return andWhere(base, { branchId: me.branchId })
}

export async function canReadTask(req: AuthRequest, task: Task): Promise<boolean> {
  if (!req.user || req.user.type !== 'staff') return false

  const role = req.user.role as SystemRole
  if (SENIOR.includes(role) || role === 'HR_MANAGER') return true
  if (role === 'STAFF' || role === 'INTERN') return task.assignedMemberId === req.user.id

  if (role === 'BRANCH_MANAGER') {
    if (task.assignedManagerId === req.user.id) return true
    const me = await prisma.staffMember.findUnique({
      where: { id: req.user.id },
      select: { branchId: true, branch: true },
    })
    if (!me?.branchId) return false
    return branchesMatch(
      { branchId: task.branchId, branch: task.assignedBranch },
      { branchId: me.branchId, branch: me.branch },
    )
  }

  return false
}

export async function branchFromAssignees(
  assignedMemberId?: string | null,
  assignedManagerId?: string | null,
): Promise<{ branchId: string | null; assignedBranch: string | undefined }> {
  let branchId: string | null = null
  let assignedBranch: string | undefined
  if (assignedMemberId) {
    const assignee = await prisma.staffMember.findUnique({
      where: { id: assignedMemberId },
      select: { branchId: true, branch: true },
    })
    branchId = assignee?.branchId ?? null
    assignedBranch = assignee?.branch?.trim() || undefined
  }
  if (!branchId && assignedManagerId) {
    const manager = await prisma.staffMember.findUnique({
      where: { id: assignedManagerId },
      select: { branchId: true, branch: true },
    })
    branchId = manager?.branchId ?? null
    if (!assignedBranch) assignedBranch = manager?.branch?.trim() || undefined
  }
  return { branchId, assignedBranch }
}

export async function canBranchManagerTouchBranch(
  managerId: string,
  target: { branchId?: string | null; branch?: string | null },
): Promise<boolean> {
  const me = await prisma.staffMember.findUnique({
    where: { id: managerId },
    select: { branchId: true, branch: true },
  })
  if (!me) return false
  return branchesMatch(target, { branchId: me.branchId, branch: me.branch })
}

export async function canBranchManagerAssignMember(managerId: string, memberId: string): Promise<boolean> {
  const [manager, assignee] = await Promise.all([
    prisma.staffMember.findUnique({
      where: { id: managerId },
      select: { branchId: true },
    }),
    prisma.staffMember.findUnique({
      where: { id: memberId },
      select: { branchId: true },
    }),
  ])

  if (!manager?.branchId || !assignee?.branchId) return false
  return manager.branchId === assignee.branchId
}

/** CEO / Co-MD / Ops may edit any task assignment */
export async function canEditTaskAssignment(userId: string, role: SystemRole, task: Task): Promise<boolean> {
  if (SENIOR.includes(role)) return true
  if (role === 'HR_MANAGER') return true

  if (role === 'BRANCH_MANAGER') {
    if (task.assignedManagerId === userId) return true
    const me = await prisma.staffMember.findUnique({
      where: { id: userId },
      select: { branchId: true, branch: true },
    })
    if (!me) return false
    return branchesMatch(
      { branchId: task.branchId, branch: task.assignedBranch },
      { branchId: me.branchId, branch: me.branch },
    )
  }

  return false
}
