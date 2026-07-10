import { describe, expect, it } from 'vitest'
import { resolveWateringClimateFactors } from './resolveWateringClimate'

const metrics = {
  avgTempC: 22,
  avgHumidity: 40,
  totalPrecipMm: 10,
  days: 7
}

describe('resolveWateringClimateFactors', () => {
  it('uses indoor humidity settings for indoor plants', () => {
    const result = resolveWateringClimateFactors({
      placement: 'indoor',
      indoorHumidity: 'low',
      outdoorHumidityPercent: 60,
      weatherMetrics: metrics
    })
    expect(result.humidityFactor).toBe(0.88)
    expect(result.weatherFactor).not.toBe(1)
  })

  it('ignores manual humidity for outdoor plants', () => {
    const result = resolveWateringClimateFactors({
      placement: 'outdoor',
      indoorHumidity: 'low',
      outdoorHumidityPercent: 60,
      weatherMetrics: metrics
    })
    expect(result.humidityFactor).toBe(1)
    expect(result.weatherFactor).not.toBe(1)
  })

  it('uses weather humidity for semi-outdoor', () => {
    const result = resolveWateringClimateFactors({
      placement: 'semi_outdoor',
      indoorHumidity: 'high',
      outdoorHumidityPercent: 60,
      weatherMetrics: metrics
    })
    expect(result.humidityFactor).toBe(1)
    expect(result.weatherFactor).not.toBe(1)
  })
})
