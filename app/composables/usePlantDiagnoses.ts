import type { Diagnosis } from '#shared/types/database'

export function usePlantDiagnoses() {
  const supabase = useSupabaseClient()

  async function fetchDiagnosisHistory(plantId: string, limit = 20) {
    const { data, error } = await supabase
      .from('diagnoses')
      .select('*')
      .eq('plant_id', plantId)
      .order('created_at', { ascending: false })
      .limit(limit)
    if (error) throw error
    return (data ?? []) as Diagnosis[]
  }

  return { fetchDiagnosisHistory }
}
