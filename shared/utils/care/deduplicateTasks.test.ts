import { describe, expect, it } from 'vitest'
import type { CareTask } from '../../types/database'
import { deduplicateOverlappingTasks, deduplicateResolvedTasks } from './deduplicateTasks'

function task(
  id: string,
  plantId: string,
  type: CareTask['type'],
  dueAt: string,
  status: CareTask['status'] = 'pending',
  completedAt: string | null = null
): CareTask {
  return {
    id,
    plant_id: plantId,
    user_id: 'user-1',
    type,
    due_at: dueAt,
    completed_at: completedAt,
    status,
    skip_reason: null,
    created_at: dueAt
  }
}

describe('deduplicateOverlappingTasks', () => {
  it('keeps only the first pending task per plant and type', () => {
    const tasks = [
      task('1', 'plant-a', 'check_in', '2026-06-01T10:00:00Z'),
      task('2', 'plant-a', 'check_in', '2026-06-02T10:00:00Z'),
      task('3', 'plant-b', 'water', '2026-06-01T10:00:00Z')
    ]
    const result = deduplicateOverlappingTasks(tasks)
    expect(result.map(t => t.id)).toEqual(['1', '3'])
  })
})

describe('deduplicateResolvedTasks', () => {
  it('prefers done over skipped for the same plant and type', () => {
    const tasks = [
      task('1', 'plant-a', 'check_in', '2026-06-01T10:00:00Z', 'skipped', '2026-06-15T09:00:00Z'),
      task('2', 'plant-a', 'check_in', '2026-06-01T10:00:00Z', 'done', '2026-06-15T09:05:00Z')
    ]
    const result = deduplicateResolvedTasks(tasks)
    expect(result).toHaveLength(1)
    expect(result[0]?.id).toBe('2')
    expect(result[0]?.status).toBe('done')
  })

  it('keeps the most recent task when statuses match', () => {
    const tasks = [
      task('1', 'plant-a', 'check_in', '2026-06-01T10:00:00Z', 'skipped', '2026-06-15T09:00:00Z'),
      task('2', 'plant-a', 'check_in', '2026-06-01T10:00:00Z', 'skipped', '2026-06-15T09:10:00Z')
    ]
    const result = deduplicateResolvedTasks(tasks)
    expect(result).toHaveLength(1)
    expect(result[0]?.id).toBe('2')
  })

  it('sorts results by completed_at descending', () => {
    const tasks = [
      task('1', 'plant-a', 'check_in', '2026-06-01T10:00:00Z', 'done', '2026-06-15T09:00:00Z'),
      task('2', 'plant-b', 'water', '2026-06-01T10:00:00Z', 'done', '2026-06-15T10:00:00Z')
    ]
    const result = deduplicateResolvedTasks(tasks)
    expect(result.map(t => t.id)).toEqual(['2', '1'])
  })
})
