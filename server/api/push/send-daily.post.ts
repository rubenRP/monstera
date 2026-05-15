import webpush from 'web-push'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const secret = getHeader(event, 'x-cron-secret')
  if (secret !== process.env.CRON_SECRET) {
    throw createError({ statusCode: 403, message: 'Forbidden' })
  }

  const publicKey = config.public.vapidPublicKey || process.env.NUXT_PUBLIC_VAPID_PUBLIC_KEY
  const privateKey = config.vapidPrivateKey || process.env.VAPID_PRIVATE_KEY
  if (!publicKey || !privateKey) {
    throw createError({ statusCode: 503, message: 'VAPID no configurado' })
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

  let sent = 0
  for (const [userId, count] of byUser) {
    const { data: subs } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', userId)

    if (!subs?.length) continue

    const payload = JSON.stringify({
      title: 'Monstera',
      body: count === 1
        ? 'Tienes 1 tarea de cuidado pendiente hoy'
        : `Tienes ${count} tareas de cuidado pendientes hoy`,
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
  }

  return { sent }
})
