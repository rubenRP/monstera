import { API_ERROR_CODES } from '#shared/utils/i18n/apiErrors'
import { resolveWateringReferenceRequestSchema } from '#shared/utils/plants/schemas'
import type { Plant } from '#shared/types/database'
import { resolveWateringReferenceForPlant } from '../../utils/care/wateringContext'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()

  const authHeader = getHeader(event, 'authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    throwApiError(401, API_ERROR_CODES.AUTH_UNAUTHORIZED)
  }
  const token = authHeader.slice(7)

  const body = await readBody(event)
  const parsed = resolveWateringReferenceRequestSchema.safeParse(body)
  if (!parsed.success) {
    throwApiError(400, API_ERROR_CODES.VALIDATION_FAILED, {
      messageKey: parsed.error.errors[0]?.message
    })
  }

  const supabase = getServiceSupabase()
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) {
    throwApiError(401, API_ERROR_CODES.AUTH_INVALID_SESSION)
  }

  const { plantId, allowCursor } = parsed.data
  const locale = getRequestLocale(event)

  const { data: plant, error: plantError } = await supabase
    .from('plants')
    .select('*, site:sites(*)')
    .eq('id', plantId)
    .eq('user_id', user.id)
    .single()

  if (plantError || !plant) {
    throwApiError(404, API_ERROR_CODES.PLANT_NOT_FOUND)
  }

  const { data: settings } = await supabase
    .from('user_settings')
    .select('home_lat, home_lon')
    .eq('user_id', user.id)
    .maybeSingle()

  const homeLocation = settings?.home_lat != null && settings?.home_lon != null
    ? { lat: Number(settings.home_lat), lon: Number(settings.home_lon) }
    : null

  const reference = await resolveWateringReferenceForPlant(
    supabase,
    plant as Plant,
    {
      locale,
      perenualApiKey: config.perenualApiKey,
      cursorApiKey: config.cursorApiKey,
      homeLocation,
      allowCursor
    }
  )

  return reference
})
