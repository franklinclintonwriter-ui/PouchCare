import { beforeEach, describe, expect, test } from 'vitest'
import { prismaMock } from '@/test/prismaMock'
import {
  branchFromAssignees,
  canBranchManagerAssignMember,
  canBranchManagerTouchBranch,
  canReadTask,
  mergeTaskWhereForUser,
} from '@/routes/tasks/access'

describe('tasks access helpers', () => {
  beforeEach(() => {
    prismaMock.staffMember.findUnique.mockReset()
  })

  test('mergeTaskWhereForUser scopes staff and interns to assigned tasks', async () => {
    const req = { user: { id: 'staff-1', role: 'STAFF', type: 'staff' } } as any
    await expect(mergeTaskWhereForUser(req, { status: 'IN_PROGRESS' })).resolves.toEqual({
      AND: [{ status: 'IN_PROGRESS' }, { assignedMemberId: 'staff-1' }],
    })
  })

  test('mergeTaskWhereForUser scopes branch managers to their branch', async () => {
    prismaMock.staffMember.findUnique.mockResolvedValueOnce({ branchId: 'branch-1' })
    const req = { user: { id: 'manager-1', role: 'BRANCH_MANAGER', type: 'staff' } } as any
    await expect(mergeTaskWhereForUser(req, { priority: 'HIGH' })).resolves.toEqual({
      AND: [{ priority: 'HIGH' }, { branchId: 'branch-1' }],
    })
  })

  test('mergeTaskWhereForUser fails closed for branch managers with no branch', async () => {
    prismaMock.staffMember.findUnique.mockResolvedValueOnce({ branchId: null })
    const req = { user: { id: 'manager-2', role: 'BRANCH_MANAGER', type: 'staff' } } as any
    await expect(mergeTaskWhereForUser(req, {})).resolves.toEqual({ id: { in: [] } })
  })

  test('mergeTaskWhereForUser supports explicit mine mode for managers', async () => {
    const req = { user: { id: 'ops-1', role: 'OP_MANAGER', type: 'staff' } } as any
    await expect(mergeTaskWhereForUser(req, {}, { mine: true })).resolves.toEqual({ assignedMemberId: 'ops-1' })
  })

  test('canReadTask lets branch managers read their branch tasks', async () => {
    prismaMock.staffMember.findUnique.mockResolvedValueOnce({ branchId: 'branch-1', branch: 'Bangladesh HQ' })
    const req = { user: { id: 'manager-1', role: 'BRANCH_MANAGER', type: 'staff' } } as any
    const task = { branchId: 'branch-1', assignedBranch: 'Bangladesh HQ', assignedManagerId: null, assignedMemberId: 'staff-1' } as any
    await expect(canReadTask(req, task)).resolves.toBe(true)
  })

  test('canReadTask blocks branch managers from cross-branch tasks', async () => {
    prismaMock.staffMember.findUnique.mockResolvedValueOnce({ branchId: 'branch-2', branch: 'Dhaka' })
    const req = { user: { id: 'manager-2', role: 'BRANCH_MANAGER', type: 'staff' } } as any
    const task = { branchId: 'branch-1', assignedBranch: 'Bangladesh HQ', assignedManagerId: null, assignedMemberId: 'staff-1' } as any
    await expect(canReadTask(req, task)).resolves.toBe(false)
  })

  test('canBranchManagerAssignMember requires same authoritative branch id', async () => {
    prismaMock.staffMember.findUnique
      .mockResolvedValueOnce({ branchId: 'branch-1' })
      .mockResolvedValueOnce({ branchId: 'branch-1' })

    await expect(canBranchManagerAssignMember('manager-1', 'staff-1')).resolves.toBe(true)
  })

  test('canBranchManagerAssignMember blocks cross-branch assignment', async () => {
    prismaMock.staffMember.findUnique
      .mockResolvedValueOnce({ branchId: 'branch-1' })
      .mockResolvedValueOnce({ branchId: 'branch-2' })

    await expect(canBranchManagerAssignMember('manager-1', 'staff-2')).resolves.toBe(false)
  })

  test('canBranchManagerAssignMember fails closed when assignee has no branch', async () => {
    prismaMock.staffMember.findUnique
      .mockResolvedValueOnce({ branchId: 'branch-1' })
      .mockResolvedValueOnce({ branchId: null })

    await expect(canBranchManagerAssignMember('manager-1', 'staff-3')).resolves.toBe(false)
  })

  test('canBranchManagerTouchBranch fails closed when manager branch is missing', async () => {
    prismaMock.staffMember.findUnique.mockResolvedValueOnce({ branchId: null, branch: null })

    await expect(
      canBranchManagerTouchBranch('manager-1', { branchId: 'branch-1', branch: 'Bangladesh HQ' }),
    ).resolves.toBe(false)
  })

  test('branchFromAssignees derives branch from assignee first', async () => {
    prismaMock.staffMember.findUnique
      .mockResolvedValueOnce({ branchId: 'branch-1', branch: 'Bangladesh HQ' })

    await expect(branchFromAssignees('staff-1', null)).resolves.toEqual({
      branchId: 'branch-1',
      assignedBranch: 'Bangladesh HQ',
    })
  })

  test('branchFromAssignees falls back to manager branch when member branch is unavailable', async () => {
    prismaMock.staffMember.findUnique
      .mockResolvedValueOnce({ branchId: null, branch: null })
      .mockResolvedValueOnce({ branchId: 'branch-9', branch: 'Khulna' })

    await expect(branchFromAssignees('staff-1', 'manager-9')).resolves.toEqual({
      branchId: 'branch-9',
      assignedBranch: 'Khulna',
    })
  })
})
