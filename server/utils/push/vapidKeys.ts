import { API_ERROR_CODES } from '#shared/utils/i18n/apiErrors'

export function getVapidKeysFromConfig() {
  const config = useRuntimeConfig()
  const publicKey = config.public.vapidPublicKey || process.env.NUXT_PUBLIC_VAPID_PUBLIC_KEY
  const privateKey = config.vapidPrivateKey || process.env.VAPID_PRIVATE_KEY
  if (!publicKey || !privateKey) {
    throwApiError(503, API_ERROR_CODES.VAPID_NOT_CONFIGURED)
  }
  return { publicKey, privateKey }
}
