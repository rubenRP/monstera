import webpush from 'web-push'
import { parseAppLocale } from '#shared/utils/i18n/locale'
import { translate } from '#shared/utils/i18n/translate'

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
  // #region agent log
  fetch('http://127.0.0.1:7401/ingest/9091c024-be74-4200-9f61-bbd636b895d0', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '3e6abf' }, body: JSON.stringify({ sessionId: '3e6abf', runId: 'initial', hypothesisId: 'H2', location: 'sendDailyReminders.ts:start', message: 'Daily reminder run started', data: { hasPublicKey: Boolean(publicKey), hasPrivateKey: Boolean(privateKey) }, timestamp: Date.now() }) }).catch(() => {})
  // #endregion
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
  // #region agent log
  fetch('http://127.0.0.1:7401/ingest/9091c024-be74-4200-9f61-bbd636b895d0', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '3e6abf' }, body: JSON.stringify({ sessionId: '3e6abf', runId: 'initial', hypothesisId: 'H3', location: 'sendDailyReminders.ts:tasks', message: 'Tasks loaded for push', data: { rawTasksCount: (tasks ?? []).length, activeTasksCount: activeTasks.length, endOfTodayIso: endOfToday.toISOString() }, timestamp: Date.now() }) }).catch(() => {})
  // #endregion

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
    .select('user_id, locale')
    .in('user_id', userIds)

  const settingsByUser = new Map(
    (settingsRows ?? []).map(r => [r.user_id, r])
  )

  let sent = 0
  let eligible = 0
  const skipped = 0
  for (const [userId, count] of byUser) {
    const settings = settingsByUser.get(userId) as { locale?: string | null } | undefined
    // #region agent log
    fetch('http://127.0.0.1:7401/ingest/9091c024-be74-4200-9f61-bbd636b895d0', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '3e6abf' }, body: JSON.stringify({ sessionId: '3e6abf', runId: 'initial', hypothesisId: 'H2', location: 'sendDailyReminders.ts:user-eligibility', message: 'User marked eligible by pending tasks', data: { userId, taskCount: count, shouldSend: true }, timestamp: Date.now() }) }).catch(() => {})
    // #endregion
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
        // #region agent log
        fetch('http://127.0.0.1:7401/ingest/9091c024-be74-4200-9f61-bbd636b895d0', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '3e6abf' }, body: JSON.stringify({ sessionId: '3e6abf', runId: 'initial', hypothesisId: 'H4', location: 'sendDailyReminders.ts:send-error', message: 'Push delivery failed', data: { statusCode: (e as { statusCode?: number })?.statusCode || null, errorName: (e as { name?: string })?.name || null }, timestamp: Date.now() }) }).catch(() => {})
        // #endregion
        console.error('Push failed:', e)
        if (isExpiredPushSubscription(e)) {
          await supabase.from('push_subscriptions').delete().eq('id', sub.id)
        }
      }
    }

    void userSent
  }

  // #region agent log
  fetch('http://127.0.0.1:7401/ingest/9091c024-be74-4200-9f61-bbd636b895d0', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '3e6abf' }, body: JSON.stringify({ sessionId: '3e6abf', runId: 'initial', hypothesisId: 'H4', location: 'sendDailyReminders.ts:finish', message: 'Daily reminder run finished', data: { sent, eligible, skipped }, timestamp: Date.now() }) }).catch(() => {})
  // #endregion
  return { sent, eligible, skipped }
}
