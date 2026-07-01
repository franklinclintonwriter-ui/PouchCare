import { describe, expect, test } from 'vitest'
import { prismaMock } from '@/test/prismaMock'
import { isNonBranchLabel, resolveBranchId } from '@/lib/branchResolve'

describe('branchResolve', () => {
  test('isNonBranchLabel treats empty and global sentinels as non-branches', () => {
    expect(isNonBranchLabel()).toBe(true)
    expect(isNonBranchLabel('')).toBe(true)
    expect(isNonBranchLabel('Company — Global')).toBe(true)
    expect(isNonBranchLabel('PouchCare - Digital Marketing')).toBe(false)
  })

  test('resolveBranchId caches successful name lookups', async () => {
    prismaMock.branch.findUnique.mockResolvedValue({ id: 'branch-1' })

    await expect(resolveBranchId('Branch Cache Example')).resolves.toBe('branch-1')
    await expect(resolveBranchId('Branch Cache Example')).resolves.toBe('branch-1')

    expect(prismaMock.branch.findUnique).toHaveBeenCalledTimes(1)
    expect(prismaMock.branch.findUnique).toHaveBeenCalledWith({
      where: { name: 'Branch Cache Example' },
      select: { id: true },
    })
  })

  test('resolveBranchId does not cache misses', async () => {
    prismaMock.branch.findUnique.mockResolvedValue(null)

    await expect(resolveBranchId('Missing Branch Example')).resolves.toBeNull()
    await expect(resolveBranchId('Missing Branch Example')).resolves.toBeNull()

    expect(prismaMock.branch.findUnique).toHaveBeenCalledTimes(2)
  })
})
