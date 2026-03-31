import { Router } from 'express'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '@/lib/jwt'
import { validate } from '@/middleware/validate'
import { requirePortal } from '@/middleware/auth'
import { authLimiter } from '@/middleware/rateLimit'
import { ok, created, badRequest, unauthorized, conflict, serverError } from '@/utils/response'
import { sendEmail, emailTemplates } from '@/lib/email'
import { env } from '@/config/env'

const router = Router()

function generateReferralCode(): string {
  return 'REF-' + crypto.randomBytes(4).toString('hex').toUpperCase()
}

const registerSchema = z.object({
  fullName:  z.string().min(2).max(100),
  email:     z.string().email(),
  password:  z.string().min(8),
  country:   z.string().optional(),
  phone:     z.string().optional(),
  refCode:   z.string().optional(), // referral code of referrer
})

const loginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(6),
})

const forgotSchema = z.object({ email: z.string().email() })
const resetSchema = z.object({
  token:    z.string(),
  password: z.string().min(8),
})
const resendSchema = z.object({ email: z.string().email() })
const verifySchema = z.object({ token: z.string() })
const refreshSchema = z.object({ refresh_token: z.string() })

// POST /v1/portal/register
router.post('/register', authLimiter, validate(registerSchema), async (req, res) => {
  try {
    const { fullName, email, password, country, phone, refCode } = req.body
    const existing = await prisma.portalMember.findUnique({ where: { email: email.toLowerCase() } })
    if (existing) return conflict(res, 'Email already registered')

    // Find referrer
    let referredById: string | undefined
    if (refCode) {
      const referrer = await prisma.portalMember.findUnique({ where: { referralCode: refCode } })
      if (referrer) referredById = referrer.id
    }

    const passwordHash = await bcrypt.hash(password, env.BCRYPT_ROUNDS)
    const referralCode = generateReferralCode()
    const verifyToken  = crypto.randomBytes(32).toString('hex')

    const member = await prisma.portalMember.create({
      data: {
        fullName,
        email: email.toLowerCase(),
        passwordHash,
        country,
        phone,
        referralCode,
        referredById,
        emailVerifyToken: verifyToken,
      },
      select: { id: true, email: true, fullName: true, referralCode: true },
    })

    // Increment referrer's total referrals
    if (referredById) {
      await prisma.portalMember.update({
        where: { id: referredById },
        data: { totalReferrals: { increment: 1 } },
      })
    }

    // Send verification email
    const { subject, html } = emailTemplates.verifyEmail(fullName, verifyToken, env.FRONTEND_URL)
    await sendEmail(email, subject, html)

    return created(res, { message: 'Registration successful. Check your email to verify.', member })
  } catch (err) { serverError(res, err) }
})

// POST /v1/portal/login
router.post('/login', authLimiter, validate(loginSchema), async (req, res) => {
  try {
    const { email, password } = req.body
    const member = await prisma.portalMember.findUnique({ where: { email: email.toLowerCase() } })
    if (!member) return unauthorized(res, 'Invalid credentials')
    if (!member.emailVerified) return unauthorized(res, 'Please verify your email first')
    if (member.status === 'SUSPENDED') return unauthorized(res, 'Account suspended')

    const valid = await bcrypt.compare(password, member.passwordHash)
    if (!valid) return unauthorized(res, 'Invalid credentials')

    const payload = { sub: member.id, role: 'CLIENT', type: 'portal' as const }
    const accessToken  = signAccessToken(payload)
    const refreshToken = signRefreshToken(payload)

    await prisma.portalMember.update({
      where: { id: member.id },
      data: { refreshToken, lastLoginDate: new Date(), status: 'ACTIVE' },
    })

    return ok(res, {
      user: {
        id: member.id, fullName: member.fullName, email: member.email,
        country: member.country, referralCode: member.referralCode,
        walletBalance: member.walletBalance, status: member.status,
      },
      access_token: accessToken,
      refresh_token: refreshToken,
    })
  } catch (err) { serverError(res, err) }
})

// POST /v1/portal/verify-email
router.post('/verify-email', validate(verifySchema), async (req, res) => {
  try {
    const member = await prisma.portalMember.findFirst({
      where: { emailVerifyToken: req.body.token },
    })
    if (!member) return badRequest(res, 'Invalid or expired verification token')

    await prisma.portalMember.update({
      where: { id: member.id },
      data: { emailVerified: true, emailVerifyToken: null, status: 'ACTIVE' },
    })
    return ok(res, { message: 'Email verified successfully' })
  } catch (err) { serverError(res, err) }
})

// POST /v1/portal/resend-verification
router.post('/resend-verification', authLimiter, validate(resendSchema), async (req, res) => {
  try {
    const member = await prisma.portalMember.findUnique({ where: { email: req.body.email.toLowerCase() } })
    if (member && !member.emailVerified) {
      const token = crypto.randomBytes(32).toString('hex')
      await prisma.portalMember.update({ where: { id: member.id }, data: { emailVerifyToken: token } })
      const { subject, html } = emailTemplates.verifyEmail(member.fullName, token, env.FRONTEND_URL)
      await sendEmail(member.email, subject, html)
    }
    return ok(res, { message: 'If that email exists and is unverified, a new link has been sent' })
  } catch (err) { serverError(res, err) }
})

// POST /v1/portal/refresh
router.post('/refresh', validate(refreshSchema), async (req, res) => {
  try {
    const payload = verifyRefreshToken(req.body.refresh_token)
    if (payload.type !== 'portal') return unauthorized(res)

    const member = await prisma.portalMember.findFirst({
      where: { id: payload.sub, refreshToken: req.body.refresh_token },
    })
    if (!member) return unauthorized(res, 'Invalid refresh token')

    const newPayload = { sub: member.id, role: 'CLIENT', type: 'portal' as const }
    const accessToken  = signAccessToken(newPayload)
    const refreshToken = signRefreshToken(newPayload)

    await prisma.portalMember.update({ where: { id: member.id }, data: { refreshToken } })
    return ok(res, { access_token: accessToken, refresh_token: refreshToken })
  } catch {
    unauthorized(res, 'Invalid refresh token')
  }
})

// POST /v1/portal/logout
router.post('/logout', requirePortal, async (req, res) => {
  try {
    await prisma.portalMember.update({ where: { id: req.user!.id }, data: { refreshToken: null } })
    return ok(res, { message: 'Logged out' })
  } catch (err) { serverError(res, err) }
})

// POST /v1/portal/forgot-password
router.post('/forgot-password', authLimiter, validate(forgotSchema), async (req, res) => {
  try {
    const member = await prisma.portalMember.findUnique({ where: { email: req.body.email.toLowerCase() } })
    if (member) {
      const token = crypto.randomBytes(32).toString('hex')
      const expiry = new Date(Date.now() + 60 * 60 * 1000) // 1 hour
      await prisma.portalMember.update({
        where: { id: member.id },
        data: { resetPasswordToken: token, resetTokenExpiry: expiry },
      })
      const { subject, html } = emailTemplates.resetPassword(member.fullName, token, env.FRONTEND_URL)
      await sendEmail(member.email, subject, html)
    }
    return ok(res, { message: 'If that email exists, a reset link has been sent' })
  } catch (err) { serverError(res, err) }
})

// POST /v1/portal/reset-password
router.post('/reset-password', validate(resetSchema), async (req, res) => {
  try {
    const { token, password } = req.body
    const member = await prisma.portalMember.findFirst({
      where: {
        resetPasswordToken: token,
        resetTokenExpiry: { gt: new Date() },
      },
    })
    if (!member) return badRequest(res, 'Invalid or expired reset token')

    const hash = await bcrypt.hash(password, env.BCRYPT_ROUNDS)
    await prisma.portalMember.update({
      where: { id: member.id },
      data: { passwordHash: hash, resetPasswordToken: null, resetTokenExpiry: null },
    })
    return ok(res, { message: 'Password updated successfully' })
  } catch (err) { serverError(res, err) }
})

export default router
