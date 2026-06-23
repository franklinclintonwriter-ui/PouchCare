/**
 * SystemAuditLog helper — write one row per admin state-mutating action.
 * Matches the contract in Notion §5.5: actor, action, resource, before/after, ip, ua.
 *
 * Use from any admin route after a successful write:
 *   await audit(req, { action: 'client.merge', resourceKind: 'PortalMember', resourceId: id, before, after, clientId: id })
 */
import type { AuthRequest } from '@/middleware/auth'
import { Prisma } from '@prisma/client'
import prisma from '@/lib/prisma'

export interface AuditPayload {
  action: string                      // e.g. 'client.merge', 'order.advance', 'order.refund'
  resourceKind: string                // e.g. 'PortalMember', 'PortalOrder', 'Service'
  resourceId: string
  clientId?: string                   // persisted to an indexed column for client-scoped audit feeds
  before?: unknown
  after?: unknown
  metadata?: Record<string, unknown>  // optional structured extras
}

function pickIp(req: AuthRequest): string | undefined {
  const fwd = req.headers['x-forwarded-for']
  if (typeof fwd === 'string' && fwd) return fwd.split(',')[0]?.trim()
  return req.ip
}

/** Build the metadata JSON value, or DbNull when there's nothing structured to store. */
function buildMetadata(payload: AuditPayload): Prisma.InputJsonValue | typeof Prisma.DbNull {
  if (payload.metadata) return JSON.parse(JSON.stringify(payload.metadata))
  if (payload.before !== undefined || payload.after !== undefined) {
    return JSON.parse(JSON.stringify({ before: payload.before ?? null, after: payload.after ?? null }))
  }
  return Prisma.DbNull
}

/** Persist an audit entry. Errors are swallowed (logged) so a failed audit never breaks a real write. */
export async function audit(req: AuthRequest, payload: AuditPayload): Promise<void> {
  try {
    await prisma.systemAuditLog.create({
      data: {
        actorId: req.user?.id ?? null,
        actorRole: req.user?.role ? String(req.user.role) : null,
        action: payload.action,
        resourceKind: payload.resourceKind,
        resourceId: payload.resourceId,
        clientId: payload.clientId ?? null,
        ip: pickIp(req) ?? null,
        userAgent: req.headers['user-agent']?.toString().slice(0, 512) ?? null,
        metadata: buildMetadata(payload),
      },
    })
  } catch (err) {
    // Never let audit failures block the calling write.
    // eslint-disable-next-line no-console
    console.warn('[audit] failed to persist audit entry', err)
  }
}

/** Bulk-audit helper for endpoints that mutate N records (e.g. bulk-order). */
export async function auditMany(req: AuthRequest, payloads: AuditPayload[]): Promise<void> {
  for (const p of payloads) await audit(req, p)
}
