export interface PlantHomeWeatherSnapshot {
  outdoorTempLabel: string
  humidityLabel: string
  hasLocation: boolean
}

export function usePlantHomeWeather() {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()
  const { t } = useI18n()

  const snapshot = ref<PlantHomeWeatherSnapshot | null>(null)
  const loading = ref(false)

  async function load() {
    const uid = user.value?.id
    if (!uid) {
      snapshot.value = null
      return
    }
    loading.value = true
    try {
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
          outdoorTempLabel: t('plants.missingInfo'),
          humidityLabel: t('plants.missingInfo')
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
          outdoorTempLabel: t('plants.missingInfo'),
          humidityLabel: t('plants.missingInfo')
        }
        return
      }

      const json = await res.json() as {
        current?: { temperature_2m?: number, relative_humidity_2m?: number }
      }
      const temp = json.current?.temperature_2m
      const humidity = json.current?.relative_humidity_2m

      snapshot.value = {
        hasLocation: true,
        outdoorTempLabel: temp != null
          ? `${Math.round(temp)}°C`
          : t('plants.missingInfo'),
        humidityLabel: humidity != null
          ? t('plants.humidityLevelValue', { level: humidityLabelFromPercent(humidity) })
          : t('plants.missingInfo')
      }
    } finally {
      loading.value = false
    }
  }

  function humidityLabelFromPercent(value: number): string {
    if (value >= 60) return t('plants.humidityHigh')
    if (value >= 40) return t('plants.humidityNormal')
    return t('plants.humidityLow')
  }

  return { snapshot, loading, load }
}
