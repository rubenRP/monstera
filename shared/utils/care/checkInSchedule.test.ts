import { describe, expect, it } from 'vitest'
import { idealCheckInDueAt } from './checkInSchedule'

describe('idealCheckInDueAt', () => {
  it('adds interval days from last check-in', () => {
    const last = new Date('2025-01-01T12:00:00Z')
    const due = idealCheckInDueAt(last, 30)
    expect(due.toISOString()).toBe('2025-01-31T12:00:00.000Z')
  })

  it('uses fromDate when no last check-in', () => {
    const from = new Date('2025-03-01T00:00:00Z')
    const due = idealCheckInDueAt(null, 14, from)
    expect(due.toISOString()).toBe('2025-03-15T00:00:00.000Z')
  })
})
