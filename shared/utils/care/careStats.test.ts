import { describe, expect, it } from 'vitest'
import { computeCareStats, isOnTime, type CompletedTaskForStats } from './careStats'

const t = (plant: string, due: string, done: string): CompletedTaskForStats => ({
  plant_id: plant,
  plantName: plant.toUpperCase(),
  type: 'water',
  due_at: new Date(due).toISOString(),
  completed_at: new Date(done).toISOString()
})

describe('isOnTime', () => {
  it('accepts completion on the due day or earlier', () => {
    expect(isOnTime(t('a', '2026-10-10T09:00', '2026-10-10T21:00'))).toBe(true)
    expect(isOnTime(t('a', '2026-10-10T09:00', '2026-10-08T21:00'))).toBe(true)
    expect(isOnTime(t('a', '2026-10-10T09:00', '2026-10-11T08:00'))).toBe(false)
  })
})

describe('computeCareStats', () => {
  it('computes punctuality, current streak and the latest plants', () => {
    const stats = computeCareStats([
      t('a', '2026-10-20T09:00', '2026-10-20T10:00'),
      t('b', '2026-10-18T09:00', '2026-10-18T10:00'),
      t('c', '2026-10-15T09:00', '2026-10-17T10:00'),
      t('c', '2026-10-05T09:00', '2026-10-06T10:00'),
      t('a', '2026-10-01T09:00', '2026-10-01T10:00')
    ])
    expect(stats.completed).toBe(5)
    expect(stats.onTimePct).toBe(60)
    expect(stats.streak).toBe(2)
    expect(stats.latePlants).toEqual([{ plantId: 'c', name: 'C', late: 2 }])
  })

  it('handles an empty window', () => {
    expect(computeCareStats([])).toEqual({ completed: 0, onTime: 0, onTimePct: null, streak: 0, latePlants: [] })
  })
})
