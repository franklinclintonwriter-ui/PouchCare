import { describe, expect, test } from 'vitest'
import { computeDailyReportStats } from '@/lib/managementStats'

describe('managementStats.computeDailyReportStats', () => {
  test('computes counters and averages with mixed status formats', () => {
    const stats = computeDailyReportStats([
      { status: 'SUBMITTED', hoursWorked: 8, tasksCompleted: '3' },
      { status: 'approved_mgr', hoursWorked: 9.5, tasksCompleted: 'Task A\nTask B' },
      { status: 'reviewed', hoursWorked: 7, tasksCompleted: 'Task C, Task D, Task E' },
      { status: 'REJECTED', hoursWorked: 6, tasksCompleted: '1' },
      { status: 'rejected_mgr', hoursWorked: 5.5, tasksCompleted: '' },
      { status: 'VERIFIED', hoursWorked: null, tasksCompleted: null },
    ])

    expect(stats.total).toBe(6)
    expect(stats.submitted).toBe(1)
    expect(stats.approved).toBe(3)
    expect(stats.rejected).toBe(2)
    expect(stats.avgHours).toBe(6)
    expect(stats.avgTasks).toBe(1.5)
  })

  test('returns zeros for empty inputs', () => {
    expect(computeDailyReportStats([])).toEqual({
      total: 0,
      submitted: 0,
      approved: 0,
      rejected: 0,
      avgHours: 0,
      avgTasks: 0,
    })
  })
})
