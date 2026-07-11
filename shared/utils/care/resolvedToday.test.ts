import { describe, expect, it } from 'vitest'
import type { CareTask } from '../../types/database'
import { careTaskKey, excludePendingResolvedToday } from './resolvedToday'

function task(
  id: string,
  plantId: string,
  type: CareTask['type'],
  status: CareTask['status']
): CareTask {
  return {
    id,
    plant_id: plantId,
    user_id: 'user-1',
    type,
    due_at: '2026-07-11T10:00:00Z',
    status,
    completed_at: status === 'pending' ? null : '2026-07-11T12:00:00Z',
    skip_reason: null,
    created_at: '2026-07-01T10:00:00Z'
  }
}

describe('excludePendingResolvedToday', () => {
  it('removes pending tasks when the same plant and type was resolved today', () => {
    const pending = [
      task('1', 'plant-a', 'water', 'pending'),
      task('2', 'plant-b', 'water', 'pending')
    ]
    const resolved = [task('3', 'plant-a', 'water', 'skipped')]

    const result = excludePendingResolvedToday(pending, resolved)
    expect(result.map(t => t.id)).toEqual(['2'])
  })

  it('keeps pending tasks when only another type was resolved today', () => {
    const pending = [task('1', 'plant-a', 'water', 'pending')]
    const resolved = [task('2', 'plant-a', 'fertilize', 'done')]

    expect(excludePendingResolvedToday(pending, resolved)).toHaveLength(1)
  })
})

describe('careTaskKey', () => {
  it('combines plant id and task type', () => {
    expect(careTaskKey({ plant_id: 'p1', type: 'water' })).toBe('p1:water')
  })
})
