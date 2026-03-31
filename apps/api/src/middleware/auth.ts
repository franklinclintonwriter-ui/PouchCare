import type { Request, Response, NextFunction } from 'express'
import { verifyAccessToken } from '@/lib/jwt'
import { unauthorized, forbidden } from '@/lib/response'
import { SystemRole } from '@prisma/client'

export interface AuthRequest extends Request {
  user?: { id: string; role: SystemRole; type: 'staff' | 'portal' }
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) return unauthorized(res)
  try {
    const payload = verifyAccessToken(header.slice(7))
    req.user = { id: payload.sub, role: payload.role as SystemRole, type: payload.type }
    next()
  } catch {
    return unauthorized(res, 'Invalid or expired token')
  }
}

export function requireRoles(...roles: SystemRole[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) return unauthorized(res)
    if (!roles.includes(req.user.role)) return forbidden(res, 'Insufficient permissions')
    next()
  }
}

export function requirePortal(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.type !== 'portal') return unauthorized(res, 'Portal access required')
  next()
}

export function requireStaff(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.type !== 'staff') return unauthorized(res, 'Staff access required')
  next()
}

const ROLE = {
  CEO: (SystemRole as any)?.CEO ?? 'CEO',
  CO_MD: (SystemRole as any)?.CO_MD ?? 'CO_MD',
  OP_MANAGER: (SystemRole as any)?.OP_MANAGER ?? 'OP_MANAGER',
  HR_MANAGER: (SystemRole as any)?.HR_MANAGER ?? 'HR_MANAGER',
  BRANCH_MANAGER: (SystemRole as any)?.BRANCH_MANAGER ?? 'BRANCH_MANAGER',
} as const

// Role group helpers — use OP_MANAGER (actual enum value)
export const isCEO     = requireRoles(ROLE.CEO as SystemRole, ROLE.CO_MD as SystemRole)
export const isOps     = requireRoles(ROLE.CEO as SystemRole, ROLE.CO_MD as SystemRole, ROLE.OP_MANAGER as SystemRole)
export const isManager = requireRoles(ROLE.CEO as SystemRole, ROLE.CO_MD as SystemRole, ROLE.OP_MANAGER as SystemRole, ROLE.BRANCH_MANAGER as SystemRole)
export const isHR      = requireRoles(ROLE.CEO as SystemRole, ROLE.CO_MD as SystemRole, ROLE.OP_MANAGER as SystemRole, ROLE.HR_MANAGER as SystemRole)
export const isAnyStaff = requireStaff

// Aliases for compatibility
export const ceoOnly      = isCEO
export const seniorOnly   = isOps
export const managerOnly  = isManager
export const managerAndAbove = isManager
export const portalOnly   = requirePortal

export const MANAGER_ROLES = [ROLE.CEO, ROLE.CO_MD, ROLE.OP_MANAGER, ROLE.HR_MANAGER, ROLE.BRANCH_MANAGER] as SystemRole[]
export const CEO_ROLES     = [ROLE.CEO, ROLE.CO_MD] as SystemRole[]
export const SENIOR_ROLES  = [ROLE.CEO, ROLE.CO_MD, ROLE.OP_MANAGER] as SystemRole[]

// Additional aliases
export const requireAuth = authenticate
export const HR_ROLES   = [ROLE.CEO, ROLE.CO_MD, ROLE.OP_MANAGER, ROLE.HR_MANAGER] as SystemRole[]
