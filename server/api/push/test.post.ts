import { API_ERROR_CODES } from '#shared/utils/i18n/apiErrors'
import { translate } from '#shared/utils/i18n/translate'
import { sendPushToUser } from '../../utils/push/sendToUser'

export default defineEventHandler(async (event) => {
  const user = requireAuthUser(event)
  const supabase = getServiceSupabase()

  const vapid = getVapidKeysFromConfig()
  const locale = getRequestLocale(event)
  const sent = await sendPushToUser(supabase, user.id, {
    title: translate(locale, 'push.testTitle'),
    body: translate(locale, 'push.testBody'),
    url: '/settings',
    tag: 'monstera-test'
  }, vapid)

  if (!sent) {
    throwApiError(404, API_ERROR_CODES.PUSH_NO_SUBSCRIPTION)
  }
  return { sent }
})
