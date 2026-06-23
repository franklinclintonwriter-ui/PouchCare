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

/**
 * Advisory branch labels that intentionally do NOT map to a real `Branch` row —
 * notably the "Company — Global" sentinel used for company-wide staff (CEO/MD/HR).
 * Such labels are allowed on writes (→ `branchId` null, unscoped) and must never be
 * rejected, otherwise editing company-wide staff/tasks would 400. Empty also counts.
 */
const NON_BRANCH_LABELS = new Set(['company — global', 'company - global', 'global', 'none', 'n/a'])

export function isNonBranchLabel(name?: string | null): boolean {
  const key = name?.trim().toLowerCase()
  if (!key) return true
  return NON_BRANCH_LABELS.has(key)
}

/** Match by `branchId` when both sides have one; otherwise fall back to legacy branch labels. */
export function branchesMatch(
  a: { branchId?: string | null; branch?: string | null },
  b: { branchId?: string | null; branch?: string | null },
): boolean {
  if (a.branchId && b.branchId && a.branchId === b.branchId) return true
  const aName = a.branch?.trim()
  const bName = b.branch?.trim()
  return !!(aName && bName && aName === bName)
}
