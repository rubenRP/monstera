export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { endpoint, keys } = body as { endpoint?: string, keys?: { p256dh?: string, auth?: string } }
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    throw createError({ statusCode: 400, message: 'Suscripción inválida' })
  }

  const supabase = getServiceSupabase()
  const authHeader = getHeader(event, 'authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    throw createError({ statusCode: 401, message: 'No autorizado' })
  }
  const token = authHeader.slice(7)
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) {
    throw createError({ statusCode: 401, message: 'Sesión inválida' })
  }

  const { error } = await supabase.from('push_subscriptions').upsert(
    {
      user_id: user.id,
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth
    },
    { onConflict: 'endpoint' }
  )

  if (error) {
    throw createError({ statusCode: 500, message: error.message })
  }

  return { ok: true }
})
