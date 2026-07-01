import { ApprovalStatus } from '@prisma/client'
import { describe, expect, test } from 'vitest'
import {
  canApproveTask,
  canEscalateTask,
  canRateTask,
  canRejectTask,
  canSubmitTask,
  canVerifyTask,
} from '@/lib/taskStateMachine'

describe('taskStateMachine', () => {
  test('submit only allows waiting tasks', () => {
    expect(canSubmitTask({ approvalStatus: ApprovalStatus.WAITING })).toEqual({ ok: true })
    expect(canSubmitTask({ approvalStatus: ApprovalStatus.SUBMITTED })).toEqual({
      ok: false,
      error: 'Task already submitted',
    })
  })

  test('approve/reject only allow submitted or escalated tasks', () => {
    expect(canApproveTask({ approvalStatus: ApprovalStatus.SUBMITTED })).toEqual({ ok: true })
    expect(canApproveTask({ approvalStatus: ApprovalStatus.ESCALATED })).toEqual({ ok: true })
    expect(canRejectTask({ approvalStatus: ApprovalStatus.SUBMITTED })).toEqual({ ok: true })
    expect(canRejectTask({ approvalStatus: ApprovalStatus.ESCALATED })).toEqual({ ok: true })
    expect(canRejectTask({ approvalStatus: ApprovalStatus.WAITING })).toEqual({
      ok: false,
      error: 'Task not in a rejectable state',
    })
  })

  test('escalate only allows submitted tasks', () => {
    expect(canEscalateTask({ approvalStatus: ApprovalStatus.SUBMITTED })).toEqual({ ok: true })
    expect(canEscalateTask({ approvalStatus: ApprovalStatus.APPROVED_MGR })).toEqual({
      ok: false,
      error: 'Only submitted tasks can be escalated',
    })
  })

  test('verify only allows manager-approved tasks', () => {
    expect(canVerifyTask({ approvalStatus: ApprovalStatus.APPROVED_MGR })).toEqual({ ok: true })
    expect(canVerifyTask({ approvalStatus: ApprovalStatus.ESCALATED })).toEqual({
      ok: false,
      error: 'Only manager-approved tasks can be verified',
    })
  })

  test('rate only allows verified tasks', () => {
    expect(canRateTask({ approvalStatus: ApprovalStatus.VERIFIED })).toEqual({ ok: true })
    expect(canRateTask({ approvalStatus: ApprovalStatus.APPROVED_MGR })).toEqual({
      ok: false,
      error: 'Only verified tasks can be rated',
    })
  })
})
