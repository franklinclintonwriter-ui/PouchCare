import type { Request, Response, NextFunction } from 'express'
import type { ZodSchema } from 'zod'
import { err } from '@/lib/response'

export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body)
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors
      return res.status(400).json({ success: false, error: 'Validation failed', errors, code: 'VALIDATION_ERROR' })
    }
    req.body = result.data
    next()
  }
}
