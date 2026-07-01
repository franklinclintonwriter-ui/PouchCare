import { ApprovalStatus, TaskStatus, type Task } from '@prisma/client'

type RuleResult = { ok: true } | { ok: false; error: string }

function allowed<T>(value: T, values: readonly T[]): boolean {
  return values.includes(value)
}

export function canSubmitTask(task: Pick<Task, 'approvalStatus'>): RuleResult {
  if (task.approvalStatus !== ApprovalStatus.WAITING) {
    return { ok: false, error: 'Task already submitted' }
  }
  return { ok: true }
}

export function canApproveTask(task: Pick<Task, 'approvalStatus'>): RuleResult {
  if (!allowed(task.approvalStatus, [ApprovalStatus.SUBMITTED, ApprovalStatus.ESCALATED] as const)) {
    return { ok: false, error: 'Task not in a reviewable state' }
  }
  return { ok: true }
}

export function canRejectTask(task: Pick<Task, 'approvalStatus'>): RuleResult {
  if (!allowed(task.approvalStatus, [ApprovalStatus.SUBMITTED, ApprovalStatus.ESCALATED] as const)) {
    return { ok: false, error: 'Task not in a rejectable state' }
  }
  return { ok: true }
}

export function canEscalateTask(task: Pick<Task, 'approvalStatus'>): RuleResult {
  if (task.approvalStatus !== ApprovalStatus.SUBMITTED) {
    return { ok: false, error: 'Only submitted tasks can be escalated' }
  }
  return { ok: true }
}

export function canVerifyTask(task: Pick<Task, 'approvalStatus'>): RuleResult {
  if (task.approvalStatus !== ApprovalStatus.APPROVED_MGR) {
    return { ok: false, error: 'Only manager-approved tasks can be verified' }
  }
  return { ok: true }
}

export function canRateTask(task: Pick<Task, 'approvalStatus'>): RuleResult {
  if (task.approvalStatus !== ApprovalStatus.VERIFIED) {
    return { ok: false, error: 'Only verified tasks can be rated' }
  }
  return { ok: true }
}

export const TASK_WORKFLOW_TRANSITIONS = {
  submit: {
    approvalStatus: ApprovalStatus.SUBMITTED,
    status: TaskStatus.REVIEW,
  },
  approve: {
    approvalStatus: ApprovalStatus.APPROVED_MGR,
  },
  reject: {
    approvalStatus: ApprovalStatus.REJECTED_MGR,
    status: TaskStatus.IN_PROGRESS,
  },
  escalate: {
    approvalStatus: ApprovalStatus.ESCALATED,
  },
  verify: {
    approvalStatus: ApprovalStatus.VERIFIED,
    status: TaskStatus.DONE,
  },
} as const
