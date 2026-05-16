import { normalizeSpeciesQuery } from '#shared/utils/species/normalize'
import type { SpeciesProfile, SpeciesProfileRow } from '#shared/types/species'
import { fetchSpeciesProfileFromPerenual } from '../../../utils/perenual'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  if (!config.perenualApiKey) {
    throw createError({ statusCode: 503, message: 'PERENUAL_API_KEY no configurada' })
  }

  const plantId = getRouterParam(event, 'id')
  if (!plantId) {
    throw createError({ statusCode: 400, message: 'ID de planta requerido' })
  }

  const refresh = getQuery(event).refresh === 'true'

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
    .select('id, species')
    .eq('id', plantId)
    .eq('user_id', user.id)
    .single()

  if (plantError || !plant) {
    throw createError({ statusCode: 404, message: 'Planta no encontrada' })
  }

  if (!plant.species?.trim()) {
    throw createError({
      statusCode: 404,
      message: 'Añade la especie de la planta en el formulario de edición para ver la ficha de variedad'
    })
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
    profile = await fetchSpeciesProfileFromPerenual(speciesQuery, config.perenualApiKey)
  } catch (e) {
    throw createError({
      statusCode: 502,
      message: e instanceof Error ? e.message : 'Error al consultar Perenual'
    })
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
