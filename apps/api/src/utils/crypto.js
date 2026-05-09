import crypto from "node:crypto";

/**
 * Generate a 6-digit numeric verification code.
 * @returns {string}
 */
export function generateVerificationCode() {
  return crypto.randomInt(100_000, 999_999).toString();
}

/**
 * Generate a secure random token for password reset.
 * @returns {string}
 */
export function generateResetToken() {
  return crypto.randomBytes(32).toString("hex");
}
