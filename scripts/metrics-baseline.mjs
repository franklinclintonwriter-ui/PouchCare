#!/usr/bin/env node
/**
 * Success metrics baseline snapshot — Phase 5 P2.
 *
 * Hits the API as a CEO token and captures the numeric baselines the
 * team wants to compare against after launch. Outputs a timestamped
 * JSON file under docs/admin-panel/metrics/.
 *
 * Metrics captured:
 *   - Total clients (portal members + CRM accounts)
 *   - Active portal members (%)
 *   - Total orders by status
 *   - Revenue MTD (USD)
 *   - Open support tickets
 *   - Audit log entries (last 7 days) — a proxy for admin activity volume
 *
 * Usage:
 *   ADMIN_API_TOKEN=<staff jwt> \
 *   ADMIN_API_BASE=https://api.pouchcare.com.bd/v1 \
 *   node scripts/metrics-baseline.mjs
 *
 * Or for local dev:
 *   ADMIN_API_TOKEN=<token> node scripts/metrics-baseline.mjs
 *   (defaults ADMIN_API_BASE to http://localhost:7000/v1)
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const repoRoot = join(__filename, '..', '..')
const outDir = join(repoRoot, 'docs', 'admin-panel', 'metrics')

const API_BASE = process.env.ADMIN_API_BASE ?? 'http://localhost:7000/v1'
const TOKEN = process.env.ADMIN_API_TOKEN

if (!TOKEN) {
  console.error('ADMIN_API_TOKEN is required. Pass a CEO-level JWT.')
  process.exit(2)
}

async function get(path, params) {
  const url = new URL(API_BASE + path)
  if (params) for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v))
  const res = await fetch(url, { headers: { Authorization: `Bearer ${TOKEN}` } })
  if (!res.ok) throw new Error(`GET ${path} → ${res.status}`)
  return res.json()
}

function unwrap(body) {
  return body?.data ?? body
}

async function main() {
  const now = new Date()
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()

  console.log(`Capturing baseline from ${API_BASE} at ${now.toISOString()}`)

  const overview = unwrap(await get('/admin/overview'))
  const audit7d = unwrap(await get('/admin/audit', { since: sevenDaysAgo, limit: 1 }))

  const auditMeta = audit7d?.meta ?? audit7d?.totalCount ?? null
  const auditTotal7d =
    (audit7d && audit7d.meta && audit7d.meta.total) ??
    (Array.isArray(audit7d) ? audit7d.length : null)

  const baseline = {
    capturedAt: now.toISOString(),
    apiBase: API_BASE,
    overview: {
      clients: overview.clients,
      orders: overview.orders,
      revenue: overview.revenue,
      support: overview.support,
    },
    adminActivity: {
      auditEntriesLast7Days: auditTotal7d,
    },
    notes: [
      'Capture this file once before turning the admin flag on for Owners (day 1 of Phase 5 rollout).',
      'Re-run at 2 weeks and 4 weeks post-launch and diff to verify success metrics.',
      'Operational success metrics per Notion §4 Roadmap: p95 latency, audit coverage %, daily active staff.',
    ],
  }

  mkdirSync(outDir, { recursive: true })
  const ts = now.toISOString().replace(/[:T]/g, '-').slice(0, 19)
  const outFile = join(outDir, `baseline-${ts}.json`)
  writeFileSync(outFile, JSON.stringify(baseline, null, 2) + '\n')
  console.log(`Wrote ${outFile}`)
  console.log()
  console.log('Summary:')
  console.log(`  clients: total=${baseline.overview.clients?.total ?? '—'}, newThisWeek=${baseline.overview.clients?.newThisWeek ?? '—'}`)
  console.log(`  orders:  total=${baseline.overview.orders?.total ?? '—'}, byStatus=${JSON.stringify(baseline.overview.orders?.byStatus ?? {})}`)
  console.log(`  revenue MTD (USD): ${baseline.overview.revenue?.mtdUsd ?? '—'}`)
  console.log(`  open tickets: ${baseline.overview.support?.open ?? '—'}`)
  console.log(`  audit entries last 7d: ${baseline.adminActivity.auditEntriesLast7Days ?? '—'}`)
}

main().catch((err) => {
  console.error(err.message)
  process.exit(1)
})
