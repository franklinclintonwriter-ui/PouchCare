import { SystemRole } from '@prisma/client'
import { HR_ROLES } from '@/middleware/auth'
import { isStaffAllowed, type PermissionKey } from '@/lib/managementPermissions'
import type { AuthRequest } from '@/middleware/auth'

/** CEO / Co-MD only may assign these roles */
const TOP_ROLES: SystemRole[] = [SystemRole.CEO, SystemRole.CO_MD]

export async function canAccessStaffProfileAdmin(req: AuthRequest): Promise<boolean> {
  if (!req.user || req.user.type !== 'staff') return false
  if (HR_ROLES.includes(req.user.role)) return true
  return isStaffAllowed(req.user.role, 'staff.manage_profiles' as PermissionKey)
}

/** Whether actor may set target's systemRole to `next`. */
export function canAssignSystemRole(actor: SystemRole, next: SystemRole): boolean {
  if (TOP_ROLES.includes(next)) return TOP_ROLES.includes(actor)
  return HR_ROLES.includes(actor)
}
