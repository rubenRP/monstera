import { Agent, CursorAgentError } from '@cursor/sdk'
import { API_ERROR_CODES } from '#shared/utils/i18n/apiErrors'
import { buildDiagnosePrompt } from '#shared/utils/cursor/prompts'
import { parseAiJson } from '#shared/utils/cursor/parseAiJson'
import { diagnoseRequestSchema, diagnosisResponseSchema } from '#shared/utils/plants/schemas'
import type { Plant } from '#shared/types/database'
import { buildCursorAgentOptions } from '../utils/cursorAgentOptions'
import { retryAgentForJson } from '../utils/cursorJsonRetry'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  if (!config.cursorApiKey) {
    throwApiError(503, API_ERROR_CODES.AI_SERVICE_UNAVAILABLE)
  }

  const body = await readBody(event)
  const parsed = diagnoseRequestSchema.safeParse(body)
  if (!parsed.success) {
    throwApiError(400, API_ERROR_CODES.VALIDATION_FAILED, {
      messageKey: parsed.error.errors[0]?.message
    })
  }

  const { plantId, symptoms, imageBase64, mimeType } = parsed.data
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

  const promptText = buildDiagnosePrompt(plant as Plant, symptoms)

  const agentOptions = buildCursorAgentOptions(config.cursorApiKey)

  let resultText: string
  try {
    if (imageBase64) {
      const agent = await Agent.create(agentOptions)
      try {
        const run = await agent.send({
          text: promptText,
          images: [{ data: imageBase64.replace(/^data:image\/\w+;base64,/, ''), mimeType: mimeType ?? 'image/jpeg' }]
        })
        const result = await run.wait()
        if (result.status === 'error') {
          console.error('Cursor diagnose run failed:', result.id)
          throwApiError(502, API_ERROR_CODES.AI_QUERY_FAILED)
        }
        resultText = result.result ?? ''
      } finally {
        await agent[Symbol.asyncDispose]()
      }
    } else {
      const result = await Agent.prompt(promptText, agentOptions)
      if (result.status === 'error') {
        console.error('Cursor diagnose run failed:', result.id)
        throwApiError(502, API_ERROR_CODES.AI_QUERY_FAILED)
      }
      resultText = result.result ?? ''
    }
  } catch (e) {
    if (e && typeof e === 'object' && 'statusCode' in e) throw e
    const detail = e instanceof CursorAgentError ? e.message : String(e)
    console.error('Cursor diagnose error:', detail)
    throwApiError(502, API_ERROR_CODES.AI_QUERY_FAILED)
  }

  let diagnosis = parseAiJson(resultText, diagnosisResponseSchema)
  if (!diagnosis) {
    diagnosis = parseAiJson(await retryAgentForJson(promptText, agentOptions), diagnosisResponseSchema)
  }
  if (!diagnosis) {
    throwApiError(502, API_ERROR_CODES.AI_PARSE_FAILED)
  }

  const d = diagnosis
  const imagePath = imageBase64
    ? await saveDiagnosisImage(supabase, user.id, plantId, imageBase64, mimeType)
    : null
  const { data: saved, error: saveError } = await supabase
    .from('diagnoses')
    .insert({
      plant_id: plantId,
      user_id: user.id,
      symptoms,
      image_path: imagePath,
      ai_summary: d.summary,
      ai_raw: d,
      suggested_health_status: d.suggestedHealthStatus
    })
    .select()
    .single()

  if (saveError) {
    throwApiError(500, API_ERROR_CODES.AI_SAVE_FAILED)
  }

  return { diagnosis: d, record: saved }
})

/** Keeps the diagnosis photo in the plant's folder (removed with the plant). Best effort: a failed upload must not lose the diagnosis. */
async function saveDiagnosisImage(
  supabase: ReturnType<typeof getServiceSupabase>,
  userId: string,
  plantId: string,
  imageBase64: string,
  mimeType: string | undefined
): Promise<string | null> {
  const type = mimeType?.startsWith('image/') ? mimeType : 'image/jpeg'
  const ext = type.split('/')[1]?.replace('jpeg', 'jpg') ?? 'jpg'
  const path = `${userId}/${plantId}/diagnosis-${Date.now()}.${ext}`
  const bytes = Buffer.from(imageBase64.replace(/^data:image\/[\w.+-]+;base64,/, ''), 'base64')
  const { error } = await supabase.storage.from('plant-photos').upload(path, bytes, { contentType: type })
  if (error) {
    console.warn('[diagnose] could not store image:', error.message)
    return null
  }
  return path
}
