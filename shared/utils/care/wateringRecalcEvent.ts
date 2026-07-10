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
    | 'home_settings_update'

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

export function inferPreviousWaterDueAt(input: {
  pendingDueAt: string | null
  lastWateredAt: string | null
  intervalDays: number | null
}): string | null {
  if (input.pendingDueAt) return input.pendingDueAt
  if (!input.lastWateredAt || input.intervalDays == null) return null
  const anchor = new Date(input.lastWateredAt)
  anchor.setDate(anchor.getDate() + input.intervalDays)
  return anchor.toISOString()
}

export function wateringRecalcHasChange(
  _previousDueAt: string | null,
  _newDueAt: string,
  previousIntervalDays: number | null,
  newIntervalDays: number
): boolean {
  return previousIntervalDays != null && previousIntervalDays !== newIntervalDays
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
