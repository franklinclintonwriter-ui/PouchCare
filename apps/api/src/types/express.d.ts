import { SystemRole } from '@prisma/client'

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string
        role: SystemRole
        type: 'staff' | 'portal'
      }
    }
  }
}
export {}
