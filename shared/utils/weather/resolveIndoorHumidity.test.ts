import { describe, expect, it } from 'vitest'
import {
  humidityFactorFromPercent,
  indoorHumidityFactor,
  resolveIndoorHumidityPercent
} from './resolveIndoorHumidity'

describe('resolveIndoorHumidityPercent', () => {
  it('uses manual levels', () => {
    expect(resolveIndoorHumidityPercent('low', null)).toBe(35)
    expect(resolveIndoorHumidityPercent('normal', null)).toBe(50)
    expect(resolveIndoorHumidityPercent('high', null)).toBe(65)
  })

  it('estimates from outdoor RH in auto mode', () => {
    expect(resolveIndoorHumidityPercent('auto', 80)).toBeGreaterThan(50)
    expect(resolveIndoorHumidityPercent('auto', null)).toBe(50)
  })
})

describe('humidityFactorFromPercent', () => {
  it('shortens interval in dry air', () => {
    expect(humidityFactorFromPercent(35)).toBe(0.88)
  })

  it('lengthens interval in humid air', () => {
    expect(humidityFactorFromPercent(65)).toBe(1.12)
  })

  it('is neutral at 50%', () => {
    expect(humidityFactorFromPercent(50)).toBeCloseTo(1, 2)
  })
})

describe('indoorHumidityFactor', () => {
  it('combines preference and factor curve', () => {
    expect(indoorHumidityFactor('low', null)).toBe(0.88)
    expect(indoorHumidityFactor('high', null)).toBe(1.12)
  })
})
