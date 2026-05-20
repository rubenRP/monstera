import type { WeatherMetrics } from './deriveWeatherFactor'

export async function fetchOpenMeteoMetrics(
  lat: number,
  lon: number,
  forecastDays = 5
): Promise<WeatherMetrics | null> {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    daily: 'temperature_2m_max,temperature_2m_min,precipitation_sum,relative_humidity_2m_mean',
    timezone: 'auto',
    forecast_days: String(forecastDays)
  })
  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`)
  if (!res.ok) return null
  const data = await res.json() as {
    daily?: {
      time?: string[]
      temperature_2m_max?: number[]
      temperature_2m_min?: number[]
      precipitation_sum?: number[]
      relative_humidity_2m_mean?: number[]
    }
  }
  const daily = data.daily
  if (!daily?.time?.length) return null

  const days = Math.min(forecastDays, daily.time.length)
  let tempSum = 0
  let humiditySum = 0
  let precipSum = 0

  for (let i = 0; i < days; i++) {
    const max = Number(daily.temperature_2m_max?.[i])
    const min = Number(daily.temperature_2m_min?.[i])
    const meanTemp = (max + min) / 2
    tempSum += meanTemp
    humiditySum += Number(daily.relative_humidity_2m_mean?.[i])
    precipSum += Number(daily.precipitation_sum?.[i])
  }

  return {
    avgTempC: tempSum / days,
    avgHumidity: humiditySum / days,
    totalPrecipMm: precipSum,
    days
  }
}
