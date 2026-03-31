import { ApprovalStatus } from '@prisma/client'
import { Router } from 'express'
import { authenticate, isOps } from '@/middleware/auth'
import prisma from '@/lib/prisma'
import { ok, serverError } from '@/lib/response'

const router = Router()
router.use(authenticate, isOps)

// GET /analytics/health — Company Health Score
router.get('/health', async (_, res) => {
  try {
    const [tasksDone, tasksTotal, presentToday, staffTotal, pipelineWon, pipelineTotal, activeClients] = await Promise.all([
      prisma.task.count({ where: { approvalStatus: "VERIFIED" as any } }),
      prisma.task.count(),
      prisma.attendance.count({ where: { status: 'PRESENT', date: { gte: new Date(new Date().setHours(0,0,0,0)) } } }),
      prisma.staffMember.count({ where: { status: { equals: 'Active', mode: 'insensitive' } } }),
      prisma.crmLead.count({ where: { stage: 'WON' } }),
      prisma.crmLead.count(),
      prisma.portalMember.count({ where: { status: 'ACTIVE' } }),
    ])

    const taskScore   = tasksTotal > 0 ? Math.min(100, (tasksDone / tasksTotal) * 100) : 100
    const attendScore = staffTotal > 0 ? Math.min(100, (presentToday / staffTotal) * 100) : 100
    const pipeScore   = pipelineTotal > 0 ? Math.min(100, (pipelineWon / pipelineTotal) * 100) : 50
    const clientScore = Math.min(100, activeClients * 2)
    const total       = Math.round((taskScore * 0.25) + (attendScore * 0.20) + (pipeScore * 0.25) + (clientScore * 0.15) + 75 * 0.15)

    return ok(res, {
      total: Math.min(100, total),
      breakdown: { tasks: Math.round(taskScore), attendance: Math.round(attendScore), pipeline: Math.round(pipeScore), clients: Math.round(clientScore) },
      meta: { tasksDone, tasksTotal, presentToday, staffTotal, activeClients },
    })
  } catch (e) { console.error(e); return serverError(res) }
})

// GET /analytics/revenue
router.get('/revenue', async (req, res) => {
  try {
    const year = parseInt(String(req.query.year ?? "")) || new Date().getFullYear()
    const data = await prisma.monthlyRevenue.findMany({ where: { year }, orderBy: { month: 'asc' } })
    const total = data.reduce((s, r) => s + r.totalRevenueUsd, 0)
    const totalExpenses = data.reduce((s, r) => s + (r.totalExpensesUsd ?? 0), 0)
    return ok(res, { data, summary: { totalRevenue: total, totalExpenses, netProfit: total - totalExpenses } })
  } catch { return serverError(res) }
})

// GET /analytics/staff
router.get('/staff', async (_, res) => {
  try {
    const [total, active, onLeave] = await Promise.all([
      prisma.staffMember.count(),
      prisma.staffMember.count({ where: { status: { equals: 'Active', mode: 'insensitive' } } }),
      prisma.staffMember.count({ where: { status: { in: ['On Leave', 'ON_LEAVE', 'on_leave'] } } }),
    ])
    const topRated = await prisma.staffMember.findMany({
      where: { averageTaskRating: { not: null } },
      orderBy: { averageTaskRating: 'desc' },
      take: 5,
      select: { id:true, name:true, branch:true, averageTaskRating:true, tasksCompleted:true },
    })
    return ok(res, { total, active, onLeave, topRated })
  } catch { return serverError(res) }
})

// GET /analytics/clients
router.get('/clients', async (_, res) => {
  try {
    const [total, active, newThisMonth] = await Promise.all([
      prisma.portalMember.count(),
      prisma.portalMember.count({ where: { status: 'ACTIVE' } }),
      prisma.portalMember.count({ where: { registrationDate: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } } }),
    ])
    const topSpenders = await prisma.portalMember.findMany({
      orderBy: { totalSpent: 'desc' }, take: 10,
      select: { id:true, fullName:true, country:true, totalSpent:true, totalOrders:true },
    })
    return ok(res, { total, active, newThisMonth, topSpenders })
  } catch { return serverError(res) }
})

// GET /analytics/leaderboard
router.get('/leaderboard', async (_, res) => {
  try {
    const [staffLb, referrerLb] = await Promise.all([
      prisma.staffMember.findMany({
        where: { status: { equals: 'Active', mode: 'insensitive' }, averageTaskRating: { not: null } },
        orderBy: { averageTaskRating: 'desc' }, take: 10,
        select: { id:true, name:true, branch:true, systemRole:true, tasksCompleted:true, averageTaskRating:true },
      }),
      prisma.portalMember.findMany({
        orderBy: { totalCommissionEarned: 'desc' }, take: 10,
        select: { id:true, fullName:true, country:true, totalReferrals:true, totalCommissionEarned:true },
      }),
    ])
    return ok(res, { staff: staffLb, referrers: referrerLb })
  } catch { return serverError(res) }
})

// GET /analytics/forecast
router.get('/forecast', async (_, res) => {
  try {
    const recent = await prisma.monthlyRevenue.findMany({ orderBy: [{ year: 'desc' }, { month: 'desc' }], take: 6 })
    if (recent.length === 0) return ok(res, { forecast: [] })
    const avg = recent.reduce((s, r) => s + r.totalRevenueUsd, 0) / recent.length
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
    const now = new Date()
    const forecast = [1, 2, 3].map((i) => {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1)
      return { month: months[d.getMonth()], year: d.getFullYear(), projected: parseFloat((avg * Math.pow(1.05, i)).toFixed(2)), low: parseFloat((avg * 0.9).toFixed(2)), high: parseFloat((avg * 1.15).toFixed(2)) }
    })
    return ok(res, { forecast, basis: { months: recent.length, avgRevenue: parseFloat(avg.toFixed(2)) } })
  } catch { return serverError(res) }
})

export default router
