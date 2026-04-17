import { Router } from 'express'
import { z } from 'zod'
import { authenticate, isCEO, type AuthRequest } from '@/middleware/auth'
import { validate } from '@/middleware/validate'
import prisma from '@/lib/prisma'
import { ok, serverError, forbidden } from '@/lib/response'
import {
  PERMISSION_KEYS,
  getFullPermissionMatrix,
  invalidatePermissionCache,
  buildDefaultMatrix,
  type PermissionKey,
} from '@/lib/managementPermissions'
import { SystemRole } from '@prisma/client'

const router = Router()

router.use(authenticate, isCEO)

const roleEnum = z.enum([
  'CEO',
  'CO_MD',
  'OP_MANAGER',
  'HR_MANAGER',
  'BRANCH_MANAGER',
  'STAFF',
  'INTERN',
] as [string, ...string[]])

const updateSchema = z.object({
  updates: z.array(
    z.object({
      role: roleEnum,
      key: z.string(),
      allowed: z.boolean(),
    }),
  ),
})

// GET /v1/admin/role-permissions — full matrix (CEO / Co-MD)
router.get('/', async (_req: AuthRequest, res) => {
  try {
    const matrix = await getFullPermissionMatrix()
    const overrides = await prisma.rolePermission.findMany({ orderBy: [{ role: 'asc' }, { key: 'asc' }] })
    return ok(res, { keys: [...PERMISSION_KEYS], matrix, overrides })
  } catch (e) {
    return serverError(res, e)
  }
})

// PUT /v1/admin/role-permissions — apply overrides (only rows that differ from code defaults are stored)
router.put('/', validate(updateSchema), async (req: AuthRequest, res) => {
  try {
    const { updates } = req.body as z.infer<typeof updateSchema>
    for (const u of updates) {
      if (!PERMISSION_KEYS.includes(u.key as PermissionKey)) {
        return forbidden(res, `Unknown permission key: ${u.key}`)
      }
      const defaults = buildDefaultMatrix(u.role as SystemRole)
      await prisma.rolePermission.deleteMany({ where: { role: u.role as SystemRole, key: u.key } })
      if (defaults[u.key] !== u.allowed) {
        await prisma.rolePermission.create({
          data: { role: u.role as SystemRole, key: u.key, allowed: u.allowed },
        })
      }
      invalidatePermissionCache(u.role as SystemRole)
    }
    const matrix = await getFullPermissionMatrix()
    return ok(res, { matrix })
  } catch (e) {
    return serverError(res, e)
  }
})

export default router
