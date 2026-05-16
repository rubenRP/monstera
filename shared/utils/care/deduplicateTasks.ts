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
