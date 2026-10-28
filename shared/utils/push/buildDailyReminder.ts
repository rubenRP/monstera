import type { CareTaskType } from '../../types/database'
import type { AppLocale } from '../i18n/locale'
import { translate } from '../i18n/translate'

export interface ReminderTask {
  id: string
  plantId: string
  plantName: string
  type: CareTaskType
  overdue: boolean
}

export interface DailyReminder {
  title: string
  body: string
  /** Opens the plant when there is a single plant, else the home screen */
  url: string
  taskIds: string[]
  count: number
}

const TYPE_ORDER: CareTaskType[] = ['water', 'fertilize', 'check_in']
const TYPE_KEY: Record<CareTaskType, string> = {
  water: 'push.lineWater',
  fertilize: 'push.lineFertilize',
  check_in: 'push.lineCheckIn'
}
const MAX_NAMES = 3

/** One task per plant and type (duplicates and archived plants are removed by the caller's query). */
export function dedupeReminderTasks(tasks: ReminderTask[]): ReminderTask[] {
  const seen = new Map<string, ReminderTask>()
  for (const task of tasks) {
    const key = `${task.plantId}:${task.type}`
    const prev = seen.get(key)
    if (!prev || (task.overdue && !prev.overdue)) seen.set(key, task)
  }
  return [...seen.values()]
}

function joinNames(names: string[], locale: AppLocale): string {
  const shown = names.slice(0, MAX_NAMES)
  const rest = names.length - shown.length
  const list = shown.join(', ')
  return rest > 0 ? `${list} ${translate(locale, 'push.andMore', { count: rest })}` : list
}

/**
 * "💧 Riega: Monstera, Pothos +2" lines per task type, so the notification says what to do
 * instead of only "you have N tasks".
 */
export function buildDailyReminder(input: ReminderTask[], locale: AppLocale): DailyReminder | null {
  const tasks = dedupeReminderTasks(input)
  if (!tasks.length) return null

  const lines = TYPE_ORDER.flatMap((type) => {
    const names = [...new Set(tasks.filter(t => t.type === type).map(t => t.plantName))]
    return names.length ? [translate(locale, TYPE_KEY[type], { plants: joinNames(names, locale) })] : []
  })

  const overdue = tasks.filter(t => t.overdue).length
  const title = tasks.length === 1
    ? translate(locale, 'push.titleOne')
    : translate(locale, 'push.titleMany', { count: tasks.length })
  const overdueLine = overdue ? [translate(locale, 'push.overdueLine', { count: overdue })] : []
  const plantIds = new Set(tasks.map(t => t.plantId))

  return {
    title,
    body: [...lines, ...overdueLine].join('\n'),
    url: plantIds.size === 1 ? `/plants/${[...plantIds][0]}` : '/',
    taskIds: tasks.map(t => t.id),
    count: tasks.length
  }
}
