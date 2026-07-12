import { Agent, CursorAgentError } from '@cursor/sdk'
import { API_ERROR_CODES } from '#shared/utils/i18n/apiErrors'
import { buildRecommendPrompt, extractJsonFromText } from '#shared/utils/cursor/prompts'
import { recommendRequestSchema, recommendResponseSchema } from '#shared/utils/plants/schemas'
import type { Plant } from '#shared/types/database'
import { buildCursorAgentOptions } from '../utils/cursorAgentOptions'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  if (!config.cursorApiKey) {
    throwApiError(503, API_ERROR_CODES.AI_SERVICE_UNAVAILABLE)
  }

  const body = await readBody(event)
  const parsed = recommendRequestSchema.safeParse(body)
  if (!parsed.success) {
    throwApiError(400, API_ERROR_CODES.VALIDATION_FAILED, {
      messageKey: parsed.error.errors[0]?.message
    })
  }

  const { plantId, latitude, longitude } = parsed.data
  const locale = getRequestLocale(event)
  const supabase = getServiceSupabase()

  const authHeader = getHeader(event, 'authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    throwApiError(401, API_ERROR_CODES.AUTH_UNAUTHORIZED)
  }
  const token = authHeader.slice(7)
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) {
    throwApiError(401, API_ERROR_CODES.AUTH_INVALID_SESSION)
  }

  const { data: plant, error: plantError } = await supabase
    .from('plants')
    .select('*, site:sites(*)')
    .eq('id', plantId)
    .eq('user_id', user.id)
    .single()

  if (plantError || !plant) {
    throwApiError(404, API_ERROR_CODES.PLANT_NOT_FOUND)
  }

  if (plant.archived_at) {
    throwApiError(400, API_ERROR_CODES.PLANT_ARCHIVED)
  }

  let lat = latitude
  let lon = longitude
  if (lat == null || lon == null) {
    const { data: settings } = await supabase
      .from('user_settings')
      .select('home_lat, home_lon')
      .eq('user_id', user.id)
      .maybeSingle()
    lat = settings?.home_lat ?? Number(process.env.NUXT_PUBLIC_HOME_LAT ?? 40.4168)
    lon = settings?.home_lon ?? Number(process.env.NUXT_PUBLIC_HOME_LON ?? -3.7038)
  }

  const weatherSummary = await fetchWeatherSummary(lat!, lon!, locale)
  const promptText = buildRecommendPrompt(plant as Plant, weatherSummary, lat!, lon!)

  const agentOptions = buildCursorAgentOptions(config.cursorApiKey)

  let resultText: string
  try {
    const result = await Agent.prompt(promptText, agentOptions)
    if (result.status === 'error') {
      console.error('Cursor recommend run failed:', result.id)
      throwApiError(502, API_ERROR_CODES.AI_QUERY_FAILED)
    }
    resultText = result.result ?? ''
  } catch (e) {
    if (e && typeof e === 'object' && 'statusCode' in e) throw e
    const detail = e instanceof CursorAgentError ? e.message : String(e)
    console.error('Cursor recommend error:', detail)
    throwApiError(502, API_ERROR_CODES.AI_QUERY_FAILED)
  }

  let recommendation = recommendResponseSchema.safeParse(
    JSON.parse(extractJsonFromText(resultText))
  )
  if (!recommendation.success) {
    const retry = await Agent.prompt(
      `${promptText}\n\nResponde ÚNICAMENTE con el JSON, sin texto adicional.`,
      agentOptions
    )
    recommendation = recommendResponseSchema.safeParse(
      JSON.parse(extractJsonFromText(retry.result ?? ''))
    )
  }
  if (!recommendation.success) {
    throwApiError(502, API_ERROR_CODES.AI_PARSE_FAILED)
  }

  return { recommendation: recommendation.data, weatherSummary }
})
