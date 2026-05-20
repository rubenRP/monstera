import {
  estimateIndoorComfortHumidityPercent,
  estimateIndoorComfortTempC
} from '#shared/utils/weather/indoorComfort'

export interface PlantHomeWeatherSnapshot {
  outdoorTempLabel: string
  indoorTempLabel: string
  humidityLabel: string
  hasLocation: boolean
}

export function usePlantHomeWeather() {
  const supabase = useSupabaseClient()
  const { requireUserId } = useRequireUserId()
  const { t } = useI18n()

  const snapshot = ref<PlantHomeWeatherSnapshot | null>(null)
  const loading = ref(false)

  function humidityLabelFromPercent(value: number): string {
    if (value >= 60) return t('plants.humidityHigh')
    if (value >= 40) return t('plants.humidityNormal')
    return t('plants.humidityLow')
  }

  async function load() {
    loading.value = true
    const missing = t('plants.missingInfo')
    try {
      let uid: string
      try {
        uid = await requireUserId()
      } catch {
        snapshot.value = null
        return
      }

      const { data } = await supabase
        .from('user_settings')
        .select('home_lat, home_lon')
        .eq('user_id', uid)
        .maybeSingle()

      const lat = data?.home_lat != null ? Number(data.home_lat) : null
      const lon = data?.home_lon != null ? Number(data.home_lon) : null

      if (lat == null || lon == null) {
        snapshot.value = {
          hasLocation: false,
          outdoorTempLabel: missing,
          indoorTempLabel: missing,
          humidityLabel: missing
        }
        return
      }

      const params = new URLSearchParams({
        latitude: String(lat),
        longitude: String(lon),
        current: 'temperature_2m,relative_humidity_2m',
        timezone: 'auto',
        forecast_days: '1'
      })
      const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`)
      if (!res.ok) {
        snapshot.value = {
          hasLocation: true,
          outdoorTempLabel: missing,
          indoorTempLabel: missing,
          humidityLabel: missing
        }
        return
      }

      const json = await res.json() as {
        current?: { temperature_2m?: number, relative_humidity_2m?: number }
      }
      const outdoorTemp = json.current?.temperature_2m
      const outdoorHumidity = json.current?.relative_humidity_2m

      const indoorTemp = estimateIndoorComfortTempC(new Date().getMonth(), lat)
      const indoorHumidity = outdoorHumidity != null
        ? estimateIndoorComfortHumidityPercent(outdoorHumidity)
        : null

      snapshot.value = {
        hasLocation: true,
        outdoorTempLabel: outdoorTemp != null
          ? `${Math.round(outdoorTemp)}°C`
          : missing,
        indoorTempLabel: indoorTemp != null
          ? `${indoorTemp}°C`
          : missing,
        humidityLabel: indoorHumidity != null
          ? t('plants.humidityLevelValue', { level: humidityLabelFromPercent(indoorHumidity) })
          : missing
      }
    } finally {
      loading.value = false
    }
  }

  return { snapshot, loading, load }
}
