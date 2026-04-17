import { Router } from "express";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { authenticate } from "@/middleware/auth";
import { requirePermission } from "@/middleware/rbac";
import { validate } from "@/middleware/validate";
import { getPagination, buildMeta } from "@/utils/pagination";
import {
  ok,
  created,
  notFound,
  badRequest,
  serverError,
} from "@/utils/response";

const router = Router();
router.use(authenticate);
const hr = requirePermission("hr.recruitment");

// ── POSITION SCHEMAS ──
const positionCreateSchema = z.object({
  title: z.string().min(1, "Title is required"),
  department: z.string().optional(),
  branch: z.string().optional(),
  status: z.enum(["Open", "Closed", "Paused"]).default("Open"),
  employmentType: z
    .enum(["Full Time", "Part Time", "Contract", "Internship"])
    .optional(),
  salaryMin: z.number().min(0).optional(),
  salaryMax: z.number().min(0).optional(),
  openings: z.number().int().min(1).default(1),
  published: z.boolean().optional(),
  postedDate: z.string().datetime().optional(),
  deadline: z.string().datetime().optional(),
  jobDescription: z.string().optional(),
});

const positionUpdateSchema = positionCreateSchema.partial();

// ── JOB POSITIONS ──
router.get("/positions", hr, async (req, res) => {
  try {
    const positions = await prisma.jobPosition.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { jobApplications: true } } },
    });
    return ok(res, positions);
  } catch (err) {
    return serverError(res, err);
  }
});

router.post(
  "/positions",
  hr,
  validate(positionCreateSchema),
  async (req, res) => {
    try {
      const pos = await prisma.jobPosition.create({ data: req.body });
      return created(res, pos);
    } catch (err) {
      return serverError(res, err);
    }
  },
);

router.get("/positions/:id", hr, async (req, res) => {
  try {
    const pos = await prisma.jobPosition.findUnique({
      where: { id: req.params.id },
      include: { _count: { select: { jobApplications: true } } },
    });
    if (!pos) return notFound(res);
    return ok(res, pos);
  } catch (err) {
    return serverError(res, err);
  }
});

router.put(
  "/positions/:id",
  hr,
  validate(positionUpdateSchema),
  async (req, res) => {
    try {
      const pos = await prisma.jobPosition.update({
        where: { id: req.params.id },
        data: req.body,
      });
      return ok(res, pos);
    } catch (err) {
      return serverError(res, err);
    }
  },
);

router.delete("/positions/:id", hr, async (req, res) => {
  try {
    const appCount = await prisma.jobApplication.count({
      where: { positionId: req.params.id },
    });
    if (appCount > 0) {
      return badRequest(
        res,
        `Cannot delete position with ${appCount} application(s). Close it instead.`,
      );
    }
    await prisma.jobPosition.delete({ where: { id: req.params.id } });
    return ok(res, { message: "Position deleted" });
  } catch (err) {
    return serverError(res, err);
  }
});

// ── APPLICATION SCHEMAS ──
const applicationCreateSchema = z.object({
  positionId: z.string().uuid("Invalid position ID"),
  applicantName: z.string().min(1, "Applicant name is required"),
  email: z.string().email("Invalid email"),
  phone: z.string().optional(),
  source: z.string().optional(),
  cvUrl: z.string().url().optional().or(z.literal("")),
  portfolioUrl: z.string().url().optional().or(z.literal("")),
  experienceYears: z.number().min(0).optional(),
  expectedSalary: z.number().min(0).optional(),
  notes: z.string().optional(),
});

const applicationUpdateSchema = z.object({
  status: z
    .enum(["New", "Screening", "Interview", "Offer", "Hired", "Rejected"])
    .optional(),
  interviewDate: z.string().datetime().optional().nullable(),
  interviewerNotes: z.string().optional(),
  rejectionReason: z.string().optional(),
  offerSalary: z.number().min(0).optional(),
  notes: z.string().optional(),
  source: z.string().optional(),
  score: z.number().min(0).max(100).optional(),
});

// Stage transition rules — enforced on both frontend and backend
const VALID_TRANSITIONS: Record<string, string[]> = {
  New: ["Screening", "Rejected"],
  Screening: ["Interview", "Rejected"],
  Interview: ["Offer", "Rejected"],
  Offer: ["Hired", "Rejected"],
  Hired: [],
  Rejected: ["New"],
};

// ── JOB APPLICATIONS ──
router.get("/applications", hr, async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req);
    const { status, positionId } = req.query as Record<string, string>;
    const where: any = {};
    if (status) {
      const statusMap: Record<string, string> = {
        new: "New",
        screening: "Screening",
        interview: "Interview",
        offer: "Offer",
        hired: "Hired",
        rejected: "Rejected",
      };
      where.status = statusMap[status.toLowerCase()] ?? status;
    }
    if (positionId) where.positionId = positionId;
    const [apps, total] = await Promise.all([
      prisma.jobApplication.findMany({
        where,
        skip,
        take: limit,
        orderBy: { appliedDate: "desc" },
        include: { position: { select: { title: true } } },
      }),
      prisma.jobApplication.count({ where }),
    ]);
    return ok(res, apps, buildMeta(total, page, limit));
  } catch (err) {
    return serverError(res, err);
  }
});

router.post(
  "/applications",
  hr,
  validate(applicationCreateSchema),
  async (req, res) => {
    try {
      const position = await prisma.jobPosition.findUnique({
        where: { id: req.body.positionId },
      });
      if (!position) return notFound(res, "Position not found");
      if (position.status === "Closed")
        return badRequest(res, "Position is closed for applications");

      const duplicate = await prisma.jobApplication.findFirst({
        where: { positionId: req.body.positionId, email: req.body.email },
      });
      if (duplicate)
        return badRequest(
          res,
          "This applicant has already applied for this position",
        );

      const app = await prisma.$transaction(async (tx) => {
        const newApp = await tx.jobApplication.create({ data: req.body });
        await tx.jobPosition.update({
          where: { id: req.body.positionId },
          data: { applications: { increment: 1 } },
        });
        return newApp;
      });

      return created(res, app);
    } catch (err) {
      return serverError(res, err);
    }
  },
);

router.get("/applications/:id", hr, async (req, res) => {
  try {
    const app = await prisma.jobApplication.findUnique({
      where: { id: req.params.id },
      include: {
        position: { select: { title: true, department: true, branch: true } },
      },
    });
    if (!app) return notFound(res);
    return ok(res, app);
  } catch (err) {
    return serverError(res, err);
  }
});

router.put(
  "/applications/:id",
  hr,
  validate(applicationUpdateSchema),
  async (req, res) => {
    try {
      const current = await prisma.jobApplication.findUnique({
        where: { id: req.params.id },
      });
      if (!current) return notFound(res);

      if (req.body.status && req.body.status !== current.status) {
        const allowed = VALID_TRANSITIONS[current.status] ?? [];
        if (!allowed.includes(req.body.status)) {
          return badRequest(
            res,
            `Cannot transition from ${current.status} to ${req.body.status}`,
          );
        }
      }

      const updateData: any = { ...req.body };
      if (req.body.status === "Hired" && !current.hiredDate) {
        updateData.hiredDate = new Date();
      }

      const app = await prisma.jobApplication.update({
        where: { id: req.params.id },
        data: updateData,
      });
      return ok(res, app);
    } catch (err) {
      return serverError(res, err);
    }
  },
);

router.delete("/applications/:id", hr, async (req, res) => {
  try {
    const app = await prisma.jobApplication.findUnique({
      where: { id: req.params.id },
    });
    if (!app) return notFound(res);

    await prisma.$transaction(async (tx) => {
      await tx.jobApplication.delete({ where: { id: req.params.id } });
      await tx.jobPosition.update({
        where: { id: app.positionId },
        data: { applications: { decrement: 1 } },
      });
    });

    return ok(res, { message: "Application deleted" });
  } catch (err) {
    return serverError(res, err);
  }
});

// ── PERFORMANCE SCHEMAS ──
const performanceCreateSchema = z.object({
  staffMemberId: z.string().uuid("Invalid staff member ID"),
  staffName: z.string().min(1, "Staff name is required"),
  systemRole: z.string().optional(),
  branch: z.string().optional(),
  reviewPeriod: z.string().optional(),
  reviewQuarter: z.enum(["Q1", "Q2", "Q3", "Q4"]).optional(),
  reviewYear: z.number().int().min(2020).max(2100).optional(),
  overallRating: z.number().min(1).max(10),
  taskQuality: z.number().min(1).max(10).optional(),
  communication: z.number().min(1).max(10).optional(),
  punctuality: z.number().min(1).max(10).optional(),
  teamwork: z.number().min(1).max(10).optional(),
  notes: z.string().optional(),
});

const performanceUpdateSchema = performanceCreateSchema
  .partial()
  .omit({ staffMemberId: true, staffName: true });

// ── PERFORMANCE RATINGS ──
router.get("/performance", hr, async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req);
    const { staffMemberId, year, quarter } = req.query as Record<
      string,
      string
    >;
    const where: any = {};
    if (staffMemberId) where.staffMemberId = staffMemberId;
    if (year) where.reviewYear = parseInt(year);
    if (quarter) where.reviewQuarter = quarter;

    const [ratings, total] = await Promise.all([
      prisma.performanceRating.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.performanceRating.count({ where }),
    ]);
    return ok(res, ratings, buildMeta(total, page, limit));
  } catch (err) {
    return serverError(res, err);
  }
});

router.post(
  "/performance",
  hr,
  validate(performanceCreateSchema),
  async (req, res) => {
    try {
      const member = await prisma.staffMember.findUnique({
        where: { id: req.body.staffMemberId },
      });
      if (!member) return notFound(res, "Staff member not found");

      const rating = await prisma.performanceRating.create({
        data: {
          ...req.body,
          staffName: member.name,
          systemRole: member.systemRole,
          branch: member.branch,
          ratedBy: req.user!.id,
        },
      });
      return created(res, rating);
    } catch (err) {
      return serverError(res, err);
    }
  },
);

router.get("/performance/:id", hr, async (req, res) => {
  try {
    const rating = await prisma.performanceRating.findUnique({
      where: { id: req.params.id },
    });
    if (!rating) return notFound(res);
    return ok(res, rating);
  } catch (err) {
    return serverError(res, err);
  }
});

router.put(
  "/performance/:id",
  hr,
  validate(performanceUpdateSchema),
  async (req, res) => {
    try {
      const rating = await prisma.performanceRating.update({
        where: { id: req.params.id },
        data: req.body,
      });
      return ok(res, rating);
    } catch (err) {
      return serverError(res, err);
    }
  },
);

router.delete("/performance/:id", hr, async (req, res) => {
  try {
    await prisma.performanceRating.delete({ where: { id: req.params.id } });
    return ok(res, { message: "Rating deleted" });
  } catch (err) {
    return serverError(res, err);
  }
});

// ── RECRUITMENT ANALYTICS ──
router.get("/analytics/recruitment", hr, async (req, res) => {
  try {
    const { year } = req.query as Record<string, string>;
    const appWhere: any = {};
    if (year) {
      const y = parseInt(year);
      appWhere.appliedDate = {
        gte: new Date(`${y}-01-01`),
        lt: new Date(`${y + 1}-01-01`),
      };
    }

    const [positions, applications] = await Promise.all([
      prisma.jobPosition.findMany({
        include: { _count: { select: { jobApplications: true } } },
      }),
      prisma.jobApplication.findMany({ where: appWhere }),
    ]);

    const stageCount = {
      new: applications.filter((a) => a.status === "New").length,
      screening: applications.filter((a) => a.status === "Screening").length,
      interview: applications.filter((a) => a.status === "Interview").length,
      offer: applications.filter((a) => a.status === "Offer").length,
      hired: applications.filter((a) => a.status === "Hired").length,
      rejected: applications.filter((a) => a.status === "Rejected").length,
    };

    const sourceCount: Record<string, number> = {};
    applications.forEach((app: any) => {
      const source = app.source || "Unknown";
      sourceCount[source] = (sourceCount[source] || 0) + 1;
    });

    const openPositions = positions.filter((p) => p.status === "Open").length;
    const hiredApps = applications.filter(
      (a) => a.status === "Hired" && a.hiredDate,
    );
    const avgTimeToHire =
      hiredApps.length > 0
        ? Math.round(
            hiredApps.reduce(
              (sum, a) =>
                sum +
                (new Date(a.hiredDate!).getTime() -
                  new Date(a.appliedDate).getTime()),
              0,
            ) /
              hiredApps.length /
              (1000 * 60 * 60 * 24),
          )
        : 0;

    const conversionRate =
      applications.length > 0
        ? Math.round((stageCount.hired / applications.length) * 100)
        : 0;

    return ok(res, {
      totalPositions: positions.length,
      openPositions,
      totalApplications: applications.length,
      stageBreakdown: stageCount,
      sourceBreakdown: sourceCount,
      metrics: {
        avgTimeToHire,
        conversionRate,
        avgApplicationsPerPosition:
          positions.length > 0
            ? Math.round(applications.length / positions.length)
            : 0,
      },
    });
  } catch (err) {
    return serverError(res, err);
  }
});

router.get("/analytics/applications-by-source", hr, async (req, res) => {
  try {
    const { year } = req.query as Record<string, string>;
    const where: any = {};
    if (year) {
      const y = parseInt(year);
      where.appliedDate = {
        gte: new Date(`${y}-01-01`),
        lt: new Date(`${y + 1}-01-01`),
      };
    }

    const applications = await prisma.jobApplication.findMany({ where });
    const sourceStats: Record<
      string,
      { total: number; hired: number; rejected: number; pending: number }
    > = {};

    applications.forEach((app: any) => {
      const source = app.source || "Unknown";
      if (!sourceStats[source]) {
        sourceStats[source] = { total: 0, hired: 0, rejected: 0, pending: 0 };
      }
      sourceStats[source].total++;
      if (app.status === "Hired") sourceStats[source].hired++;
      else if (app.status === "Rejected") sourceStats[source].rejected++;
      else sourceStats[source].pending++;
    });

    return ok(res, sourceStats);
  } catch (err) {
    return serverError(res, err);
  }
});

export default router;
