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

/** Plant ids that currently have an overdue pending water task. */
export async function plantIdsWithOverduePendingWater(
  supabase: SupabaseClient,
  plantIds: string[],
  now: Date = new Date()
): Promise<Set<string>> {
  if (!plantIds.length) return new Set()

  const { data, error } = await supabase
    .from('care_tasks')
    .select('plant_id')
    .in('plant_id', plantIds)
    .eq('type', 'water')
    .eq('status', 'pending')
    .lt('due_at', now.toISOString())
  if (error) throw error

  return new Set((data ?? []).map(row => String(row.plant_id)))
}
