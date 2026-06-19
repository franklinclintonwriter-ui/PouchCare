import { Router } from "express";
import { authenticate } from "@/middleware/auth";
import { requirePermission } from "@/middleware/rbac";
import prisma from "@/lib/prisma";
import { ok, serverError } from "@/lib/response";

const router = Router();
router.use(authenticate, requirePermission("analytics.access"));

// ── Helpers ─────────────────────────────────────────────────────────────────

function getStartOfDay(date: Date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function getStartOfMonth(date: Date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function getStartOfLastMonth() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() - 1, 1);
}

function getEndOfLastMonth() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
}

function calcTrend(
  current: number,
  previous: number,
): { change: number; direction: "up" | "down" | "neutral" } {
  if (previous === 0)
    return {
      change: current > 0 ? 100 : 0,
      direction: current > 0 ? "up" : "neutral",
    };
  const change = Math.round(((current - previous) / previous) * 100);
  return {
    change: Math.abs(change),
    direction: change > 0 ? "up" : change < 0 ? "down" : "neutral",
  };
}

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

// ── GET /analytics/summary — Consolidated Dashboard Data ────────────────────

router.get("/summary", async (_, res) => {
  try {
    const today = getStartOfDay();
    const thisMonth = getStartOfMonth();
    const lastMonthStart = getStartOfLastMonth();
    const lastMonthEnd = getEndOfLastMonth();
    const currentYear = new Date().getFullYear();

    // Parallel queries for all dashboard data
    const [
      // Tasks
      tasksDone,
      tasksTotal,
      tasksInProgress,
      tasksPending,
      tasksLastMonth,
      // Attendance
      presentToday,
      presentYesterday,
      // Staff
      staffTotal,
      staffActive,
      staffOnLeave,
      staffNewThisMonth,
      staffLastMonth,
      // Clients
      clientsTotal,
      clientsActive,
      clientsNewThisMonth,
      clientsNewLastMonth,
      // Pipeline
      pipelineWon,
      pipelineTotal,
      // Revenue
      revenueData,
      lastYearRevenue,
      // Recent activities
      recentTasks,
      recentAttendance,
      recentLeads,
      // Leaderboards
      topStaff,
      topClients,
      topReferrers,
    ] = await Promise.all([
      // Tasks
      prisma.task.count({ where: { approvalStatus: "VERIFIED" } }),
      prisma.task.count(),
      prisma.task.count({ where: { status: "IN_PROGRESS" } }),
      prisma.task.count({ where: { status: "NOT_STARTED" } }),
      prisma.task.count({
        where: {
          approvalStatus: "VERIFIED",
          updatedAt: { gte: lastMonthStart, lte: lastMonthEnd },
        },
      }),
      // Attendance
      prisma.attendance.count({
        where: { status: "PRESENT", date: { gte: today } },
      }),
      prisma.attendance.count({
        where: {
          status: "PRESENT",
          date: { gte: new Date(today.getTime() - 86400000), lt: today },
        },
      }),
      // Staff
      prisma.staffMember.count(),
      prisma.staffMember.count({
        where: { status: { equals: "Active" } },
      }),
      prisma.staffMember.count({
        where: { status: { in: ["On Leave", "ON_LEAVE", "on_leave"] } },
      }),
      prisma.staffMember.count({ where: { createdAt: { gte: thisMonth } } }),
      prisma.staffMember.count({
        where: {
          status: { equals: "Active" },
          createdAt: { gte: lastMonthStart, lte: lastMonthEnd },
        },
      }),
      // Clients
      prisma.portalMember.count(),
      prisma.portalMember.count({ where: { status: "ACTIVE" } }),
      prisma.portalMember.count({
        where: { registrationDate: { gte: thisMonth } },
      }),
      prisma.portalMember.count({
        where: { registrationDate: { gte: lastMonthStart, lte: lastMonthEnd } },
      }),
      // Pipeline
      prisma.crmLead.count({ where: { stage: "WON" } }),
      prisma.crmLead.count(),
      // Revenue
      prisma.monthlyRevenue.findMany({
        where: { year: currentYear },
        orderBy: { month: "asc" },
      }),
      prisma.monthlyRevenue.findMany({
        where: { year: currentYear - 1 },
        orderBy: { month: "asc" },
      }),
      // Recent activities
      prisma.task.findMany({
        where: { updatedAt: { gte: new Date(Date.now() - 7 * 86400000) } },
        orderBy: { updatedAt: "desc" },
        take: 5,
        select: {
          id: true,
          title: true,
          status: true,
          updatedAt: true,
          assignedMember: { select: { name: true } },
        },
      }),
      prisma.attendance.findMany({
        where: { date: { gte: today }, checkInTime: { not: null } },
        orderBy: { checkInTime: "desc" },
        take: 5,
        select: {
          id: true,
          staffMember: { select: { name: true } },
          status: true,
          checkInTime: true,
        },
      }),
      prisma.crmLead.findMany({
        where: { updatedAt: { gte: new Date(Date.now() - 7 * 86400000) } },
        orderBy: { updatedAt: "desc" },
        take: 5,
        select: {
          id: true,
          company: true,
          stage: true,
          estimatedValue: true,
          updatedAt: true,
        },
      }),
      // Leaderboards
      prisma.staffMember.findMany({
        where: {
          status: { equals: "Active" },
          averageTaskRating: { not: null },
        },
        orderBy: { averageTaskRating: "desc" },
        take: 5,
        select: {
          id: true,
          name: true,
          branch: true,
          systemRole: true,
          tasksCompleted: true,
          averageTaskRating: true,
        },
      }),
      prisma.portalMember.findMany({
        orderBy: { totalSpent: "desc" },
        take: 5,
        select: {
          id: true,
          fullName: true,
          country: true,
          totalSpent: true,
          totalOrders: true,
        },
      }),
      prisma.portalMember.findMany({
        where: { totalCommissionEarned: { gt: 0 } },
        orderBy: { totalCommissionEarned: "desc" },
        take: 5,
        select: {
          id: true,
          fullName: true,
          country: true,
          totalReferrals: true,
          totalCommissionEarned: true,
        },
      }),
    ]);

    // Calculate scores
    const taskScore =
      tasksTotal > 0 ? Math.min(100, (tasksDone / tasksTotal) * 100) : 100;
    const attendScore =
      staffActive > 0 ? Math.min(100, (presentToday / staffActive) * 100) : 100;
    const pipeScore =
      pipelineTotal > 0
        ? Math.min(100, (pipelineWon / pipelineTotal) * 100)
        : 50;
    const clientScore = Math.min(100, clientsActive * 2);
    const healthTotal = Math.round(
      taskScore * 0.25 +
        attendScore * 0.2 +
        pipeScore * 0.25 +
        clientScore * 0.15 +
        75 * 0.15,
    );

    // Revenue calculations
    const totalRevenue = revenueData.reduce((s, r) => s + r.totalRevenueUsd, 0);
    const totalExpenses = revenueData.reduce(
      (s, r) => s + (r.totalExpensesUsd ?? 0),
      0,
    );
    const lastYearTotal = lastYearRevenue.reduce(
      (s, r) => s + r.totalRevenueUsd,
      0,
    );

    // Trends
    const revenueTrend = calcTrend(totalRevenue, lastYearTotal);
    const clientTrend = calcTrend(clientsNewThisMonth, clientsNewLastMonth);
    const staffTrend = calcTrend(staffActive, staffLastMonth || staffActive);
    const attendTrend = calcTrend(presentToday, presentYesterday);

    return ok(res, {
      health: {
        total: Math.min(100, healthTotal),
        breakdown: {
          tasks: Math.round(taskScore),
          attendance: Math.round(attendScore),
          pipeline: Math.round(pipeScore),
          clients: Math.round(clientScore),
        },
      },
      kpis: {
        revenue: {
          value: totalRevenue,
          trend: revenueTrend,
          label: "YTD Revenue",
        },
        profit: {
          value: totalRevenue - totalExpenses,
          expenses: totalExpenses,
        },
        staff: {
          total: staffTotal,
          active: staffActive,
          onLeave: staffOnLeave,
          newThisMonth: staffNewThisMonth,
          trend: staffTrend,
        },
        attendance: {
          presentToday,
          staffTotal: staffActive,
          percentage:
            staffActive > 0
              ? Math.round((presentToday / staffActive) * 100)
              : 0,
          trend: attendTrend,
        },
        clients: {
          total: clientsTotal,
          active: clientsActive,
          newThisMonth: clientsNewThisMonth,
          trend: clientTrend,
        },
        tasks: {
          total: tasksTotal,
          done: tasksDone,
          inProgress: tasksInProgress,
          pending: tasksPending,
          completionRate:
            tasksTotal > 0 ? Math.round((tasksDone / tasksTotal) * 100) : 0,
        },
        pipeline: {
          won: pipelineWon,
          total: pipelineTotal,
          winRate:
            pipelineTotal > 0
              ? Math.round((pipelineWon / pipelineTotal) * 100)
              : 0,
        },
      },
      revenue: {
        data: revenueData.map((r) => {
          const monthNum = parseInt(r.month, 10) || 1;
          return {
            month: MONTH_NAMES[monthNum - 1] || r.month,
            monthNum,
            year: r.year,
            revenue: r.totalRevenueUsd,
            expenses: r.totalExpensesUsd ?? 0,
            profit: r.totalRevenueUsd - (r.totalExpensesUsd ?? 0),
          };
        }),
        summary: {
          totalRevenue,
          totalExpenses,
          netProfit: totalRevenue - totalExpenses,
          avgMonthly:
            revenueData.length > 0
              ? Math.round(totalRevenue / revenueData.length)
              : 0,
        },
      },
      activities: {
        tasks: recentTasks.map((t) => ({
          id: t.id,
          type: "task" as const,
          title: t.title,
          status: t.status,
          subtitle: t.assignedMember?.name
            ? `Assigned · ${t.assignedMember.name}`
            : "Unassigned",
          time:
            t.updatedAt instanceof Date
              ? t.updatedAt.toISOString()
              : String(t.updatedAt),
        })),
        attendance: recentAttendance.map((a) => ({
          id: a.id,
          type: "attendance" as const,
          title: `${a.staffMember?.name ?? "Staff"} checked in`,
          status: a.status,
          time:
            a.checkInTime instanceof Date
              ? a.checkInTime.toISOString()
              : String(a.checkInTime),
        })),
        leads: recentLeads.map((l) => ({
          id: l.id,
          type: "lead" as const,
          title: l.company ?? "New Lead",
          status: l.stage,
          value: l.estimatedValue ?? undefined,
          subtitle:
            l.estimatedValue != null && Number(l.estimatedValue) > 0
              ? `Est. value · ${Number(l.estimatedValue).toLocaleString()}`
              : undefined,
          time:
            l.updatedAt instanceof Date
              ? l.updatedAt.toISOString()
              : String(l.updatedAt),
        })),
      },
      leaderboards: {
        staff: topStaff,
        clients: topClients,
        referrers: topReferrers,
      },
      generatedAt: new Date().toISOString(),
    });
  } catch (e) {
    console.error("Dashboard summary error:", e);
    return serverError(res);
  }
});

// ── GET /analytics/health — Company Health Score ────────────────────────────

router.get("/health", async (_, res) => {
  try {
    const today = getStartOfDay();

    const [
      tasksDone,
      tasksTotal,
      presentToday,
      staffTotal,
      pipelineWon,
      pipelineTotal,
      activeClients,
    ] = await Promise.all([
      prisma.task.count({ where: { approvalStatus: "VERIFIED" } }),
      prisma.task.count(),
      prisma.attendance.count({
        where: { status: "PRESENT", date: { gte: today } },
      }),
      prisma.staffMember.count({
        where: { status: { equals: "Active" } },
      }),
      prisma.crmLead.count({ where: { stage: "WON" } }),
      prisma.crmLead.count(),
      prisma.portalMember.count({ where: { status: "ACTIVE" } }),
    ]);

    const taskScore =
      tasksTotal > 0 ? Math.min(100, (tasksDone / tasksTotal) * 100) : 100;
    const attendScore =
      staffTotal > 0 ? Math.min(100, (presentToday / staffTotal) * 100) : 100;
    const pipeScore =
      pipelineTotal > 0
        ? Math.min(100, (pipelineWon / pipelineTotal) * 100)
        : 50;
    const clientScore = Math.min(100, activeClients * 2);
    const total = Math.round(
      taskScore * 0.25 +
        attendScore * 0.2 +
        pipeScore * 0.25 +
        clientScore * 0.15 +
        75 * 0.15,
    );

    return ok(res, {
      total: Math.min(100, total),
      breakdown: {
        tasks: Math.round(taskScore),
        attendance: Math.round(attendScore),
        pipeline: Math.round(pipeScore),
        clients: Math.round(clientScore),
      },
      meta: { tasksDone, tasksTotal, presentToday, staffTotal, activeClients },
    });
  } catch (e) {
    console.error(e);
    return serverError(res);
  }
});

// ── GET /analytics/revenue ──────────────────────────────────────────────────

router.get("/revenue", async (req, res) => {
  try {
    const year =
      parseInt(String(req.query.year ?? "")) || new Date().getFullYear();
    const data = await prisma.monthlyRevenue.findMany({
      where: { year },
      orderBy: { month: "asc" },
    });
    const total = data.reduce((s, r) => s + r.totalRevenueUsd, 0);
    const totalExpenses = data.reduce(
      (s, r) => s + (r.totalExpensesUsd ?? 0),
      0,
    );
    return ok(res, {
      data,
      summary: {
        totalRevenue: total,
        totalExpenses,
        netProfit: total - totalExpenses,
      },
    });
  } catch {
    return serverError(res);
  }
});

// ── GET /analytics/staff ────────────────────────────────────────────────────

router.get("/staff", async (_, res) => {
  try {
    const thisMonth = getStartOfMonth();

    const [total, active, onLeave, newThisMonth] = await Promise.all([
      prisma.staffMember.count(),
      prisma.staffMember.count({
        where: { status: { equals: "Active" } },
      }),
      prisma.staffMember.count({
        where: { status: { in: ["On Leave", "ON_LEAVE", "on_leave"] } },
      }),
      prisma.staffMember.count({ where: { createdAt: { gte: thisMonth } } }),
    ]);

    const topRated = await prisma.staffMember.findMany({
      where: { averageTaskRating: { not: null } },
      orderBy: { averageTaskRating: "desc" },
      take: 5,
      select: {
        id: true,
        name: true,
        branch: true,
        averageTaskRating: true,
        tasksCompleted: true,
      },
    });

    return ok(res, { total, active, onLeave, newThisMonth, topRated });
  } catch {
    return serverError(res);
  }
});

// ── GET /analytics/clients ──────────────────────────────────────────────────

router.get("/clients", async (_, res) => {
  try {
    const thisMonth = getStartOfMonth();

    const [total, active, newThisMonth, totalSpent] = await Promise.all([
      prisma.portalMember.count(),
      prisma.portalMember.count({ where: { status: "ACTIVE" } }),
      prisma.portalMember.count({
        where: { registrationDate: { gte: thisMonth } },
      }),
      prisma.portalMember.aggregate({ _sum: { totalSpent: true } }),
    ]);

    const topSpenders = await prisma.portalMember.findMany({
      orderBy: { totalSpent: "desc" },
      take: 10,
      select: {
        id: true,
        fullName: true,
        country: true,
        totalSpent: true,
        totalOrders: true,
      },
    });

    return ok(res, {
      total,
      active,
      newThisMonth,
      totalSpent: totalSpent._sum.totalSpent ?? 0,
      topSpenders,
    });
  } catch {
    return serverError(res);
  }
});

// ── GET /analytics/leaderboard ──────────────────────────────────────────────

router.get("/leaderboard", async (_, res) => {
  try {
    const [staffLb, referrerLb] = await Promise.all([
      prisma.staffMember.findMany({
        where: {
          status: { equals: "Active" },
          averageTaskRating: { not: null },
        },
        orderBy: { averageTaskRating: "desc" },
        take: 10,
        select: {
          id: true,
          name: true,
          branch: true,
          systemRole: true,
          tasksCompleted: true,
          averageTaskRating: true,
        },
      }),
      prisma.portalMember.findMany({
        where: { totalCommissionEarned: { gt: 0 } },
        orderBy: { totalCommissionEarned: "desc" },
        take: 10,
        select: {
          id: true,
          fullName: true,
          country: true,
          totalReferrals: true,
          totalCommissionEarned: true,
        },
      }),
    ]);
    return ok(res, { staff: staffLb, referrers: referrerLb });
  } catch {
    return serverError(res);
  }
});

// ── GET /analytics/forecast ─────────────────────────────────────────────────

router.get("/forecast", async (_, res) => {
  try {
    const recent = await prisma.monthlyRevenue.findMany({
      orderBy: [{ year: "desc" }, { month: "desc" }],
      take: 6,
    });
    if (recent.length === 0) return ok(res, { forecast: [], basis: null });

    const avg =
      recent.reduce((s, r) => s + r.totalRevenueUsd, 0) / recent.length;
    const avgExpenses =
      recent.reduce((s, r) => s + (r.totalExpensesUsd ?? 0), 0) / recent.length;

    // Calculate growth rate from recent data
    const growthRates: number[] = [];
    for (let i = 0; i < recent.length - 1; i++) {
      if (recent[i + 1].totalRevenueUsd > 0) {
        growthRates.push(
          (recent[i].totalRevenueUsd - recent[i + 1].totalRevenueUsd) /
            recent[i + 1].totalRevenueUsd,
        );
      }
    }
    const avgGrowth =
      growthRates.length > 0
        ? growthRates.reduce((a, b) => a + b, 0) / growthRates.length
        : 0.05;

    const now = new Date();
    const forecast = [1, 2, 3].map((i) => {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const projected = avg * Math.pow(1 + avgGrowth, i);
      return {
        month: MONTH_NAMES[d.getMonth()],
        year: d.getFullYear(),
        projected: Math.round(projected),
        low: Math.round(projected * 0.85),
        high: Math.round(projected * 1.15),
        expenses: Math.round(avgExpenses),
        profit: Math.round(projected - avgExpenses),
      };
    });

    return ok(res, {
      forecast,
      basis: {
        months: recent.length,
        avgRevenue: Math.round(avg),
        avgExpenses: Math.round(avgExpenses),
        avgGrowth: Math.round(avgGrowth * 100),
      },
    });
  } catch {
    return serverError(res);
  }
});

// ── GET /analytics/tasks — Task Statistics ──────────────────────────────────

router.get("/tasks", async (_, res) => {
  try {
    const thisMonth = getStartOfMonth();
    const lastMonthStart = getStartOfLastMonth();
    const lastMonthEnd = getEndOfLastMonth();

    const [
      total,
      done,
      inProgress,
      pending,
      overdue,
      thisMonthDone,
      lastMonthDone,
    ] = await Promise.all([
      prisma.task.count(),
      prisma.task.count({ where: { approvalStatus: "VERIFIED" } }),
      prisma.task.count({ where: { status: "IN_PROGRESS" } }),
      prisma.task.count({ where: { status: "NOT_STARTED" } }),
      prisma.task.count({
        where: { status: { not: "DONE" }, deadline: { lt: new Date() } },
      }),
      prisma.task.count({
        where: { approvalStatus: "VERIFIED", updatedAt: { gte: thisMonth } },
      }),
      prisma.task.count({
        where: {
          approvalStatus: "VERIFIED",
          updatedAt: { gte: lastMonthStart, lte: lastMonthEnd },
        },
      }),
    ]);

    const trend = calcTrend(thisMonthDone, lastMonthDone);

    return ok(res, {
      total,
      done,
      inProgress,
      pending,
      overdue,
      completionRate: total > 0 ? Math.round((done / total) * 100) : 0,
      thisMonth: thisMonthDone,
      trend,
    });
  } catch {
    return serverError(res);
  }
});

// ── GET /analytics/activities — Recent Activities ───────────────────────────

router.get("/activities", async (req, res) => {
  try {
    const limit = Math.min(parseInt(String(req.query.limit ?? "")) || 20, 50);
    const since = new Date(Date.now() - 7 * 86400000); // Last 7 days

    const [tasks, attendance, leads, orders] = await Promise.all([
      prisma.task.findMany({
        where: { updatedAt: { gte: since } },
        orderBy: { updatedAt: "desc" },
        take: limit,
        select: {
          id: true,
          title: true,
          status: true,
          approvalStatus: true,
          updatedAt: true,
          assignedMember: { select: { id: true, name: true } },
        },
      }),
      prisma.attendance.findMany({
        where: { date: { gte: getStartOfDay() } },
        orderBy: { checkInTime: "desc" },
        take: limit,
        select: {
          id: true,
          status: true,
          checkInTime: true,
          checkOutTime: true,
          staffMember: { select: { id: true, name: true } },
        },
      }),
      prisma.crmLead.findMany({
        where: { updatedAt: { gte: since } },
        orderBy: { updatedAt: "desc" },
        take: limit,
        select: {
          id: true,
          company: true,
          stage: true,
          estimatedValue: true,
          updatedAt: true,
        },
      }),
      prisma.portalOrder.findMany({
        where: { createdAt: { gte: since } },
        orderBy: { createdAt: "desc" },
        take: limit,
        select: {
          id: true,
          service: true,
          status: true,
          amountUsd: true,
          createdAt: true,
          member: { select: { fullName: true } },
        },
      }),
    ]);

    // Combine and sort all activities
    const activities = [
      ...tasks.map((t) => ({
        id: t.id,
        type: "task" as const,
        title: t.title,
        subtitle: `Assigned to ${t.assignedMember?.name ?? "Unassigned"}`,
        status: t.status,
        time: t.updatedAt,
      })),
      ...attendance.map((a) => ({
        id: a.id,
        type: "attendance" as const,
        title: `${a.staffMember?.name ?? "Staff"} ${a.checkOutTime ? "checked out" : "checked in"}`,
        subtitle: a.status,
        status: a.status,
        time: a.checkInTime,
      })),
      ...leads.map((l) => ({
        id: l.id,
        type: "lead" as const,
        title: l.company ?? "Lead Updated",
        subtitle: `Stage: ${l.stage}`,
        status: l.stage,
        value: l.estimatedValue,
        time: l.updatedAt,
      })),
      ...orders.map((o) => ({
        id: o.id,
        type: "order" as const,
        title: `New order: ${o.service}`,
        subtitle: `From ${o.member?.fullName ?? "Client"}`,
        status: o.status,
        value: o.amountUsd,
        time: o.createdAt,
      })),
    ]
      .sort((a, b) => {
        const timeA = a.time ? new Date(a.time).getTime() : 0;
        const timeB = b.time ? new Date(b.time).getTime() : 0;
        return timeB - timeA;
      })
      .slice(0, limit);

    return ok(res, { activities });
  } catch {
    return serverError(res);
  }
});

export default router;
