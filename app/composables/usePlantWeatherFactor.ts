import type { IndoorHumidityLevel, Placement } from '#shared/types/database'
import { resolveWateringClimateFactors } from '#shared/utils/care/resolveWateringClimate'
import { fetchOpenMeteoMetrics } from '#shared/utils/weather/fetchOpenMeteoMetrics'

export function usePlantWeatherFactor() {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()

  async function fetchHomeSettings(): Promise<{
    lat: number
    lon: number
    indoorHumidity: IndoorHumidityLevel
  } | null> {
    const uid = user.value?.id
    if (!uid) return null
    const { data } = await supabase
      .from('user_settings')
      .select('home_lat, home_lon, indoor_humidity')
      .eq('user_id', uid)
      .maybeSingle()
    const lat = data?.home_lat != null ? Number(data.home_lat) : null
    const lon = data?.home_lon != null ? Number(data.home_lon) : null
    if (lat == null || lon == null) return null
    return {
      lat,
      lon,
      indoorHumidity: data?.indoor_humidity ?? 'auto'
    }
  }

  async function climateFactorsForPlant(
    placement: Placement | null | undefined
  ): Promise<{ humidityFactor: number, weatherFactor: number }> {
    const settings = await fetchHomeSettings()
    if (!settings) {
      return { humidityFactor: 1, weatherFactor: 1 }
    }
    const metrics = await fetchOpenMeteoMetrics(settings.lat, settings.lon)
    return resolveWateringClimateFactors({
      placement,
      indoorHumidity: settings.indoorHumidity,
      outdoorHumidityPercent: metrics?.avgHumidity ?? null,
      weatherMetrics: metrics
    })
  }

  /** @deprecated Use climateFactorsForPlant */
  async function weatherFactorForPlant(
    placement: Placement | null | undefined
  ): Promise<number> {
    const { weatherFactor } = await climateFactorsForPlant(placement)
    return weatherFactor
  }

  return { climateFactorsForPlant, weatherFactorForPlant, fetchHomeSettings }
}
