import { beforeEach, vi } from 'vitest'
import { prismaMock } from '@/test/prismaMock'

vi.mock('@/lib/prisma', () => ({
  default: prismaMock,
  prisma: prismaMock,
}))

beforeEach(() => {
  vi.clearAllMocks()
})
