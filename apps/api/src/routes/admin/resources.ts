import { Router } from "express";
import { SystemRole } from "@prisma/client";
import prisma from "@/lib/prisma";
import {
  propagateBranchNameChange,
  countReferencesToBranchName,
} from "@/lib/branchRename";
import type { AuthRequest } from "@/middleware/auth";
import { authenticate } from "@/middleware/auth";
import { requirePermission } from "@/middleware/rbac";
import { isStaffAllowed } from "@/lib/managementPermissions";
import { resolveMonitorBranchScope } from "@/lib/monitorBranchScope";
import { validate } from "@/middleware/validate";
import {
  ok,
  created,
  notFound,
  serverError,
  forbidden,
  conflict,
} from "@/lib/response";
import { getPaginationParams, buildMeta } from "@/lib/pagination";
import { env } from "@/config/env";
import {
  branchCreateSchema,
  branchUpdateSchema,
} from "@/routes/admin/branchSchemas";
import {
  deviceCreateSchema,
  deviceUpdateSchema,
  clientAccountCreateSchema,
  clientAccountUpdateSchema,
} from "@/routes/admin/resourceSchemas";

const router = Router();
router.use(authenticate);

// Branches
router.get(
  "/branches",
  requirePermission("staff.branches"),
  async (req, res) => {
    try {
      const { page, limit, skip } = getPaginationParams(req.query as any);
      const q = String(req.query.q ?? "").trim();
      const status = String(req.query.status ?? "").trim();
      const where: any = {};
      if (q) {
        where.OR = [
          { name: { contains: q } },
          { city: { contains: q } },
          { country: { contains: q } },
        ];
      }
      if (status) where.status = status;
      const [items, total] = await Promise.all([
        prisma.branch.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
        }),
        prisma.branch.count({ where }),
      ]);
      return ok(res, items, buildMeta(total, page, limit));
    } catch (err) {
      return serverError(res, err);
    }
  },
);

router.get(
  "/branches/:id/members",
  requirePermission("staff.branches"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const branch = await prisma.branch.findUnique({ where: { id } });
      if (!branch) return notFound(res, "Branch");
      const { page, limit, skip } = getPaginationParams(req.query as any);
      const q = String(req.query.q ?? "").trim();
      const where: Record<string, unknown> = { branch: branch.name };
      if (q) {
        where.OR = [
          { name: { contains: q } },
          { email: { contains: q } },
          { jobRole: { contains: q } },
        ];
      }
      const [items, total] = await Promise.all([
        prisma.staffMember.findMany({
          where: where as any,
          skip,
          take: limit,
          orderBy: { name: "asc" },
          select: {
            id: true,
            memberId: true,
            name: true,
            email: true,
            systemRole: true,
            status: true,
            branch: true,
            jobRole: true,
            primarySkill: true,
            joinDate: true,
            salary: true,
            averageTaskRating: true,
            ceoPerformanceRating: true,
            tasksCompleted: true,
            phone: true,
            whatsapp: true,
          },
        }),
        prisma.staffMember.count({ where: where as any }),
      ]);
      return ok(res, items, buildMeta(total, page, limit));
    } catch (err) {
      return serverError(res, err);
    }
  },
);

router.get("/branches/:id", async (req: AuthRequest, res) => {
  try {
    if (!req.user || req.user.type !== "staff")
      return forbidden(res, "Staff access required");
    const { id } = req.params;
    const canAdmin = await isStaffAllowed(req.user.role, "staff.branches");
    const scope = await resolveMonitorBranchScope(req.user.id, req.user.role);
    if (!canAdmin) {
      if (scope.kind !== "branch" || scope.branchId !== id) {
        return forbidden(res, "Branch access denied");
      }
    }
    const branch = await prisma.branch.findUnique({ where: { id } });
    if (!branch) return notFound(res, "Branch");

    const branchName = branch.name;

    const [refs, roleGroups, statusGroups, agg] = await Promise.all([
      countReferencesToBranchName(prisma, branchName),
      prisma.staffMember.groupBy({
        by: ["systemRole"],
        where: { branch: branchName },
        _count: { _all: true },
      }),
      prisma.staffMember.groupBy({
        by: ["status"],
        where: { branch: branchName },
        _count: { _all: true },
      }),
      prisma.staffMember.aggregate({
        where: { branch: branchName },
        _sum: { tasksCompleted: true },
        _avg: { averageTaskRating: true },
      }),
    ]);

    const memberCount = refs.staffMembers;

    const byRole: Record<string, number> = {};
    for (const g of roleGroups) {
      byRole[g.systemRole] = g._count._all;
    }

    let activeCount = 0;
    for (const g of statusGroups) {
      if ((g.status || "").toLowerCase() === "active")
        activeCount += g._count._all;
    }

    const totalTasksCompleted = agg._sum.tasksCompleted ?? 0;
    const rawAvg = agg._avg.averageTaskRating;
    const avgTaskRating =
      rawAvg != null && !Number.isNaN(Number(rawAvg))
        ? Math.round(Number(rawAvg) * 100) / 100
        : null;

    let managerMember: {
      id: string;
      name: string;
      email: string;
      systemRole: string;
      jobRole: string | null;
    } | null = null;

    if (branch.branchManager?.trim()) {
      const byName = await prisma.staffMember.findFirst({
        where: {
          branch: branchName,
          name: { equals: branch.branchManager.trim() },
        },
        select: {
          id: true,
          name: true,
          email: true,
          systemRole: true,
          jobRole: true,
        },
      });
      managerMember = byName;
    }
    if (!managerMember) {
      const bm = await prisma.staffMember.findFirst({
        where: { branch: branchName, systemRole: SystemRole.BRANCH_MANAGER },
        select: {
          id: true,
          name: true,
          email: true,
          systemRole: true,
          jobRole: true,
        },
      });
      managerMember = bm;
    }

    if (branch.staffCount !== memberCount) {
      await prisma.branch.update({
        where: { id },
        data: { staffCount: memberCount },
      });
    }

    return ok(res, {
      branch: { ...branch, staffCount: memberCount },
      stats: {
        memberCount,
        activeCount,
        byRole,
        totalTasksCompleted,
        avgTaskRating,
      },
      managerMember,
      references: refs,
    });
  } catch (err) {
    return serverError(res, err);
  }
});

router.post(
  "/branches",
  requirePermission("staff.branches"),
  validate(branchCreateSchema),
  async (req, res) => {
    try {
      const item = await prisma.branch.create({ data: req.body });
      return created(res, item);
    } catch (err) {
      return serverError(res, err);
    }
  },
);

router.put(
  "/branches/:id",
  requirePermission("staff.branches"),
  validate(branchUpdateSchema),
  async (req, res) => {
    try {
      const { id } = req.params;
      const existing = await prisma.branch.findUnique({ where: { id } });
      if (!existing) return notFound(res, "Branch");

      const data = req.body as Record<string, unknown>;
      const nameChange =
        typeof data.name === "string" &&
        data.name.trim() !== "" &&
        data.name !== existing.name;

      if (nameChange) {
        const newName = String(data.name).trim();
        await prisma.$transaction(async (tx) => {
          await propagateBranchNameChange(tx, existing.name, newName);
          await tx.branch.update({ where: { id }, data: data as any });
        });
      } else {
        await prisma.branch.update({ where: { id }, data: data as any });
      }

      const item = await prisma.branch.findUnique({ where: { id } });
      return ok(res, item);
    } catch (err) {
      return serverError(res, err);
    }
  },
);

router.delete(
  "/branches/:id",
  requirePermission("staff.branches"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const existing = await prisma.branch.findUnique({ where: { id } });
      if (!existing) return notFound(res, "Branch");

      const refs = await countReferencesToBranchName(prisma, existing.name);
      if (refs.total > 0) {
        const parts = Object.entries(refs)
          .filter(([k, v]) => k !== "total" && typeof v === "number" && v > 0)
          .map(([k, v]) => `${k}:${v}`)
          .join(", ");
        return conflict(
          res,
          `Branch is in use and cannot be deleted (${parts || `total:${refs.total}`})`,
        );
      }

      await prisma.branch.delete({ where: { id } });
      return ok(res, { id });
    } catch (err) {
      return serverError(res, err);
    }
  },
);

/**
 * GET /branches/:id/manager-candidates
 * Returns staff members at this branch who could be set as the branch manager.
 * Includes: name, id, systemRole, jobRole, status.
 */
router.get(
  "/branches/:id/manager-candidates",
  requirePermission("staff.branches"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const branch = await prisma.branch.findUnique({ where: { id } });
      if (!branch) return notFound(res, "Branch");

      const candidates = await prisma.staffMember.findMany({
        where: {
          branch: branch.name,
          status: { in: ["Active", "active", "ACTIVE"] },
        },
        orderBy: [{ systemRole: "asc" }, { name: "asc" }],
        select: {
          id: true,
          name: true,
          systemRole: true,
          jobRole: true,
          status: true,
          email: true,
        },
      });
      return ok(res, candidates);
    } catch (err) {
      return serverError(res, err);
    }
  },
);

/**
 * GET /staff-for-manager
 * Returns all active staff for selecting a manager when creating a new branch.
 * Optional: ?branch=<branchName> to filter by existing branch assignment.
 */
router.get(
  "/staff-for-manager",
  requirePermission("staff.branches"),
  async (req, res) => {
    try {
      const branchName = String(req.query.branch ?? "").trim();
      const where: Record<string, unknown> = {
        status: { in: ["Active", "active", "ACTIVE"] },
      };
      if (branchName) {
        where.branch = branchName;
      }
      const staff = await prisma.staffMember.findMany({
        where: where as any,
        orderBy: [{ branch: "asc" }, { name: "asc" }],
        select: {
          id: true,
          name: true,
          systemRole: true,
          jobRole: true,
          branch: true,
          email: true,
        },
      });
      return ok(res, staff);
    } catch (err) {
      return serverError(res, err);
    }
  },
);

// Devices
router.get(
  "/devices",
  requirePermission("assets.devices"),
  async (req, res) => {
    try {
      const { page, limit, skip } = getPaginationParams(req.query as any);
      const q = String(req.query.q ?? "").trim();
      const status = String(req.query.status ?? "").trim();
      const where: any = {};
      if (q) {
        where.OR = [
          { deviceName: { contains: q } },
          { deviceType: { contains: q } },
          { ipAddress: { contains: q } },
        ];
      }
      if (status) where.status = status;
      const [items, total] = await Promise.all([
        prisma.device.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
        }),
        prisma.device.count({ where }),
      ]);
      return ok(res, items, buildMeta(total, page, limit));
    } catch (err) {
      return serverError(res, err);
    }
  },
);

router.get(
  "/devices/:id",
  requirePermission("assets.devices"),
  async (req, res) => {
    try {
      const item = await prisma.device.findUnique({
        where: { id: req.params.id },
      });
      if (!item) return notFound(res);
      return ok(res, item);
    } catch (err) {
      return serverError(res, err);
    }
  },
);

router.post(
  "/devices",
  requirePermission("assets.devices"),
  validate(deviceCreateSchema),
  async (req, res) => {
    try {
      const body = req.body as import("zod").infer<typeof deviceCreateSchema>;
      const staff = await prisma.staffMember.findUnique({
        where: { id: body.staffMemberId },
        select: { id: true },
      });
      if (!staff) return notFound(res, "Staff member");
      const item = await prisma.device.create({ data: body });
      return created(res, item);
    } catch (err) {
      return serverError(res, err);
    }
  },
);

router.put(
  "/devices/:id",
  requirePermission("assets.devices"),
  validate(deviceUpdateSchema),
  async (req, res) => {
    try {
      const existing = await prisma.device.findUnique({
        where: { id: req.params.id },
      });
      if (!existing) return notFound(res, "Device");
      const body = req.body as import("zod").infer<typeof deviceUpdateSchema>;
      if (body.staffMemberId) {
        const staff = await prisma.staffMember.findUnique({
          where: { id: body.staffMemberId },
          select: { id: true },
        });
        if (!staff) return notFound(res, "Staff member");
      }
      const item = await prisma.device.update({
        where: { id: req.params.id },
        data: body,
      });
      return ok(res, item);
    } catch (err) {
      return serverError(res, err);
    }
  },
);

router.delete(
  "/devices/:id",
  requirePermission("assets.devices"),
  async (req, res) => {
    try {
      await prisma.device.delete({ where: { id: req.params.id } });
      return ok(res, { message: "Device deleted" });
    } catch (err) {
      return serverError(res, err);
    }
  },
);

// Client Accounts
router.get(
  "/client-accounts",
  requirePermission("crm.client_accounts"),
  async (req, res) => {
    try {
      const { page, limit, skip } = getPaginationParams(req.query as any);
      const q = String(req.query.q ?? "").trim();
      const status = String(req.query.status ?? "").trim();
      const where: any = {};
      if (q) {
        where.OR = [
          { clientName: { contains: q } },
          { email: { contains: q } },
          { country: { contains: q } },
        ];
      }
      if (status) where.status = status;
      const [items, total] = await Promise.all([
        prisma.clientAccount.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
        }),
        prisma.clientAccount.count({ where }),
      ]);
      return ok(res, items, buildMeta(total, page, limit));
    } catch (err) {
      return serverError(res, err);
    }
  },
);

router.get(
  "/client-accounts/:id",
  requirePermission("crm.client_accounts"),
  async (req, res) => {
    try {
      const item = await prisma.clientAccount.findUnique({
        where: { id: req.params.id },
      });
      if (!item) return notFound(res);
      return ok(res, item);
    } catch (err) {
      return serverError(res, err);
    }
  },
);

router.post(
  "/client-accounts",
  requirePermission("crm.client_accounts"),
  validate(clientAccountCreateSchema),
  async (req, res) => {
    try {
      const body = req.body as import("zod").infer<
        typeof clientAccountCreateSchema
      >;
      const item = await prisma.clientAccount.create({ data: body });
      return created(res, item);
    } catch (err) {
      return serverError(res, err);
    }
  },
);

router.put(
  "/client-accounts/:id",
  requirePermission("crm.client_accounts"),
  validate(clientAccountUpdateSchema),
  async (req, res) => {
    try {
      const existing = await prisma.clientAccount.findUnique({
        where: { id: req.params.id },
      });
      if (!existing) return notFound(res, "Client account");
      const body = req.body as import("zod").infer<
        typeof clientAccountUpdateSchema
      >;
      const item = await prisma.clientAccount.update({
        where: { id: req.params.id },
        data: body,
      });
      return ok(res, item);
    } catch (err) {
      return serverError(res, err);
    }
  },
);

router.delete(
  "/client-accounts/:id",
  requirePermission("crm.client_accounts"),
  async (req, res) => {
    try {
      await prisma.clientAccount.delete({ where: { id: req.params.id } });
      return ok(res, { message: "Client account deleted" });
    } catch (err) {
      return serverError(res, err);
    }
  },
);

// Exchange Rates

const exchangeRateInclude = {
  branch: { select: { id: true, name: true, city: true, country: true } },
  createdBy: { select: { id: true, name: true, email: true } },
  updatedBy: { select: { id: true, name: true, email: true } },
} as const;

/** GET /admin/exchange-rates/summary — aggregates + latest/previous for dashboard cards */
router.get(
  "/exchange-rates/summary",
  requirePermission("finance.exchange_rates"),
  async (_req, res) => {
    try {
      const [totalRows, agg, ordered, totalBranches] = await Promise.all([
        prisma.exchangeRate.count(),
        prisma.exchangeRate.aggregate({
          _min: { usdToBdt: true },
          _max: { usdToBdt: true },
          _avg: { usdToBdt: true },
        }),
        prisma.exchangeRate.findMany({
          orderBy: { effectiveDate: "desc" },
          take: 2,
          include: exchangeRateInclude,
        }),
        prisma.branch.count(),
      ]);
      const latest = ordered[0] ?? null;
      const previous = ordered[1] ?? null;
      let changePercentVsPrevious: number | null = null;
      if (latest && previous && previous.usdToBdt !== 0) {
        changePercentVsPrevious =
          ((latest.usdToBdt - previous.usdToBdt) / previous.usdToBdt) * 100;
      }
      return ok(res, {
        totalRows,
        minUsdToBdt: agg._min.usdToBdt,
        maxUsdToBdt: agg._max.usdToBdt,
        avgUsdToBdt: agg._avg.usdToBdt,
        latest,
        previous,
        changePercentVsPrevious,
        totalBranches,
      });
    } catch (err) {
      return serverError(res, err);
    }
  },
);

/** GET /admin/exchange-rates/latest — returns the most recent exchange rate (no permission required for staff) */
router.get("/exchange-rates/latest", async (_req, res) => {
  try {
    const latest = await prisma.exchangeRate.findFirst({
      orderBy: { effectiveDate: "desc" },
      include: exchangeRateInclude,
    });
    if (!latest) {
      return ok(res, {
        usdToBdt: env.DEFAULT_USD_TO_BDT,
        usdToAed: 3.67,
        bdtToAed: null,
        effectiveDate: new Date().toISOString(),
      });
    }
    return ok(res, latest);
  } catch (err) {
    return serverError(res, err);
  }
});

router.get(
  "/exchange-rates",
  requirePermission("finance.exchange_rates"),
  async (req, res) => {
    try {
      const { page, limit, skip } = getPaginationParams(req.query as any);
      const [items, total] = await Promise.all([
        prisma.exchangeRate.findMany({
          orderBy: { effectiveDate: "desc" },
          skip,
          take: limit,
          include: exchangeRateInclude,
        }),
        prisma.exchangeRate.count(),
      ]);
      return ok(res, items, buildMeta(total, page, limit));
    } catch (err) {
      return serverError(res, err);
    }
  },
);

router.post(
  "/exchange-rates",
  requirePermission("finance.exchange_rates"),
  async (req: AuthRequest, res) => {
    try {
      const body = req.body as Record<string, unknown>;
      const staffId = req.user?.type === "staff" ? req.user.id : undefined;
      const effectiveRaw = body.effectiveDate;
      const payload = {
        usdToBdt: Number(body.usdToBdt),
        usdToAed:
          body.usdToAed != null && body.usdToAed !== ""
            ? Number(body.usdToAed)
            : null,
        bdtToAed:
          body.bdtToAed != null && body.bdtToAed !== ""
            ? Number(body.bdtToAed)
            : null,
        effectiveDate: effectiveRaw
          ? new Date(String(effectiveRaw))
          : new Date(),
        notes:
          body.notes != null && String(body.notes).trim() !== ""
            ? String(body.notes)
            : null,
        branchId:
          body.branchId != null && String(body.branchId).trim() !== ""
            ? String(body.branchId)
            : null,
        createdById: staffId ?? null,
        updatedById: staffId ?? null,
      };
      const item = await prisma.exchangeRate.create({
        data: payload,
        include: exchangeRateInclude,
      });
      return created(res, item);
    } catch (err) {
      return serverError(res, err);
    }
  },
);

router.put(
  "/exchange-rates/:id",
  requirePermission("finance.exchange_rates"),
  async (req: AuthRequest, res) => {
    try {
      const body = req.body as Record<string, unknown>;
      const staffId = req.user?.type === "staff" ? req.user.id : undefined;
      const data: Record<string, unknown> = { updatedById: staffId ?? null };
      if (body.usdToBdt != null) data.usdToBdt = Number(body.usdToBdt);
      if (body.usdToAed !== undefined)
        data.usdToAed =
          body.usdToAed != null && body.usdToAed !== ""
            ? Number(body.usdToAed)
            : null;
      if (body.bdtToAed !== undefined)
        data.bdtToAed =
          body.bdtToAed != null && body.bdtToAed !== ""
            ? Number(body.bdtToAed)
            : null;
      if (body.effectiveDate != null)
        data.effectiveDate = new Date(String(body.effectiveDate));
      if (body.notes !== undefined)
        data.notes =
          body.notes != null && String(body.notes).trim() !== ""
            ? String(body.notes)
            : null;
      if (body.branchId !== undefined)
        data.branchId =
          body.branchId != null && String(body.branchId).trim() !== ""
            ? String(body.branchId)
            : null;
      const item = await prisma.exchangeRate.update({
        where: { id: req.params.id },
        data: data as any,
        include: exchangeRateInclude,
      });
      return ok(res, item);
    } catch (err) {
      return serverError(res, err);
    }
  },
);

router.delete(
  "/exchange-rates/:id",
  requirePermission("finance.exchange_rates"),
  async (req, res) => {
    try {
      await prisma.exchangeRate.delete({ where: { id: req.params.id } });
      return ok(res, { message: "Exchange rate deleted" });
    } catch (err) {
      return serverError(res, err);
    }
  },
);

export default router;
