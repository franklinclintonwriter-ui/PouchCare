import { Router } from "express";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { authenticate } from "@/middleware/auth";
import { requirePermission } from "@/middleware/rbac";
import { validate } from "@/middleware/validate";
import { getPagination, buildMeta } from "@/utils/pagination";
import { ok, created, notFound, serverError } from "@/utils/response";

const router = Router();
router.use(authenticate);

const revenueSchema = z.object({
  month: z.string().min(1),
  year: z.number().int().min(2000).max(3000),
  totalRevenueUsd: z.number(),
  totalExpensesUsd: z.number().optional(),
  notes: z.string().optional(),
});
// ── INVOICES ──
router.get(
  "/invoices",
  requirePermission("finance.access"),
  async (req, res) => {
    try {
      const { page, limit, skip } = getPagination(req);
      const { status, q } = req.query as Record<string, string>;
      const where: any = {};
      if (status) where.status = status;
      if (q)
        where.OR = [
          { clientName: { contains: q, mode: "insensitive" } },
          { invoiceNumber: { contains: q, mode: "insensitive" } },
        ];
      const [invoices, total] = await Promise.all([
        prisma.invoice.findMany({
          where,
          skip,
          take: limit,
          orderBy: { issueDate: "desc" },
        }),
        prisma.invoice.count({ where }),
      ]);
      return ok(res, invoices, buildMeta(total, page, limit));
    } catch (err) {
      serverError(res, err);
    }
  },
);

router.get(
  "/invoices/:id",
  requirePermission("finance.access"),
  async (req, res) => {
    try {
      const inv = await prisma.invoice.findUnique({
        where: { id: req.params.id },
      });
      if (!inv) return notFound(res);
      return ok(res, inv);
    } catch (err) {
      serverError(res, err);
    }
  },
);

router.post(
  "/invoices",
  requirePermission("finance.access"),
  async (req, res) => {
    try {
      const count = await prisma.invoice.count();
      const invoiceNumber = `INV-${String(count + 1).padStart(4, "0")}`;
      const inv = await prisma.invoice.create({
        data: {
          ...req.body,
          invoiceNumber,
          issueDate: new Date(req.body.issueDate || Date.now()),
        },
      });
      return created(res, inv);
    } catch (err) {
      serverError(res, err);
    }
  },
);

router.put(
  "/invoices/:id",
  requirePermission("finance.access"),
  async (req, res) => {
    try {
      const inv = await prisma.invoice.update({
        where: { id: req.params.id },
        data: req.body,
      });
      return ok(res, inv);
    } catch (err) {
      serverError(res, err);
    }
  },
);

router.delete(
  "/invoices/:id",
  requirePermission("finance.access"),
  async (req, res) => {
    try {
      await prisma.invoice.delete({ where: { id: req.params.id } });
      return ok(res, { message: "Invoice deleted" });
    } catch (err) {
      serverError(res, err);
    }
  },
);

// ── EXPENSES ──
router.get(
  "/expenses",
  requirePermission("finance.access"),
  async (req, res) => {
    try {
      const { page, limit, skip } = getPagination(req);
      const [expenses, total] = await Promise.all([
        prisma.expense.findMany({
          skip,
          take: limit,
          orderBy: { expenseDate: "desc" },
        }),
        prisma.expense.count(),
      ]);
      return ok(res, expenses, buildMeta(total, page, limit));
    } catch (err) {
      serverError(res, err);
    }
  },
);

router.post(
  "/expenses",
  requirePermission("finance.access"),
  async (req, res) => {
    try {
      const exp = await prisma.expense.create({
        data: {
          ...req.body,
          expenseDate: new Date(req.body.expenseDate || Date.now()),
        },
      });
      return created(res, exp);
    } catch (err) {
      serverError(res, err);
    }
  },
);

router.get(
  "/expenses/:id",
  requirePermission("finance.access"),
  async (req, res) => {
    try {
      const exp = await prisma.expense.findUnique({
        where: { id: req.params.id },
      });
      if (!exp) return notFound(res);
      return ok(res, exp);
    } catch (err) {
      serverError(res, err);
    }
  },
);

router.put(
  "/expenses/:id",
  requirePermission("finance.access"),
  async (req, res) => {
    try {
      const exp = await prisma.expense.update({
        where: { id: req.params.id },
        data: req.body,
      });
      return ok(res, exp);
    } catch (err) {
      serverError(res, err);
    }
  },
);

router.delete(
  "/expenses/:id",
  requirePermission("finance.access"),
  async (req, res) => {
    try {
      await prisma.expense.delete({ where: { id: req.params.id } });
      return ok(res, { message: "Expense deleted" });
    } catch (err) {
      serverError(res, err);
    }
  },
);

// ── REVENUE ──
router.get(
  "/revenue/monthly",
  requirePermission("finance.access"),
  async (req, res) => {
    try {
      const { page, limit, skip } = getPagination(req);
      const [records, total] = await Promise.all([
        prisma.monthlyRevenue.findMany({
          skip,
          take: limit,
          orderBy: [{ year: "desc" }, { month: "desc" }],
        }),
        prisma.monthlyRevenue.count(),
      ]);
      return ok(res, records, buildMeta(total, page, limit));
    } catch (err) {
      serverError(res, err);
    }
  },
);

router.post(
  "/revenue/monthly",
  requirePermission("finance.access"),
  validate(revenueSchema),
  async (req, res) => {
    try {
      const payload = req.body as z.infer<typeof revenueSchema>;
      const netProfitUsd =
        payload.totalRevenueUsd - (payload.totalExpensesUsd ?? 0);
      const record = await prisma.monthlyRevenue.create({
        data: {
          month: payload.month,
          year: payload.year,
          totalRevenueUsd: payload.totalRevenueUsd,
          totalExpensesUsd: payload.totalExpensesUsd,
          netProfitUsd,
          notes: payload.notes,
        },
      });
      return created(res, record);
    } catch (err) {
      serverError(res, err);
    }
  },
);

router.put(
  "/revenue/monthly/:id",
  requirePermission("finance.access"),
  async (req, res) => {
    try {
      const existing = await prisma.monthlyRevenue.findUnique({
        where: { id: req.params.id },
      });
      if (!existing) return notFound(res);
      const totalRevenueUsd =
        req.body.totalRevenueUsd ?? existing.totalRevenueUsd;
      const totalExpensesUsd =
        req.body.totalExpensesUsd ?? existing.totalExpensesUsd ?? 0;
      const netProfitUsd = totalRevenueUsd - totalExpensesUsd;
      const record = await prisma.monthlyRevenue.update({
        where: { id: req.params.id },
        data: {
          month: req.body.month,
          year: req.body.year,
          totalRevenueUsd: req.body.totalRevenueUsd,
          totalExpensesUsd: req.body.totalExpensesUsd,
          netProfitUsd,
          notes: req.body.notes,
        },
      });
      return ok(res, record);
    } catch (err) {
      serverError(res, err);
    }
  },
);

router.delete(
  "/revenue/monthly/:id",
  requirePermission("finance.access"),
  async (req, res) => {
    try {
      await prisma.monthlyRevenue.delete({ where: { id: req.params.id } });
      return ok(res, { message: "Revenue record deleted" });
    } catch (err) {
      serverError(res, err);
    }
  },
);

// ── FORECAST ── simple projection from last 3 months average
router.get(
  "/forecast",
  requirePermission("finance.access"),
  async (req, res) => {
    try {
      const recent = await prisma.monthlyRevenue.findMany({
        orderBy: [{ year: "desc" }, { month: "desc" }],
        take: 3,
      });
      if (recent.length === 0) return ok(res, { forecast: [] });
      const avgRevenue =
        recent.reduce((s, r) => s + r.totalRevenueUsd, 0) / recent.length;
      const avgExpenses =
        recent.reduce((s, r) => s + (r.totalExpensesUsd ?? 0), 0) /
        recent.length;
      const months = [
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
      const now = new Date();
      const forecast = [1, 2, 3].map((offset) => {
        const d = new Date(now.getFullYear(), now.getMonth() + offset, 1);
        return {
          month: months[d.getMonth()],
          year: d.getFullYear(),
          projectedRevenue: parseFloat(
            (avgRevenue * (1 + 0.05 * offset)).toFixed(2),
          ),
          projectedExpenses: parseFloat((avgExpenses * 1.02).toFixed(2)),
          projectedProfit: parseFloat(
            (avgRevenue * (1 + 0.05 * offset) - avgExpenses * 1.02).toFixed(2),
          ),
        };
      });
      return ok(res, { forecast, basedOnMonths: recent.length });
    } catch (err) {
      serverError(res, err);
    }
  },
);

export default router;
