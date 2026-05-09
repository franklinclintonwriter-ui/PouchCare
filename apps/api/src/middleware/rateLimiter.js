/**
 * Simple in-memory rate limiter (no external dependencies).
 * For production, replace with Redis-backed solution.
 */

const stores = new Map();

/**
 * Create a rate limiter middleware.
 * @param {{ windowMs?: number, max?: number, message?: string, keyGenerator?: Function }} opts
 */
export function rateLimit({ windowMs = 15 * 60 * 1000, max = 100, message = "Too many requests, please try again later." } = {}) {
  const store = new Map();

  // Cleanup expired entries every windowMs
  const cleanup = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (now - entry.resetTime > 0) store.delete(key);
    }
  }, windowMs);
  cleanup.unref?.(); // Don't keep process alive for cleanup

  return (req, res, next) => {
    const key = req.ip || req.connection?.remoteAddress || "unknown";
    const now = Date.now();

    let entry = store.get(key);
    if (!entry || now > entry.resetTime) {
      entry = { count: 0, resetTime: now + windowMs };
      store.set(key, entry);
    }

    entry.count++;

    // Set rate limit headers
    res.set("X-RateLimit-Limit", String(max));
    res.set("X-RateLimit-Remaining", String(Math.max(0, max - entry.count)));
    res.set("X-RateLimit-Reset", String(Math.ceil(entry.resetTime / 1000)));

    if (entry.count > max) {
      return res.status(429).json({ error: message });
    }

    next();
  };
}

// Pre-configured limiters
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,                   // 20 attempts per window
  message: "Too many authentication attempts. Please try again in 15 minutes.",
});

export const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,                    // 5 attempts per window
  message: "Too many attempts. Please try again in 15 minutes.",
});

export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,      // 1 minute
  max: 60,                   // 60 requests per minute
  message: "Too many requests. Please slow down.",
});
