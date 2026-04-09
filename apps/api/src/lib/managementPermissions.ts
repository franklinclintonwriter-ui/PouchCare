import { SystemRole } from '@prisma/client'
import prisma from '@/lib/prisma'

/** Keys for staff management areas (sidebar + API). Keep in sync with management app `permissionKeys.ts`. */
export const PERMISSION_KEYS = [
  'staff.branches',
  'staff.manage_profiles',
  'payroll.access',
  'finance.access',
  'finance.exchange_rates',
  'crm.client_accounts',
  'hr.recruitment',
  'hr.performance',
  'assets.devices',
  'monitor.view',
  'broadcast.access',
  'analytics.access',
  'admin_portal.access',
  'settings.role_permissions',
] as const

export type PermissionKey = (typeof PERMISSION_KEYS)[number]

const ALL_KEYS = PERMISSION_KEYS as readonly string[]

function defaultForRole(role: SystemRole, key: string): boolean {
  const ops = ['CEO', 'CO_MD', 'OP_MANAGER'].includes(role)
  const hrRecruitment = ['CEO', 'CO_MD', 'OP_MANAGER', 'HR_MANAGER'].includes(role)
  const ceoCoMd = ['CEO', 'CO_MD'].includes(role)

  switch (key) {
    case 'staff.branches':
    case 'payroll.access':
    case 'finance.access':
    case 'finance.exchange_rates':
    case 'crm.client_accounts':
    case 'assets.devices':
    case 'broadcast.access':
    case 'analytics.access':
    case 'admin_portal.access':
      return ops
    case 'monitor.view':
      return role !== 'INTERN'
    case 'hr.recruitment':
    case 'hr.performance':
    case 'staff.manage_profiles':
      return hrRecruitment
    case 'settings.role_permissions':
      return ceoCoMd
    default:
      return false
  }
}

export function buildDefaultMatrix(role: SystemRole): Record<string, boolean> {
  const m: Record<string, boolean> = {}
  for (const k of ALL_KEYS) m[k] = defaultForRole(role, k)
  return m
}

const cache = new Map<SystemRole, Record<string, boolean>>()

export function invalidatePermissionCache(role?: SystemRole) {
  if (role) cache.delete(role)
  else cache.clear()
}

export async function getEffectivePermissions(role: SystemRole): Promise<Record<string, boolean>> {
  const hit = cache.get(role)
  if (hit) return hit

  const base = buildDefaultMatrix(role)
  const overrides = await prisma.rolePermission.findMany({ where: { role } })
  const merged = { ...base }
  for (const o of overrides) {
    if (ALL_KEYS.includes(o.key)) merged[o.key] = o.allowed
  }
  cache.set(role, merged)
  return merged
}

export async function isStaffAllowed(role: SystemRole, key: PermissionKey): Promise<boolean> {
  const m = await getEffectivePermissions(role)
  return m[key] === true
}

const ALL_ROLES: SystemRole[] = [
  'CEO',
  'CO_MD',
  'OP_MANAGER',
  'HR_MANAGER',
  'BRANCH_MANAGER',
  'STAFF',
  'INTERN',
]

export async function getFullPermissionMatrix(): Promise<Record<string, Record<string, boolean>>> {
  const out: Record<string, Record<string, boolean>> = {}
  for (const role of ALL_ROLES) {
    out[role] = { ...(await getEffectivePermissions(role)) }
  }
  return out
}

export { ALL_ROLES as MANAGEMENT_ROLES }
