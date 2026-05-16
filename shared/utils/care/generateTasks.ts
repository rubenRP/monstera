import type { CareTaskType } from '../../types/database'

export interface TaskToInsert {
  type: CareTaskType
  due_at: string
}

/** Must cover max fertilizing_interval_days (365) so at least one task is generated. */
const HORIZON_DAYS = 365

export function generateCareTasks(
  wateringIntervalDays: number,
  fertilizingIntervalDays: number,
  lastWateredAt: Date | null,
  lastFertilizedAt: Date | null,
  fromDate: Date = new Date()
): TaskToInsert[] {
  const tasks: TaskToInsert[] = []
  const end = new Date(fromDate)
  end.setDate(end.getDate() + HORIZON_DAYS)

  let waterCursor = lastWateredAt
    ? new Date(lastWateredAt)
    : new Date(fromDate)
  waterCursor.setDate(waterCursor.getDate() + wateringIntervalDays)
  while (waterCursor <= end) {
    if (waterCursor >= fromDate) {
      tasks.push({ type: 'water', due_at: waterCursor.toISOString() })
    }
    waterCursor = new Date(waterCursor)
    waterCursor.setDate(waterCursor.getDate() + wateringIntervalDays)
  }

  let fertCursor = lastFertilizedAt
    ? new Date(lastFertilizedAt)
    : new Date(fromDate)
  fertCursor.setDate(fertCursor.getDate() + fertilizingIntervalDays)
  while (fertCursor <= end) {
    if (fertCursor >= fromDate) {
      tasks.push({ type: 'fertilize', due_at: fertCursor.toISOString() })
    }
    fertCursor = new Date(fertCursor)
    fertCursor.setDate(fertCursor.getDate() + fertilizingIntervalDays)
  }

  return tasks.sort((a, b) => new Date(a.due_at).getTime() - new Date(b.due_at).getTime())
}

export function nextTaskDue(
  intervalDays: number,
  lastDoneAt: Date | null,
  fromDate: Date = new Date()
): string {
  const base = lastDoneAt ? new Date(lastDoneAt) : new Date(fromDate)
  base.setDate(base.getDate() + intervalDays)
  return base.toISOString()
}
