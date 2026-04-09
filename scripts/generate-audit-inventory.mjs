#!/usr/bin/env node
/**
 * Regenerates docs/audit/00-inventory.md from repo globs.
 * Run from repo root: node scripts/generate-audit-inventory.mjs
 */
import { readdir, writeFile } from 'fs/promises'
import { join, relative } from 'path'
import { fileURLToPath } from 'url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const root = join(__dirname, '..')

async function walk(dir, ext, acc = []) {
  const entries = await readdir(dir, { withFileTypes: true })
  for (const e of entries) {
    const p = join(dir, e.name)
    if (e.isDirectory()) await walk(p, ext, acc)
    else if (e.isFile() && e.name.endsWith(ext)) acc.push(p)
  }
  return acc
}

function rel(p) {
  return relative(root, p).replace(/\\/g, '/')
}

const pages = (await walk(join(root, 'apps/management/src/pages'), '.tsx')).sort()
const apiRoutes = (await walk(join(root, 'apps/api/src/routes'), '.ts')).sort()
const apiClients = (await readdir(join(root, 'apps/management/src/api')))
  .filter((f) => f.endsWith('.ts'))
  .map((f) => join(root, 'apps/management/src/api', f))
  .sort((a, b) => a.localeCompare(b))

const now = new Date().toISOString().slice(0, 10)

const body = `# Audit inventory (generated)

**Generated:** ${now} — run \`node scripts/generate-audit-inventory.mjs\` from repo root to refresh.

## 1. Management page components

**Count:** ${pages.length}

\`apps/management/src/pages/**/*.tsx\`

${pages.map((p) => `- \`${rel(p)}\``).join('\n')}

## 2. API route modules

**Count:** ${apiRoutes.length}

\`apps/api/src/routes/**/*.ts\`

${apiRoutes.map((p) => `- \`${rel(p)}\``).join('\n')}

## 3. Management API client modules

**Count:** ${apiClients.length}

\`apps/management/src/api/*.ts\`

${apiClients.map((p) => `- \`${rel(p)}\``).join('\n')}

`

await writeFile(join(root, 'docs/audit/00-inventory.md'), body, 'utf8')
console.log('Wrote docs/audit/00-inventory.md')
