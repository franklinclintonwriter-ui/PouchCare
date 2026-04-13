import { z } from 'zod'

const schema = z.object({
  NODE_ENV:          z.enum(['development', 'production', 'test']).default('development'),
  PORT:              z.coerce.number().default(7000),
  DATABASE_URL:      z.string().min(1),
  REDIS_URL:         z.string().default('redis://localhost:6379'),
  JWT_SECRET:        z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_EXPIRES_IN:    z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  BCRYPT_ROUNDS:     z.coerce.number().default(12),
  RESEND_API_KEY:    z.string().default(''),
  EMAIL_FROM:        z.string().default('hello@pouchcare.com'),
  S3_BUCKET:         z.string().default(''),
  S3_REGION:         z.string().default('eu-central-1'),
  /** AWS-style names (either pair works; R2 dashboard often shows *_ID / *_ACCESS_KEY). */
  S3_ACCESS_KEY:     z.string().default(''),
  S3_SECRET_KEY:     z.string().default(''),
  S3_ACCESS_KEY_ID:  z.string().default(''),
  S3_SECRET_ACCESS_KEY: z.string().default(''),
  S3_ENDPOINT:       z.string().default(''),
  /** Public base URL of this API (used for local disk upload URLs; set in production). */
  API_URL:             z.string().default('http://localhost:7000'),
  ALLOWED_ORIGINS:   z.string().default('http://localhost:3000,http://localhost:5173,http://localhost:5174,http://localhost:5175,http://localhost:5176'),
  COMMISSION_RATE:   z.coerce.number().default(0.20),
  COMMISSION_HOLD_DAYS: z.coerce.number().default(14),
  MIN_PAYOUT_USD:    z.coerce.number().default(50),
  DEFAULT_USD_TO_BDT: z.coerce.number().default(124),
  FRONTEND_URL:      z.string().default('http://localhost:5173'),
  /** Base URL for client portal (verify email, reset password links). */
  PORTAL_URL:        z.string().default('http://localhost:5176'),
  IP_WHITELIST_ENABLED: z.string().default('false'),
  IP_WHITELIST:         z.string().default('127.0.0.1,::1'),
  /**
   * When true (non-production only), allow storing uploads on local disk under ./uploads
   * instead of Cloudflare R2. Production always requires R2.
   */
  STORAGE_LOCAL_FALLBACK: z.enum(['true', 'false']).default('false'),
})

function parseEnv() {
  const result = schema.safeParse(process.env)
  if (!result.success) {
    console.error('❌ Invalid environment variables:')
    console.error(result.error.flatten().fieldErrors)
    process.exit(1)
  }
  return result.data
}

export const env = parseEnv()
