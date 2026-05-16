import { API_ERROR_CODES } from '#shared/utils/i18n/apiErrors'
import { normalizeSpeciesQuery } from '#shared/utils/species/normalize'
import type { SpeciesProfile, SpeciesProfileRow } from '#shared/types/species'
import { fetchSpeciesProfileFromPerenual } from '../../../utils/perenual'

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
      return { profile: row.profile, cached: true, speciesQuery }
    }
  }

  let profile: SpeciesProfile
  try {
    profile = await fetchSpeciesProfileFromPerenual(speciesQuery, config.perenualApiKey, locale)
  } catch {
    throwApiError(502, API_ERROR_CODES.PERENUAL_QUERY_FAILED)
  }

  const { error: upsertError } = await supabase
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

  if (upsertError) {
    console.error('species_profiles upsert:', upsertError)
  }

  return { profile, cached: false, speciesQuery }
})
