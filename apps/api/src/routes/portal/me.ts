import { Router } from 'express'
import prisma from '@/lib/prisma'
import { authenticate, requirePortal } from '@/middleware/auth'
import { ok, notFound, serverError } from '@/lib/response'

const router = Router()
router.use(authenticate, requirePortal)

// GET /portal/me
router.get('/', async (req, res) => {
  try {
    const m = await prisma.portalMember.findUnique({ where: { id: req.user!.id } })
    if (!m) return notFound(res)
    const { passwordHash, emailVerifyToken, resetPasswordToken, refreshToken, ...safe } = m
    return ok(res, safe)
  } catch { return serverError(res) }
})

// PUT /portal/me
router.put('/', async (req, res) => {
  try {
    const { fullName, phone, whatsapp, country } = req.body
    const m = await prisma.portalMember.update({ where: { id: req.user!.id }, data: { fullName, phone, whatsapp, country } })
    const { passwordHash, emailVerifyToken, resetPasswordToken, refreshToken, ...safe } = m
    return ok(res, safe)
  } catch { return serverError(res) }
})

export default router
