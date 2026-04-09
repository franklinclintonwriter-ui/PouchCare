import type { Prisma, PrismaClient } from '@prisma/client'

export type BranchReferenceBreakdown = {
  total: number
  staffMembers: number
  tasks: number
  projects: number
  attendance: number
  leaveRequests: number
  dailyReports: number
  performanceRatings: number
  payroll: number
  devices: number
  expenses: number
  salesOrders: number
  jobPositions: number
}

/**
 * Count every row that stores this exact branch name (denormalized strings).
 * Used to block branch deletion while any related data still references the name.
 */
export async function countReferencesToBranchName(
  prisma: PrismaClient | Prisma.TransactionClient,
  branchName: string,
): Promise<BranchReferenceBreakdown> {
  const [
    staffMembers,
    tasks,
    projects,
    attendance,
    leaveRequests,
    dailyReports,
    performanceRatings,
    payroll,
    devices,
    expenses,
    salesOrders,
    jobPositions,
  ] = await Promise.all([
    prisma.staffMember.count({ where: { branch: branchName } }),
    prisma.task.count({ where: { assignedBranch: branchName } }),
    prisma.project.count({ where: { assignedBranch: branchName } }),
    prisma.attendance.count({ where: { branch: branchName } }),
    prisma.leaveRequest.count({ where: { branch: branchName } }),
    prisma.dailyReport.count({ where: { branch: branchName } }),
    prisma.performanceRating.count({ where: { branch: branchName } }),
    prisma.payroll.count({ where: { branch: branchName } }),
    prisma.device.count({ where: { branch: branchName } }),
    prisma.expense.count({ where: { branch: branchName } }),
    prisma.salesOrder.count({ where: { branch: branchName } }),
    prisma.jobPosition.count({ where: { branch: branchName } }),
  ])

  const breakdown: Omit<BranchReferenceBreakdown, 'total'> = {
    staffMembers,
    tasks,
    projects,
    attendance,
    leaveRequests,
    dailyReports,
    performanceRatings,
    payroll,
    devices,
    expenses,
    salesOrders,
    jobPositions,
  }
  const total = Object.values(breakdown).reduce((a, b) => a + b, 0)
  return { ...breakdown, total }
}

const KIND_LABELS: Record<Exclude<keyof BranchReferenceBreakdown, 'total'>, string> = {
  staffMembers: 'staff',
  tasks: 'tasks',
  projects: 'projects',
  attendance: 'attendance',
  leaveRequests: 'leave requests',
  dailyReports: 'daily reports',
  performanceRatings: 'performance ratings',
  payroll: 'payroll',
  devices: 'devices',
  expenses: 'expenses',
  salesOrders: 'sales orders',
  jobPositions: 'job postings',
}

/** User-facing sentence listing non-zero reference counts. */
export function formatBranchDeleteConflictMessage(
  branchName: string,
  breakdown: BranchReferenceBreakdown,
): string {
  const parts = (Object.keys(KIND_LABELS) as (keyof typeof KIND_LABELS)[])
    .map((key) => {
      const n = breakdown[key]
      if (n <= 0) return null
      const label = KIND_LABELS[key]
      return `${n} ${label}`
    })
    .filter(Boolean) as string[]

  const summary = parts.length ? parts.join(', ') : `${breakdown.total} records`
  return `Cannot delete branch "${branchName}": ${summary} still reference this name. Clear or reassign those records first.`
}

/**
 * Denormalized branch names appear on many models. When a Branch row is renamed,
 * keep historical rows consistent so filters and reports stay aligned.
 */
export async function propagateBranchNameChange(
  prisma: PrismaClient | Prisma.TransactionClient,
  oldName: string,
  newName: string,
) {
  if (oldName === newName) return
  await Promise.all([
    prisma.staffMember.updateMany({ where: { branch: oldName }, data: { branch: newName } }),
    prisma.task.updateMany({ where: { assignedBranch: oldName }, data: { assignedBranch: newName } }),
    prisma.project.updateMany({ where: { assignedBranch: oldName }, data: { assignedBranch: newName } }),
    prisma.attendance.updateMany({ where: { branch: oldName }, data: { branch: newName } }),
    prisma.leaveRequest.updateMany({ where: { branch: oldName }, data: { branch: newName } }),
    prisma.dailyReport.updateMany({ where: { branch: oldName }, data: { branch: newName } }),
    prisma.performanceRating.updateMany({ where: { branch: oldName }, data: { branch: newName } }),
    prisma.payroll.updateMany({ where: { branch: oldName }, data: { branch: newName } }),
    prisma.device.updateMany({ where: { branch: oldName }, data: { branch: newName } }),
    prisma.expense.updateMany({ where: { branch: oldName }, data: { branch: newName } }),
    prisma.salesOrder.updateMany({ where: { branch: oldName }, data: { branch: newName } }),
    prisma.jobPosition.updateMany({ where: { branch: oldName }, data: { branch: newName } }),
  ])
}
