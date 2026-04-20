import jwt from 'jsonwebtoken'
import { env } from '@/config/env'
import { SystemRole } from '@prisma/client'
import { getSystemSetting } from './systemConfig'

export interface TokenPayload {
  sub:  string
  role: SystemRole | string
  type: 'staff' | 'portal'
  iat?: number
  exp?: number
}

function normalizeSessionMinutes(raw: unknown): number {
  const n = typeof raw === 'number' ? raw : Number(raw)
  if (!Number.isFinite(n) || n < 1) return 120
  return Math.min(24 * 60, Math.max(1, Math.floor(n)))
}

export async function signAccess(payload: Omit<TokenPayload, 'iat' | 'exp'>): Promise<string> {
  const minutes = normalizeSessionMinutes(await getSystemSetting('session_timeout', 120))
  try {
    return jwt.sign(payload, env.JWT_SECRET, { expiresIn: `${minutes}m` } as jwt.SignOptions)
  } catch (e) {
    console.error('[signAccess] jwt.sign failed, falling back to 120m:', e)
    return jwt.sign(payload, env.JWT_SECRET, { expiresIn: '120m' } as jwt.SignOptions)
  }
}
// Aliases
export const signAccessToken  = signAccess
export const signRefreshToken = signRefresh

export function signRefresh(payload: Omit<TokenPayload, 'iat' | 'exp'>): string {
  return jwt.sign(
    payload,
    env.JWT_REFRESH_SECRET,
    { expiresIn: env.JWT_REFRESH_EXPIRES_IN } as jwt.SignOptions,
  )
}

export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, env.JWT_SECRET) as TokenPayload
}
export const verifyAccess       = verifyAccessToken

export function verifyRefresh(token: string): TokenPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as TokenPayload
}
export const verifyRefreshToken = verifyRefresh
