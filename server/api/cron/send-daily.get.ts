import { API_ERROR_CODES } from '#shared/utils/i18n/apiErrors'

export default defineEventHandler(async (event) => {
  const vercelCron = getHeader(event, 'x-vercel-cron')
  if (!vercelCron) {
    throwApiError(403, API_ERROR_CODES.CRON_FORBIDDEN)
  }

  const { publicKey, privateKey } = getVapidKeysFromConfig()
  return sendDailyPushReminders(publicKey, privateKey)
})
