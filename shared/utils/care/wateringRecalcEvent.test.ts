import { describe, expect, it } from 'vitest'
import { inferPreviousWaterDueAt, wateringRecalcHasChange } from './wateringRecalcEvent'

describe('inferPreviousWaterDueAt', () => {
  it('prefers the pending task due date', () => {
    expect(inferPreviousWaterDueAt({
      pendingDueAt: '2026-06-20T10:00:00Z',
      lastWateredAt: '2026-06-01T10:00:00Z',
      intervalDays: 7
    })).toBe('2026-06-20T10:00:00Z')
  })

  it('infers from last watering and interval when there is no pending task', () => {
    expect(inferPreviousWaterDueAt({
      pendingDueAt: null,
      lastWateredAt: '2026-06-01T10:00:00Z',
      intervalDays: 7
    })).toBe('2026-06-08T10:00:00.000Z')
  })

  it('returns null when there is no pending task and no watering history', () => {
    expect(inferPreviousWaterDueAt({
      pendingDueAt: null,
      lastWateredAt: null,
      intervalDays: 7
    })).toBeNull()
  })
})

describe('wateringRecalcHasChange', () => {
  it('returns false when due date and interval are unchanged', () => {
    expect(wateringRecalcHasChange(
      '2026-06-20T10:00:00Z',
      '2026-06-20T10:00:00Z',
      7,
      7
    )).toBe(false)
  })

  it('returns false when only the due date changes', () => {
    expect(wateringRecalcHasChange(
      '2026-06-20T10:00:00Z',
      '2026-06-27T10:00:00Z',
      7,
      7
    )).toBe(false)
  })

  it('returns true when interval changes', () => {
    expect(wateringRecalcHasChange(
      '2026-06-20T10:00:00Z',
      '2026-06-20T10:00:00Z',
      7,
      9
    )).toBe(true)
  })

  it('returns false when there was no previous due date but interval is unchanged', () => {
    expect(wateringRecalcHasChange(null, '2026-06-27T10:00:00Z', 7, 7)).toBe(false)
  })

  it('returns false when only the due time changes on the same calendar day', () => {
    expect(wateringRecalcHasChange(
      '2026-06-20T08:00:00Z',
      '2026-06-20T20:00:00Z',
      7,
      7
    )).toBe(false)
  })

  it('returns false when interval is unchanged and previous interval was unknown', () => {
    expect(wateringRecalcHasChange(
      '2026-06-20T08:00:00Z',
      '2026-06-20T20:00:00Z',
      null,
      7
    )).toBe(false)
  })
})
