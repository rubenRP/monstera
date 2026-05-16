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
