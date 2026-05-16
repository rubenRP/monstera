import { API_ERROR_CODES } from '#shared/utils/i18n/apiErrors'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { endpoint, keys } = body as { endpoint?: string, keys?: { p256dh?: string, auth?: string } }
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    throwApiError(400, API_ERROR_CODES.PUSH_INVALID_SUBSCRIPTION)
  }

  const supabase = getServiceSupabase()
  const authHeader = getHeader(event, 'authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    throwApiError(401, API_ERROR_CODES.AUTH_UNAUTHORIZED)
  }
  const token = authHeader.slice(7)
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) {
    throwApiError(401, API_ERROR_CODES.AUTH_INVALID_SESSION)
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
    throwApiError(500, API_ERROR_CODES.PUSH_SAVE_FAILED)
  }

  return { ok: true }
})
