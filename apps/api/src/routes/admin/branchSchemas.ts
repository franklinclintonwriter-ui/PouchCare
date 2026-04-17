import { z } from 'zod'

/** Allowed fields for creating a branch (no arbitrary Prisma keys). */
export const branchCreateSchema = z.object({
  name: z.string().trim().min(1).max(200),
  country: z.string().trim().max(120).optional(),
  city: z.string().trim().max(120).optional(),
  type: z.string().trim().max(80).optional(),
  status: z.string().trim().max(50).optional(),
  branchManager: z.string().trim().max(200).optional(),
  email: z.string().trim().max(255).optional(),
  phone: z.string().trim().max(120).optional(),
  address: z.string().trim().max(500).optional(),
  notes: z.string().trim().max(5000).optional(),
  establishedDate: z.coerce.date().optional(),
})

export const branchUpdateSchema = branchCreateSchema
  .partial()
  .refine((d) => Object.keys(d).length > 0, { message: 'At least one field is required' })
