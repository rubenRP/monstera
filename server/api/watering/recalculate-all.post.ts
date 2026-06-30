import { API_ERROR_CODES } from '#shared/utils/i18n/apiErrors'
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

  const locale = getRequestLocale(event)
  const config = useRuntimeConfig()

  const { data: settings } = await supabase
    .from('user_settings')
    .select('home_lat, home_lon')
    .eq('user_id', user.id)
    .maybeSingle()

  const homeLat = settings?.home_lat != null ? Number(settings.home_lat) : null
  const homeLon = settings?.home_lon != null ? Number(settings.home_lon) : null

  const { data: plants, error: plantError } = await supabase
    .from('plants')
    .select('*, site:sites(*)')
    .eq('user_id', user.id)
    .is('archived_at', null)
  if (plantError) throw plantError

  const allPlants = (plants ?? []) as Plant[]
  if (!allPlants.length) {
    return { updated: 0, errors: 0, plants: 0, skipped: 0 }
  }

  const plantIds = allPlants.map(plant => plant.id)
  const wetSkipCounts = await loadWetSkipCounts(supabase, plantIds)
  const plantContextById = await buildWateringRecalcContexts(allPlants, homeLat, homeLon)

  const batchResult = await runWateringRecalcBatch({
    plants: allPlants,
    plantContextById,
    wetSkipCounts,
    source: 'manual_all',
    supabase,
    locale,
    perenualApiKey: config.perenualApiKey,
    allowCursor: false
  })

  return {
    updated: batchResult.updated,
    errors: batchResult.errors,
    skipped: batchResult.skipped,
    plants: allPlants.length
  }
})
