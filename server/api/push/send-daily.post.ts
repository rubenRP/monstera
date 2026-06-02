import { API_ERROR_CODES } from '#shared/utils/i18n/apiErrors'

export default defineEventHandler(async (event) => {
  const secret = getHeader(event, 'x-cron-secret')
  // #region agent log
  fetch('http://127.0.0.1:7401/ingest/9091c024-be74-4200-9f61-bbd636b895d0', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '3e6abf' }, body: JSON.stringify({ sessionId: '3e6abf', runId: 'initial', hypothesisId: 'H5', location: 'send-daily.post.ts:auth', message: 'Manual push trigger auth check', data: { hasSecretHeader: Boolean(secret), hasServerSecret: Boolean(process.env.CRON_SECRET) }, timestamp: Date.now() }) }).catch(() => {})
  // #endregion
  if (secret !== process.env.CRON_SECRET) {
    throwApiError(403, API_ERROR_CODES.CRON_FORBIDDEN)
  }

  const { publicKey, privateKey } = getVapidKeysFromConfig()
  return sendDailyPushReminders(publicKey, privateKey)
})
