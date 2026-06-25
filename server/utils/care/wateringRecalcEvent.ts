import type { SupabaseClient } from '@supabase/supabase-js'
import {
  wateringRecalcHasChange,
  type WateringRecalcSource
} from '#shared/utils/care/wateringRecalcEvent'

export interface LogWateringRecalcInput {
  userId: string
  plantId: string
  plantName: string
  source: WateringRecalcSource
  previousDueAt: string | null
  newDueAt: string
  previousIntervalDays: number | null
  newIntervalDays: number
}

export async function fetchPendingWaterDueAt(
  supabase: SupabaseClient,
  plantId: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from('care_tasks')
    .select('due_at')
    .eq('plant_id', plantId)
    .eq('type', 'water')
    .eq('status', 'pending')
    .maybeSingle()
  if (error) throw error
  return data?.due_at ?? null
}

export async function logWateringRecalcEvent(
  supabase: SupabaseClient,
  input: LogWateringRecalcInput
): Promise<void> {
  if (!wateringRecalcHasChange(
    input.previousDueAt,
    input.newDueAt,
    input.previousIntervalDays,
    input.newIntervalDays
  )) {
    return
  }

  const { error } = await supabase.from('watering_recalc_events').insert({
    user_id: input.userId,
    plant_id: input.plantId,
    plant_name: input.plantName,
    source: input.source,
    previous_due_at: input.previousDueAt,
    new_due_at: input.newDueAt,
    previous_interval_days: input.previousIntervalDays,
    new_interval_days: input.newIntervalDays
  })
  if (error) throw error
}
