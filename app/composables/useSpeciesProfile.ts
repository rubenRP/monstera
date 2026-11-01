import type { SpeciesProfile } from '#shared/types/species'

export function useSpeciesProfile() {
  const { getAccessToken } = useAccessToken()
  const { localeHeaders } = useI18nHeaders()
  const { t } = useI18n()

  async function getAuthHeader(): Promise<Record<string, string>> {
    const token = await getAccessToken()
    if (!token) throw new Error(t('auth.notAuthenticated'))
    return { Authorization: `Bearer ${token}`, ...localeHeaders() }
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
