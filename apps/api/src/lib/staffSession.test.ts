import { describe, expect, test, vi } from 'vitest'
import { prismaMock } from '@/test/prismaMock'
import { activeSessionForToken, hashRefreshToken } from '@/lib/staffSession'

describe('staffSession', () => {
  test('hashRefreshToken is deterministic', () => {
    const token = 'refresh-token-value'
    expect(hashRefreshToken(token)).toBe(hashRefreshToken(token))
    expect(hashRefreshToken(token)).toHaveLength(64)
  })

  test('activeSessionForToken returns null for revoked sessions', async () => {
    prismaMock.staffSession.findUnique.mockResolvedValue({
      id: 'session-1',
      staffMemberId: 'staff-1',
      revokedAt: new Date('2026-01-01T00:00:00.000Z'),
      expiresAt: new Date('2026-12-31T00:00:00.000Z'),
    })

    await expect(activeSessionForToken('revoked-token')).resolves.toBeNull()
  })

  test('activeSessionForToken returns null for expired sessions', async () => {
    prismaMock.staffSession.findUnique.mockResolvedValue({
      id: 'session-2',
      staffMemberId: 'staff-1',
      revokedAt: null,
      expiresAt: new Date('2026-01-01T00:00:00.000Z'),
    })
    vi.spyOn(Date, 'now').mockReturnValue(new Date('2026-02-01T00:00:00.000Z').getTime())

    await expect(activeSessionForToken('expired-token')).resolves.toBeNull()
  })
})
