import { z } from 'zod'

/**
 * Single source of truth for the set-password policy (create / reset / change).
 * Login is intentionally NOT gated on complexity — it only authenticates an
 * already-stored hash; enforcing complexity there would lock out legacy users.
 */
export const PASSWORD_MIN_LENGTH = 8

/** Returns a human-readable problem with the password, or `null` when it passes. */
export function passwordIssue(pw: string): string | null {
  if (pw.length < PASSWORD_MIN_LENGTH) return `Password must be at least ${PASSWORD_MIN_LENGTH} characters`
  if (!/[a-z]/.test(pw)) return 'Password must contain a lowercase letter'
  if (!/[A-Z]/.test(pw)) return 'Password must contain an uppercase letter'
  if (!/[0-9]/.test(pw)) return 'Password must contain a number'
  return null
}

/** Zod field enforcing the shared policy — use in create/reset/change schemas. */
export const strongPassword = z.string().superRefine((pw, ctx) => {
  const issue = passwordIssue(pw)
  if (issue) ctx.addIssue({ code: z.ZodIssueCode.custom, message: issue })
})
