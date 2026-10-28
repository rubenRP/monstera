import { describe, expect, it } from 'vitest'
import { DEFAULT_FERTILIZE_DAYS, suggestFertilizeDays } from './fertilizeDefault'

describe('suggestFertilizeDays', () => {
  it('maps Perenual watering categories', () => {
    expect(suggestFertilizeDays('Frequent')).toBe(14)
    expect(suggestFertilizeDays('Average')).toBe(DEFAULT_FERTILIZE_DAYS)
    expect(suggestFertilizeDays('Minimum')).toBe(60)
    expect(suggestFertilizeDays(null)).toBe(DEFAULT_FERTILIZE_DAYS)
  })
})
