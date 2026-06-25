export type WateringRecalcSource
  = | 'season_sync'
    | 'fertilize_align_sync'
    | 'plant_create'
    | 'plant_edit'
    | 'plant_move'
    | 'task_complete'
    | 'task_skip'
    | 'base_interval_update'
    | 'cron_exterior'
    | 'manual_exterior'

export interface WateringRecalcEvent {
  id: string
  user_id: string
  plant_id: string
  plant_name: string
  source: WateringRecalcSource
  previous_due_at: string | null
  new_due_at: string
  previous_interval_days: number | null
  new_interval_days: number
  dismissed_at: string | null
  created_at: string
}

export interface WateringRecalcSnapshot {
  plantName: string
  intervalDays: number | null
  dueAt: string | null
}

export function wateringRecalcHasChange(
  previousDueAt: string | null,
  newDueAt: string,
  previousIntervalDays: number | null,
  newIntervalDays: number
): boolean {
  const dueChanged = previousDueAt == null || previousDueAt !== newDueAt
  const intervalChanged = previousIntervalDays == null || previousIntervalDays !== newIntervalDays
  return dueChanged || intervalChanged
}
