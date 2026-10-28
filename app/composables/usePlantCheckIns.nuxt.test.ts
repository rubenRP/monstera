import { describe, expect, it } from 'vitest'
import type { CareTask, Diagnosis, PlantCheckIn } from '#shared/types/database'
import { mergeCareHistory } from './usePlantCheckIns'

const task = (id: string, completed_at: string, type: CareTask['type'] = 'water') =>
  ({ id, type, status: 'done', completed_at }) as CareTask
const checkIn = (id: string, created_at: string, care_task_id: string | null) =>
  ({ id, created_at, care_task_id }) as PlantCheckIn
const diagnosis = (id: string, created_at: string) => ({ id, created_at }) as Diagnosis

describe('mergeCareHistory', () => {
  it('merges tasks, check-ins and diagnoses newest first', () => {
    const entries = mergeCareHistory(
      [task('t1', '2026-10-01T10:00:00Z')],
      [checkIn('c1', '2026-10-03T10:00:00Z', null)],
      [diagnosis('d1', '2026-10-02T10:00:00Z')]
    )
    expect(entries.map(e => e.kind)).toEqual(['check_in', 'diagnosis', 'task'])
  })

  it('hides the completed check-in task already shown by its check-in record', () => {
    const entries = mergeCareHistory(
      [task('t-check', '2026-10-03T10:00:00Z', 'check_in'), task('t1', '2026-10-01T10:00:00Z')],
      [checkIn('c1', '2026-10-03T10:00:00Z', 't-check')]
    )
    expect(entries.map(e => e.kind)).toEqual(['check_in', 'task'])
  })
})
