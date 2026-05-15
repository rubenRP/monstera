export async function fetchWeatherSummary(lat: number, lon: number): Promise<string> {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    daily: 'temperature_2m_max,temperature_2m_min,precipitation_sum,relative_humidity_2m_mean',
    timezone: 'auto',
    forecast_days: '5'
  })
  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`)
  if (!res.ok) {
    return 'Datos meteorológicos no disponibles.'
  }
  const data = await res.json()
  const daily = data.daily
  if (!daily?.time?.length) {
    return 'Sin datos de pronóstico.'
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
