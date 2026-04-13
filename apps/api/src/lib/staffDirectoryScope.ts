import type { SystemRole } from '@prisma/client'
import prisma from '@/lib/prisma'
import type { AuthRequest } from '@/middleware/auth'

const GLOBAL_DIRECTORY_ROLES: SystemRole[] = ['CEO', 'CO_MD', 'OP_MANAGER', 'HR_MANAGER']

/**
 * Branch managers only see staff in their own branch (StaffMember.branch string).
 * Query param `branch` cannot be used to read another branch.
 */
export async function staffListWhereWithBranchScope(
  req: AuthRequest,
  baseWhere: Record<string, unknown>,
  query: Record<string, string>,
): Promise<{ where: Record<string, unknown>; forbidden: boolean }> {
  if (!req.user || req.user.type !== 'staff') return { where: baseWhere, forbidden: false }
  if (GLOBAL_DIRECTORY_ROLES.includes(req.user.role as SystemRole)) {
    return { where: baseWhere, forbidden: false }
  }

  if (req.user.role === 'BRANCH_MANAGER') {
    const me = await prisma.staffMember.findUnique({
      where: { id: req.user.id },
      select: { branch: true },
    })
    const b = me?.branch?.trim()
    if (!b) return { where: { id: { in: [] } }, forbidden: false }
    const qBranch = query.branch?.trim()
    if (qBranch && qBranch !== b) return { where: baseWhere, forbidden: true }
    return { where: { ...baseWhere, branch: b }, forbidden: false }
  }

  return { where: baseWhere, forbidden: false }
}
