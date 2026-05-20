import { describe, expect, it } from 'vitest'
import { defaultPlantAgeUnit, formatPlantAge } from './formatPlantAge'

describe('formatPlantAge', () => {
  const t = (key: string, params?: Record<string, unknown>) => {
    if (key === 'plants.ageValueMonths') return `${params?.count} meses`
    return `${params?.count} años`
  }

  it('formats years', () => {
    expect(formatPlantAge(3, 'years', t)).toBe('3 años')
  })

  it('formats months', () => {
    expect(formatPlantAge(8, 'months', t)).toBe('8 meses')
  })

  it('defaults unit to years', () => {
    expect(defaultPlantAgeUnit(2, null)).toBe('years')
  })
})
