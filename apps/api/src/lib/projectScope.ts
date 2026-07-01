import type { SystemRole } from '@prisma/client'
import type { Prisma } from '@prisma/client'
import prisma from '@/lib/prisma'
import type { AuthRequest } from '@/middleware/auth'
import { branchesMatch } from '@/lib/branchResolve'

/** Roles that see all projects (no row-level filter). */
const GLOBAL_PROJECT_ROLES: SystemRole[] = ['CEO', 'CO_MD', 'OP_MANAGER', 'HR_MANAGER']

export function isGlobalProjectRole(role: SystemRole): boolean {
  return GLOBAL_PROJECT_ROLES.includes(role)
}

/**
 * Extra WHERE for project list/detail: Staff/Intern only see projects they own (`assignedTo`)
 * or that have at least one task assigned to them. Branch managers see projects for their real `branchId`.
 */
export async function projectWhereForRequest(
  userId: string,
  role: SystemRole,
): Promise<Prisma.ProjectWhereInput> {
  if (GLOBAL_PROJECT_ROLES.includes(role)) return {}

  if (role === 'BRANCH_MANAGER') {
    const me = await prisma.staffMember.findUnique({
      where: { id: userId },
      select: { branchId: true },
    })
    if (!me?.branchId) return { id: { in: [] } }
    return { branchId: me.branchId }
  }

  if (role === 'STAFF' || role === 'INTERN') {
    return {
      OR: [
        { assignedTo: userId },
        { tasks: { some: { assignedMemberId: userId } } },
      ],
    }
  }

  return {}
}

export async function canAccessProject(req: AuthRequest, projectId: string): Promise<boolean> {
  if (!req.user || req.user.type !== 'staff') return false
  const { id: userId, role } = req.user
  if (GLOBAL_PROJECT_ROLES.includes(role)) return true

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { assignedTo: true, assignedBranch: true, branchId: true },
  })
  if (!project) return false

  if (role === 'BRANCH_MANAGER') {
    const me = await prisma.staffMember.findUnique({
      where: { id: userId },
      select: { branchId: true, branch: true },
    })
    if (!me?.branchId) return false
    return branchesMatch(
      { branchId: project.branchId, branch: project.assignedBranch },
      { branchId: me.branchId, branch: me.branch },
    )
  }

  if (role === 'STAFF' || role === 'INTERN') {
    if (project.assignedTo === userId) return true
    const n = await prisma.task.count({
      where: { relatedProjectId: projectId, assignedMemberId: userId },
    })
    return n > 0
  }

  return false
}
