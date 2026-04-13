import { Router } from "express";
import { z } from "zod";
import prisma from "@/lib/prisma";
import {
  authenticate,
  requireStaff,
  requireRoles,
  MANAGER_ROLES,
  type AuthRequest,
} from "@/middleware/auth";
import type { SystemRole } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import {
  canManagerAccessStaffMember,
  mergeAttendanceWhereForManager,
} from "@/lib/teamBranchScope";
import { validate } from "@/middleware/validate";
import { getPagination, paginatedMeta, buildMeta } from "@/utils/pagination";
import {
  ok,
  created,
  badRequest,
  notFound,
  serverError,
  forbidden,
} from "@/utils/response";
import { broadcastAttendanceUpdate } from "@/lib/websocket";

const router = Router();
router.use(authenticate);

const createSchema = z.object({
  staffMemberId: z.string(),
  date: z.string(),
  status: z
    .enum(["PRESENT", "ABSENT", "LATE", "HALF_DAY", "REMOTE"])
    .default("PRESENT"),
  workType: z
    .enum(["OFFICE", "REMOTE", "FIELD", "LEAVE", "HOLIDAY"])
    .optional(),
  checkInTime: z.string().optional(),
  checkOutTime: z.string().optional(),
  hoursWorked: z.number().optional(),
  notes: z.string().optional(),
});

// GET /v1/attendance
router.get("/", requireStaff, async (req: AuthRequest, res) => {
  try {
    const { page, limit, skip } = getPagination(
      req.query as Record<string, string>,
    );
    const { memberId, startDate, endDate, date, status } = req.query as Record<
      string,
      string
    >;
    const role = req.user!.role as SystemRole;

    const where: Prisma.AttendanceWhereInput = {};
    if (!MANAGER_ROLES.includes(role)) {
      where.staffMemberId = req.user!.id;
    } else if (memberId) {
      const allowed = await canManagerAccessStaffMember(
        req.user!.id,
        role,
        memberId,
      );
      if (!allowed) return forbidden(res, "Cannot access this team's attendance");
      where.staffMemberId = memberId;
    }

    if (status) where.status = status as Prisma.EnumAttendanceStatusFilter["equals"];
    if (date) {
      const day = new Date(date);
      const next = new Date(day);
      next.setDate(day.getDate() + 1);
      where.date = { gte: day, lt: next };
    } else if (startDate || endDate) {
      where.date = {};
      if (startDate) (where.date as Prisma.DateTimeFilter).gte = new Date(startDate);
      if (endDate) (where.date as Prisma.DateTimeFilter).lte = new Date(endDate);
    }

    let finalWhere = where;
    if (MANAGER_ROLES.includes(role)) {
      finalWhere = await mergeAttendanceWhereForManager(req, where);
    }

    const [records, total] = await Promise.all([
      prisma.attendance.findMany({
        where: finalWhere,
        skip,
        take: limit,
        orderBy: { date: "desc" },
      }),
      prisma.attendance.count({ where: finalWhere }),
    ]);
    return ok(res, records, buildMeta(total, page, limit));
  } catch (err) {
    serverError(res, err);
  }
});

// GET /v1/attendance/today
router.get("/today", requireStaff, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const record = await prisma.attendance.findFirst({
      where: { staffMemberId: req.user!.id, date: today },
    });
    return ok(res, record);
  } catch (err) {
    serverError(res, err);
  }
});

// GET /v1/attendance/staff/:staffId — Managers: list a staff member's attendance (avoids /:id vs "today" ambiguity)
router.get(
  "/staff/:staffId",
  requireRoles(...(MANAGER_ROLES as any)),
  async (req: AuthRequest, res) => {
    try {
      const role = req.user!.role as SystemRole;
      const allowed = await canManagerAccessStaffMember(
        req.user!.id,
        role,
        req.params.staffId,
      );
      if (!allowed) return forbidden(res, "Cannot access this team's attendance");
      const { page, limit, skip } = getPagination(
        req.query as Record<string, string>,
      );
      const [records, total] = await Promise.all([
        prisma.attendance.findMany({
          where: { staffMemberId: req.params.staffId },
          skip,
          take: limit,
          orderBy: { date: "desc" },
        }),
        prisma.attendance.count({
          where: { staffMemberId: req.params.staffId },
        }),
      ]);
      return ok(res, records, buildMeta(total, page, limit));
    } catch (err) {
      serverError(res, err);
    }
  },
);

// POST /v1/attendance — Managers create or upsert manual attendance records
router.post(
  "/",
  requireRoles(...(MANAGER_ROLES as any)),
  validate(createSchema),
  async (req: AuthRequest, res) => {
    try {
      const payload = req.body as z.infer<typeof createSchema>;
      const role = req.user!.role as SystemRole;
      const staffOk = await canManagerAccessStaffMember(
        req.user!.id,
        role,
        payload.staffMemberId,
      );
      if (!staffOk) return forbidden(res, "Cannot record attendance for this staff member");
      const staff = await prisma.staffMember.findUnique({
        where: { id: payload.staffMemberId },
        select: { id: true, name: true, branch: true, systemRole: true },
      });
      if (!staff) return notFound(res, "Staff member not found");

      const date = new Date(payload.date);
      date.setHours(0, 0, 0, 0);
      const existing = await prisma.attendance.findFirst({
        where: { staffMemberId: payload.staffMemberId, date },
      });

      const data: any = {
        staffMemberId: payload.staffMemberId,
        name: staff.name,
        branch: staff.branch,
        staffSystemRole: staff.systemRole,
        date,
        status: payload.status,
        workType: payload.workType ?? "OFFICE",
        checkInTime: payload.checkInTime
          ? new Date(payload.checkInTime)
          : undefined,
        checkOutTime: payload.checkOutTime
          ? new Date(payload.checkOutTime)
          : undefined,
        hoursWorked: payload.hoursWorked,
        notes: payload.notes,
        approvedBy: req.user!.id,
      };

      const record = existing
        ? await prisma.attendance.update({ where: { id: existing.id }, data })
        : await prisma.attendance.create({ data });
      broadcastAttendanceUpdate({
        staffMemberId: payload.staffMemberId,
        date: payload.date,
      });
      return created(res, record);
    } catch (err) {
      return serverError(res, err);
    }
  },
);

// POST /v1/attendance/checkin
router.post("/checkin", requireStaff, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const existing = await prisma.attendance.findFirst({
      where: { staffMemberId: req.user!.id, date: today },
    });
    if (existing?.checkInTime)
      return badRequest(res, "Already checked in today");

    const staff = await prisma.staffMember.findUnique({
      where: { id: req.user!.id },
      select: { name: true, branch: true, systemRole: true },
    });

    const now = new Date();
    const hour = now.getHours();
    const isLate = hour >= 10; // Late if after 10am

    const record = existing
      ? await prisma.attendance.update({
          where: { id: existing.id },
          data: {
            checkInTime: now,
            status: isLate ? "LATE" : "PRESENT",
            loginIp: req.ip,
          },
        })
      : await prisma.attendance.create({
          data: {
            staffMemberId: req.user!.id,
            name: staff?.name || "",
            branch: staff?.branch,
            staffSystemRole: staff?.systemRole,
            date: today,
            status: isLate ? "LATE" : "PRESENT",
            workType: (req.body.workType as any) || "OFFICE",
            checkInTime: now,
            loginIp: req.ip,
          },
        });
    broadcastAttendanceUpdate({ staffMemberId: record.staffMemberId });
    return ok(res, record);
  } catch (err) {
    serverError(res, err);
  }
});

// POST /v1/attendance/checkout
router.post("/checkout", requireStaff, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const record = await prisma.attendance.findFirst({
      where: { staffMemberId: req.user!.id, date: today },
    });
    if (!record?.checkInTime)
      return badRequest(res, "No check-in found for today");
    if (record.checkOutTime)
      return badRequest(res, "Already checked out today");

    const now = new Date();
    const hoursWorked =
      (now.getTime() - record.checkInTime.getTime()) / 3600000;
    const regularHours = Math.min(hoursWorked, 8);
    const overtime = Math.max(0, hoursWorked - 8);

    const updated = await prisma.attendance.update({
      where: { id: record.id },
      data: {
        checkOutTime: now,
        hoursWorked: parseFloat(regularHours.toFixed(2)),
        overtimeHours: parseFloat(overtime.toFixed(2)),
      },
    });
    broadcastAttendanceUpdate({ staffMemberId: updated.staffMemberId });
    return ok(res, updated);
  } catch (err) {
    serverError(res, err);
  }
});

// PUT /v1/attendance/:id
router.put(
  "/:id",
  requireRoles(...(MANAGER_ROLES as any)),
  async (req: AuthRequest, res) => {
    try {
      const existing = await prisma.attendance.findUnique({
        where: { id: req.params.id },
        select: { id: true, staffMemberId: true },
      });
      if (!existing) return notFound(res, "Attendance record not found");
      const role = req.user!.role as SystemRole;
      const staffOk = await canManagerAccessStaffMember(
        req.user!.id,
        role,
        existing.staffMemberId,
      );
      if (!staffOk) return forbidden(res, "Cannot update this attendance record");
      const record = await prisma.attendance.update({
        where: { id: req.params.id },
        data: { ...req.body, approvedBy: req.user!.id },
      });
      broadcastAttendanceUpdate({ staffMemberId: record.staffMemberId });
      return ok(res, record);
    } catch (err) {
      return serverError(res, err);
    }
  },
);

// DELETE /v1/attendance/:id — Managers only, delete attendance record
router.delete(
  "/:id",
  requireRoles(...(MANAGER_ROLES as any)),
  async (req: AuthRequest, res) => {
    try {
      const record = await prisma.attendance.findUnique({
        where: { id: req.params.id },
        select: { id: true, staffMemberId: true, date: true },
      });
      if (!record) return notFound(res, "Attendance record not found");
      const role = req.user!.role as SystemRole;
      const staffOk = await canManagerAccessStaffMember(
        req.user!.id,
        role,
        record.staffMemberId,
      );
      if (!staffOk) return forbidden(res, "Cannot delete this attendance record");

      await prisma.attendance.delete({ where: { id: req.params.id } });
      broadcastAttendanceUpdate({ staffMemberId: record.staffMemberId });
      return ok(res, { message: "Attendance record deleted successfully" });
    } catch (err) {
      return serverError(res, err);
    }
  },
);

// POST /v1/attendance/bulk — Bulk import attendance records (Managers only)
const bulkSchema = z.object({
  records: z.array(
    z.object({
      staffMemberId: z.string(),
      date: z.string(),
      status: z
        .enum(["PRESENT", "ABSENT", "LATE", "HALF_DAY", "LEAVE"])
        .optional(),
      workType: z.enum(["OFFICE", "REMOTE", "HYBRID"]).optional(),
      checkInTime: z.string().optional(),
      checkOutTime: z.string().optional(),
      hoursWorked: z.number().optional(),
      notes: z.string().optional(),
    }),
  ),
});

router.post(
  "/bulk",
  requireRoles(...(MANAGER_ROLES as any)),
  validate(bulkSchema),
  async (req: AuthRequest, res) => {
    try {
      const { records } = req.body;
      const results = { created: 0, updated: 0, errors: [] as string[] };
      const role = req.user!.role as SystemRole;

      for (const record of records) {
        try {
          const date = new Date(record.date);
          date.setHours(0, 0, 0, 0);

          const allowed = await canManagerAccessStaffMember(
            req.user!.id,
            role,
            record.staffMemberId,
          );
          if (!allowed) {
            results.errors.push(
              `Staff ${record.staffMemberId} not in your branch scope`,
            );
            continue;
          }

          const staff = await prisma.staffMember.findUnique({
            where: { id: record.staffMemberId },
            select: { id: true, name: true, branch: true, systemRole: true },
          });

          if (!staff) {
            results.errors.push(`Staff ${record.staffMemberId} not found`);
            continue;
          }

          const existing = await prisma.attendance.findFirst({
            where: { staffMemberId: record.staffMemberId, date },
          });

          const data = {
            staffMemberId: record.staffMemberId,
            name: staff.name,
            branch: staff.branch,
            staffSystemRole: staff.systemRole,
            date,
            status: record.status || "PRESENT",
            workType: record.workType || "OFFICE",
            checkInTime: record.checkInTime
              ? new Date(record.checkInTime)
              : undefined,
            checkOutTime: record.checkOutTime
              ? new Date(record.checkOutTime)
              : undefined,
            hoursWorked: record.hoursWorked,
            notes: record.notes,
            approvedBy: req.user!.id,
          };

          if (existing) {
            await prisma.attendance.update({
              where: { id: existing.id },
              data,
            });
            results.updated++;
          } else {
            await prisma.attendance.create({ data: data as any });
            results.created++;
          }
        } catch (err) {
          results.errors.push(
            `Error processing record: ${(err as Error).message}`,
          );
        }
      }

      if (results.created > 0 || results.updated > 0) {
        broadcastAttendanceUpdate({ bulk: true });
      }
      return ok(res, results);
    } catch (err) {
      return serverError(res, err);
    }
  },
);

export default router;
