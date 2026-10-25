import type { CareTask, CareTaskType, Plant } from '../../types/database'

export type PlantIntervals = Pick<
  Plant,
  'watering_interval_days' | 'fertilizing_interval_days' | 'check_in_interval_days'
>

export interface ProjectedCareTask {
  /** Synthetic id: `<taskId>:<n>` */
  id: string
  sourceTaskId: string
  plant_id: string
  type: CareTaskType
  due_at: string
  plant: CareTask['plant']
}

function intervalFor(type: CareTaskType, plant: PlantIntervals): number | null {
  const days = type === 'water'
    ? plant.watering_interval_days
    : type === 'fertilize'
      ? plant.fertilizing_interval_days
      : plant.check_in_interval_days
  return days && days >= 1 ? days : null
}

function startOfDay(d: Date): Date {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

/**
 * Future occurrences of each pending task inside [rangeStart, rangeEnd], assuming the
 * current interval is kept. Only one real task exists per plant/type, so the calendar
 * would otherwise look empty after the next occurrence. Overdue tasks project from today.
 */
export function projectRecurrences(
  pending: Array<CareTask & { plant?: CareTask['plant'] & Partial<PlantIntervals> }>,
  rangeStart: Date,
  rangeEnd: Date,
  now: Date = new Date(),
  maxPerTask = 60
): ProjectedCareTask[] {
  const out: ProjectedCareTask[] = []
  const today = startOfDay(now)
  const end = rangeEnd.getTime()
  const start = startOfDay(rangeStart).getTime()

  for (const task of pending) {
    if (task.status !== 'pending' || !task.plant) continue
    const interval = intervalFor(task.type, task.plant as PlantIntervals)
    if (!interval) continue

    const due = new Date(task.due_at)
    const anchor = due.getTime() < today.getTime()
      ? new Date(today.getFullYear(), today.getMonth(), today.getDate(), due.getHours(), due.getMinutes())
      : due

    for (let n = 1; n <= maxPerTask; n++) {
      const next = new Date(anchor)
      next.setDate(next.getDate() + interval * n)
      if (next.getTime() > end) break
      if (next.getTime() < start) continue
      out.push({
        id: `${task.id}:${n}`,
        sourceTaskId: task.id,
        plant_id: task.plant_id,
        type: task.type,
        due_at: next.toISOString(),
        plant: task.plant
      })
    }
  }
  return out
}
