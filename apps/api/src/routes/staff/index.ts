import { Router } from 'express'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'
import { authenticate, requireStaff, requireRoles, MANAGER_ROLES, HR_ROLES, CEO_ROLES, type AuthRequest } from '@/middleware/auth'
import { validate } from '@/middleware/validate'
import { getPagination, buildMeta } from '@/utils/pagination'
import { ok, created, badRequest, notFound, serverError, forbidden } from '@/utils/response'
import { env } from '@/config/env'
import { getEffectivePermissions } from '@/lib/managementPermissions'
import { canAccessStaffProfileAdmin, canAssignSystemRole } from '@/lib/staffProfileAdmin'
import { staffAdminUpdateSchema } from '@/routes/staff/staffAdminUpdateSchema'
import documentsRouter from '@/routes/staff/documents'

const router = Router()
router.use(authenticate)

router.use('/members', documentsRouter)

const createSchema = z.object({
  name:           z.string().min(2),
  email:          z.string().email(),
  password:       z.string().min(8),
  systemRole:     z.string(),
  branch:         z.string().optional(),
  jobRole:        z.string().optional(),
  salary:         z.number().optional(),
  employmentType: z.string().optional(),
  primarySkill:   z.string().optional(),
})

// GET /v1/staff/members
router.get('/members', requireStaff, async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req)
    const { q, status, role, branch } = req.query as Record<string, string>

    const where: any = {}
    if (q) where.OR = [{ name: { contains: q, mode: 'insensitive' } }, { email: { contains: q, mode: 'insensitive' } }]
    if (status) where.status = status
    if (role)   where.systemRole = role
    if (branch) where.branch = branch

    const [members, total] = await Promise.all([
      prisma.staffMember.findMany({
        where, skip, take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, memberId: true, name: true, email: true,
          systemRole: true, status: true, branch: true, jobRole: true,
          primarySkill: true, joinDate: true, salary: true,
          averageTaskRating: true, ceoPerformanceRating: true,
          tasksCompleted: true, phone: true, whatsapp: true,
        },
      }),
      prisma.staffMember.count({ where }),
    ])
    return ok(res, members, buildMeta(total, page, limit))
  } catch (err) { serverError(res, err) }
})

// GET /v1/staff/members/:id — extended fields + rolePermissions when caller can manage profiles
router.get('/members/:id', requireStaff, async (req, res) => {
  try {
    const admin = await canAccessStaffProfileAdmin(req)
    const member = await prisma.staffMember.findUnique({
      where: { id: req.params.id },
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
        twoFactorEnabled: true,
        ...(admin ? { lastLoginAt: true, lastLoginIp: true } : {}),
      },
    })
    if (!member) return notFound(res)
    if (admin) {
      const rolePermissions = await getEffectivePermissions(member.systemRole)
      return ok(res, { ...member, rolePermissions, profileAdmin: true })
    }
    return ok(res, { ...member, profileAdmin: false })
  } catch (err) { serverError(res, err) }
})

// POST /v1/staff/members
router.post('/members', requireRoles(...HR_ROLES as any), validate(createSchema), async (req, res) => {
  try {
    const { password, ...data } = req.body
    const exists = await prisma.staffMember.findUnique({ where: { email: data.email.toLowerCase() } })
    if (exists) return badRequest(res, 'Email already exists')

    const passwordHash = await bcrypt.hash(password, env.BCRYPT_ROUNDS)
    const member = await prisma.staffMember.create({
      data: { ...data, email: data.email.toLowerCase(), passwordHash },
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
      },
    })
    const rolePermissions = await getEffectivePermissions(member.systemRole)
    return ok(res, { ...member, rolePermissions, profileAdmin: true })
  } catch (err) { serverError(res, err) }
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
      },
    })
    if (!row) return notFound(res)
    const { totpSecret, ...member } = row
    const permissions = await getEffectivePermissions(member.systemRole)
    const twoFactorPending = Boolean(totpSecret) && !member.twoFactorEnabled
    return ok(res, { ...member, twoFactorPending, permissions })
  } catch (err) { serverError(res, err) }
})

// PUT /v1/staff/me
router.put('/me', requireStaff, async (req, res) => {
  try {
    const allowed = ['phone', 'whatsapp', 'address', 'country', 'portfolioUrl', 'linkedinUrl', 'githubUrl', 'preferredCurrency']
    const data: Record<string, any> = {}
    allowed.forEach(k => { if (req.body[k] !== undefined) data[k] = req.body[k] })

    // Validate currency if provided
    if (data.preferredCurrency && !['USD', 'BDT'].includes(data.preferredCurrency)) {
      return badRequest(res, 'preferredCurrency must be USD or BDT')
    }

    const member = await prisma.staffMember.update({
      where: { id: req.user!.id },
      data,
      select: { id: true, name: true, phone: true, whatsapp: true, preferredCurrency: true },
    })
    return ok(res, member)
  } catch (err) { serverError(res, err) }
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
