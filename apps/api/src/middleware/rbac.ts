import type { Response, NextFunction } from 'express'
import type { AuthRequest } from '@/middleware/auth'
import { forbidden, unauthorized, serverError } from '@/lib/response'
import { isStaffAllowed, type PermissionKey } from '@/lib/managementPermissions'

export function requirePermission(key: PermissionKey) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) return unauthorized(res)
    if (req.user.type !== 'staff') return forbidden(res, 'Staff access required')
    try {
      const allowed = await isStaffAllowed(req.user.role, key)
      if (!allowed) return forbidden(res, 'Insufficient permissions')
      next()
    } catch (e) {
      return serverError(res, e)
    }
  }
}
