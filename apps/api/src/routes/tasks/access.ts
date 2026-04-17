import type { SystemRole } from '@prisma/client'
import type { Task } from '@prisma/client'
import prisma from '@/lib/prisma'

const SENIOR: SystemRole[] = ['CEO', 'CO_MD', 'OP_MANAGER']

/** CEO / Co-MD / Ops may edit any task assignment */
export async function canEditTaskAssignment(userId: string, role: SystemRole, task: Task): Promise<boolean> {
  if (SENIOR.includes(role)) return true
  if (role === 'HR_MANAGER') return true

  if (role === 'BRANCH_MANAGER') {
    if (task.assignedManagerId === userId) return true
    const me = await prisma.staffMember.findUnique({
      where: { id: userId },
      select: { branch: true },
    })
    if (task.assignedBranch && me?.branch && task.assignedBranch === me.branch) return true
    return false
  }

  return false
}
