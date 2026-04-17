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
  // ── Admin Panel (clients/orders/services unified surface) ──
  'admin.overview.read',
  'admin.clients.read',
  'admin.clients.write',
  'admin.clients.wallet.adjust',
  'admin.clients.merge',
  'admin.orders.read',
  'admin.orders.write',
  'admin.orders.reassign',
  'admin.orders.refund',
  'admin.services.read',
  'admin.services.write',
  'admin.services.publish',
  'admin.services.pricing',
  'admin.billing.read',
  'admin.billing.approve',
  'admin.support.read',
  'admin.support.reply',
  'admin.support.close',
  'admin.assets.read',
  'admin.assets.write',
  'admin.broadcast.write',
  'admin.audit.read',
  'admin.settings.write',
] as const

export type PermissionKey = (typeof PERMISSION_KEYS)[number]

const ALL_KEYS = PERMISSION_KEYS as readonly string[]

function defaultForRole(role: SystemRole, key: string): boolean {
  const ops = ['CEO', 'CO_MD', 'OP_MANAGER'].includes(role)
  const hrRecruitment = ['CEO', 'CO_MD', 'OP_MANAGER', 'HR_MANAGER'].includes(role)
  const ceoCoMd = ['CEO', 'CO_MD'].includes(role)
  const manager = ['CEO', 'CO_MD', 'OP_MANAGER', 'BRANCH_MANAGER', 'HR_MANAGER'].includes(role)

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

    // Admin Panel defaults — read for managers, sensitive writes for CEO/Co-MD/Ops
    case 'admin.overview.read':
    case 'admin.clients.read':
    case 'admin.orders.read':
    case 'admin.services.read':
    case 'admin.billing.read':
    case 'admin.support.read':
    case 'admin.assets.read':
    case 'admin.audit.read':
      return manager
    case 'admin.clients.write':
    case 'admin.orders.write':
    case 'admin.orders.reassign':
    case 'admin.services.write':
    case 'admin.services.publish':
    case 'admin.support.reply':
    case 'admin.support.close':
    case 'admin.assets.write':
    case 'admin.broadcast.write':
      return ops
    case 'admin.clients.wallet.adjust':
    case 'admin.clients.merge':
    case 'admin.orders.refund':
    case 'admin.services.pricing':
    case 'admin.billing.approve':
    case 'admin.settings.write':
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
