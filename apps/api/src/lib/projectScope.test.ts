import { beforeEach, describe, expect, test } from 'vitest'
import { prismaMock } from '@/test/prismaMock'
import { canAccessProject, projectWhereForRequest } from '@/lib/projectScope'

describe('projectScope', () => {
  beforeEach(() => {
    prismaMock.staffMember.findUnique.mockReset()
    prismaMock.project.findUnique.mockReset()
    prismaMock.task.count.mockReset()
  })

  test('branch managers are scoped by branchId for project lists', async () => {
    prismaMock.staffMember.findUnique.mockResolvedValueOnce({ branchId: 'branch-1' })
    await expect(projectWhereForRequest('manager-1', 'BRANCH_MANAGER')).resolves.toEqual({
      branchId: 'branch-1',
    })
  })

  test('branch managers fail closed when they have no branchId', async () => {
    prismaMock.staffMember.findUnique.mockResolvedValueOnce({ branchId: null })
    await expect(projectWhereForRequest('manager-2', 'BRANCH_MANAGER')).resolves.toEqual({
      id: { in: [] },
    })
  })

  test('canAccessProject allows branch managers on same branchId even if names drift', async () => {
    prismaMock.project.findUnique.mockResolvedValueOnce({
      assignedTo: null,
      assignedBranch: 'Old Name',
      branchId: 'branch-1',
    })
    prismaMock.staffMember.findUnique.mockResolvedValueOnce({ branchId: 'branch-1', branch: 'Bangladesh HQ' })

    const req = { user: { id: 'manager-1', role: 'BRANCH_MANAGER', type: 'staff' } } as any
    await expect(canAccessProject(req, 'project-1')).resolves.toBe(true)
  })

  test('staff can access projects through related tasks', async () => {
    prismaMock.project.findUnique.mockResolvedValueOnce({
      assignedTo: null,
      assignedBranch: 'Bangladesh HQ',
      branchId: 'branch-1',
    })
    prismaMock.task.count.mockResolvedValueOnce(1)

    const req = { user: { id: 'staff-1', role: 'STAFF', type: 'staff' } } as any
    await expect(canAccessProject(req, 'project-2')).resolves.toBe(true)
  })
})
