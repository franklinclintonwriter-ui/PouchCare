import crypto from 'crypto'
import prisma from '@/lib/prisma'

/**
 * Staff refresh-token sessions — the revocation layer behind login/refresh/logout.
 * The refresh token is itself a signed JWT; we store only its SHA-256 so a leaked
 * DB row can't be replayed, and look sessions up by that deterministic hash.
 */
export function hashRefreshToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

export async function createStaffSession(opts: {
  staffMemberId: string
  refreshToken: string
  expiresAt: Date
  ip?: string | null
  userAgent?: string | null
}): Promise<void> {
  await prisma.staffSession.create({
    data: {
      staffMemberId: opts.staffMemberId,
      refreshTokenHash: hashRefreshToken(opts.refreshToken),
      expiresAt: opts.expiresAt,
      ip: opts.ip ?? null,
      userAgent: opts.userAgent?.slice(0, 512) ?? null,
    },
  })
}

/** The active (exists, not revoked, not expired) session for a refresh token, else null. */
export async function activeSessionForToken(refreshToken: string) {
  const session = await prisma.staffSession.findUnique({
    where: { refreshTokenHash: hashRefreshToken(refreshToken) },
  })
  if (!session || session.revokedAt) return null
  if (session.expiresAt.getTime() < Date.now()) return null
  return session
}

/** Revoke the session for a specific refresh token (idempotent). Returns rows affected. */
export async function revokeSessionByToken(refreshToken: string): Promise<number> {
  const { count } = await prisma.staffSession.updateMany({
    where: { refreshTokenHash: hashRefreshToken(refreshToken), revokedAt: null },
    data: { revokedAt: new Date() },
  })
  return count
}

/** Revoke every active session for a staff member (logout-all / password change / admin kill). */
export async function revokeAllSessions(staffMemberId: string): Promise<number> {
  const { count } = await prisma.staffSession.updateMany({
    where: { staffMemberId, revokedAt: null },
    data: { revokedAt: new Date() },
  })
  return count
}
