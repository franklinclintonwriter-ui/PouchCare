import path from "path";
import multer from "multer";
// Lazy-load sharp so the server can start even when the native binary is unavailable
const getSharp = async () => (await import("sharp")).default;
import { Router } from "express";
import prisma from "@/lib/prisma";
import { deleteFile, uploadFile, mapSignedAvatar } from "@/lib/storage";
import { authenticate } from "@/middleware/auth";
import { requirePermission } from "@/middleware/rbac";
import { ok, serverError, notFound, badRequest } from "@/lib/response";
import { getPaginationParams, buildMeta } from "@/lib/pagination";
import { validate } from "@/middleware/validate";
import {
  orderStatusUpdateSchema,
  validateOrderStatusTransition,
  payoutProcessSchema,
} from "@/routes/admin/resourceSchemas";

const router = Router();
router.use(authenticate, requirePermission("admin_portal.access"));

const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

async function processAvatarUpload(file: Express.Multer.File) {
  const allowedMime = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
  ] as const;
  if (!allowedMime.includes(file.mimetype as (typeof allowedMime)[number])) {
    throw new Error("Use JPEG, PNG, WebP, or GIF");
  }

  let buffer: Buffer = file.buffer;
  let mime = file.mimetype;
  let outName = file.originalname || "photo.jpg";

  if (["image/jpeg", "image/png", "image/webp"].includes(file.mimetype)) {
    try {
      const sharp = await getSharp();
      buffer = await sharp(file.buffer)
        .rotate()
        .resize(512, 512, { fit: "cover", position: sharp.strategy.attention })
        .jpeg({ quality: 88, mozjpeg: true })
        .toBuffer();
      mime = "image/jpeg";
      outName = `${path.basename(outName, path.extname(outName)) || "photo"}.jpg`;
    } catch {
      throw new Error("Could not process image");
    }
  } else if (file.mimetype === "image/gif" && file.size > 1024 * 1024) {
    throw new Error("GIF must be under 1MB");
  }

  return { buffer, mime, outName };
}

async function replacePortalAvatar(
  memberId: string,
  file: Express.Multer.File,
) {
  const { buffer, mime, outName } = await processAvatarUpload(file);
  const prev = await prisma.portalMember.findUnique({
    where: { id: memberId },
    select: { avatarUrl: true },
  });

  const result = await uploadFile(buffer, outName, mime, {
    folder: `portal-avatars/${memberId}`,
    allowedTypes: ["image"],
    maxSizeMb: 5,
  });

  const updated = await prisma.portalMember.update({
    where: { id: memberId },
    data: { avatarUrl: result.fileUrl },
    select: { id: true, avatarUrl: true },
  });

  if (prev?.avatarUrl && prev.avatarUrl !== result.fileUrl) {
    await deleteFile(prev.avatarUrl).catch(() => {});
  }

  return mapSignedAvatar(updated);
}

async function clearPortalAvatar(memberId: string) {
  const row = await prisma.portalMember.findUnique({
    where: { id: memberId },
    select: { avatarUrl: true },
  });
  if (row?.avatarUrl) await deleteFile(row.avatarUrl).catch(() => {});
  await prisma.portalMember.update({
    where: { id: memberId },
    data: { avatarUrl: null },
  });
}

// GET /admin/portal/members
router.get("/members", async (req, res) => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query as any);
    const q = String(req.query.q ?? "").trim();
    const status = String(req.query.status ?? "").trim();
    const where: any = {};
    if (q) {
      where.OR = [
        { fullName: { contains: q } },
        { email: { contains: q } },
        { referralCode: { contains: q } },
      ];
    }
    if (status) where.status = status as any;
    const [items, total] = await Promise.all([
      prisma.portalMember.findMany({
        where,
        orderBy: { registrationDate: "desc" },
        skip,
        take: limit,
      }),
      prisma.portalMember.count({ where }),
    ]);
    return ok(
      res,
      await Promise.all(
        items.map(
          async ({
            passwordHash: _,
            emailVerifyToken: __,
            resetPasswordToken: ___,
            refreshToken: ____,
            ...m
          }) => mapSignedAvatar(m),
        ),
      ),
      buildMeta(total, page, limit),
    );
  } catch {
    return serverError(res);
  }
});

// GET /admin/portal/members/:id
router.get("/members/:id", async (req, res) => {
  try {
    const m = await prisma.portalMember.findUnique({
      where: { id: req.params.id },
      include: {
        orders: { take: 10, orderBy: { orderDate: "desc" } },
        commissionsEarned: { take: 10, orderBy: { createdAt: "desc" } },
        walletTx: { take: 20, orderBy: { transactionDate: "desc" } },
      },
    });
    if (!m) return notFound(res);
    const {
      passwordHash,
      emailVerifyToken,
      resetPasswordToken,
      refreshToken,
      ...safe
    } = m;
    return ok(res, await mapSignedAvatar(safe));
  } catch {
    return serverError(res);
  }
});

// PUT /admin/portal/members/:id/status
router.put("/members/:id/status", async (req, res) => {
  try {
    const m = await prisma.portalMember.update({
      where: { id: req.params.id },
      data: { status: req.body.status },
    });
    return ok(res, m);
  } catch {
    return serverError(res);
  }
});

// POST /admin/portal/members/:id/avatar
router.post(
  "/members/:id/avatar",
  avatarUpload.single("file"),
  async (req, res) => {
    try {
      const file = req.file;
      if (!file) return badRequest(res, "No file");
      const member = await prisma.portalMember.findUnique({
        where: { id: req.params.id },
        select: { id: true },
      });
      if (!member) return notFound(res);
      const updated = await replacePortalAvatar(req.params.id, file);
      return ok(res, updated);
    } catch (err) {
      if (err instanceof Error) return badRequest(res, err.message);
      return serverError(res);
    }
  },
);

// DELETE /admin/portal/members/:id/avatar
router.delete("/members/:id/avatar", async (req, res) => {
  try {
    const member = await prisma.portalMember.findUnique({
      where: { id: req.params.id },
      select: { id: true },
    });
    if (!member) return notFound(res);
    await clearPortalAvatar(req.params.id);
    return ok(res, { avatarUrl: null });
  } catch {
    return serverError(res);
  }
});

// GET /admin/portal/orders
router.get("/orders", async (req, res) => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query as any);
    const q = String(req.query.q ?? "").trim();
    const status = String(req.query.status ?? "").trim();
    const where: any = {};
    if (status) where.status = status as any;
    if (q) {
      where.OR = [
        { service: { contains: q } },
        { memberEmail: { contains: q } },
      ];
      if (!Number.isNaN(Number(q))) {
        where.OR.push({ orderId: Number(q) });
      }
    }
    const [items, total] = await Promise.all([
      prisma.portalOrder.findMany({
        where,
        orderBy: { orderDate: "desc" },
        skip,
        take: limit,
      }),
      prisma.portalOrder.count({ where }),
    ]);
    return ok(
      res,
      items.map((o) => ({ ...o, serviceName: o.service })),
      buildMeta(total, page, limit),
    );
  } catch {
    return serverError(res);
  }
});

// PUT /admin/portal/orders/:id/status
router.put(
  "/orders/:id/status",
  validate(orderStatusUpdateSchema),
  async (req, res) => {
    try {
      const order = await prisma.portalOrder.findUnique({
        where: { id: req.params.id },
      });
      if (!order) return notFound(res, "Order");

      const { status, deliveryLink } = req.body as import("zod").infer<
        typeof orderStatusUpdateSchema
      >;
      const transition = validateOrderStatusTransition(order.status, status);
      if (!transition.valid) return badRequest(res, transition.message!);

      const o = await prisma.portalOrder.update({
        where: { id: req.params.id },
        data: { status: status as any, ...(deliveryLink && { deliveryLink }) },
      });
      return ok(res, o);
    } catch {
      return serverError(res);
    }
  },
);

// GET /admin/portal/commissions
router.get("/commissions", async (req, res) => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query as any);
    const status = String(req.query.status ?? "");
    const [items, total] = await Promise.all([
      prisma.commission.findMany({
        where: status ? { status: status as any } : {},
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.commission.count(
        status ? { where: { status: status as any } } : undefined,
      ),
    ]);
    return ok(res, items, buildMeta(total, page, limit));
  } catch {
    return serverError(res);
  }
});

// GET /admin/portal/payouts — pending queue
router.get("/payouts", async (req, res) => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query as any);
    const status = String(req.query.status ?? "PENDING");
    const [items, total] = await Promise.all([
      prisma.payoutRequest.findMany({
        where: status ? { status: status as any } : {},
        orderBy: { requestedDate: "desc" },
        skip,
        take: limit,
      }),
      prisma.payoutRequest.count({
        where: status ? { status: status as any } : {},
      }),
    ]);
    return ok(res, items, buildMeta(total, page, limit));
  } catch {
    return serverError(res);
  }
});

// PUT /admin/portal/payouts/:id/process
router.put(
  "/payouts/:id/process",
  validate(payoutProcessSchema),
  async (req, res) => {
    try {
      const payout = await prisma.payoutRequest.findUnique({
        where: { id: req.params.id },
      });
      if (!payout) return notFound(res, "Payout request");
      if (payout.status !== "PENDING" && payout.status !== "PROCESSING") {
        return badRequest(
          res,
          `Payout already ${payout.status.toLowerCase()} — cannot reprocess`,
        );
      }

      const { status, transactionId } = req.body as import("zod").infer<
        typeof payoutProcessSchema
      >;
      const p = await prisma.payoutRequest.update({
        where: { id: req.params.id },
        data: {
          status: status as any,
          processedDate: new Date(),
          processedBy: req.user!.id,
          ...(transactionId && { transactionId }),
        },
      });
      return ok(res, p);
    } catch {
      return serverError(res);
    }
  },
);

// GET /admin/portal/deposits — list wallet deposit requests
router.get("/deposits", async (req, res) => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query as any);
    const status = String(req.query.status ?? "").trim();
    const where: any = { type: "DEPOSIT" };
    if (status) where.status = status;
    const [items, total] = await Promise.all([
      prisma.walletTransaction.findMany({
        where,
        orderBy: { transactionDate: "desc" },
        skip,
        take: limit,
        include: { member: { select: { fullName: true, email: true } } },
      }),
      prisma.walletTransaction.count({ where }),
    ]);
    return ok(res, items, buildMeta(total, page, limit));
  } catch {
    return serverError(res);
  }
});

// PUT /admin/portal/deposits/:id/approve
router.put("/deposits/:id/approve", async (req: any, res) => {
  try {
    const tx = await prisma.walletTransaction.findUnique({
      where: { id: req.params.id },
    });
    if (!tx || tx.type !== "DEPOSIT") return notFound(res, "Deposit");
    if (tx.status !== "Pending") return badRequest(res, "Already processed");

    const member = await prisma.portalMember.findUnique({
      where: { id: tx.memberId },
      select: { walletBalance: true },
    });
    if (!member) return notFound(res, "Member");

    const newBalance = member.walletBalance + tx.amountUsd;
    await prisma.$transaction([
      prisma.walletTransaction.update({
        where: { id: tx.id },
        data: {
          status: "Confirmed",
          balanceAfterUsd: newBalance,
          approvedBy: req.user!.id,
        },
      }),
      prisma.portalMember.update({
        where: { id: tx.memberId },
        data: {
          walletBalance: { increment: tx.amountUsd },
          totalDeposited: { increment: tx.amountUsd },
        },
      }),
    ]);
    return ok(res, { message: "Deposit approved", newBalance });
  } catch {
    return serverError(res);
  }
});

// PUT /admin/portal/deposits/:id/reject
router.put("/deposits/:id/reject", async (req: any, res) => {
  try {
    const tx = await prisma.walletTransaction.findUnique({
      where: { id: req.params.id },
    });
    if (!tx || tx.type !== "DEPOSIT") return notFound(res, "Deposit");
    if (tx.status !== "Pending") return badRequest(res, "Already processed");

    await prisma.walletTransaction.update({
      where: { id: tx.id },
      data: { status: "Failed", approvedBy: req.user!.id },
    });
    return ok(res, { message: "Deposit rejected" });
  } catch {
    return serverError(res);
  }
});

export default router;
