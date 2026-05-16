import webpush from 'web-push'
import { API_ERROR_CODES } from '#shared/utils/i18n/apiErrors'
import { parseAppLocale } from '#shared/utils/i18n/locale'
import { translate } from '#shared/utils/i18n/translate'
import {
  getLocalDateTimeParts,
  shouldSendPushReminder,
  type PushReminderSettings
} from '#shared/utils/push/reminderSchedule'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const secret = getHeader(event, 'x-cron-secret')
  if (secret !== process.env.CRON_SECRET) {
    throwApiError(403, API_ERROR_CODES.CRON_FORBIDDEN)
  }

  const publicKey = config.public.vapidPublicKey || process.env.NUXT_PUBLIC_VAPID_PUBLIC_KEY
  const privateKey = config.vapidPrivateKey || process.env.VAPID_PRIVATE_KEY
  if (!publicKey || !privateKey) {
    throwApiError(503, API_ERROR_CODES.VAPID_NOT_CONFIGURED)
  }

  webpush.setVapidDetails('mailto:monstera@local.dev', publicKey, privateKey)

  const supabase = getServiceSupabase()
  const endOfToday = new Date()
  endOfToday.setHours(23, 59, 59, 999)

  const { data: tasks } = await supabase
    .from('care_tasks')
    .select('user_id, plant:plants(name)')
    .eq('status', 'pending')
    .lte('due_at', endOfToday.toISOString())

  if (!tasks?.length) {
    return { sent: 0 }
  }

  const byUser = new Map<string, number>()
  for (const t of tasks) {
    byUser.set(t.user_id, (byUser.get(t.user_id) ?? 0) + 1)
  }

  const userIds = [...byUser.keys()]
  const now = new Date()

  const { data: settingsRows } = await supabase
    .from('user_settings')
    .select('user_id, locale, push_reminder_time, push_reminder_timezone, push_reminder_last_sent_on')
    .in('user_id', userIds)

  const settingsByUser = new Map(
    (settingsRows ?? []).map(r => [r.user_id, r])
  )

  let sent = 0
  for (const [userId, count] of byUser) {
    const settings = settingsByUser.get(userId) as PushReminderSettings | undefined
    if (!shouldSendPushReminder(settings ?? {}, now)) continue

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

    for (const sub of subs) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth }
          },
          payload
        )
        sent++
      } catch (e) {
        console.error('Push failed:', e)
      }
    }

    const timeZone = settings?.push_reminder_timezone || 'UTC'
    const { dateStr } = getLocalDateTimeParts(now, timeZone)
    await supabase
      .from('user_settings')
      .update({ push_reminder_last_sent_on: dateStr })
      .eq('user_id', userId)
  }

  return { sent }
})
