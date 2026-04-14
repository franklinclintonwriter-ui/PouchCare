import type { Request, Response, NextFunction } from 'express'
import { forbidden } from '@/lib/response'

export function ipWhitelist(req: Request, res: Response, next: NextFunction) {
  const enabled = process.env.IP_WHITELIST_ENABLED === 'true'
  if (!enabled) return next()
  const clientIp = req.ip || req.socket.remoteAddress || ''
  const allowedList = (process.env.IP_WHITELIST || '127.0.0.1,::1').split(',').map((ip: string) => ip.trim())
  const isAllowed = allowedList.some((ip: string) => clientIp.includes(ip))
  if (!isAllowed) return forbidden(res, 'IP not whitelisted')
  next()
}
