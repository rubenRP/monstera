import { API_ERROR_CODES } from '#shared/utils/i18n/apiErrors'
import { pushSubscriptionBodySchema } from '#shared/utils/push/schemas'

export default defineEventHandler(async (event) => {
  const parsed = pushSubscriptionBodySchema.safeParse(await readBody(event))
  if (!parsed.success) {
    throwApiError(400, API_ERROR_CODES.PUSH_INVALID_SUBSCRIPTION)
  }
  const { endpoint, keys } = parsed.data

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

  await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint)

  const { error } = await supabase.from('push_subscriptions').insert({
    user_id: user.id,
    endpoint,
    p256dh: keys.p256dh,
    auth: keys.auth
  })

  if (error) {
    console.error('push_subscriptions insert:', error.message, error.code, error.details)
    throwApiError(500, API_ERROR_CODES.PUSH_SAVE_FAILED)
  }

  return { ok: true }
})
