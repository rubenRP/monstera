import type { CareTask } from '../../types/database'

function taskKey(task: Pick<CareTask, 'plant_id' | 'type'>): string {
  return `${task.plant_id}:${task.type}`
}

/** Keeps only the most overdue pending task per plant and type (earliest due_at). */
export function deduplicateOverlappingTasks(tasks: CareTask[]): CareTask[] {
  const seen = new Set<string>()
  const result: CareTask[] = []

  for (const task of tasks) {
    const key = taskKey(task)
    if (seen.has(key)) continue
    seen.add(key)
    result.push(task)
  }

  return result
}

function resolvedTaskRank(task: CareTask): number {
  if (task.status === 'done') return 2
  return 1
}

/** One entry per plant and type; prefers done over skipped, then most recent. */
export function deduplicateResolvedTasks(tasks: CareTask[]): CareTask[] {
  const best = new Map<string, CareTask>()

  for (const task of tasks) {
    const key = taskKey(task)
    const current = best.get(key)
    if (!current) {
      best.set(key, task)
      continue
    }

    const taskRank = resolvedTaskRank(task)
    const currentRank = resolvedTaskRank(current)
    if (taskRank > currentRank) {
      best.set(key, task)
      continue
    }
    if (taskRank < currentRank) continue

    const taskAt = task.completed_at ? new Date(task.completed_at).getTime() : 0
    const currentAt = current.completed_at ? new Date(current.completed_at).getTime() : 0
    if (taskAt > currentAt) {
      best.set(key, task)
    }
  }

  return [...best.values()].sort((a, b) => {
    const aAt = a.completed_at ? new Date(a.completed_at).getTime() : 0
    const bAt = b.completed_at ? new Date(b.completed_at).getTime() : 0
    return bAt - aAt
  })
}
