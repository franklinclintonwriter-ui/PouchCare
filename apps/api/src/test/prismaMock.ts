import { vi } from 'vitest'

export const prismaMock = {
  branch: {
    findUnique: vi.fn(),
  },
  rolePermission: {
    findMany: vi.fn(),
  },
  staffMember: {
    findUnique: vi.fn(),
  },
  staffSession: {
    create: vi.fn(),
    findUnique: vi.fn(),
    updateMany: vi.fn(),
  },
  systemAuditLog: {
    create: vi.fn(),
  },
}
