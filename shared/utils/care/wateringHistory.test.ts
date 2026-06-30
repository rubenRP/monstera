import { describe, expect, it } from 'vitest'
import {
  blendIntervalWithHistory,
  daysBetweenWateringCompletions,
  historyBlendWeight,
  medianDaysBetweenWaterings
} from './wateringHistory'

describe('daysBetweenWateringCompletions', () => {
  it('returns empty for fewer than 2 completions', () => {
    expect(daysBetweenWateringCompletions(['2026-01-01T12:00:00Z'])).toEqual([])
    expect(daysBetweenWateringCompletions([])).toEqual([])
  })

  it('computes days between sorted completions', () => {
    const intervals = daysBetweenWateringCompletions([
      '2026-01-10T12:00:00Z',
      '2026-01-01T12:00:00Z',
      '2026-01-20T12:00:00Z'
    ])
    expect(intervals).toEqual([9, 10])
  })
})

describe('medianDaysBetweenWaterings', () => {
  it('returns null when fewer than 3 intervals', () => {
    expect(medianDaysBetweenWaterings([5, 7])).toBeNull()
  })

  it('returns median of 3+ intervals', () => {
    expect(medianDaysBetweenWaterings([5, 7, 9])).toBe(7)
    expect(medianDaysBetweenWaterings([5, 7, 9, 11])).toBe(8)
  })
})

describe('historyBlendWeight', () => {
  it('returns 0 below minimum intervals', () => {
    expect(historyBlendWeight(2)).toBe(0)
  })

  it('scales up to max 0.6', () => {
    expect(historyBlendWeight(3)).toBe(0.15)
    expect(historyBlendWeight(6)).toBe(0.6)
    expect(historyBlendWeight(10)).toBe(0.6)
  })
})

describe('blendIntervalWithHistory', () => {
  it('returns environmental when no history weight', () => {
    expect(blendIntervalWithHistory(10, 5, 2)).toBe(10)
  })

  it('blends toward historical median', () => {
    expect(blendIntervalWithHistory(10, 4, 3)).toBe(9)
  })
})
