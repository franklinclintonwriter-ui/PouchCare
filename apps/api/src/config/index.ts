import dotenv from 'dotenv'
dotenv.config()

export const config = {
  port: parseInt(process.env.API_PORT || '8000'),
  nodeEnv: process.env.NODE_ENV || 'development',
  isDev: process.env.NODE_ENV !== 'production',

  // Auth
  jwtSecret: process.env.JWT_SECRET || 'change-me-in-production',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'change-me-refresh',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12'),

  // Database
  databaseUrl: process.env.DATABASE_URL!,
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',

  // Email
  resendApiKey: process.env.RESEND_API_KEY || '',
  emailFrom: process.env.EMAIL_FROM || 'hello@pouchcare.com',

  // App URLs
  apiUrl: process.env.API_URL || 'http://localhost:8000',
  landingUrl: process.env.LANDING_URL || 'http://localhost:5173',
  managementUrl: process.env.MANAGEMENT_URL || 'http://localhost:5174',
  officeUrl: process.env.OFFICE_URL || 'http://localhost:5175',
  /** Client portal UI — same host as marketing (pouchcare.com) in production */
  portalUrl: process.env.PORTAL_URL || process.env.LANDING_URL || 'http://localhost:5173',

  // Business rules
  commissionRate: parseFloat(process.env.COMMISSION_RATE || '0.20'),
  commissionHoldDays: parseInt(process.env.COMMISSION_HOLD_DAYS || '14'),
  minPayoutUsd: parseFloat(process.env.MIN_PAYOUT_USD || '50'),

  // S3
  s3Bucket: process.env.S3_BUCKET || '',
  s3Region: process.env.S3_REGION || 'eu-central-1',
  s3AccessKey: process.env.S3_ACCESS_KEY || '',
  s3SecretKey: process.env.S3_SECRET_KEY || '',
  s3Endpoint: process.env.S3_ENDPOINT || '',
}

export const CORS_ORIGINS = [
  config.landingUrl,
  config.managementUrl,
  config.officeUrl,
  config.portalUrl,
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'https://pouchcare.com',
  'https://www.pouchcare.com',
  'https://pouchcare.com.bd',
  'https://www.pouchcare.com.bd',
  'https://m.pouchcare.com',
  'https://office.pouchcare.com.bd',
]
