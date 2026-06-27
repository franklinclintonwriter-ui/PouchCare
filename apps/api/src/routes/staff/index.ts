import { Router } from 'express'
import path from 'path'
import multer from 'multer'
// Lazy-load sharp so the server can start even when the native binary is unavailable
const getSharp = async () => (await import('sharp')).default
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { SystemRole } from '@prisma/client'
import prisma from '@/lib/prisma'
import { uploadFile, deleteFile, mapSignedAvatar } from '@/lib/storage'
import { authenticate, requireStaff, requireRoles, HR_ROLES, CEO_ROLES, type AuthRequest } from '@/middleware/auth'
import { validate } from '@/middleware/validate'
import { getPagination, buildMeta } from '@/utils/pagination'
import { ok, created, badRequest, notFound, serverError, forbidden } from '@/utils/response'
import { env } from '@/config/env'
import { getEffectivePermissions } from '@/lib/managementPermissions'
import { canAccessStaffProfileAdmin, canAssignSystemRole } from '@/lib/staffProfileAdmin'
import { staffListWhereWithBranchScope } from '@/lib/staffDirectoryScope'
import { canManagerAccessStaffMember } from '@/lib/teamBranchScope'
import { resolveBranchId, isNonBranchLabel } from '@/lib/branchResolve'
import { staffAdminUpdateSchema } from '@/routes/staff/staffAdminUpdateSchema'
import documentsRouter from '@/routes/staff/documents'

const router = Router()
router.use(authenticate)

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
      const sharp = await getSharp()
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

async function replaceStaffAvatar(staffId: string, file: Express.Multer.File) {
  const { buffer, mime, outName } = await processAvatarUpload(file)

  const prev = await prisma.staffMember.findUnique({
    where: { id: staffId },
    select: { avatarUrl: true },
  })

  const result = await uploadFile(buffer, outName, mime, {
    folder: `avatars/${staffId}`,
    allowedTypes: ['image'],
    maxSizeMb: 5,
  })

  const updated = await prisma.staffMember.update({
    where: { id: staffId },
    data: { avatarUrl: result.fileUrl },
    select: { id: true, avatarUrl: true },
  })

  if (prev?.avatarUrl && prev.avatarUrl !== result.fileUrl) {
    await deleteFile(prev.avatarUrl).catch(() => {})
  }

  return mapSignedAvatar(updated)
}

async function clearStaffAvatar(staffId: string) {
  const row = await prisma.staffMember.findUnique({
    where: { id: staffId },
    select: { avatarUrl: true },
  })
  if (row?.avatarUrl) await deleteFile(row.avatarUrl).catch(() => {})
  await prisma.staffMember.update({
    where: { id: staffId },
    data: { avatarUrl: null },
  })
}

/** Colleague directory — no salary, PII, or HR-only fields. */
const staffMemberLimitedSelect = {
  id: true,
  memberId: true,
  name: true,
  email: true,
  systemRole: true,
  status: true,
  branch: true,
  jobRole: true,
  primarySkill: true,
  phone: true,
  whatsapp: true,
  joinDate: true,
  averageTaskRating: true,
  ceoPerformanceRating: true,
  ceoLastRatedDate: true,
  tasksAssigned: true,
  tasksCompleted: true,
  performanceScore: true,
  avatarUrl: true,
} as const

/** Self or HR — full employment record (no sign-in audit unless admin). */
const staffMemberPersonalSelect = {
  ...staffMemberLimitedSelect,
  preferredCurrency: true,
  email2: true,
  skillLevel: true,
  secondarySkills: true,
  toolsKnown: true,
  yearsExperience: true,
  employmentType: true,
  salary: true,
  country: true,
  address: true,
  nidPassport: true,
  emergencyContact: true,
  terminationDate: true,
  exitReason: true,
  portfolioUrl: true,
  linkedinUrl: true,
  githubUrl: true,
  certifications: true,
  ceoRatingNote: true,
  totalTasksRated: true,
  twoFactorEnabled: true,
} as const

const staffMemberAdminSelect = {
  ...staffMemberPersonalSelect,
  lastLoginAt: true,
  lastLoginIp: true,
} as const

const LIST_SORT_FIELDS = ['createdAt', 'name', 'email', 'joinDate', 'memberId', 'systemRole', 'status'] as const
type ListSortField = (typeof LIST_SORT_FIELDS)[number]

function listOrderBy(sortBy: string | undefined, sortDir: string | undefined): { [key: string]: 'asc' | 'desc' } {
  const dir: 'asc' | 'desc' = sortDir === 'asc' ? 'asc' : 'desc'
  const field = (sortBy || '').trim()
  const allowed = LIST_SORT_FIELDS.includes(field as ListSortField) ? (field as ListSortField) : 'createdAt'
  return { [allowed]: dir }
}

function buildStaffListWhere(query: Record<string, string>): Record<string, unknown> {
  const where: Record<string, unknown> = {}
  const { q, status, role, branch } = query
  if (q) {
    where.OR = [
      { name: { contains: q } },
      { email: { contains: q } },
    ]
  }
  if (status) where.status = status
  if (role) where.systemRole = role
  if (branch) where.branch = branch
  return where
}

const createSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  systemRole: z.nativeEnum(SystemRole),
  branch: z.string().optional(),
  jobRole: z.string().optional(),
  salary: z.number().optional(),
  employmentType: z.string().optional(),
  primarySkill: z.string().optional(),
})

// GET /v1/staff/members/stats — aggregate counts (matches list filters)
router.get('/members/stats', requireStaff, async (req: AuthRequest, res) => {
  try {
    const q = req.query as Record<string, string>
    const baseWhere = buildStaffListWhere(q)
    const { where, forbidden: scopeForbidden } = await staffListWhereWithBranchScope(req, baseWhere, q)
    if (scopeForbidden) return forbidden(res, 'Cannot filter another branch')

    const [total, activeCount, branchRows] = await Promise.all([
      prisma.staffMember.count({ where }),
      prisma.staffMember.count({ where: { ...where, status: 'Active' } }),
      prisma.staffMember.groupBy({
        by: ['branch'],
        where,
      }),
    ])

    const branchCount = branchRows.filter((b) => b.branch != null && String(b.branch).trim() !== '').length

    return ok(res, {
      total,
      active: activeCount,
      inactive: Math.max(0, total - activeCount),
      branchCount,
    })
  } catch (err) {
    return serverError(res, err)
  }
})

// GET /v1/staff/members — register before /members/:id and documents mount
router.get('/members', requireStaff, async (req: AuthRequest, res) => {
  try {
    const { page, limit, skip } = getPagination(req)
    const { sortBy, sortDir } = req.query as Record<string, string>
    const q = req.query as Record<string, string>
    const baseWhere = buildStaffListWhere(q)
    const { where, forbidden: scopeForbidden } = await staffListWhereWithBranchScope(req, baseWhere, q)
    if (scopeForbidden) return forbidden(res, 'Cannot filter another branch')

    const listSalary = await canAccessStaffProfileAdmin(req)
    const orderBy = listOrderBy(sortBy, sortDir)

    const [members, total] = await Promise.all([
      prisma.staffMember.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        select: {
          id: true,
          memberId: true,
          name: true,
          email: true,
          systemRole: true,
          status: true,
          branch: true,
          jobRole: true,
          primarySkill: true,
          joinDate: true,
          ...(listSalary ? { salary: true } : {}),
          averageTaskRating: true,
          ceoPerformanceRating: true,
          tasksCompleted: true,
          phone: true,
          whatsapp: true,
          avatarUrl: true,
        },
      }),
      prisma.staffMember.count({ where }),
    ])
    return ok(res, await Promise.all(members.map((m) => mapSignedAvatar(m))), buildMeta(total, page, limit))
  } catch (err) {
    serverError(res, err)
  }
})

router.use('/members', documentsRouter)

// GET /v1/staff/members/:id — full profile for self/HR; directory view for other colleagues
router.get('/members/:id', requireStaff, async (req: AuthRequest, res) => {
  try {
    const admin = await canAccessStaffProfileAdmin(req)
    const isSelf = req.user!.id === req.params.id

    if (req.user!.role === 'BRANCH_MANAGER' && !admin && !isSelf) {
      const allowed = await canManagerAccessStaffMember(req.user!.id, req.user!.role, req.params.id)
      if (!allowed) return notFound(res)
    }

    const select =
      admin ? staffMemberAdminSelect : isSelf ? staffMemberPersonalSelect : staffMemberLimitedSelect

    const member = await prisma.staffMember.findUnique({
      where: { id: req.params.id },
      select,
    })
    if (!member) return notFound(res)

    if (admin) {
      const rolePermissions = await getEffectivePermissions(member.systemRole)
      return ok(res, {
        ...(await mapSignedAvatar(member)),
        rolePermissions,
        profileAdmin: true,
        profileScope: 'full' as const,
      })
    }
    if (isSelf) {
      return ok(res, { ...(await mapSignedAvatar(member)), profileAdmin: false, profileScope: 'full' as const })
    }
    return ok(res, { ...(await mapSignedAvatar(member)), profileAdmin: false, profileScope: 'limited' as const })
  } catch (err) {
    serverError(res, err)
  }
})

// POST /v1/staff/members
router.post('/members', requireRoles(...HR_ROLES as any), validate(createSchema), async (req, res) => {
  try {
    const { password, branch, ...rest } = req.body
    const exists = await prisma.staffMember.findUnique({ where: { email: rest.email.toLowerCase() } })
    if (exists) return badRequest(res, 'Email already exists')

    const passwordHash = await bcrypt.hash(password, env.BCRYPT_ROUNDS)
    const trimmed = branch?.trim() ?? ''
    const branchId = await resolveBranchId(branch)
    if (trimmed && !branchId && !isNonBranchLabel(trimmed)) return badRequest(res, 'Unknown branch')
    const member = await prisma.staffMember.create({
      data: {
        ...rest,
        email: rest.email.toLowerCase(),
        passwordHash,
        ...(trimmed ? { branch: trimmed } : {}),
        ...(branchId ? { branchId } : {}),
      },
      select: { id: true, memberId: true, name: true, email: true, systemRole: true },
    })
    return created(res, member)
  } catch (err) { serverError(res, err) }
})

// PUT /v1/staff/members/:id — HR / staff.manage_profiles; full whitelisted profile fields
router.put('/members/:id', requireStaff, async (req, res, next) => {
  try {
    if (!(await canAccessStaffProfileAdmin(req))) return forbidden(res, 'Insufficient permissions')
    next()
  } catch (err) { return serverError(res, err) }
}, validate(staffAdminUpdateSchema), async (req: AuthRequest, res) => {
  try {
    const target = await prisma.staffMember.findUnique({ where: { id: req.params.id } })
    if (!target) return notFound(res)

    const data = req.body as z.infer<typeof staffAdminUpdateSchema>
    if (data.systemRole !== undefined && data.systemRole !== target.systemRole) {
      if (!canAssignSystemRole(req.user!.role, data.systemRole)) {
        return badRequest(res, 'You cannot assign this system role')
      }
    }
    if (data.email !== undefined && data.email.toLowerCase() !== target.email) {
      const clash = await prisma.staffMember.findUnique({ where: { email: data.email.toLowerCase() } })
      if (clash) return badRequest(res, 'Email already in use')
    }

    const prismaData: Record<string, unknown> = { ...data }
    if (data.email !== undefined) prismaData.email = data.email.toLowerCase()
    // Keep the branchId FK in sync whenever the advisory branch string changes.
    if (data.branch !== undefined) {
      const trimmed = data.branch.trim()
      const branchId = await resolveBranchId(data.branch)
      // Reject a genuine typo, but allow the "Company — Global" sentinel / blanks
      // (company-wide staff → branchId null, unscoped). branchId stays authoritative.
      if (trimmed && !branchId && !isNonBranchLabel(trimmed)) return badRequest(res, 'Unknown branch')
      prismaData.branchId = branchId
      prismaData.branch = trimmed || null
    }

    const member = await prisma.staffMember.update({
      where: { id: req.params.id },
      data: prismaData as any,
      select: {
        id: true, memberId: true, name: true, email: true, email2: true,
        systemRole: true, status: true, branch: true, jobRole: true,
        primarySkill: true, skillLevel: true, secondarySkills: true,
        toolsKnown: true, yearsExperience: true, employmentType: true,
        salary: true, phone: true, whatsapp: true, country: true,
        address: true, nidPassport: true, emergencyContact: true,
        joinDate: true, terminationDate: true, exitReason: true,
        portfolioUrl: true, linkedinUrl: true, githubUrl: true, certifications: true,
        averageTaskRating: true, ceoPerformanceRating: true, ceoRatingNote: true, ceoLastRatedDate: true,
        tasksAssigned: true, tasksCompleted: true, totalTasksRated: true, performanceScore: true,
        twoFactorEnabled: true, lastLoginAt: true, lastLoginIp: true,
        avatarUrl: true,
      },
    })
    const rolePermissions = await getEffectivePermissions(member.systemRole)

    return ok(res, { ...(await mapSignedAvatar(member)), rolePermissions, profileAdmin: true })
  } catch (err) { serverError(res, err) }
})

// POST /v1/staff/members/:id/avatar — HR / profile admin sets a staff photo
router.post('/members/:id/avatar', requireStaff, async (req, res, next) => {
  try {
    if (!(await canAccessStaffProfileAdmin(req))) return forbidden(res, 'Insufficient permissions')
    next()
  } catch (err) { return serverError(res, err) }
}, avatarUpload.single('file'), async (req: AuthRequest, res) => {
  try {
    const file = req.file
    if (!file) return badRequest(res, 'No file')

    const target = await prisma.staffMember.findUnique({
      where: { id: req.params.id },
      select: { id: true },
    })
    if (!target) return notFound(res)

    const updated = await replaceStaffAvatar(req.params.id, file)
    return ok(res, updated)
  } catch (err) {
    if (err instanceof Error) return badRequest(res, err.message)
    return serverError(res, err)
  }
})

// DELETE /v1/staff/members/:id/avatar — HR / profile admin removes a staff photo
router.delete('/members/:id/avatar', requireStaff, async (req, res) => {
  try {
    if (!(await canAccessStaffProfileAdmin(req))) return forbidden(res, 'Insufficient permissions')
    const target = await prisma.staffMember.findUnique({
      where: { id: req.params.id },
      select: { id: true },
    })
    if (!target) return notFound(res)

    await clearStaffAvatar(req.params.id)
    return ok(res, { avatarUrl: null })
  } catch (err) {
    serverError(res, err)
  }
})

// DELETE /v1/staff/members/:id
router.delete('/members/:id', requireRoles(...CEO_ROLES as any), async (req, res) => {
  try {
    await prisma.staffMember.update({
      where: { id: req.params.id },
      data: { status: 'Inactive', terminationDate: new Date() },
    })
    return ok(res, { message: 'Staff member deactivated' })
  } catch (err) { serverError(res, err) }
})

// GET /v1/staff/me
router.get('/me', requireStaff, async (req, res) => {
  try {
    const row = await prisma.staffMember.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true, memberId: true, name: true, email: true,
        systemRole: true, branch: true, jobRole: true, status: true,
        primarySkill: true, phone: true, whatsapp: true, country: true,
        joinDate: true, salary: true, averageTaskRating: true,
        ceoPerformanceRating: true, portfolioUrl: true,
        twoFactorEnabled: true,
        totpSecret: true,
        preferredCurrency: true,
        avatarUrl: true,
      },
    })
    if (!row) return notFound(res)
    const { totpSecret, ...member } = row
    const permissions = await getEffectivePermissions(member.systemRole)
    const twoFactorPending = Boolean(totpSecret) && !member.twoFactorEnabled
    return ok(res, { ...(await mapSignedAvatar(member)), twoFactorPending, permissions })
  } catch (err) { serverError(res, err) }
})

// PUT /v1/staff/me
router.put('/me', requireStaff, async (req, res) => {
  try {
    const allowed = ['phone', 'whatsapp', 'address', 'country', 'portfolioUrl', 'linkedinUrl', 'githubUrl', 'preferredCurrency'] as const
    const data: Record<string, unknown> = {}
    for (const k of allowed) {
      if (req.body[k] !== undefined) data[k] = req.body[k]
    }

    if (req.body.name !== undefined) {
      const n = String(req.body.name).trim()
      if (n.length < 2 || n.length > 120) return badRequest(res, 'Name must be 2–120 characters')
      data.name = n
    }

    // Validate currency if provided
    if (data.preferredCurrency && !['USD', 'BDT'].includes(String(data.preferredCurrency))) {
      return badRequest(res, 'preferredCurrency must be USD or BDT')
    }

    const member = await prisma.staffMember.update({
      where: { id: req.user!.id },
      data: data as Record<string, unknown>,
      select: { id: true, name: true, phone: true, whatsapp: true, preferredCurrency: true, avatarUrl: true },
    })
    return ok(res, await mapSignedAvatar(member))
  } catch (err) { serverError(res, err) }
})

// POST /v1/staff/me/avatar — profile photo (JPEG/PNG/WebP optimized; GIF kept small)
router.post('/me/avatar', requireStaff, avatarUpload.single('file'), async (req: AuthRequest, res) => {
  try {
    const file = req.file
    if (!file) return badRequest(res, 'No file')
    const updated = await replaceStaffAvatar(req.user!.id, file)
    return ok(res, updated)
  } catch (err) {
    if (err instanceof Error) return badRequest(res, err.message)
    serverError(res, err)
  }
})

// DELETE /v1/staff/me/avatar
router.delete('/me/avatar', requireStaff, async (req: AuthRequest, res) => {
  try {
    await clearStaffAvatar(req.user!.id)
    return ok(res, { avatarUrl: null })
  } catch (err) {
    serverError(res, err)
  }
})

// GET /v1/staff/leaderboard — top 20 by rating
router.get('/leaderboard', async (req, res) => {
  try {
    const top = await prisma.staffMember.findMany({
      where: { averageTaskRating: { not: null } },
      orderBy: { averageTaskRating: 'desc' },
      take: 20,
      select: { id: true, name: true, branch: true, primarySkill: true, averageTaskRating: true, tasksCompleted: true, systemRole: true },
    })
    return ok(res, top)
  } catch { return serverError(res) }
})

// POST /v1/staff/members/:id/rate — CEO / Co-MD rates staff performance
router.post('/members/:id/rate', requireStaff, requireRoles(...CEO_ROLES as any), async (req: AuthRequest, res) => {
  try {
    const { rating, note } = req.body
    if (!rating || rating < 1 || rating > 10) return badRequest(res, 'Rating must be 1–10')
    const member = await prisma.staffMember.update({
      where: { id: req.params.id },
      data: {
        ceoPerformanceRating: Number(rating),
        ceoRatingNote:        note,
        ceoLastRatedDate:     new Date(),
      },
      select: { id: true, name: true, ceoPerformanceRating: true },
    })
    return ok(res, member)
  } catch (err) { return serverError(res, err) }
})

export default router
