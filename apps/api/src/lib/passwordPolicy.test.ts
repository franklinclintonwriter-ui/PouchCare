import { describe, expect, test } from 'vitest'
import {
  PASSWORD_MIN_LENGTH,
  passwordIssue,
  strongPassword,
} from '@/lib/passwordPolicy'

describe('passwordPolicy', () => {
  test('passwordIssue accepts passwords that meet the shared policy', () => {
    expect(passwordIssue('Password1')).toBeNull()
  })

  test('passwordIssue rejects short or weak passwords', () => {
    expect(passwordIssue('Short1')).toBe(`Password must be at least ${PASSWORD_MIN_LENGTH} characters`)
    expect(passwordIssue('password1')).toBe('Password must contain an uppercase letter')
    expect(passwordIssue('PASSWORD1')).toBe('Password must contain a lowercase letter')
    expect(passwordIssue('Password')).toBe('Password must contain a number')
  })

  test('strongPassword reuses the same policy in zod schemas', () => {
    expect(strongPassword.safeParse('Password1').success).toBe(true)

    const invalid = strongPassword.safeParse('weakpass')
    expect(invalid.success).toBe(false)
    if (!invalid.success) {
      expect(invalid.error.issues[0]?.message).toBe('Password must contain an uppercase letter')
    }
  })
})
