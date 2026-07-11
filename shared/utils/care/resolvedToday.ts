import type { SupabaseClient } from '@supabase/supabase-js'
import type { CareTask, CareTaskType } from '../../types/database'

export function calendarDayBounds(date = new Date()): { start: Date, end: Date } {
  const start = new Date(date)
  start.setHours(0, 0, 0, 0)
  const end = new Date(date)
  end.setHours(23, 59, 59, 999)
  return { start, end }
}

export function careTaskKey(task: Pick<CareTask, 'plant_id' | 'type'>): string {
  return `${task.plant_id}:${task.type}`
}

/** Hide pending tasks when the same plant and type was already done or skipped today. */
export function excludePendingResolvedToday(
  pending: CareTask[],
  resolvedToday: CareTask[]
): CareTask[] {
  const resolvedKeys = new Set(resolvedToday.map(careTaskKey))
  return pending.filter(task => !resolvedKeys.has(careTaskKey(task)))
}

export async function wasCareTaskResolvedToday(
  supabase: SupabaseClient,
  plantId: string,
  type: CareTaskType,
  now = new Date()
): Promise<boolean> {
  const { start, end } = calendarDayBounds(now)
  const { count, error } = await supabase
    .from('care_tasks')
    .select('*', { count: 'exact', head: true })
    .eq('plant_id', plantId)
    .eq('type', type)
    .in('status', ['done', 'skipped'])
    .gte('completed_at', start.toISOString())
    .lte('completed_at', end.toISOString())
  if (error) throw error
  return (count ?? 0) > 0
}

export async function loadWaterResolvedTodayPlantIds(
  supabase: SupabaseClient,
  plantIds: string[],
  now = new Date()
): Promise<Set<string>> {
  if (!plantIds.length) return new Set()

  const { start, end } = calendarDayBounds(now)
  const { data, error } = await supabase
    .from('care_tasks')
    .select('plant_id')
    .eq('type', 'water')
    .in('status', ['done', 'skipped'])
    .in('plant_id', plantIds)
    .gte('completed_at', start.toISOString())
    .lte('completed_at', end.toISOString())
  if (error) throw error

  return new Set((data ?? []).map(row => row.plant_id))
}
