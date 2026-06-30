export type DailyReportStatsInput = {
  status?: string | null
  hoursWorked?: number | null
  tasksCompleted?: string | null
}

export type DailyReportStats = {
  total: number
  submitted: number
  approved: number
  rejected: number
  avgHours: number
  avgTasks: number
}

function inferTaskCount(tasksCompleted?: string | null): number {
  const text = String(tasksCompleted ?? '').trim()
  if (!text) return 0
  const n = Number(text)
  if (!Number.isNaN(n)) return n
  return text
    .split(/\r?\n|,/)
    .map((p) => p.trim())
    .filter(Boolean).length
}

export function computeDailyReportStats(rows: DailyReportStatsInput[]): DailyReportStats {
  const total = rows.length
  const submitted = rows.filter((r) => String(r.status).toUpperCase() === 'SUBMITTED').length
  const approved = rows.filter((r) => {
    const s = String(r.status).toUpperCase()
    return s === 'APPROVED_MGR' || s === 'VERIFIED' || s === 'REVIEWED'
  }).length
  const rejected = rows.filter((r) => {
    const s = String(r.status).toUpperCase()
    return s === 'REJECTED_MGR' || s === 'REJECTED'
  }).length

  const avgHours =
    total > 0
      ? Number((rows.reduce((sum, r) => sum + (r.hoursWorked ?? 0), 0) / total).toFixed(1))
      : 0

  const avgTasks =
    total > 0
      ? Number((rows.reduce((sum, r) => sum + inferTaskCount(r.tasksCompleted), 0) / total).toFixed(1))
      : 0

  return { total, submitted, approved, rejected, avgHours, avgTasks }
}
