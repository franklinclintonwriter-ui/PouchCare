import { describe, expect, test } from 'vitest'
import { prismaMock } from '@/test/prismaMock'
import {
  branchManagerStaffRelationFilter,
  canManagerAccessStaffMember,
} from '@/lib/teamBranchScope'

describe('teamBranchScope', () => {
  test('global manager roles bypass branch checks', async () => {
    await expect(canManagerAccessStaffMember('ceo-1', 'CEO', 'staff-1')).resolves.toBe(true)
    expect(prismaMock.staffMember.findUnique).not.toHaveBeenCalled()
  })

  test('branch managers can only access staff in the same branch', async () => {
    prismaMock.staffMember.findUnique
      .mockResolvedValueOnce({ branchId: 'branch-1' })
      .mockResolvedValueOnce({ branchId: 'branch-1' })

    await expect(
      canManagerAccessStaffMember('manager-1', 'BRANCH_MANAGER', 'staff-1'),
    ).resolves.toBe(true)

    prismaMock.staffMember.findUnique
      .mockResolvedValueOnce({ branchId: 'branch-1' })
      .mockResolvedValueOnce({ branchId: 'branch-2' })

    await expect(
      canManagerAccessStaffMember('manager-1', 'BRANCH_MANAGER', 'staff-2'),
    ).resolves.toBe(false)
  })

  test('branchManagerStaffRelationFilter fails closed when the manager has no branchId', async () => {
    prismaMock.staffMember.findUnique.mockResolvedValueOnce({ branchId: null })
    await expect(branchManagerStaffRelationFilter('manager-2')).resolves.toBe('empty')

    prismaMock.staffMember.findUnique.mockResolvedValueOnce({ branchId: 'branch-9' })
    await expect(branchManagerStaffRelationFilter('manager-3')).resolves.toEqual({ branchId: 'branch-9' })
  })
})
