import { API_ERROR_CODES } from '#shared/utils/i18n/apiErrors'
import type { WateringRecalcSource } from '#shared/utils/care/wateringRecalcEvent'
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
  const body = await readBody(event).catch(() => null) as { source?: WateringRecalcSource } | null
  const source: WateringRecalcSource = body?.source === 'home_settings_update'
    ? 'home_settings_update'
    : 'manual_all'

  const { data: settings } = await supabase
    .from('user_settings')
    .select('home_lat, home_lon, indoor_humidity')
    .eq('user_id', user.id)
    .maybeSingle()

  const homeLat = settings?.home_lat != null ? Number(settings.home_lat) : null
  const homeLon = settings?.home_lon != null ? Number(settings.home_lon) : null
  const indoorHumidity = settings?.indoor_humidity ?? 'auto'

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

  const wetSkipCounts = await loadWetSkipCounts(supabase, allPlants)
  const settingsByUserId = new Map([
    [user.id, { homeLat, homeLon, indoorHumidity }]
  ])
  const plantContextById = await buildWateringRecalcContexts(allPlants, settingsByUserId)

  const batchResult = await runWateringRecalcBatch({
    plants: allPlants,
    plantContextById,
    wetSkipCounts,
    source,
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
