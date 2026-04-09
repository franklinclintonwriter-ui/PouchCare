import { z } from 'zod'

export const vigiUpsertSchema = z.object({
  host: z.string().trim().min(1).max(253),
  port: z.coerce.number().int().min(1).max(65535).optional().default(20443),
  username: z.string().trim().min(1).max(128).default('admin'),
  /** Required when creating a new integration; omit to keep stored password. */
  password: z.string().min(1).max(256).optional(),
  tlsAllowInsecure: z.boolean().optional(),
  enabled: z.boolean().optional(),
})

export const vigiTestBodySchema = z.object({
  host: z.string().trim().min(1).max(253),
  port: z.coerce.number().int().min(1).max(65535).optional().default(20443),
  username: z.string().trim().min(1).max(128).default('admin'),
  password: z.string().min(1).max(256),
  tlsAllowInsecure: z.boolean().optional(),
})
