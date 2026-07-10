import { isIndoorPlant } from '#shared/utils/care/plantPlacement'
import type { IndoorHumidityLevel, Plant } from '#shared/types/database'
import {
  buildWateringRecalcContexts,
  loadWetSkipCounts,
  runWateringRecalcBatch,
  type WateringRecalcUserSettings
} from '../../utils/care/runWateringRecalcBatch'

const LOG_PREFIX = '[cron:recalculate-watering-indoor]'

function settingsMapFromRows(
  rows: {
    user_id: string
    home_lat: number | null
    home_lon: number | null
    indoor_humidity?: IndoorHumidityLevel | null
  }[]
): Map<string, WateringRecalcUserSettings> {
  return new Map(
    rows.map(row => [
      row.user_id,
      {
        homeLat: row.home_lat != null ? Number(row.home_lat) : null,
        homeLon: row.home_lon != null ? Number(row.home_lon) : null,
        indoorHumidity: row.indoor_humidity ?? 'auto'
      }
    ])
  )
}

export default defineEventHandler(async (event) => {
  assertCronAuthorized(event)

  const startedAt = new Date().toISOString()
  console.log(LOG_PREFIX, JSON.stringify({ event: 'start', startedAt }))

  const config = useRuntimeConfig()
  const supabase = getServiceSupabase()

  const { data: plants, error: plantError } = await supabase
    .from('plants')
    .select('*, site:sites(*)')
    .is('archived_at', null)
  if (plantError) throw plantError

  const indoorPlants = (plants ?? []).filter(plant => isIndoorPlant(plant as Plant))

  if (!indoorPlants.length) {
    const summary = { updated: 0, skipped: 0, errors: 0, plants: 0 }
    console.log(LOG_PREFIX, JSON.stringify({ event: 'finish', startedAt, ...summary }))
    return summary
  }

  const userIds = [...new Set(indoorPlants.map(plant => plant.user_id))]
  const { data: settingsRows, error: settingsError } = await supabase
    .from('user_settings')
    .select('user_id, home_lat, home_lon, indoor_humidity')
    .in('user_id', userIds)
  if (settingsError) throw settingsError

  const settingsByUserId = settingsMapFromRows(settingsRows ?? [])
  const wetSkipCounts = await loadWetSkipCounts(supabase, indoorPlants)
  const plantContextById = await buildWateringRecalcContexts(indoorPlants, settingsByUserId)

  const batchResult = await runWateringRecalcBatch({
    plants: indoorPlants as Plant[],
    plantContextById,
    wetSkipCounts,
    source: 'cron_indoor',
    supabase,
    perenualApiKey: config.perenualApiKey,
    allowCursor: false
  })

  const summary = {
    updated: batchResult.updated,
    skipped: batchResult.skipped,
    errors: batchResult.errors,
    plants: indoorPlants.length
  }
  console.log(LOG_PREFIX, JSON.stringify({ event: 'finish', startedAt, ...summary }))

  return summary
})
