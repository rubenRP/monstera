import { API_ERROR_CODES } from '#shared/utils/i18n/apiErrors'
import { pushSubscriptionBodySchema } from '#shared/utils/push/schemas'

export default defineEventHandler(async (event) => {
  const parsed = pushSubscriptionBodySchema.safeParse(await readBody(event))
  // #region agent log
  fetch('http://127.0.0.1:7401/ingest/9091c024-be74-4200-9f61-bbd636b895d0',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'3e6abf'},body:JSON.stringify({sessionId:'3e6abf',runId:'initial',hypothesisId:'H1',location:'subscribe.post.ts:validation',message:'Subscription body parsed',data:{valid:parsed.success},timestamp:Date.now()})}).catch(()=>{})
  // #endregion
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
  // #region agent log
  fetch('http://127.0.0.1:7401/ingest/9091c024-be74-4200-9f61-bbd636b895d0',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'3e6abf'},body:JSON.stringify({sessionId:'3e6abf',runId:'initial',hypothesisId:'H1',location:'subscribe.post.ts:auth',message:'Subscription auth resolved',data:{hasBearer:Boolean(authHeader),authError:Boolean(authError),hasUser:Boolean(user)},timestamp:Date.now()})}).catch(()=>{})
  // #endregion
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
  // #region agent log
  fetch('http://127.0.0.1:7401/ingest/9091c024-be74-4200-9f61-bbd636b895d0',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'3e6abf'},body:JSON.stringify({sessionId:'3e6abf',runId:'initial',hypothesisId:'H1',location:'subscribe.post.ts:insert',message:'Subscription insert finished',data:{insertOk:!error,errorCode:error?.code || null},timestamp:Date.now()})}).catch(()=>{})
  // #endregion

  if (error) {
    console.error('push_subscriptions insert:', error.message, error.code, error.details)
    throwApiError(500, API_ERROR_CODES.PUSH_SAVE_FAILED)
  }

  return { ok: true }
})
