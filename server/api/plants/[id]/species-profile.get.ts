import { API_ERROR_CODES } from '#shared/utils/i18n/apiErrors'
import type { AppLocale } from '#shared/utils/i18n/locale'
import { normalizeSpeciesQuery } from '#shared/utils/species/normalize'
import { isSpeciesProfileLimited } from '#shared/utils/species/profileCompleteness'
import type { SpeciesProfile, SpeciesProfileRow } from '#shared/types/species'
import { fetchSpeciesProfileFromPerenual } from '../../../utils/perenual'
import {
  enrichSpeciesProfileWithCursor,
  generateSpeciesProfileWithCursor
} from '../../../utils/speciesCursor'
import type { SupabaseClient } from '@supabase/supabase-js'

async function maybeEnrichSpeciesProfile(
  profile: SpeciesProfile,
  speciesQuery: string,
  locale: AppLocale,
  cursorApiKey: string | undefined,
  refresh: boolean
): Promise<SpeciesProfile> {
  if (!cursorApiKey || (profile.enrichedByAi && !refresh)) {
    return profile
  }
  if (!isSpeciesProfileLimited(profile, locale)) {
    return profile
  }
  try {
    return await enrichSpeciesProfileWithCursor(profile, speciesQuery, locale, cursorApiKey)
  } catch (e) {
    console.error('species profile enrich failed:', e)
    return profile
  }
}

async function upsertSpeciesProfile(
  supabase: SupabaseClient,
  speciesQuery: string,
  profile: SpeciesProfile
): Promise<void> {
  const { error } = await supabase
    .from('species_profiles')
    .upsert(
      {
        species_query: speciesQuery,
        perenual_id: profile.perenualId,
        profile,
        updated_at: new Date().toISOString()
      },
      { onConflict: 'species_query' }
    )
  if (error) {
    console.error('species_profiles upsert:', error)
  }
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  if (!config.perenualApiKey) {
    throwApiError(503, API_ERROR_CODES.PERENUAL_SERVICE_UNAVAILABLE)
  }

  const plantId = getRouterParam(event, 'id')
  if (!plantId) {
    throwApiError(400, API_ERROR_CODES.PLANT_ID_REQUIRED)
  }

  const refresh = getQuery(event).refresh === 'true'
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
    .select('id, species')
    .eq('id', plantId)
    .eq('user_id', user.id)
    .single()

  if (plantError || !plant) {
    throwApiError(404, API_ERROR_CODES.PLANT_NOT_FOUND)
  }

  if (!plant.species?.trim()) {
    throwApiError(404, API_ERROR_CODES.PLANT_SPECIES_REQUIRED)
  }

  const speciesQuery = normalizeSpeciesQuery(plant.species)

  if (!refresh) {
    const { data: cached } = await supabase
      .from('species_profiles')
      .select('*')
      .eq('species_query', speciesQuery)
      .maybeSingle()

    if (cached) {
      const row = cached as SpeciesProfileRow
      const enriched = await maybeEnrichSpeciesProfile(
        row.profile,
        speciesQuery,
        locale,
        config.cursorApiKey,
        refresh
      )
      if (enriched !== row.profile) {
        await upsertSpeciesProfile(supabase, speciesQuery, enriched)
      }
      return { profile: enriched, cached: true, speciesQuery }
    }
  }

  let profile: SpeciesProfile
  try {
    profile = await fetchSpeciesProfileFromPerenual(speciesQuery, config.perenualApiKey, locale)
  } catch (e) {
    const notFound = isError(e)
      && e.statusCode === 404
      && (e.data as { code?: string })?.code === API_ERROR_CODES.PERENUAL_SPECIES_NOT_FOUND
    if (notFound && config.cursorApiKey) {
      try {
        profile = await generateSpeciesProfileWithCursor(
          speciesQuery,
          locale,
          config.cursorApiKey
        )
      } catch (genErr) {
        console.error('Cursor species generate failed:', genErr)
        throw e
      }
    } else if (isError(e) && e.statusCode) {
      throw e
    } else {
      console.error('Perenual fetch failed:', e)
      throwApiError(502, API_ERROR_CODES.PERENUAL_QUERY_FAILED)
    }
  }

  profile = await maybeEnrichSpeciesProfile(
    profile,
    speciesQuery,
    locale,
    config.cursorApiKey,
    refresh
  )

  await upsertSpeciesProfile(supabase, speciesQuery, profile)

  return { profile, cached: false, speciesQuery }
})
