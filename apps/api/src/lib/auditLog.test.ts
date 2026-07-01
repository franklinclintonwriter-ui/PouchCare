import { describe, expect, test } from 'vitest'
import { prismaMock } from '@/test/prismaMock'
import { audit } from '@/lib/auditLog'

const LONG_USER_AGENT = 'Browser '.repeat(100)

describe('auditLog', () => {
  test('audit maps payload fields into systemAuditLog.create', async () => {
    prismaMock.systemAuditLog.create.mockResolvedValue({ id: 'audit-1' })

    await audit(
      {
        user: { id: 'staff-1', role: 'CEO' },
        headers: {
          'x-forwarded-for': '203.0.113.10, 10.0.0.1',
          'user-agent': LONG_USER_AGENT,
        },
        ip: '127.0.0.1',
      } as any,
      {
        action: 'client.merge',
        resourceKind: 'PortalMember',
        resourceId: 'client-1',
        clientId: 'client-1',
        metadata: { source: 'vitest', nested: { ok: true } },
      },
    )

    expect(prismaMock.systemAuditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        actorId: 'staff-1',
        actorRole: 'CEO',
        action: 'client.merge',
        resourceKind: 'PortalMember',
        resourceId: 'client-1',
        clientId: 'client-1',
        ip: '203.0.113.10',
        userAgent: LONG_USER_AGENT.slice(0, 512),
        metadata: { source: 'vitest', nested: { ok: true } },
      }),
    })
  })

  test('audit stores before/after metadata when explicit metadata is absent', async () => {
    prismaMock.systemAuditLog.create.mockResolvedValue({ id: 'audit-2' })

    await audit(
      {
        user: null,
        headers: {},
        ip: '127.0.0.1',
      } as any,
      {
        action: 'staff.update',
        resourceKind: 'StaffMember',
        resourceId: 'staff-2',
        before: { status: 'Active' },
        after: { status: 'Suspended' },
      },
    )

    expect(prismaMock.systemAuditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        clientId: null,
        metadata: { before: { status: 'Active' }, after: { status: 'Suspended' } },
      }),
    })
  })
})
