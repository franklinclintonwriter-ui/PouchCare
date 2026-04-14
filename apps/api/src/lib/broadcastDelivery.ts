import prisma from '@/lib/prisma'
import { sendBroadcastEmail, buildBroadcastEmailHtml } from '@/lib/email'

export type BroadcastDeliverySummary = {
  attempted: number
  sent: number
  skipped: number
  failed: number
  failures?: { to: string; error: string }[]
}

const EMAIL_BATCH = 8
const MAX_FAILURES_LOG = 25

function buildEmailHtml(title: string, message: string): string {
  return buildBroadcastEmailHtml(title, message)
}

async function mapInBatches<T, R>(items: T[], batchSize: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = []
  for (let i = 0; i < items.length; i += batchSize) {
    const chunk = items.slice(i, i + batchSize)
    out.push(...(await Promise.all(chunk.map(fn))))
  }
  return out
}

function summarize(
  results: Array<'sent' | 'skipped' | 'failed'>,
  recipients: string[],
): BroadcastDeliverySummary {
  let sent = 0
  let skipped = 0
  let failed = 0
  const failures: { to: string; error: string }[] = []
  results.forEach((r, i) => {
    if (r === 'sent') sent += 1
    else if (r === 'skipped') skipped += 1
    else {
      failed += 1
      if (failures.length < MAX_FAILURES_LOG) {
        failures.push({ to: recipients[i] ?? '?', error: 'Send failed' })
      }
    }
  })
  return {
    attempted: results.length,
    sent,
    skipped,
    failed,
    ...(failures.length ? { failures } : {}),
  }
}

export async function deliverBroadcastByEmail(
  audience: 'staff' | 'clients' | 'all',
  title: string,
  message: string,
  isUrgent: boolean,
): Promise<BroadcastDeliverySummary> {
  const subject = isUrgent ? `[Urgent] ${title}` : title
  const html = buildEmailHtml(title, message)

  const emailByLower = new Map<string, string>()

  if (audience === 'staff' || audience === 'all') {
    const rows = await prisma.staffMember.findMany({
      where: { status: 'Active' },
      select: { email: true },
    })
    for (const r of rows) {
      const e = r.email?.trim()
      if (!e) continue
      const k = e.toLowerCase()
      if (!emailByLower.has(k)) emailByLower.set(k, e)
    }
  }
  if (audience === 'clients' || audience === 'all') {
    const rows = await prisma.portalMember.findMany({
      where: { status: 'ACTIVE' },
      select: { email: true },
    })
    for (const r of rows) {
      const e = r.email?.trim()
      if (!e) continue
      const k = e.toLowerCase()
      if (!emailByLower.has(k)) emailByLower.set(k, e)
    }
  }

  const list = [...emailByLower.values()]
  if (list.length === 0) {
    return { attempted: 0, sent: 0, skipped: 0, failed: 0 }
  }

  const results = await mapInBatches(list, EMAIL_BATCH, (to) =>
    sendBroadcastEmail(to, subject, html),
  )

  return summarize(results, list)
}
