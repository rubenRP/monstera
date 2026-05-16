import { Agent } from '@cursor/sdk'
import {
  buildSpeciesEnrichPrompt,
  buildSpeciesGeneratePrompt,
  extractJsonFromText
} from '#shared/utils/cursor/prompts'
import type { SpeciesProfile } from '#shared/types/species'
import type { AppLocale } from '#shared/utils/i18n/locale'
import { translate } from '#shared/utils/i18n/translate'
import {
  mergeEnrichedSpeciesProfile,
  mergeGeneratedSpeciesProfile
} from '#shared/utils/species/mergeEnrichedProfile'
import { getIncompleteSpeciesFields } from '#shared/utils/species/profileCompleteness'
import {
  speciesEnrichResponseSchema,
  speciesGenerateResponseSchema
} from '#shared/utils/species/schemas'
import { syntheticPerenualId } from '#shared/utils/species/syntheticPerenualId'

function stubSpeciesProfile(speciesQuery: string, locale: AppLocale): SpeciesProfile {
  const unavailable = translate(locale, 'species.unavailable')
  return {
    perenualId: syntheticPerenualId(speciesQuery),
    commonName: speciesQuery,
    scientificName: [],
    imageUrl: null,
    imageLicense: null,
    watering: unavailable,
    light: unavailable,
    humidity: unavailable,
    fertilizing: unavailable,
    soil: unavailable,
    repotting: unavailable,
    toxicity: unavailable,
    characteristics: unavailable,
    temperature: unavailable,
    pestsAndProblems: unavailable,
    fetchedAt: new Date().toISOString()
  }
}

async function parseCursorSpeciesJson<T>(
  promptText: string,
  schema: { safeParse: (data: unknown) => { success: true, data: T } | { success: false } },
  apiKey: string
): Promise<T> {
  let resultText: string
  try {
    const result = await Agent.prompt(promptText, {
      apiKey,
      model: { id: 'composer-2' },
      local: { cwd: process.cwd() }
    })
    resultText = result.result ?? ''
  } catch (e) {
    console.error('Cursor species error:', e)
    throw e
  }

  let parsed = schema.safeParse(JSON.parse(extractJsonFromText(resultText)))
  if (!parsed.success) {
    const retry = await Agent.prompt(
      `${promptText}\n\nRespond ONLY with the JSON object, no extra text.`,
      {
        apiKey,
        model: { id: 'composer-2' },
        local: { cwd: process.cwd() }
      }
    )
    parsed = schema.safeParse(JSON.parse(extractJsonFromText(retry.result ?? '')))
  }
  if (!parsed.success) {
    throw new Error('Failed to parse species Cursor response')
  }
  return parsed.data
}

export async function generateSpeciesProfileWithCursor(
  speciesQuery: string,
  locale: AppLocale,
  apiKey: string
): Promise<SpeciesProfile> {
  const promptText = buildSpeciesGeneratePrompt(speciesQuery, locale)
  const generated = await parseCursorSpeciesJson(
    promptText,
    speciesGenerateResponseSchema,
    apiKey
  )
  return mergeGeneratedSpeciesProfile(stubSpeciesProfile(speciesQuery, locale), generated)
}

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
