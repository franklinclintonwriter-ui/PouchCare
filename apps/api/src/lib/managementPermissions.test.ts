import { beforeEach, describe, expect, test } from 'vitest'
import { prismaMock } from '@/test/prismaMock'
import {
  invalidatePermissionCache,
  isStaffAllowed,
} from '@/lib/managementPermissions'

describe('managementPermissions', () => {
  beforeEach(() => {
    invalidatePermissionCache()
    prismaMock.rolePermission.findMany.mockResolvedValue([])
  })

  test('isStaffAllowed returns the default matrix for CEO role', async () => {
    await expect(isStaffAllowed('CEO', 'admin.settings.write')).resolves.toBe(true)
    await expect(isStaffAllowed('CEO', 'payroll.access')).resolves.toBe(true)
  })

  test('isStaffAllowed denies keys outside the staff default matrix', async () => {
    await expect(isStaffAllowed('STAFF', 'admin.overview.read')).resolves.toBe(false)
    await expect(isStaffAllowed('STAFF', 'settings.role_permissions')).resolves.toBe(false)
  })
})
