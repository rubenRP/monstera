import type { SupabaseClient } from '@supabase/supabase-js'
import type { CareTask, CareTaskType } from '#shared/types/database'

/**
 * Sets the single pending task of `type` for a plant to `dueAt` (insert or move).
 * Atomic in Postgres via `replace_pending_care_task`; see migration 20261025120000.
 */
export async function replacePendingCareTask(
  supabase: SupabaseClient,
  plantId: string,
  type: CareTaskType,
  dueAt: string
): Promise<CareTask> {
  const { data, error } = await supabase.rpc('replace_pending_care_task', {
    p_plant_id: plantId,
    p_type: type,
    p_due_at: dueAt
  })
  if (error) throw error
  return data as CareTask
}
