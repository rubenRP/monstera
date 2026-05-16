import type { DiagnosisResponse, RecommendResponse } from '#shared/utils/plants/schemas'

export function useAiApi() {
  const supabase = useSupabaseClient()
  const { localeHeaders } = useI18nHeaders()
  const { t } = useI18n()

  async function getAuthHeader(): Promise<Record<string, string>> {
    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token
    if (!token) throw new Error(t('auth.notAuthenticated'))
    return { Authorization: `Bearer ${token}`, ...localeHeaders() }
  }

  async function diagnose(plantId: string, symptoms: string, imageBase64?: string) {
    const headers = await getAuthHeader()
    return $fetch<{ diagnosis: DiagnosisResponse, record: unknown }>('/api/diagnose', {
      method: 'POST',
      headers,
      body: { plantId, symptoms, imageBase64 }
    })
  }

  async function recommend(plantId: string, latitude?: number, longitude?: number) {
    const headers = await getAuthHeader()
    return $fetch<{ recommendation: RecommendResponse, weatherSummary: string }>('/api/recommend', {
      method: 'POST',
      headers,
      body: { plantId, latitude, longitude }
    })
  }

  return { diagnose, recommend }
}
