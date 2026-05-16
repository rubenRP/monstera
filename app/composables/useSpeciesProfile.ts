import type { SpeciesProfile } from '#shared/types/species'

export function useSpeciesProfile() {
  const supabase = useSupabaseClient()

  async function getAuthHeader(): Promise<Record<string, string>> {
    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token
    if (!token) throw new Error('No autenticado')
    return { Authorization: `Bearer ${token}` }
  }

  async function fetchSpeciesProfile(plantId: string, refresh = false) {
    const headers = await getAuthHeader()
    return $fetch<{ profile: SpeciesProfile, cached: boolean, speciesQuery: string }>(
      `/api/plants/${plantId}/species-profile`,
      { headers, query: refresh ? { refresh: 'true' } : undefined }
    )
  }

  return { fetchSpeciesProfile }
}
