import type { Prisma, SystemRole } from '@prisma/client'
import prisma from '@/lib/prisma'
import type { AuthRequest } from '@/middleware/auth'

/** Full org visibility for attendance / leave / daily reports lists. */
export const GLOBAL_TEAM_ROLES: SystemRole[] = ['CEO', 'CO_MD', 'OP_MANAGER', 'HR_MANAGER']

export function isGlobalTeamRole(role: SystemRole): boolean {
  return GLOBAL_TEAM_ROLES.includes(role)
}

/**
 * Whether a manager role may act on the given staff member (same branch for Branch Managers).
 */
export async function canManagerAccessStaffMember(
  managerId: string,
  managerRole: SystemRole,
  targetStaffId: string,
): Promise<boolean> {
  if (isGlobalTeamRole(managerRole)) return true
  if (managerRole !== 'BRANCH_MANAGER') return true

  const [me, them] = await Promise.all([
    prisma.staffMember.findUnique({ where: { id: managerId }, select: { branchId: true } }),
    prisma.staffMember.findUnique({ where: { id: targetStaffId }, select: { branchId: true } }),
  ])
  return !!(me?.branchId && them?.branchId && me.branchId === them.branchId)
}

async function branchManagerStaffRelationFilter(
  managerId: string,
): Promise<Prisma.StaffMemberWhereInput | 'empty'> {
  const me = await prisma.staffMember.findUnique({
    where: { id: managerId },
    select: { branchId: true },
  })
  const b = me?.branchId
  if (!b) return 'empty'
  return { branchId: b }
}

/** Merge manager list filters with branch scope (BM → same branch via `staffMember`). */
export async function mergeAttendanceWhereForManager(
  req: AuthRequest,
  base: Prisma.AttendanceWhereInput,
): Promise<Prisma.AttendanceWhereInput> {
  const role = req.user!.role as SystemRole
  if (!req.user || req.user.type !== 'staff' || isGlobalTeamRole(role)) return base
  if (role !== 'BRANCH_MANAGER') return base
  const rel = await branchManagerStaffRelationFilter(req.user.id)
  if (rel === 'empty') return { id: { in: [] } }
  return { AND: [base, { staffMember: rel }] }
}

export async function mergeLeaveWhereForManager(
  req: AuthRequest,
  base: Prisma.LeaveRequestWhereInput,
): Promise<Prisma.LeaveRequestWhereInput> {
  const role = req.user!.role as SystemRole
  if (!req.user || req.user.type !== 'staff' || isGlobalTeamRole(role)) return base
  if (role !== 'BRANCH_MANAGER') return base
  const rel = await branchManagerStaffRelationFilter(req.user.id)
  if (rel === 'empty') return { id: { in: [] } }
  return { AND: [base, { staffMember: rel }] }
}

export async function mergeDailyReportWhereForManager(
  req: AuthRequest,
  base: Prisma.DailyReportWhereInput,
): Promise<Prisma.DailyReportWhereInput> {
  const role = req.user!.role as SystemRole
  if (!req.user || req.user.type !== 'staff' || isGlobalTeamRole(role)) return base
  if (role !== 'BRANCH_MANAGER') return base
  const rel = await branchManagerStaffRelationFilter(req.user.id)
  if (rel === 'empty') return { id: { in: [] } }
  return { AND: [base, { staffMember: rel }] }
}

export async function mergePayrollWhereForManager(
  req: AuthRequest,
  base: Prisma.PayrollWhereInput,
): Promise<Prisma.PayrollWhereInput> {
  const role = req.user!.role as SystemRole
  if (!req.user || req.user.type !== 'staff' || isGlobalTeamRole(role)) return base
  if (role !== 'BRANCH_MANAGER') return base
  const rel = await branchManagerStaffRelationFilter(req.user.id)
  if (rel === 'empty') return { id: { in: [] } }
  return { AND: [base, { staffMember: rel }] }
}
