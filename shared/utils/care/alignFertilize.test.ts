import { describe, expect, it } from 'vitest'
import { alignFertilizeDueAt, idealFertilizeDueAt, isSameCalendarDay } from './alignFertilize'

describe('idealFertilizeDueAt', () => {
  it('adds interval from last fertilized date', () => {
    const last = new Date('2026-01-01T12:00:00Z')
    const ideal = idealFertilizeDueAt(last, 30)
    expect(ideal.toISOString().slice(0, 10)).toBe('2026-01-31')
  })

  it('uses fromDate when never fertilized', () => {
    const from = new Date('2026-03-01T12:00:00Z')
    const ideal = idealFertilizeDueAt(null, 14, from)
    expect(ideal.toISOString().slice(0, 10)).toBe('2026-03-15')
  })
})

describe('alignFertilizeDueAt', () => {
  it('uses next water when it is on or after ideal date', () => {
    const ideal = new Date('2026-05-10T12:00:00Z')
    const water = new Date('2026-05-15T08:00:00Z')
    const aligned = alignFertilizeDueAt(ideal, water, 7)
    expect(aligned.getTime()).toBe(water.getTime())
  })

  it('advances water dates until on or after ideal date', () => {
    const ideal = new Date('2026-05-20T12:00:00Z')
    const water = new Date('2026-05-08T08:00:00Z')
    const aligned = alignFertilizeDueAt(ideal, water, 7)
    expect(aligned.toISOString().slice(0, 10)).toBe('2026-05-22')
  })

  it('returns ideal date when no water schedule exists', () => {
    const ideal = new Date('2026-05-20T12:00:00Z')
    const aligned = alignFertilizeDueAt(ideal, null, 7)
    expect(aligned.getTime()).toBe(ideal.getTime())
  })
})

describe('isSameCalendarDay', () => {
  it('matches same local calendar day', () => {
    expect(isSameCalendarDay('2026-05-16T08:00:00Z', '2026-05-16T20:00:00Z')).toBe(true)
  })
})
