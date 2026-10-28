import { describe, expect, it } from 'vitest'
import { postponedDueAt } from './postpone'

const now = new Date('2026-10-25T18:00:00.000Z')

describe('postponedDueAt', () => {
  it('adds days to a task due today or later', () => {
    expect(postponedDueAt('2026-10-25T09:00:00.000Z', 2, now).slice(0, 10)).toBe('2026-10-27')
    expect(postponedDueAt('2026-10-30T09:00:00.000Z', 1, now).slice(0, 10)).toBe('2026-10-31')
  })

  it('counts from today for overdue tasks', () => {
    expect(postponedDueAt('2026-10-20T09:00:00.000Z', 1, now).slice(0, 10)).toBe('2026-10-26')
  })
})
