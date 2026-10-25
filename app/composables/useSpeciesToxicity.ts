import { normalizeSpeciesQuery } from '#shared/utils/species/normalize'
import { petToxicity } from '#shared/utils/species/toxicity'

/** Pet toxicity per species from the shared species cache, in one light query (JSON fields only). */
export function useSpeciesToxicity() {
  const supabase = useSupabaseClient()

  async function fetchPetToxicity(species: Array<string | null | undefined>): Promise<Map<string, boolean | null>> {
    const queries = [...new Set(species.filter((s): s is string => !!s?.trim()).map(normalizeSpeciesQuery))]
    const map = new Map<string, boolean | null>()
    if (!queries.length) return map
    const { data, error } = await supabase
      .from('species_profiles')
      .select('species_query, toxicity:profile->>toxicity, toxicToPets:profile->toxicToPets')
      .in('species_query', queries)
    // Decorative hint: never fail the plant list because of it
    if (error) {
      console.warn('[useSpeciesToxicity]', error)
      return map
    }
    for (const row of (data ?? []) as Array<{ species_query: string, toxicity: string | null, toxicToPets: boolean | null }>) {
      map.set(row.species_query, petToxicity({ toxicity: row.toxicity ?? '', toxicToPets: row.toxicToPets }))
    }
    return map
  }

  function toxicFor(map: Map<string, boolean | null>, species: string | null | undefined): boolean {
    return !!species && map.get(normalizeSpeciesQuery(species)) === true
  }

  return { fetchPetToxicity, toxicFor }
}
