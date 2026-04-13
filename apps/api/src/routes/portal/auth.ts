import { Router } from "express";
import { z } from "zod";
import { validate } from "@/middleware/validate";
import {
  authenticate,
  requirePortal,
  type AuthRequest,
} from "@/middleware/auth";
import prisma from "@/lib/prisma";
import { hashPassword, comparePassword } from "@/lib/hash";
import { signAccess, signRefresh, verifyRefresh } from "@/lib/jwt";
import {
  ok,
  created,
  badRequest,
  unauthorized,
  conflict,
  serverError,
  notFound,
  serviceUnavailable,
} from "@/lib/response";
import { isDbConnectionError, DB_UNAVAILABLE_MESSAGE } from "@/lib/dbErrors";
import { sendVerificationEmail, sendPasswordResetEmail } from "@/lib/email";
import { env } from "@/config/env";
import crypto from "crypto";
import { nanoid } from "nanoid";

const router = Router();

const registerSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  country: z.string().optional(),
  phone: z.string().optional(),
  ref: z.string().optional(), // referral code
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});
const changePasswordSchema = z.object({
  current_password: z.string().min(1),
  new_password: z.string().min(8),
});

function generateReferralCode() {
  return "REF-" + nanoid(8).toUpperCase();
}

// POST /portal/register
router.post("/register", validate(registerSchema), async (req, res) => {
  try {
    const { password, ref, ...rest } = req.body;
    const exists = await prisma.portalMember.findUnique({
      where: { email: rest.email },
    });
    if (exists) return conflict(res, "Email already registered");

    const passwordHash = await hashPassword(password);
    const referralCode = generateReferralCode();
    const verifyToken = crypto.randomBytes(32).toString("hex");

    const member = await prisma.portalMember.create({
      data: {
        ...rest,
        passwordHash,
        referralCode,
        referredBy: ref || null,
        emailVerifyToken: verifyToken,
      },
    });

    // Link referral if valid ref code provided
    if (ref) {
      const referrer = await prisma.portalMember.findFirst({
        where: { referralCode: ref },
      });
      if (referrer) {
        await prisma.portalMember.update({
          where: { id: member.id },
          data: { referredById: referrer.id },
        });
        await prisma.portalMember.update({
          where: { id: referrer.id },
          data: { totalReferrals: { increment: 1 } },
        });
      }
    }

    await sendVerificationEmail(
      member.email,
      verifyToken,
      env.PORTAL_URL,
    ).catch((err) =>
      console.error("[portal/register] verification email:", err),
    );

    return created(res, { ...member, message: "Verification email sent" });
  } catch (e) {
    if (isDbConnectionError(e))
      return serviceUnavailable(res, DB_UNAVAILABLE_MESSAGE);
    console.error(e);
    return serverError(res);
  }
});

// POST /portal/login
router.post("/login", validate(loginSchema), async (req, res) => {
  try {
    const { email, password } = req.body;
    const member = await prisma.portalMember.findUnique({ where: { email } });
    if (!member) return unauthorized(res, "Invalid credentials");

    const valid = await comparePassword(password, member.passwordHash);
    if (!valid) return unauthorized(res, "Invalid credentials");

    if (!member.emailVerified)
      return unauthorized(res, "Please verify your email first");
    if (member.status === "SUSPENDED")
      return unauthorized(res, "Account suspended");

    const payload = {
      sub: member.id,
      role: "PORTAL_MEMBER" as any,
      type: "portal" as const,
    };
    const access_token = await signAccess(payload);
    const refresh_token = signRefresh(payload);

    await prisma.portalMember.update({
      where: { id: member.id },
      data: { lastLoginDate: new Date() },
    });

    return ok(res, {
      access_token,
      refresh_token,
      user: {
        id: member.id,
        fullName: member.fullName,
        email: member.email,
        referralCode: member.referralCode,
        walletBalance: member.walletBalance,
        avatarUrl: member.avatarUrl ?? undefined,
      },
    });
  } catch (e) {
    if (isDbConnectionError(e))
      return serviceUnavailable(res, DB_UNAVAILABLE_MESSAGE);
    return serverError(res);
  }
});

// POST /portal/verify-email
router.post(
  "/verify-email",
  validate(z.object({ token: z.string() })),
  async (req, res) => {
    try {
      const member = await prisma.portalMember.findFirst({
        where: { emailVerifyToken: req.body.token },
      });
      if (!member)
        return badRequest(res, "Invalid or expired verification token");
      await prisma.portalMember.update({
        where: { id: member.id },
        data: { emailVerified: true, emailVerifyToken: null, status: "ACTIVE" },
      });
      return ok(res, { message: "Email verified successfully" });
    } catch {
      return serverError(res);
    }
  },
);

// POST /portal/resend-verification
router.post(
  "/resend-verification",
  validate(z.object({ email: z.string().email() })),
  async (req, res) => {
    try {
      const member = await prisma.portalMember.findUnique({
        where: { email: req.body.email },
      });
      if (member && !member.emailVerified) {
        const token = crypto.randomBytes(32).toString("hex");
        await prisma.portalMember.update({
          where: { id: member.id },
          data: { emailVerifyToken: token },
        });
        await sendVerificationEmail(member.email, token, env.PORTAL_URL).catch(
          (err) => console.error("[portal/resend-verification] email:", err),
        );
      }
      return ok(res, {
        message:
          "If account exists and is unverified, a verification email has been sent",
      });
    } catch {
      return serverError(res);
    }
  },
);

// POST /portal/forgot-password
router.post(
  "/forgot-password",
  validate(z.object({ email: z.string().email() })),
  async (req, res) => {
    try {
      const member = await prisma.portalMember.findUnique({
        where: { email: req.body.email },
      });
      if (member) {
        const token = crypto.randomBytes(32).toString("hex");
        const expires = new Date(Date.now() + 3600000); // 1 hour
        await prisma.portalMember.update({
          where: { id: member.id },
          data: { resetPasswordToken: token, resetTokenExpiry: expires },
        });
        await sendPasswordResetEmail(member.email, token, true).catch((err) =>
          console.error("[portal/forgot-password] email:", err),
        );
      }
      return ok(res, { message: "If email exists, reset link has been sent" });
    } catch {
      return serverError(res);
    }
  },
);

// POST /portal/reset-password
router.post(
  "/reset-password",
  validate(z.object({ token: z.string(), password: z.string().min(8) })),
  async (req, res) => {
    try {
      const member = await prisma.portalMember.findFirst({
        where: {
          resetPasswordToken: req.body.token,
          resetTokenExpiry: { gt: new Date() },
        },
      });
      if (!member) return badRequest(res, "Invalid or expired reset token");
      const passwordHash = await hashPassword(req.body.password);
      await prisma.portalMember.update({
        where: { id: member.id },
        data: {
          passwordHash,
          resetPasswordToken: null,
          resetTokenExpiry: null,
        },
      });
      return ok(res, { message: "Password reset successfully" });
    } catch {
      return serverError(res);
    }
  },
);

// POST /portal/logout
router.post(
  "/logout",
  authenticate,
  requirePortal,
  async (req: AuthRequest, res) => {
    return ok(res, { message: "Logged out" });
  },
);

// POST /portal/refresh
router.post(
  "/refresh",
  validate(z.object({ refresh_token: z.string() })),
  async (req, res) => {
    try {
      const payload = verifyRefresh(req.body.refresh_token);
      const member = await prisma.portalMember.findUnique({
        where: { id: payload.sub },
      });
      if (!member) return unauthorized(res, "Invalid token");
      const access_token = await signAccess({
        sub: member.id,
        role: "PORTAL_MEMBER" as any,
        type: "portal",
      });
      return ok(res, { access_token });
    } catch {
      return unauthorized(res, "Invalid or expired refresh token");
    }
  },
);

// POST /portal/change-password
router.post(
  "/change-password",
  authenticate,
  requirePortal,
  validate(changePasswordSchema),
  async (req: AuthRequest, res) => {
    try {
      const member = await prisma.portalMember.findUnique({
        where: { id: req.user!.id },
      });
      if (!member) return unauthorized(res, "User not found");

      const valid = await comparePassword(
        req.body.current_password,
        member.passwordHash,
      );
      if (!valid) return badRequest(res, "Current password is incorrect");

      const sameAsCurrent = await comparePassword(
        req.body.new_password,
        member.passwordHash,
      );
      if (sameAsCurrent)
        return badRequest(res, "New password must be different");

      const passwordHash = await hashPassword(req.body.new_password);
      await prisma.portalMember.update({
        where: { id: member.id },
        data: { passwordHash },
      });

      return ok(res, { message: "Password changed successfully" });
    } catch {
      return serverError(res);
    }
  },
);

export default router;
