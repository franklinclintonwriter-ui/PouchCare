import path from 'path'
import multer from 'multer'
import sharp from 'sharp'
import { Router } from 'express'
import prisma from '@/lib/prisma'
import { authenticate, requirePortal } from '@/middleware/auth'
import { deleteFile, uploadFile } from '@/lib/storage'
import { badRequest, ok, notFound, serverError } from '@/lib/response'

const router = Router()
router.use(authenticate, requirePortal)

const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
})

async function processAvatarUpload(file: Express.Multer.File) {
  const allowedMime = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const
  if (!allowedMime.includes(file.mimetype as (typeof allowedMime)[number])) {
    throw new Error('Use JPEG, PNG, WebP, or GIF')
  }

  let buffer: Buffer = file.buffer
  let mime = file.mimetype
  let outName = file.originalname || 'photo.jpg'

  if (['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
    try {
      buffer = await sharp(file.buffer)
        .rotate()
        .resize(512, 512, { fit: 'cover', position: sharp.strategy.attention })
        .jpeg({ quality: 88, mozjpeg: true })
        .toBuffer()
      mime = 'image/jpeg'
      outName = `${path.basename(outName, path.extname(outName)) || 'photo'}.jpg`
    } catch {
      throw new Error('Could not process image')
    }
  } else if (file.mimetype === 'image/gif' && file.size > 1024 * 1024) {
    throw new Error('GIF must be under 1MB')
  }

  return { buffer, mime, outName }
}

async function replacePortalAvatar(memberId: string, file: Express.Multer.File) {
  const { buffer, mime, outName } = await processAvatarUpload(file)
  const prev = await prisma.portalMember.findUnique({
    where: { id: memberId },
    select: { avatarUrl: true },
  })

  const result = await uploadFile(buffer, outName, mime, {
    folder: `portal-avatars/${memberId}`,
    allowedTypes: ['image'],
    maxSizeMb: 5,
  })

  const updated = await prisma.portalMember.update({
    where: { id: memberId },
    data: { avatarUrl: result.fileUrl },
    select: { id: true, avatarUrl: true },
  })

  if (prev?.avatarUrl && prev.avatarUrl !== result.fileUrl) {
    await deleteFile(prev.avatarUrl).catch(() => {})
  }

  return updated
}

async function clearPortalAvatar(memberId: string) {
  const row = await prisma.portalMember.findUnique({
    where: { id: memberId },
    select: { avatarUrl: true },
  })
  if (row?.avatarUrl) await deleteFile(row.avatarUrl).catch(() => {})
  await prisma.portalMember.update({
    where: { id: memberId },
    data: { avatarUrl: null },
  })
}

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

// POST /portal/me/avatar
router.post('/avatar', avatarUpload.single('file'), async (req, res) => {
  try {
    const file = req.file
    if (!file) return badRequest(res, 'No file')
    const updated = await replacePortalAvatar(req.user!.id, file)
    return ok(res, updated)
  } catch (err) {
    if (err instanceof Error) return badRequest(res, err.message)
    return serverError(res)
  }
})

// DELETE /portal/me/avatar
router.delete('/avatar', async (req, res) => {
  try {
    await clearPortalAvatar(req.user!.id)
    return ok(res, { avatarUrl: null })
  } catch {
    return serverError(res)
  }
})

export default router
