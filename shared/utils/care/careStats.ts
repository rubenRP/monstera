import type { CareTaskType } from '../../types/database'

export interface CompletedTaskForStats {
  plant_id: string
  plantName: string
  type: CareTaskType
  due_at: string
  completed_at: string
}

export interface CareStats {
  completed: number
  onTime: number
  /** 0–100, null when nothing was completed in the window */
  onTimePct: number | null
  /** Consecutive on-time completions, most recent first */
  streak: number
  /** Plants with late completions, worst first (max 3) */
  latePlants: Array<{ plantId: string, name: string, late: number }>
}

function dayStart(iso: string): number {
  const d = new Date(iso)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

/** A task counts as on time when completed on or before its due day (local calendar days). */
export function isOnTime(task: Pick<CompletedTaskForStats, 'due_at' | 'completed_at'>): boolean {
  return dayStart(task.completed_at) <= dayStart(task.due_at)
}

export function computeCareStats(tasks: CompletedTaskForStats[]): CareStats {
  const sorted = [...tasks].sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime())
  const onTime = sorted.filter(isOnTime).length

  let streak = 0
  for (const task of sorted) {
    if (!isOnTime(task)) break
    streak++
  }

  const late = new Map<string, { plantId: string, name: string, late: number }>()
  for (const task of sorted) {
    if (isOnTime(task)) continue
    const entry = late.get(task.plant_id) ?? { plantId: task.plant_id, name: task.plantName, late: 0 }
    entry.late++
    late.set(task.plant_id, entry)
  }

  return {
    completed: sorted.length,
    onTime,
    onTimePct: sorted.length ? Math.round((onTime / sorted.length) * 100) : null,
    streak,
    latePlants: [...late.values()].sort((a, b) => b.late - a.late || a.name.localeCompare(b.name)).slice(0, 3)
  }
}
