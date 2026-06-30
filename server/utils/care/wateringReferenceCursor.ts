import { Agent } from '@cursor/sdk'
import { buildWateringReferencePrompt, extractJsonFromText } from '#shared/utils/cursor/prompts'
import type { Plant } from '#shared/types/database'
import { wateringReferenceResponseSchema } from '#shared/utils/plants/schemas'

export async function fetchWateringReferenceFromCursor(
  plant: Plant,
  apiKey: string
): Promise<number | null> {
  const promptText = buildWateringReferencePrompt(plant)
  let resultText: string
  try {
    const result = await Agent.prompt(promptText, {
      apiKey,
      model: { id: 'composer-2' },
      local: { cwd: process.cwd() }
    })
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
