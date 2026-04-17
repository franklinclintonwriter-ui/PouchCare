#!/usr/bin/env node
/**
 * Perf test harness — Phase 5 P1.
 *
 * Hits the admin list + detail endpoints N times per path, records per-request
 * latency, prints p50/p95/p99, and fails (exit 1) if any path exceeds its
 * budget (list < 400 ms p95, detail < 300 ms p95 per Notion §4 "Success metrics").
 *
 * Usage:
 *   ADMIN_API_TOKEN=<staff jwt> \
 *   ADMIN_API_BASE=http://localhost:7000/v1 \
 *   node scripts/perf-admin.mjs [iterations=50] [concurrency=4]
 *
 * Example:
 *   ADMIN_API_TOKEN=... node scripts/perf-admin.mjs 100 8
 *
 * Notes:
 *   - Only one warm-up request is made per endpoint (to exclude JIT/cold-start).
 *   - Detail endpoints are discovered by calling the corresponding list first.
 *   - Non-2xx responses count against the sample but are not retried; if >5 %
 *     of calls fail the run is marked FAIL regardless of latency.
 */

const iterations = Number(process.argv[2] ?? 50)
const concurrency = Number(process.argv[3] ?? 4)
const API_BASE = process.env.ADMIN_API_BASE ?? 'http://localhost:7000/v1'
const TOKEN = process.env.ADMIN_API_TOKEN

if (!TOKEN) {
  console.error('ADMIN_API_TOKEN is required.')
  process.exit(2)
}

function quantile(sorted, q) {
  if (sorted.length === 0) return 0
  const i = Math.min(sorted.length - 1, Math.floor(sorted.length * q))
  return sorted[i]
}

async function timedGet(path) {
  const t0 = performance.now()
  const res = await fetch(API_BASE + path, {
    headers: { Authorization: `Bearer ${TOKEN}` },
  })
  const ms = performance.now() - t0
  return { ms, ok: res.ok, status: res.status }
}

async function discoverOneId(listPath, extractId) {
  const res = await fetch(API_BASE + listPath, { headers: { Authorization: `Bearer ${TOKEN}` } })
  if (!res.ok) return null
  const body = await res.json()
  const items = body.data ?? body
  return Array.isArray(items) && items[0] ? extractId(items[0]) : null
}

async function runCase(label, path, budgetMs) {
  // Warm up
  await timedGet(path).catch(() => null)

  const samples = []
  let failures = 0
  let inflight = 0
  let done = 0
  const queue = Array.from({ length: iterations }, (_, i) => i)

  await new Promise((resolve) => {
    const tick = () => {
      while (inflight < concurrency && queue.length > 0) {
        queue.shift()
        inflight++
        timedGet(path)
          .then((r) => {
            samples.push(r.ms)
            if (!r.ok) failures++
          })
          .catch(() => failures++)
          .finally(() => {
            inflight--
            done++
            if (done === iterations) resolve(null)
            else tick()
          })
      }
    }
    tick()
  })

  samples.sort((a, b) => a - b)
  const p50 = quantile(samples, 0.5)
  const p95 = quantile(samples, 0.95)
  const p99 = quantile(samples, 0.99)
  const max = samples[samples.length - 1] ?? 0
  const avg = samples.reduce((a, b) => a + b, 0) / (samples.length || 1)
  const failureRate = failures / iterations
  const withinBudget = p95 <= budgetMs && failureRate < 0.05

  return { label, path, budgetMs, n: iterations, p50, p95, p99, max, avg, failureRate, withinBudget }
}

function fmt(ms) {
  return `${ms.toFixed(1)} ms`
}

function fmtPct(pct) {
  return `${(pct * 100).toFixed(1)}%`
}

async function main() {
  console.log(`Perf harness — ${iterations} req × ${concurrency} concurrent, target ${API_BASE}\n`)

  const clientId = await discoverOneId('/admin/clients?limit=1', (c) => c.id)
  const orderId = await discoverOneId('/admin/orders?limit=1', (o) => o.id)
  const serviceId = await discoverOneId('/admin/services', (s) => s.id)

  const cases = [
    { label: 'Overview', path: '/admin/overview', budget: 400 },
    { label: 'Clients list', path: '/admin/clients?limit=20', budget: 400 },
    { label: 'Orders list', path: '/admin/orders?limit=20', budget: 400 },
    { label: 'Services list', path: '/admin/services', budget: 400 },
    { label: 'Audit list', path: '/admin/audit?limit=20', budget: 400 },
    ...(clientId ? [{ label: 'Client detail', path: `/admin/clients/${encodeURIComponent(clientId)}`, budget: 300 }] : []),
    ...(orderId
      ? [(() => {
          const [kind, ...rest] = orderId.split(':')
          return { label: 'Order detail', path: `/admin/orders/${kind}/${rest.join(':')}`, budget: 300 }
        })()]
      : []),
    ...(serviceId ? [{ label: 'Service detail', path: `/admin/services/${serviceId}`, budget: 300 }] : []),
  ]

  const results = []
  for (const c of cases) {
    const r = await runCase(c.label, c.path, c.budget)
    results.push(r)
  }

  // Print table
  const headers = ['Endpoint', 'Budget', 'p50', 'p95', 'p99', 'max', 'fail%', 'Result']
  const widths = [22, 10, 10, 10, 10, 10, 8, 8]
  const line = (cells) => cells.map((c, i) => String(c).padEnd(widths[i])).join('')
  console.log(line(headers))
  console.log('-'.repeat(widths.reduce((a, b) => a + b, 0)))
  let anyFail = false
  for (const r of results) {
    const resultCell = r.withinBudget ? '✓' : 'FAIL'
    if (!r.withinBudget) anyFail = true
    console.log(
      line([
        r.label,
        `${r.budgetMs}`,
        fmt(r.p50),
        fmt(r.p95),
        fmt(r.p99),
        fmt(r.max),
        fmtPct(r.failureRate),
        resultCell,
      ]),
    )
  }

  console.log()
  if (anyFail) {
    console.error('One or more endpoints exceeded the budget. See table above.')
    process.exit(1)
  }
  console.log('All endpoints within budget. ✓')
}

main().catch((err) => {
  console.error(err.message)
  process.exit(1)
})
