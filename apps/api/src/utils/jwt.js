import jwt from "jsonwebtoken";

const DEFAULT_SECRET = "dev-secret-change-me";
const SECRET = process.env.JWT_SECRET || DEFAULT_SECRET;
const EXPIRES = process.env.JWT_EXPIRES_IN || "7d";

// Refuse to run with default secret in production
if (process.env.NODE_ENV === "production" && SECRET === DEFAULT_SECRET) {
  console.error("[FATAL] JWT_SECRET is not set. Refusing to start in production with default secret.");
  process.exit(1);
}

/**
 * Sign a JWT for a given user.
 * @param {{ id: string, email: string, plan: string, role?: string }} user
 * @returns {string}
 */
export function signToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, plan: user.plan, role: user.role || "customer" },
    SECRET,
    { expiresIn: EXPIRES }
  );
}

/**
 * Verify and decode a JWT.
 * @param {string} token
 * @returns {{ sub: string, email: string, plan: string, role: string, iat: number, exp: number }}
 */
export function verifyToken(token) {
  return jwt.verify(token, SECRET);
}
