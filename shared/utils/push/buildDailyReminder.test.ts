import { describe, expect, it } from 'vitest'
import { buildDailyReminder, type ReminderTask } from './buildDailyReminder'

const task = (id: string, plantId: string, plantName: string, type: ReminderTask['type'], overdue = false): ReminderTask =>
  ({ id, plantId, plantName, type, overdue })

describe('buildDailyReminder', () => {
  it('lists plants per task type and links to home', () => {
    const r = buildDailyReminder([
      task('1', 'p1', 'Monstera', 'water'),
      task('2', 'p2', 'Pothos', 'water'),
      task('3', 'p2', 'Pothos', 'fertilize')
    ], 'es')!
    expect(r.title).toBe('3 tareas para hoy')
    expect(r.body).toBe('💧 Regar: Monstera, Pothos\n🧪 Abonar: Pothos')
    expect(r.url).toBe('/')
    expect(r.taskIds).toEqual(['1', '2', '3'])
  })

  it('removes duplicate tasks and mentions overdue ones', () => {
    const r = buildDailyReminder([
      task('1', 'p1', 'Monstera', 'water'),
      task('1b', 'p1', 'Monstera', 'water', true)
    ], 'en')!
    expect(r.count).toBe(1)
    expect(r.title).toBe('1 task for today')
    expect(r.body).toBe('💧 Water: Monstera\n⏰ 1 overdue')
    expect(r.url).toBe('/plants/p1')
  })

  it('truncates long plant lists', () => {
    const many = ['A', 'B', 'C', 'D', 'E'].map((n, i) => task(String(i), `p${i}`, n, 'water'))
    expect(buildDailyReminder(many, 'es')!.body).toBe('💧 Regar: A, B, C y 2 más')
  })

  it('returns null when there is nothing to do', () => {
    expect(buildDailyReminder([], 'es')).toBeNull()
  })
})
