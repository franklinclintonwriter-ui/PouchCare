import { describe, expect, test, vi } from 'vitest'
import { prismaMock } from '@/test/prismaMock'

// ── resolve helper needs a prisma mock before module import ──────────────────
// We import after setting up the mock so the module picks up our stub.
import { resolveMonitorBranchScope, cameraWhereForScope } from '@/lib/monitorBranchScope'

const GLOBAL_ROLES = ['CEO', 'CO_MD', 'OP_MANAGER', 'HR_MANAGER'] as const
const SCOPED_ROLES = ['BRANCH_MANAGER', 'STAFF', 'INTERN'] as const

describe('resolveMonitorBranchScope', () => {
  test('returns global for all global roles without DB hits', async () => {
    for (const role of GLOBAL_ROLES) {
      const scope = await resolveMonitorBranchScope('user-1', role as any)
      expect(scope.kind).toBe('global')
    }
    expect(prismaMock.staffMember.findUnique).not.toHaveBeenCalled()
  })

  test('returns unassigned when staff member has no branch', async () => {
    prismaMock.staffMember.findUnique.mockResolvedValue({ branch: null } as any)
    const scope = await resolveMonitorBranchScope('user-2', 'STAFF')
    expect(scope.kind).toBe('unassigned')
  })

  test('returns unassigned when staff branch name does not match a Branch row', async () => {
    prismaMock.staffMember.findUnique.mockResolvedValue({ branch: 'Unknown Branch' } as any)
    prismaMock.branch.findUnique.mockResolvedValue(null)
    // findFirst is not on the mock by default; spy branch model for findFirst
    const findFirstSpy = vi.fn().mockResolvedValue(null)
    ;(prismaMock.branch as any).findFirst = findFirstSpy

    const scope = await resolveMonitorBranchScope('user-3', 'BRANCH_MANAGER')
    expect(scope.kind).toBe('unassigned')
  })

  test('returns scoped branch when staff member has a matched branch', async () => {
    prismaMock.staffMember.findUnique.mockResolvedValue({ branch: 'HQ' } as any)
    ;(prismaMock.branch as any).findFirst = vi.fn().mockResolvedValue({ id: 'branch-hq' })

    const scope = await resolveMonitorBranchScope('user-4', 'STAFF')
    expect(scope).toEqual({ kind: 'branch', branchId: 'branch-hq' })
  })
})

describe('cameraWhereForScope', () => {
  test('returns empty object for global scope (no filter)', () => {
    expect(cameraWhereForScope({ kind: 'global' })).toEqual({})
  })

  test('returns empty-set clause for unassigned scope', () => {
    expect(cameraWhereForScope({ kind: 'unassigned' })).toEqual({
      branchId: { in: [] },
    })
  })

  test('returns branchId filter for scoped users', () => {
    expect(cameraWhereForScope({ kind: 'branch', branchId: 'abc-123' })).toEqual({
      branchId: 'abc-123',
    })
  })
})
