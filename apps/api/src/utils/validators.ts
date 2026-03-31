import { z } from 'zod'

export const paginationSchema = z.object({
  page:  z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(20),
  q:     z.string().optional(),
})

export const uuidParam = z.object({ id: z.string().uuid() })
