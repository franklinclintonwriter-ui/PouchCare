import type { Response } from 'express'
import { Prisma } from '@prisma/client'
import { env } from '@/config/env'

export function ok<T>(res: Response, data: T, meta?: object) {
  return res.json({ success: true, data, ...(meta && { meta }) })
}
export function created<T>(res: Response, data: T, meta?: object) {
  return res.status(201).json({ success: true, data, ...(meta && { meta }) })
}
export function noContent(res: Response) {
  return res.status(204).send()
}
export function paginated<T>(res: Response, data: T[], meta: { total: number; page: number; limit: number; totalPages: number }) {
  return res.json({ success: true, data, meta })
}
export function err(res: Response, message: string, code?: string, status = 400) {
  return res.status(status).json({ success: false, error: message, ...(code && { code }) })
}
export const badRequest   = (res: Response, msg = 'Bad request')          => err(res, msg, 'BAD_REQUEST', 400)
export const unauthorized = (res: Response, msg = 'Unauthorized')         => err(res, msg, 'UNAUTHORIZED', 401)
export const forbidden    = (res: Response, msg = 'Forbidden')            => err(res, msg, 'FORBIDDEN', 403)
export const notFound     = (res: Response, resource = 'Resource')        => err(res, `${resource} not found`, 'NOT_FOUND', 404)
export const conflict     = (res: Response, msg = 'Conflict')             => err(res, msg, 'CONFLICT', 409)
export const serviceUnavailable = (res: Response, msg = 'Service unavailable') =>
  err(res, msg, 'SERVICE_UNAVAILABLE', 503)
export const badGateway = (res: Response, msg = 'Upstream service error') =>
  err(res, msg, 'BAD_GATEWAY', 502)
// Accept unknown for catch(err) blocks
export const serverError  = (res: Response, _err?: unknown) => {
  const base = _err instanceof Error ? _err.message : 'Internal server error'
  const isPrisma = _err instanceof Prisma.PrismaClientKnownRequestError
  const body: Record<string, unknown> = {
    success: false,
    error: base,
    code: 'SERVER_ERROR',
  }
  if (env.NODE_ENV === 'development' && isPrisma) {
    body.prismaCode = _err.code
    if (_err.meta && Object.keys(_err.meta as object).length)
      body.prismaMeta = _err.meta
  }
  return res.status(500).json(body)
}
