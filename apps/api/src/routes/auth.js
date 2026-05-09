import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import prisma from "../utils/prisma.js";
import { signToken } from "../utils/jwt.js";
import { generateVerificationCode, generateResetToken } from "../utils/crypto.js";
import { sendVerificationEmail, sendPasswordResetEmail } from "../services/email.js";
import authenticate from "../middleware/authenticate.js";

const router = Router();

// ─────────────── Validation schemas ───────────────

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const verifySchema = z.object({
  email: z.string().email(),
  code: z.string().length(6, "Code must be 6 digits"),
});

const forgotSchema = z.object({
  email: z.string().email(),
});

const resetSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const resendSchema = z.object({
  email: z.string().email(),
});

// ─────────────── POST /auth/register ───────────────

router.post("/register", async (req, res, next) => {
  try {
    const body = registerSchema.parse(req.body);

    const existing = await prisma.user.findUnique({ where: { email: body.email } });
    if (existing) {
      return res.status(409).json({ error: "An account with this email already exists" });
    }

    const passwordHash = await bcrypt.hash(body.password, 12);

    const user = await prisma.user.create({
      data: {
        email: body.email,
        name: body.name,
        passwordHash,
        status: "pending",
        emailVerified: false,
      },
    });

    const code = generateVerificationCode();
    await prisma.verificationToken.create({
      data: {
        code,
        userId: user.id,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      },
    });

    await sendVerificationEmail(user.email, user.name, code);

    res.status(201).json({
      message: "Account created. Please check your email for the verification code.",
      email: user.email,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors[0].message, details: err.errors });
    }
    next(err);
  }
});

// ─────────────── POST /auth/verify-email ───────────────

router.post("/verify-email", async (req, res, next) => {
  try {
    const body = verifySchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email: body.email } });
    if (!user) {
      return res.status(404).json({ error: "Account not found" });
    }

    if (user.emailVerified) {
      return res.status(400).json({ error: "Email already verified" });
    }

    const tokenRecord = await prisma.verificationToken.findFirst({
      where: {
        userId: user.id,
        code: body.code,
        expiresAt: { gt: new Date() },
      },
    });

    if (!tokenRecord) {
      return res.status(400).json({ error: "Invalid or expired verification code" });
    }

    const verifiedUser = await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true, status: "active" },
      select: { id: true, email: true, name: true, plan: true, role: true, status: true },
    });

    await prisma.verificationToken.deleteMany({ where: { userId: user.id } });

    const token = signToken(verifiedUser);

    res.json({
      message: "Email verified successfully",
      token,
      user: verifiedUser,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors[0].message });
    }
    next(err);
  }
});

// ─────────────── POST /auth/resend-code ───────────────

router.post("/resend-code", async (req, res, next) => {
  try {
    const body = resendSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email: body.email } });
    if (!user) {
      return res.json({ message: "If an account exists, a new code has been sent." });
    }

    if (user.emailVerified) {
      return res.status(400).json({ error: "Email already verified" });
    }

    await prisma.verificationToken.deleteMany({ where: { userId: user.id } });

    const code = generateVerificationCode();
    await prisma.verificationToken.create({
      data: {
        code,
        userId: user.id,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      },
    });

    await sendVerificationEmail(user.email, user.name, code);

    res.json({ message: "If an account exists, a new code has been sent." });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors[0].message });
    }
    next(err);
  }
});

// ─────────────── POST /auth/login ───────────────

router.post("/login", async (req, res, next) => {
  try {
    const body = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email: body.email } });
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const valid = await bcrypt.compare(body.password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    if (!user.emailVerified) {
      return res.status(403).json({
        error: "Email not verified",
        code: "EMAIL_NOT_VERIFIED",
        email: user.email,
      });
    }

    if (user.status === "suspended") {
      return res.status(403).json({ error: "Account suspended. Contact support." });
    }

    const token = signToken(user);

    res.json({
      token,
      user: { id: user.id, email: user.email, name: user.name, plan: user.plan, role: user.role, status: user.status },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors[0].message });
    }
    next(err);
  }
});

// ─────────────── POST /auth/forgot-password ───────────────

router.post("/forgot-password", async (req, res, next) => {
  try {
    const body = forgotSchema.parse(req.body);

    const successMsg = { message: "If an account with that email exists, a reset link has been sent." };

    const user = await prisma.user.findUnique({ where: { email: body.email } });
    if (!user) return res.json(successMsg);

    await prisma.passwordResetToken.updateMany({
      where: { userId: user.id, used: false },
      data: { used: true },
    });

    const token = generateResetToken();
    await prisma.passwordResetToken.create({
      data: {
        token,
        userId: user.id,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });

    await sendPasswordResetEmail(user.email, user.name, token);

    res.json(successMsg);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors[0].message });
    }
    next(err);
  }
});

// ─────────────── POST /auth/reset-password ───────────────

router.post("/reset-password", async (req, res, next) => {
  try {
    const body = resetSchema.parse(req.body);

    const tokenRecord = await prisma.passwordResetToken.findUnique({
      where: { token: body.token },
      include: { user: true },
    });

    if (!tokenRecord || tokenRecord.used || tokenRecord.expiresAt < new Date()) {
      return res.status(400).json({ error: "Invalid or expired reset token" });
    }

    const passwordHash = await bcrypt.hash(body.password, 12);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: tokenRecord.userId },
        data: { passwordHash },
      }),
      prisma.passwordResetToken.update({
        where: { id: tokenRecord.id },
        data: { used: true },
      }),
    ]);

    res.json({ message: "Password reset successfully. You can now log in." });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors[0].message });
    }
    next(err);
  }
});

// ─────────────── GET /auth/me (protected) ───────────────

router.get("/me", authenticate, (req, res) => {
  res.json({ user: req.user });
});

// ─────────────── POST /auth/logout ───────────────

router.post("/logout", authenticate, (_req, res) => {
  res.json({ message: "Logged out successfully" });
});

// ─────────────── PATCH /auth/profile (protected) ───────────────

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  email: z.string().email("Invalid email address").optional(),
}).refine((data) => data.name || data.email, { message: "At least one field is required" });

router.patch("/profile", authenticate, async (req, res, next) => {
  try {
    const body = profileSchema.parse(req.body);
    const updateData = {};

    if (body.name) updateData.name = body.name;

    if (body.email && body.email !== req.user.email) {
      const existing = await prisma.user.findUnique({ where: { email: body.email } });
      if (existing) {
        return res.status(409).json({ error: "Email already in use" });
      }
      updateData.email = body.email;
    }

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: updateData,
      select: { id: true, email: true, name: true, plan: true, role: true, status: true },
    });

    res.json({ message: "Profile updated", user });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors[0].message });
    }
    next(err);
  }
});

// ─────────────── PATCH /auth/password (protected) ───────────────

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
});

router.patch("/password", authenticate, async (req, res, next) => {
  try {
    const body = changePasswordSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    const valid = await bcrypt.compare(body.currentPassword, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: "Current password is incorrect" });
    }

    const passwordHash = await bcrypt.hash(body.newPassword, 12);
    await prisma.user.update({
      where: { id: req.user.id },
      data: { passwordHash },
    });

    res.json({ message: "Password changed successfully" });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors[0].message });
    }
    next(err);
  }
});

export default router;
