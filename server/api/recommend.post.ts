import { Agent } from '@cursor/sdk'
import { buildRecommendPrompt, extractJsonFromText } from '#shared/utils/cursor/prompts'
import { recommendRequestSchema, recommendResponseSchema } from '#shared/utils/plants/schemas'
import type { Plant } from '#shared/types/database'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  if (!config.cursorApiKey) {
    throw createError({ statusCode: 503, message: 'CURSOR_API_KEY no configurada' })
  }

  const body = await readBody(event)
  const parsed = recommendRequestSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, message: parsed.error.message })
  }

  const { plantId, latitude, longitude } = parsed.data
  const supabase = getServiceSupabase()

  const authHeader = getHeader(event, 'authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    throw createError({ statusCode: 401, message: 'No autorizado' })
  }
  const token = authHeader.slice(7)
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) {
    throw createError({ statusCode: 401, message: 'Sesión inválida' })
  }

  const { data: plant, error: plantError } = await supabase
    .from('plants')
    .select('*, site:sites(*)')
    .eq('id', plantId)
    .eq('user_id', user.id)
    .single()

  if (plantError || !plant) {
    throw createError({ statusCode: 404, message: 'Planta no encontrada' })
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

  const weatherSummary = await fetchWeatherSummary(lat, lon)
  const promptText = buildRecommendPrompt(plant as Plant, weatherSummary, lat, lon)

  let resultText: string
  try {
    const result = await Agent.prompt(promptText, {
      apiKey: config.cursorApiKey,
      model: { id: 'composer-2' },
      local: { cwd: process.cwd() }
    })
    resultText = result.result ?? ''
  } catch (e) {
    console.error('Cursor recommend error:', e)
    throw createError({ statusCode: 502, message: 'Error al consultar la IA' })
  }

  let recommendation = recommendResponseSchema.safeParse(
    JSON.parse(extractJsonFromText(resultText))
  )
  if (!recommendation.success) {
    const retry = await Agent.prompt(
      `${promptText}\n\nResponde ÚNICAMENTE con el JSON, sin texto adicional.`,
      {
        apiKey: config.cursorApiKey,
        model: { id: 'composer-2' },
        local: { cwd: process.cwd() }
      }
    )
    recommendation = recommendResponseSchema.safeParse(
      JSON.parse(extractJsonFromText(retry.result ?? ''))
    )
  }
  if (!recommendation.success) {
    throw createError({ statusCode: 502, message: 'No se pudo interpretar la respuesta de la IA' })
  }

  return { recommendation: recommendation.data, weatherSummary }
})
