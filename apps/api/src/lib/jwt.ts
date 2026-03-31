import jwt from 'jsonwebtoken'
import { env } from '@/config/env'
import { SystemRole } from '@prisma/client'

export interface TokenPayload {
  sub:  string
  role: SystemRole | string
  type: 'staff' | 'portal'
  iat?: number
  exp?: number
}

export function signAccess(payload: Omit<TokenPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN } as any)
}
// Aliases
export const signAccessToken  = signAccess
export const signRefreshToken = signRefresh

export function signRefresh(payload: Omit<TokenPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: env.JWT_REFRESH_EXPIRES_IN } as any)
}

export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, env.JWT_SECRET) as TokenPayload
}
export const verifyAccess       = verifyAccessToken

export function verifyRefresh(token: string): TokenPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as TokenPayload
}
export const verifyRefreshToken = verifyRefresh
