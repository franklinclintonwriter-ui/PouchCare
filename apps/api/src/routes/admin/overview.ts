/**
 * /v1/admin/overview — Cross-domain KPI dashboard for admin home.
 * Aggregates clients, orders, revenue, and support counts.
 * See Notion §3.2 (Admin Overview).
 */
import { Router } from 'express'
import prisma from '@/lib/prisma'
import { authenticate } from '@/middleware/auth'
import { requirePermission } from '@/middleware/rbac'
import { ok, serverError } from '@/lib/response'

const router = Router()
router.use(authenticate)

router.get('/', requirePermission('admin.overview.read'), async (_req, res) => {
  try {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    const [
      totalMembers,
      totalAccounts,
      newMembersWk,
      activeMembers,
      totalOrders,
      pendingOrders,
      inProgressOrders,
      deliveredOrders,
      completedOrders,
      mtdSpendAgg,
      openTickets,
    ] = await Promise.all([
      prisma.portalMember.count(),
      prisma.clientAccount.count(),
      prisma.portalMember.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      prisma.portalMember.count({ where: { status: 'ACTIVE' as any } }),
      prisma.portalOrder.count(),
      prisma.portalOrder.count({ where: { status: 'PENDING' as any } }),
      prisma.portalOrder.count({
        where: { status: { in: ['PROCESSING', 'IN_PROGRESS'] as any } },
      }),
      prisma.portalOrder.count({ where: { status: 'DELIVERED' as any } }),
      prisma.portalOrder.count({ where: { status: 'COMPLETED' as any } }),
      prisma.portalOrder.aggregate({
        _sum: { amountUsd: true },
        where: { orderDate: { gte: startOfMonth } },
      }),
      prisma.supportTicket
        .count({ where: { status: { in: ['OPEN', 'IN_PROGRESS'] as any } } })
        .catch(() => 0),
    ])

    const totalClients = totalMembers + totalAccounts
    const activePct = totalMembers > 0 ? Math.round((activeMembers / totalMembers) * 100) : 0

    return ok(res, {
      clients: {
        total: totalClients,
        newThisWeek: newMembersWk,
        activePct,
      },
      orders: {
        total: totalOrders,
        byStatus: {
          PENDING: pendingOrders,
          IN_PROGRESS: inProgressOrders,
          DELIVERED: deliveredOrders,
          COMPLETED: completedOrders,
        },
        overdue: 0,
        unassigned: 0,
      },
      revenue: {
        mtdUsd: mtdSpendAgg._sum.amountUsd ?? 0,
      },
      support: {
        open: openTickets,
        overdueSla: 0,
      },
      generatedAt: now.toISOString(),
    })
  } catch (e) {
    return serverError(res, e)
  }
})

export default router
