import { Agent } from '@cursor/sdk'
import { buildWateringReferencePrompt, extractJsonFromText } from '#shared/utils/cursor/prompts'
import type { Plant } from '#shared/types/database'
import { wateringReferenceResponseSchema } from '#shared/utils/plants/schemas'
import { buildCursorAgentOptions } from '../cursorAgentOptions'

export async function fetchWateringReferenceFromCursor(
  plant: Plant,
  apiKey: string
): Promise<number | null> {
  const promptText = buildWateringReferencePrompt(plant)
  let resultText: string
  try {
    const result = await Agent.prompt(promptText, buildCursorAgentOptions(apiKey))
    resultText = result.result ?? ''
  } catch (e) {
    console.error('Cursor watering reference error:', e)
    return null
  }

  try {
    const parsed = wateringReferenceResponseSchema.safeParse(
      JSON.parse(extractJsonFromText(resultText))
    )
    return parsed.success ? parsed.data.referenceDays : null
  } catch {
    return null
  }
}
