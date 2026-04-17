import type { SystemRole } from '@prisma/client'
import type { Response } from 'express'
import prisma from '@/lib/prisma'
import type { AuthRequest } from '@/middleware/auth'
import { forbidden } from '@/lib/response'

/**
 * Ops / HR see all branches. Branch managers and staff are limited to the branch
 * named on their StaffMember.branch record (matched to Branch.name).
 */
export type MonitorBranchScope =
  | { kind: 'global' }
  | { kind: 'branch'; branchId: string }
  | { kind: 'unassigned' }

const GLOBAL_MONITOR_ROLES: SystemRole[] = ['CEO', 'CO_MD', 'OP_MANAGER', 'HR_MANAGER']

export async function resolveMonitorBranchScope(
  staffUserId: string,
  role: SystemRole,
): Promise<MonitorBranchScope> {
  if (GLOBAL_MONITOR_ROLES.includes(role)) return { kind: 'global' }
  if (role === 'BRANCH_MANAGER' || role === 'STAFF' || role === 'INTERN') {
    const staff = await prisma.staffMember.findUnique({
      where: { id: staffUserId },
      select: { branch: true },
    })
    const name = staff?.branch?.trim()
    if (!name) return { kind: 'unassigned' }
    const b = await prisma.branch.findFirst({
      where: { name },
      select: { id: true },
    })
    if (!b) return { kind: 'unassigned' }
    return { kind: 'branch', branchId: b.id }
  }
  return { kind: 'global' }
}

/** Extra WHERE for camera_device queries (empty object = no filter). */
export function cameraWhereForScope(scope: MonitorBranchScope): { branchId?: string | { in: string[] } } {
  if (scope.kind === 'global') return {}
  if (scope.kind === 'unassigned') return { branchId: { in: [] } }
  return { branchId: scope.branchId }
}

export async function assertCameraBranchAccess(
  req: AuthRequest,
  res: Response,
  cameraBranchId: string,
): Promise<boolean> {
  if (!req.user || req.user.type !== 'staff') {
    forbidden(res, 'Staff access required')
    return false
  }
  const scope = await resolveMonitorBranchScope(req.user.id, req.user.role)
  if (scope.kind === 'global') return true
  if (scope.kind === 'unassigned') {
    forbidden(res, 'No branch assigned to your profile for monitor access')
    return false
  }
  if (cameraBranchId !== scope.branchId) {
    forbidden(res, 'Not allowed for this branch')
    return false
  }
  return true
}

/**
 * When URL has :branchId, ensure scoped users only access their branch.
 */
export async function assertRouteBranchId(
  req: AuthRequest,
  res: Response,
  branchId: string,
): Promise<boolean> {
  if (!req.user || req.user.type !== 'staff') {
    forbidden(res, 'Staff access required')
    return false
  }
  const scope = await resolveMonitorBranchScope(req.user.id, req.user.role)
  if (scope.kind === 'global') return true
  if (scope.kind === 'unassigned') {
    forbidden(res, 'No branch assigned to your profile')
    return false
  }
  if (branchId !== scope.branchId) {
    forbidden(res, 'Not allowed for this branch')
    return false
  }
  return true
}

