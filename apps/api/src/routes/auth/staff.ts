import { Router } from 'express'
import bcrypt from 'bcryptjs'
import speakeasy from 'speakeasy'

import { z } from 'zod'
import prisma from '@/lib/prisma'
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '@/lib/jwt'
import { validate } from '@/middleware/validate'
import { requireStaff } from '@/middleware/auth'
import { authLimiter } from '@/middleware/rateLimit'
import { ok, created, badRequest, unauthorized, serverError } from '@/utils/response'
import { env } from '@/config/env'

const router = Router()

const loginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(6),
  totp:     z.string().length(6).optional(),
})

const refreshSchema = z.object({
  refresh_token: z.string(),
})

const forgotSchema = z.object({
  email: z.string().email(),
})

const resetSchema = z.object({
  token:    z.string(),
  password: z.string().min(8),
})

const setup2faSchema = z.object({
  password: z.string(),
})

const verify2faSchema = z.object({
  token: z.string().length(6),
})

// POST /v1/auth/login
router.post('/login', authLimiter, validate(loginSchema), async (req, res) => {
  try {
    const { email, password, totp } = req.body
    const staff = await prisma.staffMember.findUnique({ where: { email: email.toLowerCase() } })
    if (!staff) return unauthorized(res, 'Invalid credentials')

    const valid = await bcrypt.compare(password, staff.passwordHash)
    if (!valid) return unauthorized(res, 'Invalid credentials')

    // 2FA check (required for CEO / Co-MD)
    if (staff.twoFactorEnabled) {
      if (!totp) return ok(res, { requireTotp: true })
      const validTotp = speakeasy.totp.verify({ secret: staff.totpSecret!, encoding: 'base32', token: totp })
      if (!validTotp) return unauthorized(res, 'Invalid 2FA code')
    }

    const payload = { sub: staff.id, role: staff.systemRole, type: 'staff' as const }
    const accessToken  = signAccessToken(payload)
    const refreshToken = signRefreshToken(payload)

    await prisma.staffMember.update({
      where: { id: staff.id },
      data: {
        refreshToken,
        lastLoginAt: new Date(),
        lastLoginIp: req.ip,
      },
    })

    return ok(res, {
      user: {
        id: staff.id, name: staff.name, email: staff.email,
        role: staff.systemRole, branch: staff.branch,
        twoFactorEnabled: staff.twoFactorEnabled,
        memberId: staff.memberId,
      },
      access_token: accessToken,
      refresh_token: refreshToken,
    })
  } catch (err) { serverError(res, err) }
})

// POST /v1/auth/refresh
router.post('/refresh', validate(refreshSchema), async (req, res) => {
  try {
    const payload = verifyRefreshToken(req.body.refresh_token)
    if (payload.type !== 'staff') return unauthorized(res)

    const staff = await prisma.staffMember.findFirst({
      where: { id: payload.sub, refreshToken: req.body.refresh_token },
    })
    if (!staff) return unauthorized(res, 'Invalid refresh token')

    const newPayload = { sub: staff.id, role: staff.systemRole, type: 'staff' as const }
    const accessToken  = signAccessToken(newPayload)
    const refreshToken = signRefreshToken(newPayload)

    await prisma.staffMember.update({ where: { id: staff.id }, data: { refreshToken } })
    return ok(res, { access_token: accessToken, refresh_token: refreshToken })
  } catch {
    unauthorized(res, 'Invalid refresh token')
  }
})

// POST /v1/auth/logout
router.post('/logout', requireStaff, async (req, res) => {
  try {
    await prisma.staffMember.update({ where: { id: req.user!.id }, data: { refreshToken: null } })
    return ok(res, { message: 'Logged out' })
  } catch (err) { serverError(res, err) }
})

// POST /v1/auth/forgot-password
router.post('/forgot-password', authLimiter, validate(forgotSchema), async (req, res) => {
  try {
    const staff = await prisma.staffMember.findUnique({ where: { email: req.body.email.toLowerCase() } })
    // Always return ok to prevent email enumeration
    if (staff) {
      const token = require('crypto').randomBytes(32).toString('hex')
      await prisma.staffMember.update({
        where: { id: staff.id },
        data: { refreshToken: `reset:${token}` }, // reuse field temporarily
      })
      // TODO: send email with reset link
      console.log(`[RESET TOKEN] ${staff.email}: ${token}`)
    }
    return ok(res, { message: 'If that email exists, a reset link has been sent' })
  } catch (err) { serverError(res, err) }
})

// POST /v1/auth/reset-password
router.post('/reset-password', validate(resetSchema), async (req, res) => {
  try {
    const { token, password } = req.body
    const staff = await prisma.staffMember.findFirst({
      where: { refreshToken: `reset:${token}` },
    })
    if (!staff) return badRequest(res, 'Invalid or expired reset token')

    const hash = await bcrypt.hash(password, env.BCRYPT_ROUNDS)
    await prisma.staffMember.update({
      where: { id: staff.id },
      data: { passwordHash: hash, refreshToken: null },
    })
    return ok(res, { message: 'Password updated successfully' })
  } catch (err) { serverError(res, err) }
})

// GET /v1/auth/me
router.get('/me', requireStaff, async (req, res) => {
  try {
    const staff = await prisma.staffMember.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true, memberId: true, name: true, email: true,
        systemRole: true, branch: true, jobRole: true,
        primarySkill: true, phone: true, whatsapp: true,
        twoFactorEnabled: true, status: true, joinDate: true,
        averageTaskRating: true, ceoPerformanceRating: true,
      },
    })
    if (!staff) return unauthorized(res)
    return ok(res, staff)
  } catch (err) { serverError(res, err) }
})

// POST /v1/auth/2fa/setup
router.post('/2fa/setup', requireStaff, validate(setup2faSchema), async (req, res) => {
  try {
    const staff = await prisma.staffMember.findUnique({ where: { id: req.user!.id } })
    if (!staff) return unauthorized(res)

    const valid = await bcrypt.compare(req.body.password, staff.passwordHash)
    if (!valid) return unauthorized(res, 'Invalid password')

    const secret = speakeasy.generateSecret({ name: `PouchCare:${staff.email}`, issuer: 'PouchCare', length: 20 }).base32
    const otpauthUrl = speakeasy.otpauthURL({ secret, label: staff.email, issuer: 'PouchCare', encoding: 'base32' })

    await prisma.staffMember.update({ where: { id: staff.id }, data: { totpSecret: secret } })

    return ok(res, { secret, otpauthUrl })
  } catch (err) { serverError(res, err) }
})

// POST /v1/auth/2fa/verify
router.post('/2fa/verify', requireStaff, validate(verify2faSchema), async (req, res) => {
  try {
    const staff = await prisma.staffMember.findUnique({ where: { id: req.user!.id } })
    if (!staff?.totpSecret) return badRequest(res, '2FA not set up')

    const valid = speakeasy.totp.verify({ secret: staff.totpSecret , encoding: 'base32', token: req.body.token })
    if (!valid) return badRequest(res, 'Invalid code')

    await prisma.staffMember.update({ where: { id: staff.id }, data: { twoFactorEnabled: true } })
    return ok(res, { message: '2FA enabled successfully' })
  } catch (err) { serverError(res, err) }
})

export default router
