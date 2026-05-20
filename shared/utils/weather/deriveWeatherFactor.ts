export interface WeatherMetrics {
  avgTempC: number
  avgHumidity: number
  totalPrecipMm: number
  days: number
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function deriveWeatherFactor(
  metrics: WeatherMetrics,
  options: {
    includeTemperature?: boolean
    includeHumidity?: boolean
    includePrecipitation?: boolean
  } = {}
): number {
  const includeTemperature = options.includeTemperature ?? true
  const includeHumidity = options.includeHumidity ?? true
  const includePrecipitation = options.includePrecipitation ?? true

  const factors: number[] = []

  if (includeTemperature) {
    const minTemp = 8
    const maxTemp = 28
    const tempFactor = clamp(
      1.15 - ((metrics.avgTempC - minTemp) / (maxTemp - minTemp)) * 0.3,
      0.85,
      1.15
    )
    factors.push(tempFactor)
  }

  if (includeHumidity) {
    const minHum = 35
    const maxHum = 75
    const humFactor = clamp(
      0.9 + ((metrics.avgHumidity - minHum) / (maxHum - minHum)) * 0.2,
      0.9,
      1.1
    )
    factors.push(humFactor)
  }

  if (includePrecipitation) {
    const minPrecip = 2
    const maxPrecip = 25
    const precipFactor = clamp(
      0.9 + ((metrics.totalPrecipMm - minPrecip) / (maxPrecip - minPrecip)) * 0.25,
      0.9,
      1.15
    )
    factors.push(precipFactor)
  }

  const raw = factors.length ? factors.reduce((acc, f) => acc * f, 1) : 1
  return clamp(raw, 0.7, 1.3)
}

/** Softens exterior weather factor for indoor plants (partial home climate influence). */
export function softenWeatherFactorForIndoor(factor: number, weight = 0.4): number {
  if (factor === 1) return 1
  return clamp(1 + (factor - 1) * weight, 0.85, 1.15)
}

export function weatherFactorForPlacement(
  metrics: WeatherMetrics,
  placement: 'indoor' | 'outdoor' | 'semi_outdoor' | null | undefined
): number {
  if (!placement || placement === 'indoor') {
    const raw = deriveWeatherFactor(metrics, {
      includeTemperature: true,
      includeHumidity: true,
      includePrecipitation: false
    })
    return softenWeatherFactorForIndoor(raw)
  }
  if (placement === 'semi_outdoor') {
    return deriveWeatherFactor(metrics, {
      includeTemperature: true,
      includeHumidity: true,
      includePrecipitation: false
    })
  }
  return deriveWeatherFactor(metrics)
}
