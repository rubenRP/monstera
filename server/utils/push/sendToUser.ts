import webpush from 'web-push'
import type { SupabaseClient } from '@supabase/supabase-js'

export interface PushPayload {
  title: string
  body: string
  url?: string
  tag?: string
  /** Tasks the notification is about, used by the "done" / "snooze" actions in sw-push.js */
  taskIds?: string[]
  actions?: Array<{ action: 'done' | 'snooze', title: string }>
}

function isExpiredPushSubscription(error: unknown): boolean {
  const statusCode = (error as { statusCode?: number }).statusCode
  return statusCode === 410 || statusCode === 404
}

/** Sends to every subscription of the user; expired ones (404/410) are removed. Returns how many succeeded. */
export async function sendPushToUser(
  supabase: SupabaseClient,
  userId: string,
  payload: PushPayload,
  vapid: { publicKey: string, privateKey: string }
): Promise<number> {
  webpush.setVapidDetails('mailto:monstera@local.dev', vapid.publicKey, vapid.privateKey)

  const { data: subs, error } = await supabase
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth')
    .eq('user_id', userId)
  if (error) throw error

  let sent = 0
  for (const sub of subs ?? []) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify(payload)
      )
      sent++
    } catch (e) {
      console.error('Push failed:', e)
      if (isExpiredPushSubscription(e)) {
        await supabase.from('push_subscriptions').delete().eq('id', sub.id)
      }
    }
  }
  return sent
}
