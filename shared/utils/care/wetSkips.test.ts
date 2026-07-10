import { describe, expect, it } from 'vitest'
import { countWetSkipsAfter, wetSkipCountSince } from './wetSkips'

describe('wetSkipCountSince', () => {
  const now = new Date('2026-07-10T12:00:00Z')

  it('uses lookback window when plant was never watered', () => {
    const since = wetSkipCountSince(null, now)
    const expected = new Date(now)
    expected.setDate(expected.getDate() - 60)
    expect(since.toISOString()).toBe(expected.toISOString())
  })

  it('uses last watered date when more recent than lookback', () => {
    const since = wetSkipCountSince('2026-07-05T10:00:00Z', now)
    expect(since.toISOString()).toBe('2026-07-05T10:00:00.000Z')
  })

  it('uses lookback when last watering is older than window', () => {
    const since = wetSkipCountSince('2026-01-01T10:00:00Z', now)
    const expected = new Date(now)
    expected.setDate(expected.getDate() - 60)
    expect(since.toISOString()).toBe(expected.toISOString())
  })
})

describe('countWetSkipsAfter', () => {
  const now = new Date('2026-07-10T12:00:00Z')

  it('ignores wet skips before the last watering', () => {
    const count = countWetSkipsAfter(
      [
        '2026-05-17T08:58:32.991Z',
        '2026-05-18T11:36:57.136Z'
      ],
      '2026-07-05T10:00:21.827Z',
      now
    )
    expect(count).toBe(0)
  })

  it('counts wet skips after the last watering', () => {
    const count = countWetSkipsAfter(
      [
        '2026-07-06T08:00:00Z',
        '2026-07-08T08:00:00Z'
      ],
      '2026-07-05T10:00:21.827Z',
      now
    )
    expect(count).toBe(2)
  })
})
