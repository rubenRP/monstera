import { Agent } from '@cursor/sdk'
import { buildDiagnosePrompt, extractJsonFromText } from '#shared/utils/cursor/prompts'
import { diagnoseRequestSchema, diagnosisResponseSchema } from '#shared/utils/plants/schemas'
import type { Plant } from '#shared/types/database'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  if (!config.cursorApiKey) {
    throw createError({ statusCode: 503, message: 'CURSOR_API_KEY no configurada' })
  }

  const body = await readBody(event)
  const parsed = diagnoseRequestSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, message: parsed.error.message })
  }

  const { plantId, symptoms, imageBase64, mimeType } = parsed.data
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

  const promptText = buildDiagnosePrompt(plant as Plant, symptoms)

  let resultText: string
  try {
    if (imageBase64) {
      const agent = Agent.create({
        apiKey: config.cursorApiKey,
        model: { id: 'composer-2' },
        local: { cwd: process.cwd() }
      })
      try {
        const run = await agent.send({
          text: promptText,
          images: [{ data: imageBase64.replace(/^data:image\/\w+;base64,/, ''), mimeType: mimeType ?? 'image/jpeg' }]
        })
        const result = await run.wait()
        resultText = result.result ?? ''
      } finally {
        await agent[Symbol.asyncDispose]()
      }
    } else {
      const result = await Agent.prompt(promptText, {
        apiKey: config.cursorApiKey,
        model: { id: 'composer-2' },
        local: { cwd: process.cwd() }
      })
      resultText = result.result ?? ''
    }
  } catch (e) {
    console.error('Cursor diagnose error:', e)
    throw createError({ statusCode: 502, message: 'Error al consultar la IA' })
  }

  let diagnosis = diagnosisResponseSchema.safeParse(
    JSON.parse(extractJsonFromText(resultText))
  )
  if (!diagnosis.success) {
    const retry = await Agent.prompt(
      `${promptText}\n\nResponde ÚNICAMENTE con el JSON, sin texto adicional.`,
      {
        apiKey: config.cursorApiKey,
        model: { id: 'composer-2' },
        local: { cwd: process.cwd() }
      }
    )
    diagnosis = diagnosisResponseSchema.safeParse(
      JSON.parse(extractJsonFromText(retry.result ?? ''))
    )
  }
  if (!diagnosis.success) {
    throw createError({ statusCode: 502, message: 'No se pudo interpretar la respuesta de la IA' })
  }

  const d = diagnosis.data
  const { data: saved, error: saveError } = await supabase
    .from('diagnoses')
    .insert({
      plant_id: plantId,
      user_id: user.id,
      symptoms,
      ai_summary: d.summary,
      ai_raw: d,
      suggested_health_status: d.suggestedHealthStatus
    })
    .select()
    .single()

  if (saveError) {
    throw createError({ statusCode: 500, message: saveError.message })
  }

  return { diagnosis: d, record: saved }
})
