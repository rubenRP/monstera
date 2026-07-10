import type { IndoorHumidityLevel, Placement } from '../../types/database'
import {
  deriveWeatherFactor,
  softenWeatherFactorForIndoor,
  type WeatherMetrics
} from '../weather/deriveWeatherFactor'
import { indoorHumidityFactor } from '../weather/resolveIndoorHumidity'

export interface WateringClimateFactors {
  humidityFactor: number
  weatherFactor: number
}

export function resolveWateringClimateFactors(input: {
  placement: Placement | null | undefined
  indoorHumidity: IndoorHumidityLevel
  outdoorHumidityPercent: number | null
  weatherMetrics: WeatherMetrics | null
}): WateringClimateFactors {
  const placement = input.placement ?? 'indoor'

  if (placement === 'outdoor') {
    return {
      humidityFactor: 1,
      weatherFactor: input.weatherMetrics
        ? deriveWeatherFactor(input.weatherMetrics)
        : 1
    }
  }

  if (placement === 'semi_outdoor') {
    return {
      humidityFactor: 1,
      weatherFactor: input.weatherMetrics
        ? deriveWeatherFactor(input.weatherMetrics, {
            includeTemperature: true,
            includeHumidity: true,
            includePrecipitation: false
          })
        : 1
    }
  }

  const humidityFactor = indoorHumidityFactor(
    input.indoorHumidity,
    input.outdoorHumidityPercent
  )
  const weatherFactor = input.weatherMetrics
    ? softenWeatherFactorForIndoor(
        deriveWeatherFactor(input.weatherMetrics, {
          includeTemperature: true,
          includeHumidity: false,
          includePrecipitation: false
        })
      )
    : 1

  return { humidityFactor, weatherFactor }
}
