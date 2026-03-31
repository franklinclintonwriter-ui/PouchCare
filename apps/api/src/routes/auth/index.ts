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
} from "@/lib/response";
import crypto from "crypto";

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

// POST /auth/login
router.post("/login", validate(loginSchema), async (req, res) => {
  try {
    const { email, password, totp } = req.body
    const staff = await prisma.staffMember.findUnique({ where: { email } })
    if (!staff || !(await comparePassword(password, staff.passwordHash)))
      return unauthorized(res, "Invalid credentials");
    if (staff.status === "INACTIVE")
      return unauthorized(res, "Account is inactive");

    // 2FA for CEO/CO_MD
    if (staff.twoFactorEnabled && ['CEO', 'CO_MD'].includes(staff.systemRole)) {
      if (!totp) return ok(res, { requireTotp: true })
      const { TOTP } = await import('otpauth')
      const otp = new TOTP({ secret: staff.totpSecret! })
      if (otp.validate({ token: totp, window: 1 }) === null)
        return unauthorized(res, "Invalid 2FA code");
    }

    const payload = {
      sub: staff.id,
      role: staff.systemRole,
      type: "staff" as const,
    };
    const access_token = signAccess(payload);
    const refresh_token = signRefresh(payload);

    await prisma.staffMember.update({ where: { id: staff.id }, data: { lastLoginAt: new Date(), lastLoginIp: req.ip } })

    return ok(res, {
      access_token,
      refresh_token,
      user: {
        id: staff.id,
        name: staff.name,
        email: staff.email,
        role: staff.systemRole,
        branch: staff.branch,
        memberId: staff.memberId,
      },
    });
  } catch (e) {
    console.error(e);
    return serverError(res);
  }
});

// POST /auth/refresh
router.post("/refresh", validate(refreshSchema), async (req, res) => {
  try {
    const payload = verifyRefresh(req.body.refresh_token)
    const staff = await prisma.staffMember.findUnique({ where: { id: payload.sub } })
    if (!staff) return unauthorized(res, 'Invalid token')
    const access_token = signAccess({ sub: staff.id, role: staff.systemRole, type: 'staff' })
    return ok(res, { access_token })
  } catch { return unauthorized(res, 'Invalid or expired refresh token') }
})

// POST /auth/logout
router.post("/logout", authenticate, async (req: AuthRequest, res) => {
  return ok(res, { message: "Logged out successfully" });
});

// POST /auth/forgot-password
router.post("/forgot-password", validate(forgotSchema), async (req, res) => {
  try {
    const staff = await prisma.staffMember.findUnique({ where: { email: req.body.email } })
    if (staff) console.log(`[DEV] Password reset requested for ${staff.email}`)
    return ok(res, { message: 'If email exists, reset link sent' })
  } catch { return serverError(res) }
})

// POST /auth/reset-password
router.post("/reset-password", validate(resetSchema), async (req, res) => {
  return ok(res, { message: "Password reset — implement token storage" });
});

// POST /auth/2fa/setup
router.post("/2fa/setup", authenticate, async (req: AuthRequest, res) => {
  try {
    const { TOTP, Secret } = await import('otpauth')
    const QRCode = await import('qrcode')
    const secret = new Secret()
    const totp   = new TOTP({ issuer: 'PouchCare', label: req.user!.id, secret })
    const qrCode = await QRCode.toDataURL(totp.toString())
    await prisma.staffMember.update({ where: { id: req.user!.id }, data: { totpSecret: secret.base32 } })
    return ok(res, { secret: secret.base32, qrCode })
  } catch { return serverError(res) }
})

// POST /auth/2fa/verify
router.post('/2fa/verify', authenticate, validate(z.object({ code: z.string().length(6) })), async (req: AuthRequest, res) => {
  try {
    const staff = await prisma.staffMember.findUnique({ where: { id: req.user!.id } })
    if (!staff?.totpSecret) return badRequest(res, '2FA not set up')
    const { TOTP } = await import('otpauth')
    const otp = new TOTP({ secret: staff.totpSecret })
    if (otp.validate({ token: req.body.code, window: 1 }) === null) return badRequest(res, 'Invalid code')
    await prisma.staffMember.update({ where: { id: req.user!.id }, data: { twoFactorEnabled: true } })
    return ok(res, { message: '2FA enabled' })
  } catch { return serverError(res) }
})

export default router;
