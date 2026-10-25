import type { CareTaskType } from '#shared/types/database'
import { parseAppLocale } from '#shared/utils/i18n/locale'
import { translate } from '#shared/utils/i18n/translate'
import { buildDailyReminder, type ReminderTask } from '#shared/utils/push/buildDailyReminder'
import { sendPushToUser } from './sendToUser'

const PAGE_SIZE = 1000

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
}

function endOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    23, 59, 59, 999
  ))
}

interface PendingRow {
  id: string
  user_id: string
  plant_id: string
  type: CareTaskType
  due_at: string
  plant: { name: string, archived_at: string | null } | null
}

/** All pending tasks due today or earlier, paginated (PostgREST caps responses at 1000 rows). */
async function loadDueTasks(supabase: ReturnType<typeof getServiceSupabase>, until: Date): Promise<PendingRow[]> {
  const rows: PendingRow[] = []
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from('care_tasks')
      .select('id, user_id, plant_id, type, due_at, plant:plants(name, archived_at)')
      .eq('status', 'pending')
      .lte('due_at', until.toISOString())
      .order('id')
      .range(from, from + PAGE_SIZE - 1)
    if (error) throw error
    rows.push(...((data ?? []) as unknown as PendingRow[]))
    if (!data || data.length < PAGE_SIZE) break
  }
  return rows
}

export async function sendDailyPushReminders(
  publicKey: string,
  privateKey: string
): Promise<{ sent: number, eligible: number, skipped: number }> {
  const supabase = getServiceSupabase()
  const now = new Date()
  const startOfToday = startOfUtcDay(now).getTime()

  const rows = (await loadDueTasks(supabase, endOfUtcDay(now))).filter(row => row.plant && !row.plant.archived_at)
  if (!rows.length) {
    return { sent: 0, eligible: 0, skipped: 0 }
  }

  const byUser = new Map<string, ReminderTask[]>()
  for (const row of rows) {
    const list = byUser.get(row.user_id) ?? []
    list.push({
      id: row.id,
      plantId: row.plant_id,
      plantName: row.plant!.name,
      type: row.type,
      overdue: new Date(row.due_at).getTime() < startOfToday
    })
    byUser.set(row.user_id, list)
  }

  const { data: settingsRows, error: settingsError } = await supabase
    .from('user_settings')
    .select('user_id, locale')
    .in('user_id', [...byUser.keys()])
  if (settingsError) throw settingsError
  const localeByUser = new Map((settingsRows ?? []).map(r => [r.user_id, parseAppLocale(r.locale)]))

  let sent = 0
  let skipped = 0
  for (const [userId, tasks] of byUser) {
    const locale = localeByUser.get(userId) ?? 'es'
    const reminder = buildDailyReminder(tasks, locale)
    if (!reminder) {
      skipped++
      continue
    }
    const delivered = await sendPushToUser(supabase, userId, {
      title: reminder.title,
      body: reminder.body,
      url: reminder.url,
      tag: 'monstera-daily',
      taskIds: reminder.taskIds,
      actions: [
        { action: 'done', title: translate(locale, 'push.actionDone') },
        { action: 'snooze', title: translate(locale, 'push.actionSnooze') }
      ]
    }, { publicKey, privateKey })
    if (delivered) sent++
    else skipped++
  }

  return { sent, eligible: byUser.size, skipped }
}
