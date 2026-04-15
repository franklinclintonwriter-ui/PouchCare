import { Router } from "express";
import { z } from "zod";
import { validate } from "@/middleware/validate";
import { authenticate, type AuthRequest } from "@/middleware/auth";
import prisma from "@/lib/prisma";
import { hashPassword, comparePassword } from "@/lib/hash";
import { signAccess, signRefresh, verifyRefresh } from "@/lib/jwt";
import {
  ok,
  created,
  badRequest,
  unauthorized,
  serverError,
  notFound,
  serviceUnavailable,
} from "@/lib/response";
import { isDbConnectionError, DB_UNAVAILABLE_MESSAGE } from "@/lib/dbErrors";
import { sendPasswordResetEmail } from "@/lib/email";
import { redis } from "@/lib/redis";
import crypto from "crypto";
import { getEffectivePermissions } from "@/lib/managementPermissions";

const router = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  totp: z.string().optional(),
});
const forgotSchema = z.object({ email: z.string().email() });
const resetSchema = z.object({
  token: z.string(),
  password: z.string().min(8),
});
const refreshSchema = z.object({ refresh_token: z.string() });
const changePasswordSchema = z.object({
  current_password: z.string().min(1),
  new_password: z.string().min(8),
});

// POST /auth/login
router.post("/login", validate(loginSchema), async (req, res) => {
  try {
    const { email, password, totp } = req.body;
    const emailNorm = email.trim().toLowerCase();
    const totpCode = totp?.trim() || undefined;

    const staff = await prisma.staffMember.findUnique({
      where: { email: emailNorm },
    });
    if (!staff || !(await comparePassword(password, staff.passwordHash)))
      return unauthorized(res, "Invalid credentials");
    const statusNorm = (staff.status ?? "").trim().toLowerCase();
    if (statusNorm === "inactive" || statusNorm === "suspended")
      return unauthorized(res, "Account is inactive");

    // 2FA for CEO/CO_MD
    if (staff.twoFactorEnabled && ["CEO", "CO_MD"].includes(staff.systemRole)) {
      if (!totpCode) return ok(res, { requireTotp: true });
      if (!staff.totpSecret)
        return badRequest(
          res,
          "2FA is enabled but no authenticator secret is configured. Contact an administrator.",
        );
      const { TOTP } = await import("otpauth");
      const otp = new TOTP({ secret: staff.totpSecret });
      if (otp.validate({ token: totpCode, window: 1 }) === null)
        return unauthorized(res, "Invalid 2FA code");
    }

    const payload = {
      sub: staff.id,
      role: staff.systemRole,
      type: "staff" as const,
    };
    const access_token = await signAccess(payload);
    const refresh_token = signRefresh(payload);

    const loginIp = typeof req.ip === "string" ? req.ip : undefined;
    await prisma.staffMember.update({
      where: { id: staff.id },
      data: {
        lastLoginAt: new Date(),
        ...(loginIp !== undefined && { lastLoginIp: loginIp }),
      },
    });

    const permissions = await getEffectivePermissions(staff.systemRole);

    return ok(res, {
      access_token,
      refresh_token,
      user: {
        id: staff.id,
        name: staff.name,
        email: staff.email,
        systemRole: staff.systemRole,
        branch: staff.branch,
        memberId: staff.memberId,
        avatarUrl: staff.avatarUrl ?? undefined,
        permissions,
      },
    });
  } catch (e) {
    if (isDbConnectionError(e)) {
      console.error("[auth/login] database unreachable");
      return serviceUnavailable(res, DB_UNAVAILABLE_MESSAGE);
    }
    console.error("[auth/login]", e);
    return serverError(res, e);
  }
});

// POST /auth/refresh
router.post("/refresh", validate(refreshSchema), async (req, res) => {
  try {
    const payload = verifyRefresh(req.body.refresh_token);
    const staff = await prisma.staffMember.findUnique({
      where: { id: payload.sub },
    });
    if (!staff) return unauthorized(res, "Invalid token");
    const access_token = await signAccess({
      sub: staff.id,
      role: staff.systemRole,
      type: "staff",
    });
    return ok(res, { access_token });
  } catch (e) {
    if (isDbConnectionError(e)) {
      return serviceUnavailable(res, DB_UNAVAILABLE_MESSAGE);
    }
    return unauthorized(res, "Invalid or expired refresh token");
  }
});

// POST /auth/logout
router.post("/logout", authenticate, async (req: AuthRequest, res) => {
  return ok(res, { message: "Logged out successfully" });
});

// POST /auth/forgot-password
router.post("/forgot-password", validate(forgotSchema), async (req, res) => {
  try {
    const email = req.body.email.trim().toLowerCase();
    const staff = await prisma.staffMember.findUnique({ where: { email } });
    if (staff) {
      const token = crypto.randomBytes(32).toString("hex");
      await redis.setex(`reset:staff:${token}`, 3600, staff.id);
      await sendPasswordResetEmail(staff.email, token, false);
    }
    return ok(res, { message: "If email exists, a reset link has been sent" });
  } catch {
    return serverError(res);
  }
});

// POST /auth/reset-password
router.post("/reset-password", validate(resetSchema), async (req, res) => {
  try {
    const { token, password } = req.body;
    const staffId = await redis.get(`reset:staff:${token}`);
    if (!staffId) return badRequest(res, "Invalid or expired reset token");

    const staff = await prisma.staffMember.findUnique({
      where: { id: staffId },
    });
    if (!staff) return notFound(res, "User");

    const passwordHash = await hashPassword(password);
    await prisma.staffMember.update({
      where: { id: staffId },
      data: { passwordHash },
    });
    await redis.del(`reset:staff:${token}`);
    return ok(res, { message: "Password reset successfully" });
  } catch {
    return serverError(res);
  }
});

// POST /auth/2fa/setup
router.post("/2fa/setup", authenticate, async (req: AuthRequest, res) => {
  try {
    const { TOTP, Secret } = await import("otpauth");
    const QRCode = await import("qrcode");
    const secret = new Secret();
    const totp = new TOTP({ issuer: "PouchCare", label: req.user!.id, secret });
    const qrCode = await QRCode.toDataURL(totp.toString());
    await prisma.staffMember.update({
      where: { id: req.user!.id },
      data: { totpSecret: secret.base32 },
    });
    return ok(res, { secret: secret.base32, qrCode });
  } catch {
    return serverError(res);
  }
});

// POST /auth/2fa/verify
router.post(
  "/2fa/verify",
  authenticate,
  validate(z.object({ code: z.string().length(6) })),
  async (req: AuthRequest, res) => {
    try {
      const staff = await prisma.staffMember.findUnique({
        where: { id: req.user!.id },
      });
      if (!staff?.totpSecret) return badRequest(res, "2FA not set up");
      const { TOTP } = await import("otpauth");
      const otp = new TOTP({ secret: staff.totpSecret });
      if (otp.validate({ token: req.body.code, window: 1 }) === null)
        return badRequest(res, "Invalid code");
      await prisma.staffMember.update({
        where: { id: req.user!.id },
        data: { twoFactorEnabled: true },
      });
      return ok(res, { message: "2FA enabled" });
    } catch {
      return serverError(res);
    }
  },
);

// POST /auth/change-password
router.post(
  "/change-password",
  authenticate,
  validate(changePasswordSchema),
  async (req: AuthRequest, res) => {
    try {
      const staff = await prisma.staffMember.findUnique({
        where: { id: req.user!.id },
      });
      if (!staff) return unauthorized(res, "User not found");

      const valid = await comparePassword(
        req.body.current_password,
        staff.passwordHash,
      );
      if (!valid) return badRequest(res, "Current password is incorrect");

      const sameAsCurrent = await comparePassword(
        req.body.new_password,
        staff.passwordHash,
      );
      if (sameAsCurrent)
        return badRequest(res, "New password must be different");

      const passwordHash = await hashPassword(req.body.new_password);
      await prisma.staffMember.update({
        where: { id: staff.id },
        data: { passwordHash },
      });

      return ok(res, { message: "Password changed successfully" });
    } catch {
      return serverError(res);
    }
  },
);

export default router;
