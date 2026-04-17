import type { Prisma, SystemRole } from '@prisma/client'
import prisma from '@/lib/prisma'

/**
 * CRM row-level rules for management routes.
 * CEO, Co-MD, Ops, HR — full visibility; Branch Manager — scoped (see below).
 */
const GLOBAL_CRM_ROLES: SystemRole[] = ['CEO', 'CO_MD', 'OP_MANAGER', 'HR_MANAGER']

export function isGlobalCrmRole(role: SystemRole): boolean {
  return GLOBAL_CRM_ROLES.includes(role)
}

/** Branch managers: leads they own or are explicitly assigned to (no `branch` on CrmLead). */
export function crmLeadScopeWhere(userId: string, role: SystemRole): Prisma.CrmLeadWhereInput {
  if (GLOBAL_CRM_ROLES.includes(role)) return {}
  if (role === 'BRANCH_MANAGER') {
    return { OR: [{ owner: userId }, { assignedTo: userId }] }
  }
  return {}
}

export function mergeLeadWhere(
  filter: Prisma.CrmLeadWhereInput,
  scope: Prisma.CrmLeadWhereInput,
): Prisma.CrmLeadWhereInput {
  const hasF = filter && Object.keys(filter).length > 0
  const hasS = scope && Object.keys(scope).length > 0
  if (!hasS) return filter
  if (!hasF) return scope
  return { AND: [filter, scope] }
}

export async function salesOrderScopeWhere(
  userId: string,
  role: SystemRole,
): Promise<Prisma.SalesOrderWhereInput> {
  if (GLOBAL_CRM_ROLES.includes(role)) return {}
  if (role === 'BRANCH_MANAGER') {
    const me = await prisma.staffMember.findUnique({
      where: { id: userId },
      select: { branch: true },
    })
    const b = me?.branch?.trim()
    if (!b) return { id: { in: [] } }
    return {
      OR: [{ branch: b }, { assignedTo: userId }],
    }
  }
  return {}
}

export function mergeSalesOrderWhere(
  filter: Prisma.SalesOrderWhereInput,
  scope: Prisma.SalesOrderWhereInput,
): Prisma.SalesOrderWhereInput {
  const hasF = filter && Object.keys(filter).length > 0
  const hasS = scope && Object.keys(scope).length > 0
  if (!hasS) return filter
  if (!hasF) return scope
  return { AND: [filter, scope] }
}

export async function canAccessCrmLead(
  userId: string,
  role: SystemRole,
  leadId: string,
): Promise<boolean> {
  const lead = await prisma.crmLead.findUnique({
    where: { id: leadId },
    select: { id: true, owner: true, assignedTo: true },
  })
  if (!lead) return false
  if (GLOBAL_CRM_ROLES.includes(role)) return true
  if (role === 'BRANCH_MANAGER') {
    return lead.owner === userId || lead.assignedTo === userId
  }
  return true
}

export async function canAccessSalesOrder(
  userId: string,
  role: SystemRole,
  orderId: string,
): Promise<boolean> {
  const order = await prisma.salesOrder.findUnique({
    where: { id: orderId },
    select: { id: true, branch: true, assignedTo: true },
  })
  if (!order) return false
  if (GLOBAL_CRM_ROLES.includes(role)) return true
  if (role === 'BRANCH_MANAGER') {
    const me = await prisma.staffMember.findUnique({
      where: { id: userId },
      select: { branch: true },
    })
    const b = me?.branch?.trim()
    if (!b) return false
    const ob = order.branch?.trim()
    if (ob === b) return true
    if (order.assignedTo === userId) return true
    return false
  }
  return true
}
