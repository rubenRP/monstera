import { describe, expect, it } from 'vitest'
import type { CareTask } from '../../types/database'
import { projectRecurrences } from './projectRecurrences'

const plant = {
  id: 'p1',
  name: 'Monstera',
  photo_path: null,
  health_status: 'healthy' as const,
  archived_at: null,
  last_watered_at: null,
  site: null,
  watering_interval_days: 7,
  fertilizing_interval_days: 30,
  check_in_interval_days: 30
}

function task(overrides: Partial<CareTask>): CareTask {
  return {
    id: 't1',
    plant_id: 'p1',
    user_id: 'u1',
    type: 'water',
    due_at: '2026-11-02T09:00:00.000Z',
    completed_at: null,
    status: 'pending',
    skip_reason: null,
    created_at: '2026-10-01T00:00:00.000Z',
    plant,
    ...overrides
  } as CareTask
}

const now = new Date('2026-10-25T10:00:00.000Z')

describe('projectRecurrences', () => {
  it('repeats the pending task every interval within the range', () => {
    const out = projectRecurrences(
      [task({})],
      new Date('2026-11-01T00:00:00.000Z'),
      new Date('2026-11-30T23:59:59.000Z'),
      now
    )
    expect(out.map(o => o.due_at.slice(0, 10))).toEqual(['2026-11-09', '2026-11-16', '2026-11-23', '2026-11-30'])
    expect(out[0]!.sourceTaskId).toBe('t1')
  })

  it('projects overdue tasks from today', () => {
    const out = projectRecurrences(
      [task({ due_at: '2026-10-10T09:00:00.000Z' })],
      new Date('2026-10-25T00:00:00.000Z'),
      new Date('2026-11-10T23:59:59.000Z'),
      now
    )
    expect(out.map(o => o.due_at.slice(0, 10))).toEqual(['2026-11-01', '2026-11-08'])
  })

  it('uses the interval of each task type and skips resolved tasks', () => {
    const out = projectRecurrences(
      [
        task({ id: 'f1', type: 'fertilize', due_at: '2026-10-28T09:00:00.000Z' }),
        task({ id: 'd1', status: 'done' })
      ],
      new Date('2026-10-25T00:00:00.000Z'),
      new Date('2026-12-31T23:59:59.000Z'),
      now
    )
    expect(out.map(o => o.id)).toEqual(['f1:1', 'f1:2'])
    expect(out.map(o => o.due_at.slice(0, 10))).toEqual(['2026-11-27', '2026-12-27'])
  })
})
