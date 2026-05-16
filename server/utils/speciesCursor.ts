import { Agent } from '@cursor/sdk'
import { buildSpeciesEnrichPrompt, extractJsonFromText } from '#shared/utils/cursor/prompts'
import type { SpeciesProfile } from '#shared/types/species'
import type { AppLocale } from '#shared/utils/i18n/locale'
import { mergeEnrichedSpeciesProfile } from '#shared/utils/species/mergeEnrichedProfile'
import { getIncompleteSpeciesFields } from '#shared/utils/species/profileCompleteness'
import { speciesEnrichResponseSchema } from '#shared/utils/species/schemas'

export async function enrichSpeciesProfileWithCursor(
  profile: SpeciesProfile,
  speciesQuery: string,
  locale: AppLocale,
  apiKey: string
): Promise<SpeciesProfile> {
  const missingFields = getIncompleteSpeciesFields(profile, locale)
  if (missingFields.length === 0) {
    return profile
  }

  const promptText = buildSpeciesEnrichPrompt(speciesQuery, profile, missingFields, locale)

  let resultText: string
  try {
    const result = await Agent.prompt(promptText, {
      apiKey,
      model: { id: 'composer-2' },
      local: { cwd: process.cwd() }
    })
    resultText = result.result ?? ''
  } catch (e) {
    console.error('Cursor species enrich error:', e)
    throw e
  }

  let parsed = speciesEnrichResponseSchema.safeParse(
    JSON.parse(extractJsonFromText(resultText))
  )
  if (!parsed.success) {
    const retry = await Agent.prompt(
      `${promptText}\n\nRespond ONLY with the JSON object, no extra text.`,
      {
        apiKey,
        model: { id: 'composer-2' },
        local: { cwd: process.cwd() }
      }
    )
    parsed = speciesEnrichResponseSchema.safeParse(
      JSON.parse(extractJsonFromText(retry.result ?? ''))
    )
  }
  if (!parsed.success) {
    throw new Error('Failed to parse species enrich response')
  }

  return mergeEnrichedSpeciesProfile(profile, parsed.data, locale)
}
