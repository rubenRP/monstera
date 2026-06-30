import { isSameCalendarDay } from './alignFertilize'

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
    | 'cron_indoor'
    | 'manual_exterior'
    | 'manual_all'

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
  const dueChanged = previousDueAt != null && !isSameCalendarDay(previousDueAt, newDueAt)
  const intervalChanged = previousIntervalDays != null && previousIntervalDays !== newIntervalDays
  const createdFirstTask = previousDueAt == null
  return dueChanged || intervalChanged || createdFirstTask
}

export function wateringRecalcEventHasChange(
  event: Pick<
    WateringRecalcEvent,
    'previous_due_at' | 'new_due_at' | 'previous_interval_days' | 'new_interval_days'
  >
): boolean {
  return wateringRecalcHasChange(
    event.previous_due_at,
    event.new_due_at,
    event.previous_interval_days,
    event.new_interval_days
  )
}
