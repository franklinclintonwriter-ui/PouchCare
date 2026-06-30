import { describe, expect, test } from 'vitest'
import { monthToNumber } from '@/lib/months'

describe('months.monthToNumber', () => {
  test('supports numeric month strings', () => {
    expect(monthToNumber('1')).toBe(1)
    expect(monthToNumber('12')).toBe(12)
  })

  test('supports short and full month names case-insensitively', () => {
    expect(monthToNumber('Jan')).toBe(1)
    expect(monthToNumber('september')).toBe(9)
    expect(monthToNumber('OCTOBER')).toBe(10)
  })

  test('falls back safely to 1 for unknown values', () => {
    expect(monthToNumber('')).toBe(1)
    expect(monthToNumber('unknown')).toBe(1)
    expect(monthToNumber('99')).toBe(1)
  })
})
