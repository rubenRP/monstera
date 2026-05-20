import { describe, expect, it } from 'vitest'
import {
  estimateIndoorComfortHumidityPercent,
  estimateIndoorComfortTempC
} from './indoorComfort'

describe('estimateIndoorComfortTempC', () => {
  it('uses 22 °C in northern winter (January)', () => {
    expect(estimateIndoorComfortTempC(0, 40)).toBe(22)
  })

  it('uses 25 °C in northern summer (July)', () => {
    expect(estimateIndoorComfortTempC(6, 40)).toBe(25)
  })

  it('inverts seasons for southern hemisphere', () => {
    expect(estimateIndoorComfortTempC(0, -34)).toBe(25)
    expect(estimateIndoorComfortTempC(6, -34)).toBe(22)
  })
})

describe('estimateIndoorComfortHumidityPercent', () => {
  it('pulls extreme outdoor humidity toward mid range', () => {
    expect(estimateIndoorComfortHumidityPercent(90)).toBeLessThan(80)
    expect(estimateIndoorComfortHumidityPercent(20)).toBeGreaterThan(25)
  })
})
