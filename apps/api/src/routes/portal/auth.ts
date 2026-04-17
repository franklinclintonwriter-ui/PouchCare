import { Router } from "express";
import { z } from "zod";
import { validate } from "@/middleware/validate";
import {
  authenticate,
  requirePortal,
  type AuthRequest,
} from "@/middleware/auth";
import { authLimiter } from "@/middleware/rateLimit";
import prisma from "@/lib/prisma";
import { hashPassword, comparePassword } from "@/lib/hash";
import { signAccess, signRefresh, verifyRefresh } from "@/lib/jwt";
import { redis } from "@/lib/redis";
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

const emailSchema = z
  .string()
  .trim()
  .email()
  .transform((v) => v.toLowerCase());

const OTP_TTL_SECONDS = 10 * 60;
const OTP_MAX_ATTEMPTS = 5;

const registerSchema = z.object({
  fullName: z.string().trim().min(2),
  email: emailSchema,
  password: z.string().min(8),
  country: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  ref: z.string().trim().optional(), // referral code
});

const loginSchema = z.object({
  email: emailSchema,
  password: z.string(),
});
const changePasswordSchema = z.object({
  current_password: z.string().min(1),
  new_password: z.string().min(8),
});

function generateReferralCode() {
  return "REF-" + nanoid(8).toUpperCase();
}

function generateOtp() {
  return crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");
}

/** Request bodies normalize email to lowercase; DB may store mixed case — match case-insensitively. */
function findPortalMemberByEmail(normalizedEmail: string) {
  return prisma.portalMember.findFirst({
    where: { email: { equals: normalizedEmail, mode: "insensitive" } },
  });
}

function hashOtp(otp: string) {
  return crypto
    .createHash("sha256")
    .update(`${otp}:${env.JWT_SECRET}`)
    .digest("hex");
}

async function issueVerification(member: { id: string; email: string }) {
  const token = crypto.randomBytes(32).toString("hex");

  await prisma.portalMember.update({
    where: { id: member.id },
    data: { emailVerifyToken: token },
  });

  let otp: string | undefined = generateOtp();
  try {
    await redis.setex(
      `verify:portal:${member.email}`,
      OTP_TTL_SECONDS,
      JSON.stringify({
        otpHash: hashOtp(otp),
        attempts: 0,
        memberId: member.id,
      }),
    );
  } catch (err) {
    otp = undefined;
    console.error("[portal/verification] redis unavailable:", err);
  }

  await sendVerificationEmail(member.email, token, env.PORTAL_URL, otp);
}

// POST /portal/register
router.post(
  "/register",
  authLimiter,
  validate(registerSchema),
  async (req, res) => {
    try {
      const { password, ref, ...rest } = req.body;
      const email = rest.email;
      const fullName = String(rest.fullName).trim();

      const exists = await findPortalMemberByEmail(email);
      if (exists) {
        if (exists.emailVerified)
          return conflict(res, "Email already registered");

        await issueVerification({ id: exists.id, email }).catch((err) =>
          console.error("[portal/register] resend verification email:", err),
        );
        return ok(res, {
          message:
            "If the account exists and is unverified, a verification email has been sent",
          member: {
            id: exists.id,
            email: exists.email,
            fullName: exists.fullName,
            referralCode: exists.referralCode,
          },
        });
      }

      const passwordHash = await hashPassword(password);
      const referralCode = generateReferralCode();

      const member = await prisma.portalMember.create({
        data: {
          ...rest,
          email,
          fullName,
          passwordHash,
          referralCode,
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

      await issueVerification({ id: member.id, email: member.email }).catch(
        (err) => console.error("[portal/register] verification email:", err),
      );

      return created(res, {
        message: "Verification email sent",
        member: {
          id: member.id,
          email: member.email,
          fullName: member.fullName,
          referralCode: member.referralCode,
        },
      });
    } catch (e) {
      if (isDbConnectionError(e))
        return serviceUnavailable(res, DB_UNAVAILABLE_MESSAGE);
      console.error(e);
      return serverError(res);
    }
  },
);

// POST /portal/login
router.post("/login", authLimiter, validate(loginSchema), async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;
    const member = await findPortalMemberByEmail(email);
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
    console.error("[portal/login]", e);
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

// POST /portal/verify-email-otp
router.post(
  "/verify-email-otp",
  validate(
    z.object({
      email: emailSchema,
      otp: z.string().trim().length(6),
    }),
  ),
  async (req, res) => {
    try {
      const email = req.body.email;
      const otp = req.body.otp;

      const member = await findPortalMemberByEmail(email);
      if (!member)
        return badRequest(res, "Invalid or expired verification code");

      if (member.emailVerified) return ok(res, { message: "Email verified" });

      // Redis keys use canonical email from DB (see issueVerification)
      const raw = await redis.get(`verify:portal:${member.email}`);
      if (!raw) return badRequest(res, "Invalid or expired verification code");

      const state = JSON.parse(raw) as {
        otpHash: string;
        attempts: number;
        memberId: string;
      };

      if (state.memberId !== member.id) {
        await redis.del(`verify:portal:${member.email}`);
        return badRequest(res, "Invalid or expired verification code");
      }

      const expected = state.otpHash;
      const got = hashOtp(otp);
      if (expected !== got) {
        const nextAttempts = (state.attempts ?? 0) + 1;
        if (nextAttempts >= OTP_MAX_ATTEMPTS) {
          await redis.del(`verify:portal:${member.email}`);
          return badRequest(res, "Too many attempts. Request a new code.");
        }
        await redis.setex(
          `verify:portal:${member.email}`,
          OTP_TTL_SECONDS,
          JSON.stringify({ ...state, attempts: nextAttempts }),
        );
        return badRequest(res, "Invalid or expired verification code");
      }

      await prisma.portalMember.update({
        where: { id: member.id },
        data: { emailVerified: true, emailVerifyToken: null, status: "ACTIVE" },
      });
      await redis.del(`verify:portal:${member.email}`);
      return ok(res, { message: "Email verified successfully" });
    } catch (e) {
      if (isDbConnectionError(e))
        return serviceUnavailable(res, DB_UNAVAILABLE_MESSAGE);
      console.error("[portal/verify-email-otp]", e);
      return serverError(res);
    }
  },
);

// POST /portal/resend-verification
router.post(
  "/resend-verification",
  validate(z.object({ email: emailSchema })),
  async (req, res) => {
    try {
      const email = req.body.email;
      const member = await findPortalMemberByEmail(email);
      if (member && !member.emailVerified) {
        await issueVerification({ id: member.id, email: member.email }).catch(
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
  validate(z.object({ email: emailSchema })),
  async (req, res) => {
    try {
      const email = req.body.email;
      const member = await findPortalMemberByEmail(email);
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
