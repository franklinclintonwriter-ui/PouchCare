#!/usr/bin/env node
/**
 * Audit-coverage CI check — Phase 5 P0.
 *
 * Scans every /admin/* backend route for state-mutating verbs (POST/PATCH/PUT/DELETE)
 * and asserts that each handler block contains at least one call to `audit(`.
 * Fails (exit code 1) if any state-mutating endpoint is missing an audit call,
 * so a broken audit path is caught at PR time rather than after launch.
 *
 * Usage:
 *   node scripts/audit-coverage.mjs
 *
 * Add to package.json:
 *   "audit:coverage": "node scripts/audit-coverage.mjs"
 *
 * Add to CI (GitHub Actions / GitLab CI) before tests pass.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const repoRoot = join(__filename, '..', '..')
const adminDir = join(repoRoot, 'apps', 'api', 'src', 'routes', 'admin')

function walk(dir) {
  const out = []
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry)
    if (statSync(p).isDirectory()) out.push(...walk(p))
    else if (p.endsWith('.ts')) out.push(p)
  }
  return out
}

/**
 * Files in scope for the contract — the new admin panel namespace
 * built per Notion §5.5. Pre-existing routes (portal.ts, resources.ts,
 * role-permissions.ts, system-config.ts) were written before the audit
 * helper existed; track those separately rather than failing CI on them.
 */
const IN_SCOPE = new Set([
  'clients.ts',
  'orders.ts',
  'services.ts',
  'audit.ts',
  'assets.ts',
  'overview.ts',
])
const LEGACY_FILES = new Set([
  'portal.ts',
  'resources.ts',
  'role-permissions.ts',
  'system-config.ts',
])

// Match `router.(post|patch|put|delete)('/path', ...)` and capture the path + the
// rest of the call site through the next `})` followed by a blank line.
const ENDPOINT_RE = /router\.(post|patch|put|delete)\(\s*['"`]([^'"`]+)['"`][\s\S]*?(?=\nrouter\.|\nexport\b|\Z)/g

const failures = []
const legacyMissing = []
const summary = []

for (const file of walk(adminDir)) {
  const src = readFileSync(file, 'utf8')
  const rel = relative(repoRoot, file)
  const base = rel.split(/[\\/]/).pop()
  const inScope = IN_SCOPE.has(base)
  let matchCount = 0

  for (const m of src.matchAll(ENDPOINT_RE)) {
    matchCount++
    const verb = m[1].toUpperCase()
    const path = m[2]
    const block = m[0]
    const hasAudit = /\baudit\s*\(/.test(block)
    if (!hasAudit) {
      if (inScope) failures.push({ file: rel, verb, path })
      else if (LEGACY_FILES.has(base)) legacyMissing.push({ file: rel, verb, path })
    }
    summary.push({ file: rel, verb, path, hasAudit, inScope })
  }

  if (matchCount === 0) summary.push({ file: rel, verb: '—', path: '(read-only file)', hasAudit: true, inScope })
}

const inScopeRows = summary.filter((s) => s.verb !== '—' && s.inScope)
const total = inScopeRows.length
const audited = inScopeRows.filter((s) => s.hasAudit).length
const pct = total === 0 ? 100 : Math.round((audited / total) * 100)

console.log(`Audit-coverage (in-scope admin panel routes): ${audited}/${total} (${pct}%)`)

if (legacyMissing.length > 0) {
  console.log(`\nLegacy admin routes missing audit() (informational, not gated):`)
  for (const f of legacyMissing) {
    console.log(`  · ${f.verb} ${f.path}   (${f.file})`)
  }
  console.log('Track these as Phase 5 backfill tasks; they predate the audit() helper.')
}

if (failures.length > 0) {
  console.error('\nMissing audit() calls in NEW admin panel routes:')
  for (const f of failures) {
    console.error(`  - ${f.verb} ${f.path}   (${f.file})`)
  }
  console.error('\nEvery state-mutating admin endpoint must call audit() exactly once after a successful write.')
  console.error('See apps/api/src/lib/auditLog.ts and the contract in Notion §5.5.')
  process.exit(1)
}

console.log('\nAll in-scope admin panel endpoints are audited. ✓')
