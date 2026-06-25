import type { SupabaseClient } from '@supabase/supabase-js'

/** True when the plant has a pending water task whose due_at is before now. */
export async function hasOverduePendingWaterTask(
  supabase: SupabaseClient,
  plantId: string,
  now: Date = new Date()
): Promise<boolean> {
  const { count, error } = await supabase
    .from('care_tasks')
    .select('*', { count: 'exact', head: true })
    .eq('plant_id', plantId)
    .eq('type', 'water')
    .eq('status', 'pending')
    .lt('due_at', now.toISOString())
  if (error) throw error
  return (count ?? 0) > 0
}
