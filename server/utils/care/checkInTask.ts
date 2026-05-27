import type { SupabaseClient } from '@supabase/supabase-js'
import { idealCheckInDueAt } from '#shared/utils/care/checkInSchedule'

type PlantCheckInRow = {
  id: string
  user_id: string
  last_check_in_at: string | null
  check_in_interval_days: number
  created_at: string
}

export async function upsertPendingCheckInTask(
  supabase: SupabaseClient,
  plant: PlantCheckInRow
): Promise<void> {
  const interval = plant.check_in_interval_days ?? 30
  const anchor = plant.last_check_in_at
    ? new Date(plant.last_check_in_at)
    : new Date(plant.created_at)
  let due = idealCheckInDueAt(
    plant.last_check_in_at ? anchor : null,
    interval,
    anchor
  )
  if (due.getTime() < Date.now()) {
    due = new Date()
  }

  const { error: delError } = await supabase
    .from('care_tasks')
    .delete()
    .eq('plant_id', plant.id)
    .eq('type', 'check_in')
    .eq('status', 'pending')
  if (delError) throw delError

  const { error: insError } = await supabase.from('care_tasks').insert({
    plant_id: plant.id,
    user_id: plant.user_id,
    type: 'check_in',
    due_at: due.toISOString(),
    status: 'pending'
  })
  if (insError) throw insError
}
