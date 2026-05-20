import type { Placement } from '#shared/types/database'
import { weatherFactorForPlacement } from '#shared/utils/weather/deriveWeatherFactor'
import { fetchOpenMeteoMetrics } from '#shared/utils/weather/fetchOpenMeteoMetrics'

export function usePlantWeatherFactor() {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()

  async function fetchHomeCoords(): Promise<{ lat: number, lon: number } | null> {
    const uid = user.value?.id
    if (!uid) return null
    const { data } = await supabase
      .from('user_settings')
      .select('home_lat, home_lon')
      .eq('user_id', uid)
      .maybeSingle()
    const lat = data?.home_lat != null ? Number(data.home_lat) : null
    const lon = data?.home_lon != null ? Number(data.home_lon) : null
    if (lat == null || lon == null) return null
    return { lat, lon }
  }

  async function weatherFactorForPlant(
    placement: Placement | null | undefined
  ): Promise<number> {
    const coords = await fetchHomeCoords()
    if (!coords) return 1
    const metrics = await fetchOpenMeteoMetrics(coords.lat, coords.lon)
    if (!metrics) return 1
    return weatherFactorForPlacement(metrics, placement)
  }

  return { weatherFactorForPlant, fetchHomeCoords }
}
