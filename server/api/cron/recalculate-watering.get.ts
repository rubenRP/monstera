import { isExteriorPlant } from '#shared/utils/care/plantPlacement'
import type { Plant } from '#shared/types/database'
import {
  loadWetSkipCounts,
  runWateringRecalcBatch,
  type WateringRecalcBatchPlantContext
} from '../../utils/care/runWateringRecalcBatch'

const LOG_PREFIX = '[cron:recalculate-watering]'

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

  const exteriorPlants = (plants ?? []).filter(plant => isExteriorPlant(plant as Plant))

  if (!exteriorPlants.length) {
    const summary = { updated: 0, skipped: 0, errors: 0, users: 0, plants: 0, changes: [] }
    console.log(LOG_PREFIX, JSON.stringify({ event: 'finish', startedAt, ...summary }))
    return summary
  }

  const plantsByUser = new Map<string, typeof exteriorPlants>()
  for (const plant of exteriorPlants) {
    const list = plantsByUser.get(plant.user_id) ?? []
    list.push(plant)
    plantsByUser.set(plant.user_id, list)
  }

  const userIds = [...plantsByUser.keys()]
  const { data: settingsRows, error: settingsError } = await supabase
    .from('user_settings')
    .select('user_id, home_lat, home_lon')
    .in('user_id', userIds)
  if (settingsError) throw settingsError

  const settingsByUser = new Map(
    (settingsRows ?? []).map(row => [row.user_id, row])
  )

  const wetSkipCounts = await loadWetSkipCounts(supabase, exteriorPlants)

  const plantContextById = new Map<string, WateringRecalcBatchPlantContext>()
  let skippedUsers = 0

  for (const userId of userIds) {
    const userPlants = plantsByUser.get(userId) ?? []
    const settings = settingsByUser.get(userId)
    const homeLat = settings?.home_lat
    const homeLon = settings?.home_lon
    if (homeLat == null || homeLon == null) {
      skippedUsers += userPlants.length
      continue
    }

    const metrics = await fetchWeatherMetrics(Number(homeLat), Number(homeLon))
    if (!metrics) {
      skippedUsers += userPlants.length
      continue
    }

    const outdoorFactor = deriveWeatherFactor(metrics, {
      includeTemperature: true,
      includeHumidity: true,
      includePrecipitation: true
    })
    const semiFactor = deriveWeatherFactor(metrics, {
      includeTemperature: true,
      includeHumidity: true,
      includePrecipitation: false
    })

    for (const plant of userPlants) {
      const placement = plant.site?.placement
      const weatherFactor = placement === 'outdoor' ? outdoorFactor : semiFactor
      plantContextById.set(plant.id, {
        homeLat: Number(homeLat),
        weatherFactor
      })
    }
  }

  const batchResult = await runWateringRecalcBatch({
    plants: exteriorPlants as Plant[],
    plantContextById,
    wetSkipCounts,
    source: 'cron_exterior',
    supabase,
    perenualApiKey: config.perenualApiKey,
    allowCursor: false
  })

  const summary = {
    updated: batchResult.updated,
    skipped: batchResult.skipped + skippedUsers,
    errors: batchResult.errors,
    users: plantContextById.size > 0 ? userIds.length : 0,
    plants: exteriorPlants.length
  }
  console.log(LOG_PREFIX, JSON.stringify({ event: 'finish', startedAt, ...summary }))

  return summary
})
