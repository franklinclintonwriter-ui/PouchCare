#!/usr/bin/env node
/**
 * Bundle budget check — Phase 5 P1.
 *
 * Scans the built management app (apps/management/dist/assets) and asserts
 * the total gzipped size of admin-panel chunks stays under a configurable
 * budget (default 150 KB). Fails (exit 1) on overage so it can gate CI.
 *
 * Usage:
 *   npm run build --workspace=m.pouchcare.com
 *   node scripts/bundle-budget.mjs              # default 150 KB budget
 *   node scripts/bundle-budget.mjs 200          # 200 KB budget
 *
 * Admin chunks are detected by filename substring (Vite names chunks after
 * the lazy-import's component). See apps/management/src/routes/index.tsx —
 * every admin page uses a `lazy(() => import('@/pages/admin/…'))` pattern,
 * so Vite produces chunks whose filenames contain the Page component name.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, basename } from 'node:path'
import { gzipSync } from 'node:zlib'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const repoRoot = join(__filename, '..', '..')
const distDir = join(repoRoot, 'apps', 'management', 'dist', 'assets')

const BUDGET_KB = Number(process.argv[2] ?? 150)

// Match any admin-panel lazy-loaded chunk by component name.
const ADMIN_CHUNK_PATTERNS = [
  /(^|[-_])Overview[-.]/,
  /(^|[-_])ClientsList[-.]/,
  /(^|[-_])ClientDetail[-.]/,
  /(^|[-_])OrdersList[-.]/,
  /(^|[-_])OrderDetail[-.]/,
  /(^|[-_])OrderNew[-.]/,
  /(^|[-_])ServiceCatalog[-.]/,
  /(^|[-_])ServiceDetail[-.]/,
  /(^|[-_])AuditLog[-.]/,
  /(^|[-_])Deposits[-.]/,
  /(^|[-_])Payouts[-.]/,
  /(^|[-_])CommissionsAdmin[-.]/,
  /(^|[-_])InvoicesAdmin[-.]/,
  /(^|[-_])TicketsAdmin[-.]/,
  /(^|[-_])BroadcastAdmin[-.]/,
]

function isAdminChunk(name) {
  return ADMIN_CHUNK_PATTERNS.some((rx) => rx.test(name))
}

function humanKB(bytes) {
  return `${(bytes / 1024).toFixed(1)} KB`
}

let files
try {
  files = readdirSync(distDir)
} catch (err) {
  console.error(`Build output not found at ${distDir}.`)
  console.error('Run `npm run build --workspace=m.pouchcare.com` first.')
  process.exit(2)
}

const chunks = []
for (const name of files) {
  if (!name.endsWith('.js')) continue
  const full = join(distDir, name)
  if (!statSync(full).isFile()) continue
  if (!isAdminChunk(name)) continue
  const raw = readFileSync(full)
  const gz = gzipSync(raw, { level: 9 }).length
  chunks.push({ name, raw: raw.length, gz })
}

if (chunks.length === 0) {
  console.warn('No admin chunks detected. Either the build is missing or chunk names have changed.')
  console.warn(`Looked in ${distDir}`)
  process.exit(2)
}

chunks.sort((a, b) => b.gz - a.gz)

const totalRaw = chunks.reduce((s, c) => s + c.raw, 0)
const totalGz = chunks.reduce((s, c) => s + c.gz, 0)
const budgetBytes = BUDGET_KB * 1024

console.log(`Admin panel bundle budget: ${BUDGET_KB} KB gzipped`)
console.log()
console.log('Chunk'.padEnd(46) + 'raw'.padStart(12) + 'gzipped'.padStart(12))
console.log('-'.repeat(70))
for (const c of chunks) {
  console.log(basename(c.name).padEnd(46) + humanKB(c.raw).padStart(12) + humanKB(c.gz).padStart(12))
}
console.log('-'.repeat(70))
console.log('Totals'.padEnd(46) + humanKB(totalRaw).padStart(12) + humanKB(totalGz).padStart(12))
console.log()
console.log(`Gzipped total: ${humanKB(totalGz)}  /  Budget: ${BUDGET_KB} KB  (${Math.round((totalGz / budgetBytes) * 100)}% of budget)`)

if (totalGz > budgetBytes) {
  console.error(`\nBundle over budget by ${humanKB(totalGz - budgetBytes)}. Failing CI.`)
  console.error('Fix: tree-shake heavy libs, split rarely-used views further, or raise the budget with justification.')
  process.exit(1)
}

console.log('\nWithin budget. ✓')
