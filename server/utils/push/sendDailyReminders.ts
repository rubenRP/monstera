import webpush from 'web-push'
import { parseAppLocale } from '#shared/utils/i18n/locale'
import { translate } from '#shared/utils/i18n/translate'
import {
  getLocalDateTimeParts,
  shouldSendPushReminder,
  type PushReminderSettings
} from '#shared/utils/push/reminderSchedule'

function endOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    23, 59, 59, 999
  ))
}

function isExpiredPushSubscription(error: unknown): boolean {
  const statusCode = (error as { statusCode?: number }).statusCode
  return statusCode === 410 || statusCode === 404
}

export async function sendDailyPushReminders(
  publicKey: string,
  privateKey: string
): Promise<{ sent: number, eligible: number, skipped: number }> {
  webpush.setVapidDetails('mailto:monstera@local.dev', publicKey, privateKey)

  const supabase = getServiceSupabase()
  const now = new Date()
  const endOfToday = endOfUtcDay(now)

  const { data: tasks } = await supabase
    .from('care_tasks')
    .select('user_id, plant:plants(name, archived_at)')
    .eq('status', 'pending')
    .lte('due_at', endOfToday.toISOString())

  const activeTasks = (tasks ?? []).filter(
    t => !(t.plant as { archived_at?: string | null } | null)?.archived_at
  )

  if (!activeTasks.length) {
    return { sent: 0, eligible: 0, skipped: 0 }
  }

  const byUser = new Map<string, number>()
  for (const t of activeTasks) {
    byUser.set(t.user_id, (byUser.get(t.user_id) ?? 0) + 1)
  }

  const userIds = [...byUser.keys()]

  const { data: settingsRows } = await supabase
    .from('user_settings')
    .select('user_id, locale, push_reminder_time, push_reminder_timezone, push_reminder_last_sent_on')
    .in('user_id', userIds)

  const settingsByUser = new Map(
    (settingsRows ?? []).map(r => [r.user_id, r])
  )

  let sent = 0
  let eligible = 0
  let skipped = 0
  for (const [userId, count] of byUser) {
    const settings = settingsByUser.get(userId) as PushReminderSettings | undefined
    if (!shouldSendPushReminder(settings ?? {}, now)) {
      skipped++
      continue
    }

    eligible++

    const locale = parseAppLocale(
      (settings as { locale?: string } | undefined)?.locale
    )
    const { data: subs } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', userId)

    if (!subs?.length) continue

    const payload = JSON.stringify({
      title: translate(locale, 'push.title'),
      body: count === 1
        ? translate(locale, 'push.bodyOne')
        : translate(locale, 'push.bodyMany', { count }),
      url: '/'
    })

    let userSent = 0
    for (const sub of subs) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth }
          },
          payload
        )
        userSent++
        sent++
      } catch (e) {
        console.error('Push failed:', e)
        if (isExpiredPushSubscription(e)) {
          await supabase.from('push_subscriptions').delete().eq('id', sub.id)
        }
      }
    }

    if (userSent > 0) {
      const timeZone = settings?.push_reminder_timezone || 'UTC'
      const { dateStr } = getLocalDateTimeParts(now, timeZone)
      await supabase
        .from('user_settings')
        .update({ push_reminder_last_sent_on: dateStr })
        .eq('user_id', userId)
    }
  }

  return { sent, eligible, skipped }
}
