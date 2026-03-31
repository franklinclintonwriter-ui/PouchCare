import cron from 'node-cron'
import prisma from '@/lib/prisma'
import { sendPasswordResetEmail, sendVerificationEmail } from '@/lib/email'

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

export function startAllJobs() {
  console.log('⏰ Background jobs started (4 cron jobs)')
}
// Alias
export const startJobs = startAllJobs
