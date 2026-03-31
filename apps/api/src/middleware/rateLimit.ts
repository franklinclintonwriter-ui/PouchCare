import rateLimit from 'express-rate-limit'

export const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests, please slow down' },
})

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many auth attempts' },
})

// Aliases
export const loginRateLimit = authLimiter
export const strictRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { success: false, error: 'Rate limit exceeded' },
})
