import type { SupabaseClient } from '@supabase/supabase-js'
import { WATERING_HISTORY_LOOKBACK_DAYS, daysBetweenWateringCompletions } from '#shared/utils/care/wateringHistory'

export async function fetchWateringHistoryIntervals(
  supabase: SupabaseClient,
  plantId: string
): Promise<number[]> {
  const since = new Date()
  since.setDate(since.getDate() - WATERING_HISTORY_LOOKBACK_DAYS)

  const { data, error } = await supabase
    .from('care_tasks')
    .select('completed_at')
    .eq('plant_id', plantId)
    .eq('type', 'water')
    .eq('status', 'done')
    .gte('completed_at', since.toISOString())
    .order('completed_at', { ascending: true })

  if (error) throw error

  const timestamps = (data ?? [])
    .map(row => row.completed_at)
    .filter((at): at is string => at != null)

  return daysBetweenWateringCompletions(timestamps)
}
