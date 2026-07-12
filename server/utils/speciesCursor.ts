import { Agent } from '@cursor/sdk'
import {
  buildSpeciesEnrichPrompt,
  buildSpeciesGeneratePrompt
} from '#shared/utils/cursor/prompts'
import { parseAgentJson } from '#shared/utils/cursor/parseAgentJson'
import type { SpeciesProfile } from '#shared/types/species'
import type { AppLocale } from '#shared/utils/i18n/locale'
import { translate } from '#shared/utils/i18n/translate'
import {
  mergeEnrichedSpeciesProfile,
  mergeGeneratedSpeciesProfile
} from '#shared/utils/species/mergeEnrichedProfile'
import {
  getIncompleteSpeciesFields,
  isSpeciesProfileLimited,
  needsTemperatureExtras
} from '#shared/utils/species/profileCompleteness'
import {
  speciesEnrichResponseSchema,
  speciesGenerateResponseSchema
} from '#shared/utils/species/schemas'
import { syntheticPerenualId } from '#shared/utils/species/syntheticPerenualId'
import { buildCursorAgentOptions } from './cursorAgentOptions'

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

async function promptCursorAgent(promptText: string, apiKey: string): Promise<string> {
  const result = await Agent.prompt(promptText, buildCursorAgentOptions(apiKey))
  return result.result ?? ''
}

async function parseCursorSpeciesJson<T>(
  promptText: string,
  schema: { safeParse: (data: unknown) => { success: true, data: T } | { success: false } },
  apiKey: string
): Promise<T> {
  let resultText: string
  try {
    resultText = await promptCursorAgent(promptText, apiKey)
  } catch (e) {
    console.error('Cursor species error:', e)
    throw e
  }

  let data = parseAgentJson(resultText)
  let parsed = data != null ? schema.safeParse(data) : { success: false as const }

  if (!parsed.success) {
    const retryText = await promptCursorAgent(
      `${promptText}\n\nRespond ONLY with valid JSON. Escape newlines inside strings. No trailing commas.`,
      apiKey
    )
    data = parseAgentJson(retryText)
    parsed = data != null ? schema.safeParse(data) : { success: false as const }
  }

  if (!parsed.success) {
    throw new Error('Failed to parse species Cursor response')
  }
  return parsed.data
}

export interface SpeciesEnrichLocation {
  lat: number
  lon: number
}

export async function generateSpeciesProfileWithCursor(
  speciesQuery: string,
  locale: AppLocale,
  apiKey: string,
  location?: SpeciesEnrichLocation | null,
  seed?: SpeciesProfile | null
): Promise<SpeciesProfile> {
  const promptText = buildSpeciesGeneratePrompt(speciesQuery, locale, location)
  const base = seed ?? stubSpeciesProfile(speciesQuery, locale)
  const generated = await parseCursorSpeciesJson(
    promptText,
    speciesGenerateResponseSchema,
    apiKey
  )
  return mergeGeneratedSpeciesProfile(base, generated, locale)
}

export async function enrichSpeciesProfileWithCursor(
  profile: SpeciesProfile,
  speciesQuery: string,
  locale: AppLocale,
  apiKey: string,
  location?: SpeciesEnrichLocation | null
): Promise<SpeciesProfile> {
  const missingFields = getIncompleteSpeciesFields(profile, locale)
  const includeTemperatureExtras = needsTemperatureExtras(profile)
  if (missingFields.length === 0 && !includeTemperatureExtras) {
    return profile
  }

  const promptText = buildSpeciesEnrichPrompt(speciesQuery, profile, missingFields, locale, {
    includeTemperatureExtras,
    location
  })

  const parsed = await parseCursorSpeciesJson(
    promptText,
    speciesEnrichResponseSchema,
    apiKey
  )

  return mergeEnrichedSpeciesProfile(profile, parsed, locale)
}

/** Full Cursor profile when enrich is unreliable (e.g. mostly empty Perenual list item) */
export async function generateOrEnrichSpeciesProfileWithCursor(
  profile: SpeciesProfile,
  speciesQuery: string,
  locale: AppLocale,
  apiKey: string,
  location?: SpeciesEnrichLocation | null
): Promise<SpeciesProfile> {
  if (isSpeciesProfileLimited(profile, locale)) {
    return generateSpeciesProfileWithCursor(
      speciesQuery,
      locale,
      apiKey,
      location,
      profile.perenualId > 0 ? profile : null
    )
  }
  return enrichSpeciesProfileWithCursor(profile, speciesQuery, locale, apiKey, location)
}
