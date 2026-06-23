import type { SystemRole } from '@prisma/client'
import prisma from '@/lib/prisma'
import type { AuthRequest } from '@/middleware/auth'
import { resolveBranchId } from '@/lib/branchResolve'

const GLOBAL_DIRECTORY_ROLES: SystemRole[] = ['CEO', 'CO_MD', 'OP_MANAGER', 'HR_MANAGER']

/**
 * Branch managers only see staff in their own branch (StaffMember.branchId FK).
 * Query param `branch` (a name) cannot be used to read another branch.
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
      select: { branchId: true },
    })
    const b = me?.branchId
    if (!b) return { where: { id: { in: [] } }, forbidden: false } // fail closed
    // `branch` query param is a name; resolve it and reject cross-branch reads.
    const qBranch = query.branch?.trim()
    if (qBranch && (await resolveBranchId(qBranch)) !== b) {
      return { where: baseWhere, forbidden: true }
    }
    // branchId is authoritative — drop any advisory `branch` string filter.
    const { branch: _ignored, ...rest } = baseWhere as Record<string, unknown>
    return { where: { ...rest, branchId: b }, forbidden: false }
  }

  return { where: baseWhere, forbidden: false }
}

