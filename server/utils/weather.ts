import type { AppLocale } from '#shared/utils/i18n/locale'
import { translate } from '#shared/utils/i18n/translate'

export async function fetchWeatherSummary(
  lat: number,
  lon: number,
  locale: AppLocale = 'es'
): Promise<string> {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    daily: 'temperature_2m_max,temperature_2m_min,precipitation_sum,relative_humidity_2m_mean',
    timezone: 'auto',
    forecast_days: '5'
  })
  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`)
  if (!res.ok) {
    return translate(locale, 'errors.api.weather.unavailable')
  }
  const data = await res.json()
  const daily = data.daily
  if (!daily?.time?.length) {
    return translate(locale, 'errors.api.weather.noForecast')
  }
  const lines: string[] = []
  for (let i = 0; i < Math.min(5, daily.time.length); i++) {
    lines.push(
      `${daily.time[i]}: max ${daily.temperature_2m_max[i]}°C, min ${daily.temperature_2m_min[i]}°C, `
      + `lluvia ${daily.precipitation_sum[i]} mm, humedad ${daily.relative_humidity_2m_mean[i]}%`
    )
  }
  return lines.join('\n')
}

export interface WeatherMetrics {
  avgTempC: number
  avgHumidity: number
  totalPrecipMm: number
  days: number
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export async function fetchWeatherMetrics(
  lat: number,
  lon: number
): Promise<WeatherMetrics | null> {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    daily: 'temperature_2m_max,temperature_2m_min,precipitation_sum,relative_humidity_2m_mean',
    timezone: 'auto',
    forecast_days: '5'
  })
  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`)
  if (!res.ok) return null
  const data = await res.json()
  const daily = data.daily
  if (!daily?.time?.length) return null

  const days = Math.min(5, daily.time.length)
  let tempSum = 0
  let humiditySum = 0
  let precipSum = 0

  for (let i = 0; i < days; i++) {
    const max = Number(daily.temperature_2m_max[i])
    const min = Number(daily.temperature_2m_min[i])
    const meanTemp = (max + min) / 2
    tempSum += meanTemp
    humiditySum += Number(daily.relative_humidity_2m_mean[i])
    precipSum += Number(daily.precipitation_sum[i])
  }

  return {
    avgTempC: tempSum / days,
    avgHumidity: humiditySum / days,
    totalPrecipMm: precipSum,
    days
  }
}

export function deriveWeatherFactor(
  metrics: WeatherMetrics,
  options: {
    includeTemperature?: boolean
    includeHumidity?: boolean
    includePrecipitation?: boolean
  }
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

  const raw = factors.reduce((acc, f) => acc * f, 1)
  return clamp(raw, 0.7, 1.3)
}
