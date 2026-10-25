import { describe, expect, it } from 'vitest'
import { taskOverdueDays } from './taskDue'

describe('taskOverdueDays', () => {
  it('counts whole calendar days', () => {
    const now = new Date(2026, 5, 10, 18, 0)
    expect(taskOverdueDays(new Date(2026, 5, 10, 9, 0).toISOString(), now)).toBe(0)
    expect(taskOverdueDays(new Date(2026, 5, 8, 23, 0).toISOString(), now)).toBe(2)
    expect(taskOverdueDays(new Date(2026, 5, 13, 1, 0).toISOString(), now)).toBe(-3)
  })

  it('is not off by one across a daylight-saving change', () => {
    // Local dates: in zones with DST one of these spans has 23 or 25 hours per day
    const autumn = new Date(2026, 9, 25, 10, 0)
    expect(taskOverdueDays(new Date(2026, 9, 28, 9, 0).toISOString(), autumn)).toBe(-3)
    const spring = new Date(2026, 2, 28, 10, 0)
    expect(taskOverdueDays(new Date(2026, 2, 30, 9, 0).toISOString(), spring)).toBe(-2)
    expect(taskOverdueDays(new Date(2026, 2, 27, 9, 0).toISOString(), new Date(2026, 2, 30, 9, 0))).toBe(3)
  })
})
