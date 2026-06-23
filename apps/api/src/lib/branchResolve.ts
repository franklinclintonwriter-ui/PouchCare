import prisma from '@/lib/prisma'

/**
 * Resolve a Branch *name* → its `id`, so write paths that accept the legacy
 * advisory `branch`/`assignedBranch` string can also persist the real `branchId`
 * FK (PR-2.3). Returns `null` when the name is empty or no branch matches.
 *
 * Positive (name→id) results are memoised for the process lifetime — branch rows
 * are effectively static and `name` is `@unique`. Misses are NOT cached, so a
 * branch created after a failed lookup still resolves on the next call.
 */
const nameToId = new Map<string, string>()

export async function resolveBranchId(name?: string | null): Promise<string | null> {
  const key = name?.trim()
  if (!key) return null
  const cached = nameToId.get(key)
  if (cached) return cached
  const branch = await prisma.branch.findUnique({ where: { name: key }, select: { id: true } })
  if (branch) {
    nameToId.set(key, branch.id)
    return branch.id
  }
  return null
}
