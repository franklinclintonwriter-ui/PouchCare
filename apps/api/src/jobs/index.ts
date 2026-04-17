import cron from 'node-cron'
import prisma from '@/lib/prisma'

// Job 1: Release commissions after hold period (daily at 2am)
cron.schedule('0 2 * * *', async () => {
  try {
    const now = new Date()
    const result = await prisma.commission.updateMany({
      where: { status: 'PENDING_HOLD', holdReleaseDate: { lte: now } },
      data: { status: 'AVAILABLE' },
    })
    if (result.count > 0) console.log(`[CRON] Released ${result.count} commissions`)
  } catch (e) { console.error('[CRON] Commission release error:', e) }
})

// Job 2: Domain expiry alerts (daily at 8am)
cron.schedule('0 8 * * *', async () => {
  try {
    const thirtyDays = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    const expiring = await prisma.domain.findMany({
      where: { expiryDate: { lte: thirtyDays, gt: new Date() } },
    })
    if (expiring.length > 0) {
      console.log(`[CRON] ${expiring.length} domain(s) expiring in 30 days:`, expiring.map(d => d.domainName))
    }
  } catch (e) { console.error('[CRON] Domain expiry check error:', e) }
})

// Job 3: Payroll reminder (1st of month at 9am)
cron.schedule('0 9 1 * *', async () => {
  try {
    const activeStaff = await prisma.staffMember.count({ where: { status: 'Active' } })
    console.log(`[CRON] Payroll reminder: ${activeStaff} active staff members`)
  } catch (e) { console.error('[CRON] Payroll reminder error:', e) }
})

// Job 4: Daily report reminder (Mon-Fri at 11am UTC)
cron.schedule('0 11 * * 1-5', async () => {
  try {
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const submitted = await prisma.dailyReport.findMany({
      where: { reportDate: { gte: today } },
      select: { staffMemberId: true },
    })
    const submittedIds = submitted.map(r => r.staffMemberId)
    const missing = await prisma.staffMember.findMany({
      where: { status: 'Active', id: { notIn: submittedIds } },
      select: { id: true, name: true },
    })
    for (const staff of missing) {
      await prisma.notification.create({
        data: {
          recipientId: staff.id,
          recipientType: "staff",
          title: 'Daily Report Reminder',
          message: `Don't forget to submit your daily report for today!`,
          type: 'REMINDER',
        },
      })
    }
    if (missing.length > 0) console.log(`[CRON] Sent report reminders to ${missing.length} staff`)
  } catch (e) { console.error('[CRON] Report reminder error:', e) }
})

// Job 5: AI Task Coach — daily at 9:30am Mon-Fri
// Sends personalized AI tips for each staff member's pending/blocked tasks
cron.schedule('30 9 * * 1-5', async () => {
  try {
    const { aiStatus } = await import('@/lib/ai/config')
    const status = aiStatus()
    if (!status.hasAny) {
      console.log('[CRON:AI-TASK] Skipped — no AI provider configured')
      return
    }

    const { resolveProvider, resolveModel } = await import('@/lib/ai/config')
    const { getProvider } = await import('@/lib/ai/providers')

    const activeStaff = await prisma.staffMember.findMany({
      where: { status: 'Active' },
      select: { id: true, name: true, systemRole: true },
    })

    let sent = 0
    for (const staff of activeStaff) {
      const pendingTasks = await prisma.task.findMany({
        where: {
          assignedMemberId: staff.id,
          status: { in: ['NOT_STARTED', 'IN_PROGRESS', 'BLOCKED'] },
        },
        select: { title: true, status: true, priority: true, deadline: true, notes: true, progress: true },
        orderBy: { deadline: 'asc' },
        take: 8,
      })

      if (pendingTasks.length === 0) continue

      const overdue = pendingTasks.filter((t) => t.deadline && new Date(t.deadline) < new Date())
      const blocked = pendingTasks.filter((t) => t.status === 'BLOCKED')
      const highPri = pendingTasks.filter((t) => t.priority === 'CRITICAL' || t.priority === 'HIGH')

      const taskList = pendingTasks
        .map((t, i) => `${i + 1}. [${t.status}${t.priority === 'CRITICAL' ? ' CRITICAL' : t.priority === 'HIGH' ? ' HIGH' : ''}] "${t.title}" (${t.progress ?? 0}% done${t.deadline ? `, due ${new Date(t.deadline).toLocaleDateString()}` : ''})`)
        .join('\n')

      const providerName = resolveProvider()
      const modelName = resolveModel(providerName)

      try {
        const provider = getProvider(providerName)
        const result = await provider.chatSync(
          [
            {
              role: 'system',
              content: `You are a task productivity coach. Write a brief, encouraging daily notification (3-5 sentences max) for a staff member about their pending tasks. Be specific to their actual tasks. Mention any overdue or blocked items first. Give one concrete tip to make progress today. Keep it motivating and actionable. Do NOT use markdown — plain text only.`,
            },
            {
              role: 'user',
              content: `Staff: ${staff.name} (${staff.systemRole})\nPending tasks (${pendingTasks.length}):\n${taskList}\n${overdue.length > 0 ? `\n⚠️ ${overdue.length} overdue task(s)` : ''}${blocked.length > 0 ? `\n🚫 ${blocked.length} blocked task(s)` : ''}${highPri.length > 0 ? `\n🔴 ${highPri.length} high-priority task(s)` : ''}`,
            },
          ],
          { model: modelName, maxTokens: 300, temperature: 0.8 },
        )

        if (result.content.trim()) {
          await prisma.notification.create({
            data: {
              recipientId: staff.id,
              recipientType: 'staff',
              type: 'task',
              title: `Daily task coach — ${pendingTasks.length} pending`,
              message: result.content.trim(),
              link: '/tasks',
            },
          })
          sent++
        }

        await prisma.aiUsage.create({
          data: {
            staffId: staff.id,
            provider: providerName,
            model: modelName,
            inputTk: result.inputTokens,
            outputTk: result.outputTokens,
            useCase: 'TASK',
          },
        })
      } catch (aiErr) {
        console.error(`[CRON:AI-TASK] AI call failed for ${staff.name}:`, aiErr instanceof Error ? aiErr.message : aiErr)
      }
    }

    if (sent > 0) console.log(`[CRON:AI-TASK] Sent AI task tips to ${sent} staff`)
  } catch (e) {
    console.error('[CRON:AI-TASK] Job error:', e)
  }
})

export function startAllJobs() {
  console.log('⏰ Background jobs started (5 cron jobs)')
}
export const startJobs = startAllJobs
