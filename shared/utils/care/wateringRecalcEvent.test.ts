import { describe, expect, it } from 'vitest'
import { wateringRecalcHasChange } from './wateringRecalcEvent'

describe('wateringRecalcHasChange', () => {
  it('returns false when due date and interval are unchanged', () => {
    expect(wateringRecalcHasChange(
      '2026-06-20T10:00:00Z',
      '2026-06-20T10:00:00Z',
      7,
      7
    )).toBe(false)
  })

  it('returns true when due date changes', () => {
    expect(wateringRecalcHasChange(
      '2026-06-20T10:00:00Z',
      '2026-06-27T10:00:00Z',
      7,
      7
    )).toBe(true)
  })

  it('returns true when interval changes', () => {
    expect(wateringRecalcHasChange(
      '2026-06-20T10:00:00Z',
      '2026-06-20T10:00:00Z',
      7,
      9
    )).toBe(true)
  })

  it('returns true when there was no previous due date', () => {
    expect(wateringRecalcHasChange(null, '2026-06-27T10:00:00Z', 7, 7)).toBe(true)
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
