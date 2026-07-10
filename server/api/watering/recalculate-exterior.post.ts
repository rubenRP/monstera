import { API_ERROR_CODES } from '#shared/utils/i18n/apiErrors'
import { isExteriorPlant } from '#shared/utils/care/plantPlacement'
import type { Plant } from '#shared/types/database'
import {
  buildWateringRecalcContexts,
  loadWetSkipCounts,
  runWateringRecalcBatch
} from '../../utils/care/runWateringRecalcBatch'

export default defineEventHandler(async (event) => {
  const authHeader = getHeader(event, 'authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    throwApiError(401, API_ERROR_CODES.AUTH_UNAUTHORIZED)
  }
  const token = authHeader.slice(7)

  const supabase = getServiceSupabase()
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) {
    throwApiError(401, API_ERROR_CODES.AUTH_INVALID_SESSION)
  }

  const { data: settings, error: settingsError } = await supabase
    .from('user_settings')
    .select('home_lat, home_lon')
    .eq('user_id', user.id)
    .maybeSingle()
  if (settingsError) throw settingsError

  if (settings?.home_lat == null || settings?.home_lon == null) {
    throwApiError(400, API_ERROR_CODES.VALIDATION_FAILED, {
      messageKey: 'errors.validation.homeLocationRequired'
    })
  }

  const homeLat = Number(settings.home_lat)
  const homeLon = Number(settings.home_lon)

  const metrics = await fetchWeatherMetrics(homeLat, homeLon)
  if (!metrics) {
    throwApiError(503, API_ERROR_CODES.WEATHER_UNAVAILABLE)
  }

  const config = useRuntimeConfig()

  const { data: plants, error: plantError } = await supabase
    .from('plants')
    .select('*, site:sites(*)')
    .eq('user_id', user.id)
    .is('archived_at', null)
  if (plantError) throw plantError

  const exteriorPlants = (plants ?? []).filter(plant => isExteriorPlant(plant as Plant))

  if (!exteriorPlants.length) {
    return { updated: 0, errors: 0, plants: 0 }
  }

  const wetSkipCounts = await loadWetSkipCounts(supabase, exteriorPlants)
  const plantContextById = await buildWateringRecalcContexts(
    exteriorPlants as Plant[],
    homeLat,
    homeLon
  )

  const batchResult = await runWateringRecalcBatch({
    plants: exteriorPlants as Plant[],
    plantContextById,
    wetSkipCounts,
    source: 'manual_exterior',
    supabase,
    perenualApiKey: config.perenualApiKey,
    allowCursor: false
  })

  return {
    updated: batchResult.updated,
    errors: batchResult.errors,
    plants: exteriorPlants.length
  }
})
